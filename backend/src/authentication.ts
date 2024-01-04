import { auth } from "./firebase-config";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, User as FirebaseAuthUser, fetchSignInMethodsForEmail} from "firebase/auth";

interface AuthResult {
    user: FirebaseAuthUser | null;
    errorCode: string | null;
    success: boolean;
}

export const registerOrLogin = async (email: string, password: string): Promise<AuthResult> => {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("User created successfully");

        // Send email verification
        await sendEmailVerification(auth.currentUser);
        console.log("Email verification sent");

        return {
            user: auth.currentUser,
            errorCode: null,
            success: true,
        };
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            try{

                await signInWithEmailAndPassword(auth, email, password);
                console.log("User logged in successfully");
                
                return {
                    user: auth.currentUser,
                    errorCode: null,
                    success: true,
                };

            }catch(error){
                console.log("Error logging in user:", error);
                return {
                    user: null,
                    errorCode: error.code || "unknown-error",
                    success: false,
                };
            }
        }

        console.log("Error creating or logging in user:", error);
        return {
            user: null,
            errorCode: error.code || "unknown-error",
            success: false,
        };
    }
};

export const logout = async (): Promise<void> => {
    try {
        await auth.signOut();
        console.log("User logged out successfully");
    } catch (error) {
        console.log("Error logging out user:", error);
    }
};
