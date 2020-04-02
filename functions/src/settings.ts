import {SecretManagerServiceClient} from "@google-cloud/secret-manager";
import {AWSBucket} from "./lib/aws";
import {FunctionBuilder, region, VALID_MEMORY_OPTIONS} from "firebase-functions";

export const FIREBASE_REGION = "europe-west1";
export const GCP_PROJECT = process.env.GCP_PROJECT as string;

export const MAX_BUIDS_PER_USER = 50;
export const AWS_PHONE_CSV_PATH = "msisdn.csv";

const SECRET_CLIENT = new SecretManagerServiceClient();

async function loadSecret(name: string): Promise<string> {
    if (GCP_PROJECT === undefined) {
        throw new Error("Missing GCP_PROJECT environment variable");
    }

    const secret = (await SECRET_CLIENT.accessSecretVersion({name: `projects/${GCP_PROJECT}/secrets/${name}/versions/latest`}))[0];
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

export async function loadAwsReadBucket(): Promise<AWSBucket> {
    return await loadBucket("aws_read_bucket", "keboola-to-erouska-eu-s3filesbucket-97le08muirlf");
}

export async function loadAwsWriteBucket(): Promise<AWSBucket> {
    return await loadBucket("aws_write_bucket", "erouska-to-keboola-eu-s3filesbucket-951s0u595wpl");
}

export function buildCloudFunction(params: { memory?: typeof VALID_MEMORY_OPTIONS[number], timeoutSeconds?: number } = {}): FunctionBuilder {
    return region(FIREBASE_REGION).runWith(params);
}
