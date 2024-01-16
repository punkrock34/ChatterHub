import WebSocket from 'ws';

export const wss = new WebSocket.Server({ port: parseInt(process.env.WEBSOCKET_PORT || '3001', 10) });

export function handleMessage(ws: WebSocket, message: any): void {
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'message',
                message: message
            }));
        };
    });
}

export function handleMessageDelete(ws: WebSocket, message_id: number): void {
    wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'delete',
                message_id: message_id
            }));
        };
    });
}

export function handleMessageUpdate(ws: WebSocket, message_id: number, message: string, showAvatar: boolean, showTimestamp: boolean): void {
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
