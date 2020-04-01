import {FIREBASE_TEST} from "./setup.test"; // must be first import
import {equal, rejects} from "assert";
import {isBuidActive} from "../src";
import * as functions from "firebase-functions";
import {createAuth} from "./common";
import {makeDeviceData, registerBuidMock} from "./register-buid.test";

const isBuidActiveMock = FIREBASE_TEST.wrap(isBuidActive);

function makeBuid(buid: string): { buid: string } {
    return {buid};
}

describe("isBuidActive", () => {
    it("should not accept unauthorized calls", async () => {
        await rejects(async () => {
            await isBuidActiveMock({});
        }, new functions.https.HttpsError("unauthenticated", "Chybějící autentizace"));
    });
    it("should not accept wrong input", async () => {
        await rejects(async () => {
            await isBuidActiveMock({}, createAuth());
        }, new functions.https.HttpsError("invalid-argument", "Wrong arguments"));
    });
    it("should return false if BUID does not exist", async () => {
        equal(await isBuidActiveMock(makeBuid("buid1"), createAuth()), false);
    });
    it("should return false if BUID is not owned by the user", async () => {
        const buid = await registerBuidMock(makeDeviceData(), createAuth("different-uid", "my-phone"));
        equal(await isBuidActiveMock(makeBuid(buid.buid), createAuth()), false);
    });
    it("should return true if BUID is owned by the user", async () => {
        const auth = createAuth();
        const buid = await registerBuidMock(makeDeviceData(), auth);
        equal(await isBuidActiveMock(makeBuid(buid.buid), auth), true);
    });
});
