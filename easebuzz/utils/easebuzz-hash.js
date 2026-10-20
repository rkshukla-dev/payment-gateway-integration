import crypto from 'crypto';
import { easebuzzConfig } from '../config/easebuzz.js';

const sha512 = (value) => crypto.createHash("sha512").update(value, 'utf8').digest("hex");

export function generatePaymentHash(data) {
    const udfFields = Array.from(
        { length: 10 },
        (_, i) => data[`udf${i+1}`] ?? ""
    );

    const hashString = [
        easebuzzConfig.key,
        data.txnid,
        data.amount,
        data.productinfo,
        data.firstname,
        data.email,
        ...udfFields,
        easebuzzConfig.salt
    ].join("|")

    return sha512(hashString);
}

export function verifyResponseHash(data) {
    if(!data.hash || !data.status) return false;

    const udfFields = Array.from(
        { length: 10 },
        (_, i) => data[`udf${10-i}`] ?? ""
    );

    const hashString = [].join("|");

    const expected = sha512(hashString);
    const received = String(data.hash);

    if (!/^[a-f0-9]{128}$/i.test(received)) return false;

    return crypto.timingSafeEqual(
        Buffer.from(expected.toLowerCase(), "hex"),
        Buffer.from(received.toLowerCase(), "hex")
    );
}