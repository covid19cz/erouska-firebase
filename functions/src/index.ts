import * as admin from "firebase-admin";
// this needs to be imported before initializing the admin SDK
// @ts-ignore
const _ = require("firebase-functions");

if ("FIREBASE_BUCKET" in process.env) {
    admin.initializeApp({
        storageBucket: process.env.FIREBASE_BUCKET
    });
}
else {
    admin.initializeApp();
}

import {registerBuidCallable} from "./functions/register-buid";
import {isBuidActiveCallable} from "./functions/is-buid-active";
import {deleteBuidCallable} from "./functions/delete-buid";
import {deleteUploadsCallable} from "./functions/delete-uploads";
import {deleteUserCallable} from "./functions/delete-user";
import {changePushTokenCallable} from "./functions/change-push-token";
import {backupDatabaseCron} from "./triggered/database-backup";
import {deleteUserTrigger} from "./triggered/delete-user";
import {awsPollerCron} from "./triggered/aws-poller";
import {createObjectTrigger, deleteUploadTask} from "./triggered/delete-upload";
import {deleteOldUsersCron} from "./triggered/delete-old-users";
import {storeEventCallable} from "./functions/store-event";

// Callable functions
export {changePushTokenCallable as changePushToken};
export {isBuidActiveCallable as isBuidActive};
export {registerBuidCallable as registerBuid};
export {deleteBuidCallable as deleteBuid};
export {deleteUserCallable as deleteUser};
export {deleteUploadsCallable as deleteUploads};
export {storeEventCallable as storeEvent};

// Triggered functions
export {awsPollerCron};
export {backupDatabaseCron};
export {deleteOldUsersCron};
export {createObjectTrigger};
export {deleteUserTrigger};
export {deleteUploadTask};
