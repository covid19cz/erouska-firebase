import * as functions from "firebase-functions";
import {firestore} from "firebase-admin";
import {REGION} from "../settings";
import * as t from "io-ts";
import {parseRequest} from "../lib/request";
import {isBuidOwnedByFuid} from "../lib/database";

const RequestSchema = t.type({
    buid: t.string,
});

export const deleteBuidCallable = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("failed-precondition", "Missing authentication");
    }

    const payload = parseRequest(RequestSchema, data);
    const buid = payload.buid;
    const fuid = context.auth.uid;
    const client = firestore();

    const registrations = client.collection("registrations");
    const buidDoc = await registrations.doc(buid).get();
    const lastUpdateTime = buidDoc.updateTime;

    if (!await isBuidOwnedByFuid(client, buid, fuid)) {
        throw new functions.https.HttpsError("failed-precondition", "Missing or non-owned BUID");
    }

    try {
        const batch = client.batch();
        batch.update(client.collection("users").doc(fuid), {
            registrationCount: firestore.FieldValue.increment(-1)
        });
        batch.delete(registrations.doc(buid), {
            lastUpdateTime
        });
        await batch.commit();

        return true;
    } catch (error) {
        console.error(`Failed deleting buid ${buid}: ${error}`);
        return false;
    }
});
