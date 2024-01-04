// backend/src/routes/auth.ts
import express, { Router, Request, Response } from 'express';
import { auth } from '../firebase-config';
import { logout, registerOrLogin } from '../authentication';

const router: Router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.status(418).send("I'm a teapot");
});

router.get('/check-auth', (req: Request, res: Response) => {
    const user = auth.currentUser;

    if (user) {
        res.status(200).json({ authenticated: true, user });
    } else {
        res.status(200).json({ authenticated: false, user: null });
    }
});

router.post("/login-or-register", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
        res.status(400).json({ errorCode: "auth/invalid-credentials" });
        return;
    }

    const { user, errorCode, success } = await registerOrLogin(email, password);

    if (success) {
        res.status(200).json({ user });
    } else {
        res.status(400).json({ errorCode });
    }
});

router.get("/logout", async (req: Request, res: Response) => {
    logout();
    res.status(200).json({ success: true });
});

export default function authRoutes(): Router {
    return router;
}
