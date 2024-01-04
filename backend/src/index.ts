import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import authRoutes from './routes/auth';
//import imageMiddleware from './image-middleware';
import { connection } from './mysql-config'

const app: Express = express();

// Log requests
app.use(morgan('dev'));

app.use(express.json());

// Middleware to check for webp support and convert images on-the-fly
//app.use(imageMiddleware);

//redirect all /api to the correct route 
app.use('/api/auth', authRoutes());

app.use('/', (req: Request, res: Response) => {
    res.status(418).send("I'm a teapot");
});

// Start the server
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
