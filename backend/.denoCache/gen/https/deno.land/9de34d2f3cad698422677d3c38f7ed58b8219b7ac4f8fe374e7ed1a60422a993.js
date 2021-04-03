import { default as randomBytes } from "./_crypto/randomBytes.ts";
import { createHash as stdCreateHash, supportedAlgorithms, } from "../hash/mod.ts";
import { pbkdf2, pbkdf2Sync } from "./_crypto/pbkdf2.ts";
import { Buffer } from "./buffer.ts";
import { Transform } from "./stream.ts";
import { encodeToString as encodeToHexString } from "../encoding/hex.ts";
export class Hash extends Transform {
    constructor(algorithm, _opts) {
        super({
            transform(chunk, _encoding, callback) {
                hash.update(chunk);
                callback();
            },
            flush(callback) {
                this.push(hash.digest());
                callback();
            },
        });
        const hash = this.hash = stdCreateHash(algorithm);
    }
    update(data, _encoding) {
        if (typeof data === "string") {
            data = new TextEncoder().encode(data);
            this.hash.update(data);
        }
        else {
            this.hash.update(data);
        }
        return this;
    }
    digest(encoding) {
        const digest = this.hash.digest();
        if (encoding === undefined) {
            return Buffer.from(digest);
        }
        switch (encoding) {
            case "hex": {
                return encodeToHexString(new Uint8Array(digest));
            }
            default: {
                throw new Error(`The output encoding for hash digest is not impelemented: ${encoding}`);
            }
        }
    }
}
export function createHash(algorithm, opts) {
    return new Hash(algorithm, opts);
}
export function getHashes() {
    return supportedAlgorithms.slice();
}
export default { Hash, createHash, getHashes, pbkdf2, pbkdf2Sync, randomBytes };
export { pbkdf2, pbkdf2Sync, randomBytes };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3J5cHRvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3J5cHRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxPQUFPLElBQUksV0FBVyxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDbEUsT0FBTyxFQUNMLFVBQVUsSUFBSSxhQUFhLEVBRzNCLG1CQUFtQixHQUNwQixNQUFNLGdCQUFnQixDQUFDO0FBQ3hCLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDekQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNyQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBRXhDLE9BQU8sRUFBRSxjQUFjLElBQUksaUJBQWlCLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQVV6RSxNQUFNLE9BQU8sSUFBSyxTQUFRLFNBQVM7SUFFakMsWUFBWSxTQUE2QixFQUFFLEtBQXdCO1FBQ2pFLEtBQUssQ0FBQztZQUNKLFNBQVMsQ0FBQyxLQUFhLEVBQUUsU0FBaUIsRUFBRSxRQUFvQjtnQkFDOUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsUUFBUSxFQUFFLENBQUM7WUFDYixDQUFDO1lBQ0QsS0FBSyxDQUFDLFFBQW9CO2dCQUV4QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUN6QixRQUFRLEVBQUUsQ0FBQztZQUNiLENBQUM7U0FDRixDQUFDLENBQUM7UUFDSCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBUUQsTUFBTSxDQUFDLElBQTBCLEVBQUUsU0FBa0I7UUFDbkQsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDNUIsSUFBSSxHQUFHLElBQUksV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hCO2FBQU07WUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN4QjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQVNELE1BQU0sQ0FBQyxRQUFpQjtRQUN0QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2xDLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtZQUMxQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDNUI7UUFFRCxRQUFRLFFBQVEsRUFBRTtZQUNoQixLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUNWLE9BQU8saUJBQWlCLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzthQUNsRDtZQUVELE9BQU8sQ0FBQyxDQUFDO2dCQUNQLE1BQU0sSUFBSSxLQUFLLENBQ2IsNERBQTRELFFBQVEsRUFBRSxDQUN2RSxDQUFDO2FBQ0g7U0FDRjtJQUNILENBQUM7Q0FDRjtBQU1ELE1BQU0sVUFBVSxVQUFVLENBQ3hCLFNBQTZCLEVBQzdCLElBQXVCO0lBRXZCLE9BQU8sSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ25DLENBQUM7QUFLRCxNQUFNLFVBQVUsU0FBUztJQUN2QixPQUFPLG1CQUFtQixDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3JDLENBQUM7QUFFRCxlQUFlLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsQ0FBQztBQUNoRixPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsQ0FBQyJ9