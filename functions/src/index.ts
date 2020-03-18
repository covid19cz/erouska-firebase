import * as functions from 'firebase-functions';
import * as t from 'io-ts'
import {isLeft} from "fp-ts/lib/Either";
import * as admin from 'firebase-admin';
import {CollectionReference} from "@google-cloud/firestore";
import {Guid} from "guid-typescript";

const Request = t.type({
    platform: t.string,
    platformVersion: t.string,
    manufacturer: t.string,
    model: t.string,
    local: t.string,
});

const MAX_GUID_RETRIES = 10;

async function generateGuid(collection: CollectionReference) {
    for (let i = 0; i < MAX_GUID_RETRIES; i++) {
        const buid = Guid.create().toString().substring(14).replace("-", "");
        const res = await collection.where("buid", "==", buid).get();

        // Note: small data race here, ignored for now
        if (res.empty) {
            return buid;
        }
    }
    return null;
}

export const createUser = functions.region('europe-west2').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'Missing authentication');
    }
    const payload = Request.decode(data);
    if (isLeft(payload)) {
        throw new functions.https.HttpsError('invalid-argument', 'Wrong arguments');
    }

    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });

    const uid = context.auth.uid;
    const auth: { phone_number: string } = context.auth as {} as { phone_number: string };

    const collection = admin.firestore().collection("users");
    const buid = generateGuid(collection);
    if (buid === null) {
        throw new functions.https.HttpsError('unavailable', 'BUID could not be generated');
    }

    const document = collection.doc(uid);
    try {
        await document.create({
            ...payload,
            buid,
            phoneNumber: auth.phone_number,
            infected: false
        });
    } catch (e) {
        await document.set({...payload});
        console.error(e);
    }
    return {buid};
});
