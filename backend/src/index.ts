import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import WebSocket from 'ws';
import imageRouter from './routes/images';
import messageRouter from './routes/messages';
import path from 'path';

const app: Express = express();
const wss = new WebSocket.Server({ port: parseInt(process.env.WEBSOCKET_PORT || '3001', 10) });

// Log requests
app.use(morgan('dev'));

// Parse request bodies
app.use(express.json());

// Routes
app.use('/api/images', imageRouter);
app.use('/api/messages', messageRouter);

// Serve static files first
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    // Handle messages from clients
    ws.on('message', (message: any) => {
        const { type, user: user, message: msg } = JSON.parse(message);
        
        switch (type) {
        case 'register':
            console.log(`User registered: ${user.displayName}`);
            break;
        
        case 'message':
            handleMessage(ws, msg.message_id);
            break;
        case 'delete':
            handleMessageDelete(ws, msg.message_id);
            break;
        case 'update':
            handleMessageUpdate(ws, msg.message_id, msg.message, msg.showAvatar, msg.showTimestamp);
            break;
        default:
            console.error(`Unknown message type: ${type}`);
            break;
        }
    });

    ws.on('error', (error: any) => {
        console.error(`WebSocket error: ${error}`);
    });
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
    

    // Send a welcome message to the client
    ws.send(JSON.stringify({"type": "notification", "message": "Welcome to the chat!", "welcome": true}));
});

function handleMessage(ws: WebSocket, message: any): void {
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'message',
                message: message
            }));
        };
    });
}

function handleMessageDelete(ws: WebSocket, message_id: number): void {
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'delete',
                message_id: message_id
            }));
        };
    });
}

function handleMessageUpdate(ws: WebSocket, message_id: number, message: string, showAvatar: boolean, showTimestamp: boolean): void {
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'update',
                message_id: message_id,
                message: message,
                showAvatar: showAvatar,
                showTimestamp: showTimestamp
            }));
        };
    });
}

// Other routes or middleware...
app.use('/', (req: Request, res: Response) => {
    res.status(418).send("I'm a teapot");
});

// Start the server
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
