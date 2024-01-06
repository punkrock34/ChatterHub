import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import imageMiddleware from './image-middleware';
import https from 'https';
import fs from 'fs';
import path from 'path';

const app: Express = express();

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

// Other routes or middleware...
app.use('/', (req, res) => {
    res.status(418).send("I'm a teapot");
});


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


// Start the server
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
