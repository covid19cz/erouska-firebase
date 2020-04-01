import {spawn} from "child_process";
import * as fftest from "firebase-functions-test";

// initialize admin
const PROJECT_ID = "erouska-test";
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
// @ts-ignore
const _ = require("../src/index");

import {clearFirestoreData} from "@firebase/testing";

export const FIREBASE_TEST = fftest();

const emulator = spawn("firebase", ["emulators:start", "--only", "firestore"], {cwd: process.cwd()});

// wait for emulator to start
setTimeout(() => {
    run();
}, 3000);

beforeEach(async () => {
  await clearFirestoreData({ projectId: PROJECT_ID });
});

after(() => {
    console.log("Killing emulator");
    emulator.kill("SIGKILL");
    FIREBASE_TEST.cleanup();
});
