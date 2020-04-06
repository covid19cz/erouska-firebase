export interface ProximityRecord {
    buid: string;

    [key: string]: string;
}

export interface PhoneProximityData {
    phone: string;
    devices: { [key: string]: DeviceProximityData };
    metBuids: Set<string>;
}

export type DeviceProximityData = ProximityRecord[];

export interface DeviceDetails {
    phone: string;
    manufacturer: string;
    model: string;
    platform: string;
    platformVersion: string;
}

export interface ProximityFile {
    stream: NodeJS.ReadableStream,
    updatedAt: Date
}
