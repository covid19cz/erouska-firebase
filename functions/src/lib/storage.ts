import * as admin from "firebase-admin";

export const STORAGE_CLIENT = admin.storage();

export async function deleteUploads(fuid: string, buid: string) {
    const bucket = STORAGE_CLIENT.bucket();
    await bucket.deleteFiles({
        prefix: `proximity/${fuid}/${buid}/`,
        force: true
    });
}
