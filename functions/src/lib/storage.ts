import * as admin from "firebase-admin";
import {BUCKET_URL} from "../settings";

export async function deleteUploads(fuid: string, buid: string) {
    const bucket = admin.storage().bucket(BUCKET_URL);
    await bucket.deleteFiles({
        directory: `proximity/${fuid}/${buid}/`,
        delimiter: "/",
        force: true
    });
}
