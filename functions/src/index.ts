import * as admin from "firebase-admin";
import {registerBuidCallable} from "./functions/register-buid";
import {deleteUserCallable, deleteUserDataTrigger} from "./functions/delete-user";
import {deleteUploadsCallable} from "./functions/delete-uploads";
import {scheduledBackup} from "./functions/database-backup";

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

export {registerBuidCallable as registerBuid};
export {deleteUserCallable as deleteUser, deleteUserDataTrigger};
export {deleteUploadsCallable as deleteUploads};
export {scheduledBackup};
