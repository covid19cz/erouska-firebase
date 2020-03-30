import * as functions from "firebase-functions";
import {S3} from "aws-sdk";
import {
    AWS_PHONE_CSV_PATH,
    AWS_WRITE_BUCKET,
    AWSBucket,
    FIREBASE_BUCKET_URL,
    REGION
} from "../settings";
import {firestore, storage} from "firebase-admin";
import {format, parseStream, parseString} from "fast-csv";
import {DeviceDetails, PhoneProximityData, ProximityRecord} from "../lib/proximity";

type DeviceMap = { [key: string]: DeviceDetails };

function createS3Client(bucket: AWSBucket): S3 {
    return new S3({
        apiVersion: "2006-03-01",
        region: "eu-central-1",
        accessKeyId: bucket.key,
        secretAccessKey: bucket.secret
    });
}

function bucketKey(bucket: AWSBucket, key: string): { Bucket: string, Key: string } {
    return {
        Bucket: bucket.name,
        Key: key
    };
}

async function getFileIfExists(s3: S3, bucket: AWSBucket, file: string, headOnly: boolean = false): Promise<S3.Types.GetObjectOutput | null> {
    try {
        const params = {
            ...bucketKey(bucket, file)
        };
        if (headOnly) {
            return await s3.headObject(params).promise();
        } else {
            return await s3.getObject(params).promise();
        }
    } catch (e) {
        if ("statusCode" in e && e.statusCode === 404) {
            return null;
        }
        throw e;
    }
}

function parsePhoneCSVRecords(stream: NodeJS.ReadableStream): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const phones: string[] = [];
        stream
            .on('error', error => reject(error))
            .on('data', row => phones.push(row["phone"]))
            .on('end', () => resolve(phones));
    });
}

async function getPhoneNumbers(s3: S3, bucket: AWSBucket): Promise<string[]> {
    const file = await getFileIfExists(s3, bucket, AWS_PHONE_CSV_PATH);
    if (file === null) return [];

    const buffer = (file.Body as Buffer);
    const stream = parseString(buffer.toString("utf-8"), {headers: true});
    try {
        return await parsePhoneCSVRecords(stream);
    } catch (e) {
        console.error(`Error while parsing CSV phone numbers: ${e}`);
        return [];
    }
}

async function findMissingPhones(s3: S3, bucket: AWSBucket, phones: string[]): Promise<string[]> {
    const results = await Promise.all(phones.map(async (phone) => {
        const file = await getFileIfExists(s3, bucket, phone, true);
        return {phone, missing: file === null};
    }));
    return results.filter(({phone, missing}) => missing).map(({phone}) => phone);
}

async function getFuidFromPhone(phone: string): Promise<string | null> {
    const client = firestore();
    const query = await client.collection("users").where("phoneNumber", "==", phone).get();
    if (query.empty) return null;
    return query.docs[0].id;
}

async function getProximityRecord(fuid: string, buid: string): Promise<NodeJS.ReadableStream | null> {
    const bucket = storage().bucket(FIREBASE_BUCKET_URL);
    const files = (await bucket.getFiles({
        prefix: `proximity/${fuid}/${buid}/`,
        delimiter: "/",
        maxResults: 1
    }))[0];
    if (files.length === 0) return null;

    return files[0].createReadStream();
}

function parseBuidCSVRecords(stream: NodeJS.ReadableStream, metBuids: Set<string>): Promise<ProximityRecord[]> {
    return new Promise((resolve, reject) => {
        const encounters: ProximityRecord[] = [];
        stream
            .on('error', error => reject(error))
            .on('data', row => {
                const buid = row["buid"];
                if (buid !== undefined) {
                    metBuids.add(buid);
                    encounters.push(row);
                }
            })
            .on('end', () => resolve(encounters));
    });
}

async function getPhoneRecords(s3: S3, bucket: AWSBucket, phone: string): Promise<PhoneProximityData> {
    const result: PhoneProximityData = {
        phone,
        devices: {},
        metBuids: new Set()
    };

    const fuid = await getFuidFromPhone(phone);
    if (fuid === null) return result;

    const client = firestore();
    const registrations = client.collection("registrations");
    const query = await registrations.where("fuid", "==", fuid).get();
    const buids = await Promise.all(query.docs.map(async doc => ({
        buid: doc.id,
        stream: await getProximityRecord(fuid, doc.id)
    })));

    for (const {buid, stream} of buids) {
        if (stream !== null) {
            try {
                result.devices[buid] = await parseBuidCSVRecords(parseStream(stream, {
                    headers: true,
                }), result.metBuids);
            } catch (e) {
                console.error(`Error during BUID ${buid} CSV parsing: ${e}`);
            }
        }
    }
    return result;
}

async function buildDeviceMap(buids: Set<string>): Promise<DeviceMap> {
    const client = firestore();
    const registrations = client.collection("registrations");
    const users = client.collection("users");

    const refs = [...buids.values()].map(buid => registrations.doc(buid));
    const fuidRefs = [];
    const pendingBuids: { [key: string]: string } = {};
    const map: DeviceMap = {};
    if (refs.length === 0) return map;

    for (const document of await client.getAll(...refs)) {
        const buid = document.id;
        if (document.exists) {
            const fuid = document.get("fuid");
            fuidRefs.push(users.doc(fuid));
            pendingBuids[fuid] = buid;
        }
    }
    if (fuidRefs.length === 0) return map;

    for (const document of await client.getAll(...fuidRefs)) {
        const buid = pendingBuids[document.id];
        if (document.exists) {
            map[buid] = {
                phone: document.get("phoneNumber")
            };
        }
    }
    return map;
}

async function uploadPhone(s3: S3, bucket: AWSBucket, phoneData: PhoneProximityData, deviceMap: DeviceMap) {
    const buids = Object.keys(phoneData.devices).sort();

    const stream = format({headers: true});

    for (const buid of buids) {
        for (const row of phoneData.devices[buid]) {
            const neighbourBuid = row["buid"];
            const deviceDetails = deviceMap[neighbourBuid] ?? {
                phone: ""
            };
            row["buid"] = buid;
            row["phone"] = deviceDetails.phone;
            stream.write(row);
        }
    }
    stream.end();

    const filePath = `${phoneData.phone}.csv`;
    await s3.upload({
        ...bucketKey(bucket, filePath),
        Body: stream
    }).promise();
}

async function uploadPhones(s3: S3, bucket: AWSBucket, phones: string[]) {
    const records = await Promise.all(phones.map((phone) => getPhoneRecords(s3, bucket, phone)));
    const buidSet = new Set<string>();
    for (const record of records) {
        for (const buid of record.metBuids) {
            buidSet.add(buid);
        }
    }

    const deviceMap = await buildDeviceMap(buidSet);
    await Promise.all(records.map(record => uploadPhone(s3, bucket, record, deviceMap)));
}

export async function sendProximityToAws() {
    const s3_read = createS3Client(AWS_WRITE_BUCKET);
    const phones = await getPhoneNumbers(s3_read, AWS_WRITE_BUCKET);

    const s3_write = createS3Client(AWS_WRITE_BUCKET);
    // const missingPhones = await findMissingPhones(s3_write, AWS_WRITE_BUCKET, phones);
    // if (missingPhones.length === 0) return;

    await uploadPhones(s3_write, AWS_WRITE_BUCKET, phones);
    // const file = await getFileIfExists(s3_write, AWS_WRITE_BUCKET, phones[0] + ".csv");
    // console.log((file?.Body as Buffer).toString("utf-8"));
}

export const awsPoller = functions.region(REGION).pubsub
    .schedule("every 5 minutes")
    .onRun(async (context) => {
        await sendProximityToAws();
    });
