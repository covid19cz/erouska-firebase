import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
import {AWSBucket} from "./lib/aws";

export const REGION = "europe-west1";
export const FIREBASE_BUCKET_URL = "covid19cz.appspot.com";

export const MAX_BUIDS_PER_USER = 50;

const SECRET_CLIENT = new SecretManagerServiceClient();

async function loadSecret(name: string): Promise<string> {
    if (name in process.env) {
        return process.env[name] as string;
    }

    const secret = (await SECRET_CLIENT.accessSecretVersion({ name }))[0];
    const value = secret?.payload?.data?.toString();
    if (value === null || value === undefined) {
        throw Error(`Secret ${name} not found`);
    }
    return value;
}

async function loadBucket(secret_namespace: string, name: string): Promise<AWSBucket> {
    const key = await loadSecret(`${secret_namespace}_key`);
    const secret = await loadSecret(`${secret_namespace}_secret`);
    return new AWSBucket(name, key, secret);
}

export const AWS_PHONE_CSV_PATH = "msisdn.csv";

export async function loadAwsReadBucket(): Promise<AWSBucket> {
    return await loadBucket("aws_read_bucket", "keboola-to-erouska-eu-s3filesbucket-97le08muirlf");
}

export async function loadAwsWriteBucket(): Promise<AWSBucket> {
    return await loadBucket("aws_write_bucket", "erouska-to-keboola-eu-s3filesbucket-951s0u595wpl");
}
