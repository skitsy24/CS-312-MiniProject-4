import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;

export async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const key = await scrypt(password, salt, keyLength);
    return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password, storedPassword) {
    if (typeof storedPassword !== "string") return false;

    if (storedPassword.startsWith("scrypt:")) {
        const parts = storedPassword.split(":");
        if (parts.length !== 3 || !/^[a-f0-9]{32}$/.test(parts[1]) ||
            !/^[a-f0-9]{128}$/.test(parts[2])) return false;

        const expected = Buffer.from(parts[2], "hex");
        const actual = await scrypt(password, parts[1], expected.length);
        return timingSafeEqual(actual, expected);
    }

    // Mini-Project-3 stored passwords as plain text. Upgrade after a valid login.
    const actual = Buffer.from(password);
    const expected = Buffer.from(storedPassword);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
}
