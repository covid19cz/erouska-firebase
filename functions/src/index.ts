import * as firebase from 'firebase-functions';

import * as admin from 'firebase-admin';

import { Guid } from "guid-typescript";
import UserRecord = admin.auth.UserRecord;

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

/**
 * user.onCreate trigger creates a user document
 *
 * We may also use cloud function - but then I not know where is the trusted source for the 'phoneNumber' field.
 */

firebase.auth.user().onCreate((user) => {
    // Grab the current value of what was written to the Realtime Database.
    console.log("generating /user/", user.uid, " record");
    // call the main logic
    return generateBuidAndCreateUser(user);
});

function generateBuidAndCreateUser(user: UserRecord) {
    // strip UUID (eb754589-7357-4fbe-945f-eb83a4a448aa) to 10-bytes
    var buidAsString = Guid.create().toString()
        // strip first 6 bytes, keep only 10 bytes (4fbe-945f-eb83a4a448aa)
        .substring(14)
        // remove dashes - so that we have pure octal representation only (4fbe945feb83a4a448aa)
        .replace("-","");
    // retrieve DB reference
    var db = admin.firestore();
    // check that such BUID does not exist yet
    return db.collection("users").where('buid', '==', buidAsString)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                // we may create use the generated BUID, create the /user/ document
                console.log("creating user ", user.uid);
                db.collection("users").doc(user.uid).set({
                    "buid": buidAsString,
                    "phoneNumber": user.phoneNumber,
                    "infected": false
                });
            } else {
                // let's do it again
                console.log("BUID ", buidAsString, " already used, trying again");
                generateBuidAndCreateUser(user);
            }
        })


}