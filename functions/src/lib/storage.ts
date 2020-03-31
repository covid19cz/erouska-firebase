import * as admin from "firebase-admin";

export async function deleteUploads(fuid: string, buid: string) {
    const bucket = admin.storage().bucket();
    await bucket.deleteFiles({
        prefix: `proximity/${fuid}/${buid}/`,
        force: true
    });
}
