import * as functions from "firebase-functions";

export const REGION = "europe-west1";
export const FIREBASE_BUCKET_URL = "covid19cz.appspot.com";

export const MAX_BUIDS_PER_USER = 50;

export interface AWSBucket {
    name: string;
    key: string;
    secret: string;
}

function loadBucket(id: string, name: string): AWSBucket {
    const key = functions.config()[id].key;
    const secret = functions.config()[id].secret;
    // const key = process.env[`${id}_key`] as string;
    // const secret = process.env[`${id}_secret`] as string;
    return {
        name,
        key,
        secret,
    };
}

export const AWS_PHONE_CSV_PATH = "phones.csv";
export const AWS_READ_BUCKET = loadBucket("aws_read_bucket", "keboola-to-erouska-eu-s3filesbucket-97le08muirlf");
export const AWS_WRITE_BUCKET = loadBucket("aws_write_bucket", "erouska-to-keboola-eu-s3filesbucket-951s0u595wpl");
