import * as functions from "firebase-functions";
import {REGION} from "../settings";
import {deleteUploads} from "../lib/storage";
import * as t from "io-ts";
import {parseRequest} from "../lib/request";
import {isBuidOwnedByFuid} from "../lib/database";
import {firestore} from "firebase-admin";

const RequestSchema = t.type({
    buid: t.string,
});

export const deleteUploadsCallable = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("failed-precondition", "Missing authentication");
    }

    const payload = parseRequest(RequestSchema, data);
    const buid = payload.buid;
    const fuid = context.auth.uid;

    if (!await isBuidOwnedByFuid(firestore(), buid, fuid)) {
        throw new functions.https.HttpsError("failed-precondition", "Missing or non-owned BUID");
    }

    try {
        console.log(`Deleting uploads for user ${fuid} and buid ${buid}`);
        await deleteUploads(fuid, buid);
        return true;
    } catch (error) {
        console.error(`Failed deleting uploads for user ${fuid} and buid ${buid}: ${error}`);
        return false;
    }
});
