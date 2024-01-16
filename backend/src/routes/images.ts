import { Router, Request, Response } from 'express';
import https from 'https';
import fs from 'fs';
import imageMiddleware from '../image-middleware';

const router: Router = Router();

const uploadsDirectory = './uploads';
if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory);
}

router.use(imageMiddleware);

router.use('/download-image', async (req: Request, res: Response) => {
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
                res.status(200).json({ imagePath: imagePath });
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

router.use('/check-image-exists', (req: Request, res: Response) => {
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

export default router;