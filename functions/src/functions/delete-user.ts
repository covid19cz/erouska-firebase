import * as functions from "firebase-functions";
import {buildCloudFunction} from "../settings";
import {FIREBASE_AUTH_CLIENT} from "../lib/database";

export const deleteUserCallable = buildCloudFunction().https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Chybějící autentizace");
    }

    const fuid = context.auth.uid;
    try {
        console.log(`Erasing user ${fuid}`);
        await FIREBASE_AUTH_CLIENT.revokeRefreshTokens(fuid);
        await FIREBASE_AUTH_CLIENT.deleteUser(fuid);
    } catch (error) {
        console.error(`Erasing user ${fuid} failed: ${error}`);
        throw new functions.https.HttpsError("unauthenticated", "Nepodařilo se smazat uživatele");
    }
});
