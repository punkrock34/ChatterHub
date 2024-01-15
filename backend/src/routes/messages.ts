import { Router, Request, Response } from 'express';
import { getConnection } from '../database-config';
import { BindParameters } from 'oracledb';

const router: Router = Router();
const dbConnection = await getConnection();

router.use('/send-message', async (req: Request, res: Response) => {
    try {
        const { uid, displayName, photoURL, timestamp, message, showAvatar, showTimestamp } = req.body;

        //convert the booleans to numbers
        const showAvatarNumber = showAvatar ? 1 : 0;
        const showTimestampNumber = showTimestamp ? 1 : 0;

        const query = `INSERT INTO messages( USER_ID, MESSAGE, DISPLAY_NAME, PHOTO_URL, SHOW_AVATAR, SHOW_TIMESTAMP, CREATED_AT ) VALUES( :USER_ID, :MESSAGE, :DISPLAY_NAME, :PHOTO_URL, :SHOW_AVATAR, :SHOW_TIMESTAMP, :CREATED_AT )`;
        const binds: BindParameters = { USER_ID: uid, MESSAGE: message, DISPLAY_NAME: displayName, PHOTO_URL: photoURL, SHOW_AVATAR: showAvatarNumber, SHOW_TIMESTAMP: showTimestampNumber, CREATED_AT: timestamp };
        const options = { autoCommit: true };

        const result = await dbConnection.execute(query, binds, options);

        const insertId = result.lastRowid;

        console.log('Message saved to database');
        res.json({ insertId });

    } catch (error) {
        console.error(error.message || error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

router.use('/get-messages', async (req: Request, res: Response) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            throw new Error('Missing "start" or "end" parameter.');
        }

        const query = `
            SELECT *
            FROM (
                SELECT m.*, ROWNUM AS RN
                FROM (
                  SELECT *
                    FROM messages
                    ORDER BY CREATED_AT ASC
                ) m
                WHERE ROWNUM <= :END_COUNT
            )
            WHERE RN >= :START_COUNT`;

        const binds: BindParameters = { START_COUNT: Number(start), END_COUNT: Number(end) };
        const options = { outFormat: 4002 };

        const result = await dbConnection.execute(query, binds, options);
        const messagesFromDb = result.rows;

        if (messagesFromDb === undefined || messagesFromDb.length === 0) {
            res.json({ messages: [] });
            return;
        }

        for(let i = 0; i < messagesFromDb.length; i++) {
            const message:any = messagesFromDb[i];
            const newMessage: any = {
                uid: message.USER_ID,
                displayName: message.DISPLAY_NAME,
                photoURL: message.PHOTO_URL,
                timestamp: message.CREATED_AT,
                message: message.MESSAGE,
                showAvatar: message.SHOW_AVATAR === 1,
                showTimestamp: message.SHOW_TIMESTAMP === 1,
            };

            messagesFromDb[i] = newMessage;
        }

        res.json({ messages: messagesFromDb });
    } catch (error) {
        console.error(error.message || error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

export default router;