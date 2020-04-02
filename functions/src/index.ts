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
import {scheduledBackup} from "./triggered/database-backup";
import {deleteUserTrigger} from "./triggered/delete-user";
import {awsPoller} from "./triggered/aws-poller";

// Callable functions
export {changePushTokenCallable as changePushToken};
export {isBuidActiveCallable as isBuidActive};
export {registerBuidCallable as registerBuid};
export {deleteBuidCallable as deleteBuid};
export {deleteUserCallable as deleteUser};
export {deleteUploadsCallable as deleteUploads};

// Triggerd functions
export {awsPoller};
export {deleteUserTrigger};
export {scheduledBackup};
