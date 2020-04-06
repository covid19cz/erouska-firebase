import {FIREBASE_TEST} from "./setup.test"; // must be first import
import {equal, rejects} from "assert";
import {changePushToken} from "../src";
import * as functions from "firebase-functions";
import {createAuth} from "./common";
import {makeDeviceData, registerBuidMock} from "./register-buid.test";
import {firestore} from "firebase-admin";

const changePushTokenMock = FIREBASE_TEST.wrap(changePushToken);

function makeArguments(buid: string, pushRegistrationToken: string) {
    return {
        buid,
        pushRegistrationToken
    }
}

describe("changePushToken", () => {
    it("should not accept unauthorized calls", async () => {
        await rejects(async () => {
            await changePushTokenMock({});
        }, new functions.https.HttpsError("unauthenticated", "Chybějící autentizace"));
    });
    it("should not accept wrong input", async () => {
        await rejects(async () => {
            await changePushTokenMock({}, createAuth());
        }, new functions.https.HttpsError("invalid-argument", "Wrong arguments"));
    });
    it("should not accept missing BUID", async () => {
        await rejects(async () => {
            await changePushTokenMock(makeArguments("buid1", ""), createAuth());
        }, new functions.https.HttpsError("unauthenticated", "Zařízení neexistuje nebo nepatří Vašemu účtu"));
    });
    it("should not accept BUID not owned by the user", async () => {
        const buid = await registerBuidMock(makeDeviceData(), createAuth("different-uid", "my-phone"));
        await rejects(async () => {
            await changePushTokenMock(makeArguments(buid.buid, ""), createAuth());
        }, new functions.https.HttpsError("unauthenticated", "Zařízení neexistuje nebo nepatří Vašemu účtu"));
    });
    it("should change token of BUID owned by the user", async () => {
        const auth = createAuth();
        const buid = await registerBuidMock(makeDeviceData(), auth);
        const token = "my-token";
        await changePushTokenMock(makeArguments(buid.buid, token), auth);
        const doc = await firestore().collection("registrations").doc(buid.buid).get();
        equal(doc.get("pushRegistrationToken"), token);
    });
});
