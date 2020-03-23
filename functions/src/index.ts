import * as admin from "firebase-admin";
import {registerBuidCallable} from "./endpoints/register-buid";
import {deleteUserCallable, deleteUserDataTrigger} from "./endpoints/delete-user";
import {deleteUploadsCallable} from "./endpoints/delete-uploads";

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

export {registerBuidCallable as registerBuid};
export {deleteUserCallable as deleteUser, deleteUserDataTrigger};
export {deleteUploadsCallable as deleteUploads};
