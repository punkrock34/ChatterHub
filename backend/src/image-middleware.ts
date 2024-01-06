import { Request, Response, NextFunction } from 'express';
import path from "path";
import { promises as fs } from 'fs';
import sharp from "sharp";

const imageMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    console.log('Image Middleware Executed:', req.path);
    
    // Check if the requested resource is an image
    if (!/\.(jpe?g|png)$/i.test(req.path)) {
        next();
        return;
    }

    const imagePath = path.join(__dirname, "..", req.path);
    const cachePath = path.join(__dirname, "..", req.path + '.webp');

    try {
        // Check if the converted image exists in the cache
        await fs.access(cachePath);

        // Serve the cached WebP image
        res.sendFile(cachePath);
    } catch (err) {
        // Convert image to WebP format
        sharp(imagePath)
            .toFormat('webp')
            .toBuffer()
            .then(async (data) => {
                // Save the converted image to the cache
                await fs.writeFile(cachePath, data);

                // Send the converted image
                res.header('Content-Type', 'image/webp');
                res.send(data);
            })
            .catch((err) => {
                console.error('Error converting image:', err);
                next();
            });
    }
};

export default imageMiddleware;
