import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import imageMiddleware from './image-middleware';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { getConnection } from './database-config';
import { redisClient as rd } from './redis-config';

const app: Express = express();

const dbConnection = await getConnection();
const redisClient = rd;

const uploadsDirectory = './uploads';
if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory);
}

// Log requests
app.use(morgan('dev'));

app.use(express.json());

// Middleware to check for webp support and convert images on-the-fly
app.use(imageMiddleware);

// Serve static files first
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


app.use('/api/download-image', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            throw new Error('Missing "url" parameter.');
        }

        const randomName = Date.now() + Math.random().toString(36).substring(2, 15);
        const imagePath = `${uploadsDirectory}/${randomName}.jpg`;

        const fileStream = fs.createWriteStream(imagePath);

        https.get(url as string, (response) => {
            if (response.statusCode !== 200) {
                throw new Error(`Failed to download image. Status Code: ${response.statusCode}`);
            }

            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                console.log('Saved to', imagePath);
                res.json({ imagePath });
            });
        }).on('error', (error) => {
            fs.unlinkSync(imagePath); // Remove the file if an error occurs
            throw new Error(`Error downloading image: ${error.message}`);
        });
    } catch (error) {
        console.error(error.message || error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

app.use('/api/check-image-exists', (req, res) => {
    try {
        const { imagePath } = req.query;
        if (!imagePath) {
            throw new Error('Missing "imagePath" parameter.');
        }

        const exists = fs.existsSync(imagePath as string);
        res.json({ imageExists: exists });
    } catch (error) {
        console.error(error.message || error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

app.use('/api/send-message', async (req, res) => {
    try {
        const { uid, displayName, photoURL, timestamp, message, showAvatar, showTimestamp } = req.body;
        if (!uid || !displayName || !photoURL || !timestamp || !message || !showAvatar || !showTimestamp) {
            throw new Error('Missing required parameters.');
        }

        const query = `INSERT INTO MESSAGES( USER_ID, MESSAGE, DISPLAY_NAME, PHOTO_URL, SHOW_AVATAR, SHOW_TIMESTAMP, CREATED_AT ) VALUES( :uid, :message, :displayName, :photoURL, :showAvatar, :showTimestamp, :timestamp )`;
        const binds = { uid, displayName, photoURL, timestamp, message, showAvatar, showTimestamp };
        const options = { autoCommit: true };

        await dbConnection.execute(query, binds, options);

        //save in redis as well
        const key = `messages:${uid}`;
        const value = JSON.stringify({ uid, displayName, photoURL, timestamp, message, showAvatar, showTimestamp });
        redisClient.lPush(key, value);

    } catch (error) {
        console.error(error.message || error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

app.use('/api/get-messages', async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            throw new Error('Missing "start" or "end" parameter.');
        }

        // first try to get from redis cache
        const key = `messages:${start}:${end}`;
        const messages = await redisClient.lRange(key, 0, -1);
        if (messages.length > 0) {
            res.json({ messages });
            return;
        }

        // if not found in cache, get from db
        const query = `SELECT * FROM ( SELECT * FROM MESSAGES ORDER BY CREATED_AT DESC ) WHERE ROWNUM >= :start AND ROWNUM <= :end ORDER BY CREATED_AT ASC`;
        const binds = { start: Number(start), end: Number(end) }; // Convert start and end to numbers
        const options = { outFormat: 4002 };

        // save these messages in redis cache
        const result = await dbConnection.execute(query, binds, options);
        const messagesFromDb = result.rows;

        if (messagesFromDb === undefined || messagesFromDb.length === 0) {
            res.json({ messages: [] });
            return;
        }

        messagesFromDb.forEach((message: any) => {
            const key = `messages:${start}:${end}`;
            const value = JSON.stringify(message);
            redisClient.lPush(key, value);
        });

        res.json({ messages: messagesFromDb });
    } catch (error) {
        console.error(error.message || error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

// Other routes or middleware...
app.use('/', (req, res) => {
    res.status(418).send("I'm a teapot");
});

// Start the server
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
