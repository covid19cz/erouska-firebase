import * as admin from "firebase-admin";
import {deleteUploads} from "../lib/storage";
import {buildCloudFunction} from "../settings";
import UserRecord = admin.auth.UserRecord;

async function deleteAllUploads(client: admin.firestore.Firestore, fuid: string) {
    const registrations = client.collection("registrations");

    try {
        console.log(`Deleting user ${fuid} uploads`);
        const documents = await registrations.where("fuid", "==", fuid).select().get();
        for (const document of documents.docs) {
            await deleteUploads(fuid, document.id)
        }
    } catch (error) {
        console.error(`Failed deleting user ${fuid} uploads: ${error}`);
    }
}

async function deleteRegistrations(client: admin.firestore.Firestore, fuid: string) {
    const registrations = client.collection("registrations");

    try {
        console.log(`Deleting user ${fuid} registrations`);
        const documents = await registrations.where("fuid", "==", fuid).select().get();
        for (const document of documents.docs) {
            if (document.exists) {
                await document.ref.delete();
            }
        }
    } catch (error) {
        console.error(`Failed deleting user ${fuid} registrations: ${error}`);
    }
}

async function deleteUserEntry(client: admin.firestore.Firestore, fuid: string) {
    const users = client.collection("users");

    try {
        console.log(`Deleting user ${fuid} database entry`);
        await users.doc(fuid).delete();
    } catch (error) {
        console.error(`Failed deleting user ${fuid} database entry: ${error}`);
    }
}

export const deleteUserTrigger = buildCloudFunction().auth.user().onDelete(async (user: UserRecord) => {
    const fuid = user.uid;
    const client = admin.firestore();
    await deleteAllUploads(client, fuid);
    await deleteRegistrations(client, fuid);
    await deleteUserEntry(client, fuid);
});
