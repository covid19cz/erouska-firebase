import * as functions from "firebase-functions";
import {firestore} from "firebase-admin";
import {REGION} from "../settings";
import * as t from "io-ts";
import {parseRequest} from "../lib/request";
import {isBuidOwnedByFuid} from "../lib/database";

const RequestSchema = t.type({
    buid: t.string,
    pushRegistrationToken: t.string
});

export const changePushTokenCallable = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("failed-precondition", "Chybějící autentizace");
    }

    const payload = parseRequest(RequestSchema, data);
    const buid = payload.buid;
    const pushRegistrationToken = payload.pushRegistrationToken;
    const fuid = context.auth.uid;
    const client = firestore();

    if (!await isBuidOwnedByFuid(client, buid, fuid)) {
        throw new functions.https.HttpsError("failed-precondition", "Zařízení neexistuje nebo nepatří Vašemu účtu");
    }

    const registrations = client.collection("registrations");

    try {
        console.log(`Changing push token for BUID ${buid}`);
        await registrations.doc(buid).update({
            pushRegistrationToken
        });
    } catch (error) {
        console.log(`Changing push token for BUID ${buid}: ${error}`);
        throw new functions.https.HttpsError("unavailable", "Nepodařilo se změnit push token");
    }
});
