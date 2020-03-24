import * as functions from "firebase-functions";
import {BUCKET_URL, REGION} from "../settings";
import * as firestore from "@google-cloud/firestore";

async function backupDatabase() {
    const client = new firestore.v1.FirestoreAdminClient();
    const bucket = `gs://${BUCKET_URL}/backups/database`;

    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const databaseName = client.databasePath(projectId, "(default)");
    return await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: bucket,
        collectionIds: []
    });
}

export const scheduledBackup = functions.region(REGION).pubsub
    .schedule("every 24 hours")
    .onRun(async (context) => {
        await backupDatabase();
    });
