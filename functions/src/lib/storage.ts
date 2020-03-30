import * as admin from "firebase-admin";
import {FIREBASE_BUCKET_URL} from "../settings";

export async function deleteUploads(fuid: string, buid: string) {
    const bucket = admin.storage().bucket(FIREBASE_BUCKET_URL);
    await bucket.deleteFiles({
        prefix: `proximity/${fuid}/${buid}/`,
        force: true
    });
}
