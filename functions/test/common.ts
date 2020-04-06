export function createAuth(uid: string = "uid1", phoneNumber: string = "123456789") {
    return {
        auth: {
            uid,
            token: {
                phone_number: phoneNumber
            }
        }
    };
}
