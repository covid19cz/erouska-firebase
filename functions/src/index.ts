import * as fbFunctions from 'firebase-functions';

import * as adminFunctions from 'firebase-admin';

import { Guid } from "guid-typescript";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const generateBuid = fbFunctions.database.ref("/users/{uid}").onCreate((snapshot, context) => {
    // Grab the current value of what was written to the Realtime Database.
    console.log("generating BUID for UID ", context.params.uid);
    //
    // strip UUID (eb754589-7357-4fbe-945f-eb83a4a448aa) to 10-bytes
    var buidAsString = Guid.create().toString()
        // strip first 6 bytes, keep only 10 bytes (4fbe-945f-eb83a4a448aa)
        .substring(14)
        // remove dashes - so that we have pure octal representation only (4fbe945feb83a4a448aa)
        .replace("-","");
    // TODO: check that such BUID does not exist yet

    adminFunctions.database()
    return snapshot.ref.parent!!.child('buid').set(buidAsString);
});