import * as functions from "firebase-functions";
import {buildCloudFunction} from "../settings";
import * as admin from "firebase-admin";

export const deleteUserCallable = buildCloudFunction().https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Chybějící autentizace");
    }

    const fuid = context.auth.uid;
    try {
        console.log(`Erasing user ${fuid}`);
        const auth = admin.auth();
        await auth.revokeRefreshTokens(fuid);
        await auth.deleteUser(fuid);
    } catch (error) {
        console.error(`Erasing user ${fuid} failed: ${error}`);
        throw new functions.https.HttpsError("unauthenticated", "Nepodařilo se smazat uživatele");
    }
});
