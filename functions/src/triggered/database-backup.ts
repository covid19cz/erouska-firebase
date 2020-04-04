import {buildCloudFunction} from "../settings";
import * as firestore from "@google-cloud/firestore";
import {STORAGE_CLIENT} from "../lib/storage";

async function backupDatabase() {
    const prefix = "backups/database/";

    // delete old backups
    const bucket = STORAGE_CLIENT.bucket();
    await bucket.deleteFiles({
        prefix,
        force: true
    });

    const client = new firestore.v1.FirestoreAdminClient();
    const timestamp = Date.now().toString();
    const outputUriPrefix = `gs://${bucket.name}/${prefix}${timestamp}`;
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const databaseName = client.databasePath(projectId, "(default)");
    await client.exportDocuments({
        name: databaseName,
        outputUriPrefix,
        collectionIds: []
    });
}

export const scheduledBackup = buildCloudFunction().pubsub
    .schedule("every 24 hours")
    .onRun(async (context) => {
        await backupDatabase();
    });
