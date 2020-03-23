import * as functions from "firebase-functions";
import * as t from "io-ts"
import {isLeft} from "fp-ts/lib/Either";
import * as admin from "firebase-admin";
import {PathReporter} from "io-ts/lib/PathReporter";
import {MAX_BUIDS_PER_USER, REGION} from "../settings";
import {CollectionReference} from "@google-cloud/firestore";
import {randomBytes} from "crypto";

const MAX_BUID_RETRIES = 10;
const BUID_BYTE_LENGTH = 10;

function getUTCTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}

const Request = t.type({
    platform: t.string,
    platformVersion: t.string,
    manufacturer: t.string,
    model: t.string,
    locale: t.string,
    pushRegistrationToken: t.string
});

function parseRequest(data: any): {} {
    const parsed = t.exact(Request).decode(data);
    if (isLeft(parsed)) {
        console.error(PathReporter.report(parsed));
        throw new functions.https.HttpsError("invalid-argument", "Wrong arguments");
    }
    return parsed.right;
}

function generateBuid(): string {
    return randomBytes(BUID_BYTE_LENGTH).toString("hex");
}

function isAlreadyExistsError(e: { code: number }): boolean {
    return "code" in e && e.code === 6;
}

async function registerUserIfNotExists(collection: CollectionReference, fuid: string, phoneNumber: string): Promise<boolean> {
    try {
        await collection.doc(fuid).create({
            phoneNumber,
            createdAt: getUTCTimestamp(),
            registrationCount: 0
        });
        return true;
    } catch (e) {
        if (!isAlreadyExistsError(e)) {
            throw e;
        }
    }
    return false;
}

async function hasSpaceforBuids(
    collection: CollectionReference,
    fuid: string,
    maxCount: number
): Promise<boolean> {
    const doc = await collection.doc(fuid).get();
    if (!doc.exists) {
        return false;
    }
    return doc.get("registrationCount") < maxCount;
}

async function registerBuid(
    users: CollectionReference,
    registrations: CollectionReference,
    fuid: string,
    data: {}
): Promise<string> {
    for (let i = 0; i < MAX_BUID_RETRIES; i++) {
        const buid = generateBuid();
        try {
            await registrations.doc(buid).create({
                ...data,
                fuid,
                createdAt: getUTCTimestamp()
            });
            await users.doc(fuid).update({
                registrationCount: admin.firestore.FieldValue.increment(1)
            });

            return buid;
        } catch (e) {
            if (!isAlreadyExistsError(e)) {
                throw e;
            }
        }
    }
    throw new functions.https.HttpsError("deadline-exceeded", "Could not generate BUID");
}

export const registerBuidCallable = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("failed-precondition", "Missing authentication");
    }

    const phoneNumber = context.auth.token.phone_number;
    if (phoneNumber === undefined) {
        throw new functions.https.HttpsError("failed-precondition", "Phone number is missing");
    }

    const payload = parseRequest(data);

    const fuid = context.auth.uid;
    const firestore = admin.firestore();
    const users = firestore.collection("users");

    const registered = await registerUserIfNotExists(users, fuid, phoneNumber);
    if (registered) {
        console.log(`Registered user ${fuid}`);
    }

    if (!(await hasSpaceforBuids(users, fuid, MAX_BUIDS_PER_USER))) {
        throw new functions.https.HttpsError("resource-exhausted", "Too many BUIDs for the current user");
    }

    const buid = await registerBuid(users, firestore.collection("registrations"), fuid, payload);
    console.log(`Registered BUID ${buid} for user ${fuid}`);

    return {buid};
});
