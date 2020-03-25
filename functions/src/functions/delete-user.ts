import * as functions from "firebase-functions";
import {REGION} from "../settings";
import * as admin from "firebase-admin";
import {deleteUploads} from "../lib/storage";
import UserRecord = admin.auth.UserRecord;

export const deleteUserCallable = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("failed-precondition", "Chybějící autentizace");
    }

    const fuid = context.auth.uid;
    try {
        console.log(`Erasing user ${fuid}`);
        await admin.auth().deleteUser(fuid);
    } catch (error) {
        console.log(`Erasing user ${fuid} failed: ${error}`);
        throw new functions.https.HttpsError("unavailable", "Nepodařilo se smazat uživatele");
    }
});

async function deleteAllUploads(client: admin.firestore.Firestore, fuid: string) {
    const registrations = client.collection("registrations");

    try {
        console.log(`Deleting user ${fuid} uploads`);
        const documents = await registrations.where("fuid", "==", fuid).select().get();
        for (const document of documents.docs) {
            await deleteUploads(fuid, document.id)
        }
    } catch (error) {
        console.log(`Failed deleting user ${fuid} uploads: ${error}`);
    }
}

async function deleteRegistrations(client: admin.firestore.Firestore, fuid: string) {
    const registrations = client.collection("registrations");

    try {
        console.log(`Deleting user ${fuid} registrations`);
        const documents = await registrations.where("fuid", "==", fuid).select().get();
        for (const document of documents.docs) {
            await document.ref.delete();
        }
    } catch (error) {
        console.log(`Failed deleting user ${fuid} registrations: ${error}`);
    }
}

async function deleteUserEntry(client: admin.firestore.Firestore, fuid: string) {
    const users = client.collection("users");

    try {
        console.log(`Deleting user ${fuid} database entry`);
        await users.doc(fuid).delete();
    } catch (error) {
        console.log(`Failed deleting user ${fuid} database entry: ${error}`);
    }
}

export const deleteUserTrigger = functions.auth.user().onDelete(async (user: UserRecord) => {
    const fuid = user.uid;
    const client = admin.firestore();
    await deleteAllUploads(client, fuid);
    await deleteRegistrations(client, fuid);
    await deleteUserEntry(client, fuid);
});
