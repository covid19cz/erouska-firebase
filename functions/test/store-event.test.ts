import {FIREBASE_TEST} from "./setup.test"; // must be first import
import {rejects} from "assert";
import * as functions from "firebase-functions";
import {storeEvent} from "../src";
import {createAuth} from "./common";
import {firestore} from "firebase-admin";
import {expect} from "chai";
import {getUnixTimestamp} from "../src/lib/time";
import DocumentData = FirebaseFirestore.DocumentData;

const storeEventMock = FIREBASE_TEST.wrap(storeEvent);

describe("storeEvent", () => {
    it("should not accept unauthorized calls", async () => {
        await rejects(async () => {
            await storeEventMock({});
        }, new functions.https.HttpsError("unauthenticated", "Chybějící autentizace"));
    });
    it("should not accept events without a category", async () => {
        await rejects(async () => {
            await storeEventMock({}, createAuth());
        }, new functions.https.HttpsError("invalid-argument", "Wrong arguments"));
    });
    it("should store event timestamp", async () => {
        const data = {
            category: "my-event",
            properties: {}
        };
        const timestamp = getUnixTimestamp();
        await storeEventMock(data, createAuth());
        const docs = await firestore().collection("events").listDocuments();
        const doc = (await docs[0].get()).data() as DocumentData;
        expect(doc.createdAt).to.be.closeTo(timestamp, 2);
    });
    it("should store data into the database", async () => {
        const data = {
            category: "my-event",
            properties: {
                "key1": "key2",
                "key3": "key4"
            }
        };
        await storeEventMock(data, createAuth());
        const docs = await firestore().collection("events").listDocuments();
        expect(docs.length).to.equal(1);
        const doc = (await docs[0].get()).data() as DocumentData;
        delete doc["createdAt"];
        expect(doc).to.eql(data);
    });
    it("should accept arbitrary data", async () => {
        const data = {
            category: "my-event",
            properties: {},
            "my-key": "value1",
            "my-key2": "value2"
        };
        await storeEventMock(data, createAuth());
        const docs = await firestore().collection("events").listDocuments();
        const doc = (await docs[0].get()).data() as DocumentData;
        delete doc["createdAt"];
        expect(doc).to.eql(data);
    });
});
