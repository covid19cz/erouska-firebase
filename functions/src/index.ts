import * as admin from "firebase-admin";
import {registerBuidCallable} from "./functions/register-buid";
import {deleteBuidCallable} from "./functions/delete-buid";
import {deleteUploadsCallable} from "./functions/delete-uploads";
import {deleteUserCallable, deleteUserTrigger} from "./functions/delete-user";
import {changePushTokenCallable} from "./functions/change-push-token";
import {scheduledBackup} from "./functions/database-backup";

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

export {changePushTokenCallable as changePushToken};
export {registerBuidCallable as registerBuid};
export {deleteBuidCallable as deleteBuid};
export {deleteUserCallable as deleteUser, deleteUserTrigger};
export {deleteUploadsCallable as deleteUploads};
export {scheduledBackup};
