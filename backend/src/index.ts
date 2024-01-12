import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import WebSocket from 'ws';
import router from './routes';
import path from 'path';
import { Console } from 'console';

const app: Express = express();
const wss = new WebSocket.Server({ port: parseInt(process.env.WEBSOCKET_PORT || '3001', 10) });

// Log requests
app.use(morgan('dev'));

// Parse request bodies
app.use(express.json());

// Routes
app.use('/api', router);

// Serve static files first
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    // Handle messages from clients
    ws.on('message', (message: any) => {
        const parsedMessage = JSON.parse(message);

        switch (parsedMessage.type) {
        case 'register':
            console.log(`User registered: ${parsedMessage.user.displayName}`);
            break;
        
        case 'message':
            handleMessage(ws, parsedMessage.message);
            break;
        default:
            console.error(`Unknown message type: ${parsedMessage.type}`);
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

// Other routes or middleware...
app.use('/', (req: Request, res: Response) => {
    res.status(418).send("I'm a teapot");
});

// Start the server
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
