import * as functions from "firebase-functions";
import * as t from "io-ts"
import * as admin from "firebase-admin";
import {MAX_BUIDS_PER_USER, REGION} from "../settings";
import {CollectionReference} from "@google-cloud/firestore";
import {randomBytes} from "crypto";
import {parseRequest} from "../lib/request";

const MAX_BUID_RETRIES = 10;
const BUID_BYTE_LENGTH = 10;

function getUnixTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}

const RequestSchema = t.type({
    platform: t.string,
    platformVersion: t.string,
    manufacturer: t.string,
    model: t.string,
    locale: t.string,
    pushRegistrationToken: t.string
});

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
            createdAt: getUnixTimestamp(),
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
    return (doc.get("registrationCount") || 0) < maxCount;
}

async function registerBuid(
    client: admin.firestore.Firestore,
    users: CollectionReference,
    registrations: CollectionReference,
    fuid: string,
    data: {}
): Promise<string> {
    for (let i = 0; i < MAX_BUID_RETRIES; i++) {
        const buid = generateBuid();
        try {
            const batch = client.batch();
            batch.create(registrations.doc(buid), {
                ...data,
                fuid,
                createdAt: getUnixTimestamp()
            });
            batch.update(users.doc(fuid), {
                registrationCount: admin.firestore.FieldValue.increment(1)
            });
            await batch.commit();

            return buid;
        } catch (e) {
            if (!isAlreadyExistsError(e)) {
                throw e;
            }
        }
    }
    throw new functions.https.HttpsError("deadline-exceeded", "Nepodařilo se vygenerovat BUID");
}

export const registerBuidCallable = functions.region(REGION).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("failed-precondition", "Chybějící autentizace");
    }

    const phoneNumber = context.auth.token.phone_number;
    if (phoneNumber === undefined) {
        throw new functions.https.HttpsError("failed-precondition", "Chybí telefonní číslo");
    }

    const payload = parseRequest(RequestSchema, data);

    const fuid = context.auth.uid;
    const firestore = admin.firestore();
    const users = firestore.collection("users");

    const registered = await registerUserIfNotExists(users, fuid, phoneNumber);
    if (registered) {
        console.log(`Registered user ${fuid}`);
    }

    if (!(await hasSpaceforBuids(users, fuid, MAX_BUIDS_PER_USER))) {
        throw new functions.https.HttpsError("resource-exhausted", "Na Vašem účtu je již příliš mnoho registrovaných zařízení");
    }

    const buid = await registerBuid(firestore, users, firestore.collection("registrations"), fuid, payload);
    console.log(`Registered BUID ${buid} for user ${fuid}`);
    return {buid};
});
