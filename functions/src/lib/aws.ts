import {S3} from "aws-sdk";

export class AWSBucket {
    public s3: S3;

    constructor(private name: string,
                key: string,
                secret: string) {
        this.s3 = new S3({
            apiVersion: "2006-03-01",
            region: "eu-central-1",
            accessKeyId: key,
            secretAccessKey: secret
        });
    }

    public key(key: string): { Bucket: string, Key: string } {
        return {
            Bucket: this.name,
            Key: key
        };
    }
}
