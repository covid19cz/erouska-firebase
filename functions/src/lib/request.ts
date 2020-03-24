import {exact, HasProps, TypeOf} from "io-ts";
import {isLeft} from "fp-ts/lib/Either";
import {PathReporter} from "io-ts/lib/PathReporter";
import * as functions from "firebase-functions";

export function parseRequest<C extends HasProps>(schema: C, data: any): TypeOf<C> {
    const parsed = exact(schema).decode(data);
    if (isLeft(parsed)) {
        console.error(PathReporter.report(parsed));
        throw new functions.https.HttpsError("invalid-argument", "Wrong arguments");
    }
    return parsed.right;
}
