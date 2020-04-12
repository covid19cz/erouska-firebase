import * as functions from "firebase-functions";
import {buildCloudFunction} from "../settings";
import * as t from "io-ts";
import {parseRequest} from "../lib/request";
import {FIRESTORE_CLIENT} from "../lib/database";
import {getUnixTimestamp} from "../lib/time";

const RequestSchema = t.type({
    category: t.string,
    properties: t.record(t.string, t.string)
});

export const storeEventCallable = buildCloudFunction().https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Chybějící autentizace");
    }

    const payload = parseRequest(RequestSchema, data, false);
    const events = FIRESTORE_CLIENT.collection("events");

    try {
        await events.add({
            ...payload,
            createdAt: getUnixTimestamp()
        });
    } catch (error) {
        console.error(`Error when storing event: ${error}`);
        throw new functions.https.HttpsError("unavailable", "Nepodařilo se nahrát událost");
    }
});
