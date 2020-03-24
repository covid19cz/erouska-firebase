import * as admin from "firebase-admin";
import {registerBuidCallable} from "./functions/register-buid";
import {deleteBuidCallable} from "./functions/delete-registration";
import {deleteUploadsCallable} from "./functions/delete-uploads";
import {scheduledBackup} from "./functions/database-backup";

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

export {registerBuidCallable as registerBuid};
export {deleteBuidCallable as deleteBuid};
export {deleteUploadsCallable as deleteUploads};
export {scheduledBackup};
