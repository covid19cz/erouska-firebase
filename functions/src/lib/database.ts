import * as admin from "firebase-admin";

export async function isBuidOwnedByFuid(client: admin.firestore.Firestore,
                                        buid: string,
                                        fuid: string): Promise<boolean> {
    const buidDocRef = client.collection("registrations").doc(buid);
    const buidDoc = await buidDocRef.get();
    return buidDoc.exists && buidDoc.get("fuid") === fuid;
}
