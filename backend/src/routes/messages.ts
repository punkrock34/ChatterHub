import { Router, Request, Response } from 'express';
import { getConnection } from '../database-config';
import oracledb, { BindParameters } from 'oracledb';

const router: Router = Router();
const dbConnection = await getConnection();

router.use('/send-message', async (req: Request, res: Response) => {
    try {
        const { uid, displayName, photoURL, timestamp, message, showAvatar, showTimestamp } = req.body;

        //convert the booleans to numbers
        const showAvatarNumber = showAvatar ? 1 : 0;
        const showTimestampNumber = showTimestamp ? 1 : 0;

        const query = `
            INSERT INTO messages (
                MESSAGE_ID, USER_ID, MESSAGE, DISPLAY_NAME, PHOTO_URL, SHOW_AVATAR, SHOW_TIMESTAMP, CREATED_AT
            ) VALUES (
                MESSAGE_ID_SEQ.NEXTVAL, :USER_ID, :MESSAGE, :DISPLAY_NAME, :PHOTO_URL, :SHOW_AVATAR, :SHOW_TIMESTAMP, :CREATED_AT
            ) RETURNING MESSAGE_ID INTO :insertId
        `;
        const binds: BindParameters = {
            USER_ID: uid,
            MESSAGE: message,
            DISPLAY_NAME: displayName,
            PHOTO_URL: photoURL,
            SHOW_AVATAR: showAvatarNumber,
            SHOW_TIMESTAMP: showTimestampNumber,
            CREATED_AT: timestamp,
            insertId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        };

        const options = { autoCommit: true };
        const result: any = await dbConnection.execute(query, binds, options);

        const insertId = result.outBinds.insertId[0];

        console.log('Message saved to database with ID:', insertId);
        res.status(201).json({ message_id: insertId });

    } catch (error) {
        console.error(error.message || error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

router.use('/get-messages', async (req: Request, res: Response) => {
    try {
        const { start, end } = req.query;
        if (!start || !end || isNaN(Number(start)) || isNaN(Number(end))) {
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
            res.status(205).json({ messages: [] });
            return;
        }

        for(let i = 0; i < messagesFromDb.length; i++) {
            const message:any = messagesFromDb[i];
            const newMessage: any = {
                message_id: message.MESSAGE_ID,
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

        res.status(200).json({ messages: messagesFromDb });
    } catch (error) {
        console.error(error.message || error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

router.use('/delete-message', async (req: Request, res: Response) => {
    try {
        const { message_id } = req.body;
        if (!message_id || isNaN(Number(message_id))) {
            throw new Error('Missing "message_id" parameter.');
        }

        const query = `DELETE FROM messages WHERE MESSAGE_ID = :MESSAGE_ID`;
        const binds: BindParameters = { MESSAGE_ID: message_id };
        const options = { autoCommit: true };

        await dbConnection.execute(query, binds, options);

        console.log('Message deleted from database');
        res.status(200).send();

    } catch (error) {
        console.error(error.message || error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

router.use('/update-message', async (req: Request, res: Response) => {
    try {
        const { message_id, message, showAvatar, showTimestamp } = req.body;
        if (!message_id || !message || showAvatar === undefined || showTimestamp === undefined) {
            throw new Error('Missing "message_id", "message", "showAvatar", or "showTimestamp" parameter.');
        }

        //convert the booleans to numbers
        const showAvatarNumber = showAvatar ? 1 : 0;
        const showTimestampNumber = showTimestamp ? 1 : 0;

        const query = `UPDATE messages SET MESSAGE = :MESSAGE, SHOW_AVATAR = :SHOW_AVATAR, SHOW_TIMESTAMP = :SHOW_TIMESTAMP WHERE MESSAGE_ID = :MESSAGE_ID`;
        const binds: BindParameters = { MESSAGE_ID: message_id, MESSAGE: message, SHOW_AVATAR: showAvatarNumber, SHOW_TIMESTAMP: showTimestampNumber };
        const options = { autoCommit: true };

        await dbConnection.execute(query, binds, options);

        console.log('Message updated in database');
        res.status(200).send();

    } catch (error) {
        console.error(error.message || error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

export default router;