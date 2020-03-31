import * as admin from "firebase-admin";

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

import {registerBuidCallable} from "./functions/register-buid";
import {isBuidActiveCallable} from "./functions/is-buid-active";
import {deleteBuidCallable} from "./functions/delete-buid";
import {deleteUploadsCallable} from "./functions/delete-uploads";
import {deleteUserCallable, deleteUserTrigger} from "./functions/delete-user";
import {changePushTokenCallable} from "./functions/change-push-token";
import {scheduledBackup} from "./functions/database-backup";
import {awsPoller} from "./processing/aws-poller";

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

export {awsPoller};
export {changePushTokenCallable as changePushToken};
export {isBuidActiveCallable as isBuidActive};
export {registerBuidCallable as registerBuid};
export {deleteBuidCallable as deleteBuid};
export {deleteUserCallable as deleteUser, deleteUserTrigger};
export {deleteUploadsCallable as deleteUploads};
export {scheduledBackup};
