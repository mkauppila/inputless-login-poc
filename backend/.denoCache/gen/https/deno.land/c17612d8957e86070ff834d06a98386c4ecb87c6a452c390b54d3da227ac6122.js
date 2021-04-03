/*!
 * Substantial parts adapted from https://github.com/brianc/node-postgres
 * which is licensed as follows:
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2010 - 2019 Brian Carlson
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { bold, BufReader, BufWriter, yellow } from "../deps.ts";
import { DeferredStack } from "./deferred.ts";
import { hashMd5Password, readUInt32BE } from "../utils.ts";
import { PacketReader } from "./packet_reader.ts";
import { PacketWriter } from "./packet_writer.ts";
import { parseError, parseNotice } from "./warning.ts";
import { QueryArrayResult, QueryObjectResult, } from "../query/query.ts";
export var ResultType;
(function (ResultType) {
    ResultType[ResultType["ARRAY"] = 0] = "ARRAY";
    ResultType[ResultType["OBJECT"] = 1] = "OBJECT";
})(ResultType || (ResultType = {}));
export var Format;
(function (Format) {
    Format[Format["TEXT"] = 0] = "TEXT";
    Format[Format["BINARY"] = 1] = "BINARY";
})(Format || (Format = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["Idle"] = "I";
    TransactionStatus["IdleInTransaction"] = "T";
    TransactionStatus["InFailedTransaction"] = "E";
})(TransactionStatus || (TransactionStatus = {}));
function assertArgumentsResponse(msg) {
    switch (msg.type) {
        case "2":
            break;
        case "E":
            throw parseError(msg);
        default:
            throw new Error(`Unexpected frame: ${msg.type}`);
    }
}
function assertSuccessfulStartup(msg) {
    switch (msg.type) {
        case "E":
            throw parseError(msg);
    }
}
function assertSuccessfulAuthentication(auth_message) {
    if (auth_message.type === "E") {
        throw parseError(auth_message);
    }
    else if (auth_message.type !== "R") {
        throw new Error(`Unexpected auth response: ${auth_message.type}.`);
    }
    const responseCode = auth_message.reader.readInt32();
    if (responseCode !== 0) {
        throw new Error(`Unexpected auth response code: ${responseCode}.`);
    }
}
function assertQueryResponse(msg) {
    switch (msg.type) {
        case "1":
            break;
        case "E":
            throw parseError(msg);
        default:
            throw new Error(`Unexpected frame: ${msg.type}`);
    }
}
export class Message {
    constructor(type, byteCount, body) {
        this.type = type;
        this.byteCount = byteCount;
        this.body = body;
        this.reader = new PacketReader(body);
    }
}
export class Column {
    constructor(name, tableOid, index, typeOid, columnLength, typeModifier, format) {
        this.name = name;
        this.tableOid = tableOid;
        this.index = index;
        this.typeOid = typeOid;
        this.columnLength = columnLength;
        this.typeModifier = typeModifier;
        this.format = format;
    }
}
export class RowDescription {
    constructor(columnCount, columns) {
        this.columnCount = columnCount;
        this.columns = columns;
    }
}
const decoder = new TextDecoder();
const encoder = new TextEncoder();
export class Connection {
    constructor(connParams) {
        this.connParams = connParams;
        this.connected = false;
        this.#packetWriter = new PacketWriter();
        this.#parameters = {};
        this.#queryLock = new DeferredStack(1, [undefined]);
    }
    #bufReader;
    #bufWriter;
    #conn;
    #packetWriter;
    #parameters;
    #pid;
    #queryLock;
    #secretKey;
    #transactionStatus;
    async readMessage() {
        const header = new Uint8Array(5);
        await this.#bufReader.readFull(header);
        const msgType = decoder.decode(header.slice(0, 1));
        const msgLength = readUInt32BE(header, 1) - 4;
        const msgBody = new Uint8Array(msgLength);
        await this.#bufReader.readFull(msgBody);
        return new Message(msgType, msgLength, msgBody);
    }
    async serverAcceptsTLS() {
        const writer = this.#packetWriter;
        writer.clear();
        writer
            .addInt32(8)
            .addInt32(80877103)
            .join();
        await this.#bufWriter.write(writer.flush());
        await this.#bufWriter.flush();
        const response = new Uint8Array(1);
        await this.#conn.read(response);
        switch (String.fromCharCode(response[0])) {
            case "S":
                return true;
            case "N":
                return false;
            default:
                throw new Error(`Could not check if server accepts SSL connections, server responded with: ${response}`);
        }
    }
    async sendStartupMessage() {
        const writer = this.#packetWriter;
        writer.clear();
        writer.addInt16(3).addInt16(0);
        const connParams = this.connParams;
        writer.addCString("user").addCString(connParams.user);
        writer.addCString("database").addCString(connParams.database);
        writer.addCString("application_name").addCString(connParams.applicationName);
        writer.addCString("client_encoding").addCString("'utf-8'");
        writer.addCString("");
        const bodyBuffer = writer.flush();
        const bodyLength = bodyBuffer.length + 4;
        writer.clear();
        const finalBuffer = writer
            .addInt32(bodyLength)
            .add(bodyBuffer)
            .join();
        await this.#bufWriter.write(finalBuffer);
        await this.#bufWriter.flush();
        return await this.readMessage();
    }
    async startup() {
        const { hostname, port, tls: { enforce: enforceTLS, }, } = this.connParams;
        this.#conn = await Deno.connect({ port, hostname });
        this.#bufWriter = new BufWriter(this.#conn);
        if (await this.serverAcceptsTLS()) {
            try {
                if (typeof Deno.startTls === "undefined") {
                    throw new Error("You need to execute Deno with the `--unstable` argument in order to stablish a TLS connection");
                }
                this.#conn = await Deno.startTls(this.#conn, { hostname });
            }
            catch (e) {
                if (!enforceTLS) {
                    console.error(bold(yellow("TLS connection failed with message: ")) +
                        e.message +
                        "\n" +
                        bold("Defaulting to non-encrypted connection"));
                    this.#conn = await Deno.connect({ port, hostname });
                }
                else {
                    throw e;
                }
            }
            this.#bufWriter = new BufWriter(this.#conn);
        }
        else if (enforceTLS) {
            throw new Error("The server isn't accepting TLS connections. Change the client configuration so TLS configuration isn't required to connect");
        }
        this.#bufReader = new BufReader(this.#conn);
        try {
            const startup_response = await this.sendStartupMessage();
            assertSuccessfulStartup(startup_response);
            await this.authenticate(startup_response);
            let msg;
            connection_status: while (true) {
                msg = await this.readMessage();
                switch (msg.type) {
                    case "E":
                        await this.processError(msg, false);
                        break;
                    case "K":
                        this._processBackendKeyData(msg);
                        break;
                    case "S":
                        this._processParameterStatus(msg);
                        break;
                    case "Z": {
                        this._processReadyForQuery(msg);
                        break connection_status;
                    }
                    default:
                        throw new Error(`Unknown response for startup: ${msg.type}`);
                }
            }
            this.connected = true;
        }
        catch (e) {
            this.#conn.close();
            throw e;
        }
    }
    async authenticate(msg) {
        const code = msg.reader.readInt32();
        switch (code) {
            case 0:
                break;
            case 3:
                await assertSuccessfulAuthentication(await this.authenticateWithClearPassword());
                break;
            case 5: {
                const salt = msg.reader.readBytes(4);
                await assertSuccessfulAuthentication(await this.authenticateWithMd5(salt));
                break;
            }
            case 7: {
                throw new Error("Database server expected gss authentication, which is not supported at the moment");
            }
            case 10: {
                throw new Error("Database server expected scram-sha-256 authentication, which is not supported at the moment");
            }
            default:
                throw new Error(`Unknown auth message code ${code}`);
        }
    }
    async authenticateWithClearPassword() {
        this.#packetWriter.clear();
        const password = this.connParams.password || "";
        const buffer = this.#packetWriter.addCString(password).flush(0x70);
        await this.#bufWriter.write(buffer);
        await this.#bufWriter.flush();
        return this.readMessage();
    }
    async authenticateWithMd5(salt) {
        this.#packetWriter.clear();
        if (!this.connParams.password) {
            throw new Error("Auth Error: attempting MD5 auth with password unset");
        }
        const password = hashMd5Password(this.connParams.password, this.connParams.user, salt);
        const buffer = this.#packetWriter.addCString(password).flush(0x70);
        await this.#bufWriter.write(buffer);
        await this.#bufWriter.flush();
        return this.readMessage();
    }
    _processBackendKeyData(msg) {
        this.#pid = msg.reader.readInt32();
        this.#secretKey = msg.reader.readInt32();
    }
    _processParameterStatus(msg) {
        const key = msg.reader.readCString();
        const value = msg.reader.readCString();
        this.#parameters[key] = value;
    }
    _processReadyForQuery(msg) {
        const txStatus = msg.reader.readByte();
        this.#transactionStatus = String.fromCharCode(txStatus);
    }
    async _readReadyForQuery() {
        const msg = await this.readMessage();
        if (msg.type !== "Z") {
            throw new Error(`Unexpected message type: ${msg.type}, expected "Z" (ReadyForQuery)`);
        }
        this._processReadyForQuery(msg);
    }
    async _simpleQuery(query, type) {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter.addCString(query.text).flush(0x51);
        await this.#bufWriter.write(buffer);
        await this.#bufWriter.flush();
        let result;
        if (type === ResultType.ARRAY) {
            result = new QueryArrayResult(query);
        }
        else {
            result = new QueryObjectResult(query);
        }
        let msg;
        msg = await this.readMessage();
        switch (msg.type) {
            case "T":
                result.loadColumnDescriptions(this.parseRowDescription(msg));
                break;
            case "n":
                break;
            case "E":
                await this.processError(msg);
                break;
            case "N":
                result.warnings.push(await this.processNotice(msg));
                break;
            case "C": {
                const commandTag = this.getCommandTag(msg);
                result.handleCommandComplete(commandTag);
                result.done();
                break;
            }
            default:
                throw new Error(`Unexpected frame: ${msg.type}`);
        }
        while (true) {
            msg = await this.readMessage();
            switch (msg.type) {
                case "D": {
                    result.insertRow(this.parseRowData(msg));
                    break;
                }
                case "C": {
                    const commandTag = this.getCommandTag(msg);
                    result.handleCommandComplete(commandTag);
                    result.done();
                    break;
                }
                case "Z":
                    this._processReadyForQuery(msg);
                    return result;
                case "E":
                    await this.processError(msg);
                    break;
                case "N":
                    result.warnings.push(await this.processNotice(msg));
                    break;
                case "T":
                    result.loadColumnDescriptions(this.parseRowDescription(msg));
                    break;
                default:
                    throw new Error(`Unexpected frame: ${msg.type}`);
            }
        }
    }
    async appendQueryToMessage(query) {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter
            .addCString("")
            .addCString(query.text)
            .addInt16(0)
            .flush(0x50);
        await this.#bufWriter.write(buffer);
    }
    async appendArgumentsToMessage(query) {
        this.#packetWriter.clear();
        const hasBinaryArgs = query.args.some((arg) => arg instanceof Uint8Array);
        this.#packetWriter.clear();
        this.#packetWriter
            .addCString("")
            .addCString("");
        if (hasBinaryArgs) {
            this.#packetWriter.addInt16(query.args.length);
            query.args.forEach((arg) => {
                this.#packetWriter.addInt16(arg instanceof Uint8Array ? 1 : 0);
            });
        }
        else {
            this.#packetWriter.addInt16(0);
        }
        this.#packetWriter.addInt16(query.args.length);
        query.args.forEach((arg) => {
            if (arg === null || typeof arg === "undefined") {
                this.#packetWriter.addInt32(-1);
            }
            else if (arg instanceof Uint8Array) {
                this.#packetWriter.addInt32(arg.length);
                this.#packetWriter.add(arg);
            }
            else {
                const byteLength = encoder.encode(arg).length;
                this.#packetWriter.addInt32(byteLength);
                this.#packetWriter.addString(arg);
            }
        });
        this.#packetWriter.addInt16(0);
        const buffer = this.#packetWriter.flush(0x42);
        await this.#bufWriter.write(buffer);
    }
    async appendQueryTypeToMessage() {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter.addCString("P").flush(0x44);
        await this.#bufWriter.write(buffer);
    }
    async appendExecuteToMessage() {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter
            .addCString("")
            .addInt32(0)
            .flush(0x45);
        await this.#bufWriter.write(buffer);
    }
    async appendSyncToMessage() {
        this.#packetWriter.clear();
        const buffer = this.#packetWriter.flush(0x53);
        await this.#bufWriter.write(buffer);
    }
    async processError(msg, recoverable = true) {
        const error = parseError(msg);
        if (recoverable) {
            await this._readReadyForQuery();
        }
        throw error;
    }
    processNotice(msg) {
        const warning = parseNotice(msg);
        console.error(`${bold(yellow(warning.severity))}: ${warning.message}`);
        return warning;
    }
    async _preparedQuery(query, type) {
        await this.appendQueryToMessage(query);
        await this.appendArgumentsToMessage(query);
        await this.appendQueryTypeToMessage();
        await this.appendExecuteToMessage();
        await this.appendSyncToMessage();
        await this.#bufWriter.flush();
        await assertQueryResponse(await this.readMessage());
        await assertArgumentsResponse(await this.readMessage());
        let result;
        if (type === ResultType.ARRAY) {
            result = new QueryArrayResult(query);
        }
        else {
            result = new QueryObjectResult(query);
        }
        let msg;
        msg = await this.readMessage();
        switch (msg.type) {
            case "T": {
                const rowDescription = this.parseRowDescription(msg);
                result.loadColumnDescriptions(rowDescription);
                break;
            }
            case "n":
                break;
            case "E":
                await this.processError(msg);
                break;
            default:
                throw new Error(`Unexpected frame: ${msg.type}`);
        }
        outerLoop: while (true) {
            msg = await this.readMessage();
            switch (msg.type) {
                case "D": {
                    const rawDataRow = this.parseRowData(msg);
                    result.insertRow(rawDataRow);
                    break;
                }
                case "C": {
                    const commandTag = this.getCommandTag(msg);
                    result.handleCommandComplete(commandTag);
                    result.done();
                    break outerLoop;
                }
                case "E":
                    await this.processError(msg);
                    break;
                default:
                    throw new Error(`Unexpected frame: ${msg.type}`);
            }
        }
        await this._readReadyForQuery();
        return result;
    }
    async query(query, type) {
        if (!this.connected) {
            throw new Error("The connection hasn't been initialized");
        }
        await this.#queryLock.pop();
        try {
            if (query.args.length === 0) {
                return await this._simpleQuery(query, type);
            }
            else {
                return await this._preparedQuery(query, type);
            }
        }
        finally {
            this.#queryLock.push(undefined);
        }
    }
    parseRowDescription(msg) {
        const columnCount = msg.reader.readInt16();
        const columns = [];
        for (let i = 0; i < columnCount; i++) {
            const column = new Column(msg.reader.readCString(), msg.reader.readInt32(), msg.reader.readInt16(), msg.reader.readInt32(), msg.reader.readInt16(), msg.reader.readInt32(), msg.reader.readInt16());
            columns.push(column);
        }
        return new RowDescription(columnCount, columns);
    }
    parseRowData(msg) {
        const fieldCount = msg.reader.readInt16();
        const row = [];
        for (let i = 0; i < fieldCount; i++) {
            const colLength = msg.reader.readInt32();
            if (colLength == -1) {
                row.push(null);
                continue;
            }
            row.push(msg.reader.readBytes(colLength));
        }
        return row;
    }
    getCommandTag(msg) {
        return msg.reader.readString(msg.byteCount);
    }
    async end() {
        if (this.connected) {
            const terminationMessage = new Uint8Array([0x58, 0x00, 0x00, 0x00, 0x04]);
            await this.#bufWriter.write(terminationMessage);
            await this.#bufWriter.flush();
            this.#conn.close();
            this.connected = false;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbm5lY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBMEJHO0FBRUgsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxNQUFNLFlBQVksQ0FBQztBQUNoRSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzlDLE9BQU8sRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQzVELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbEQsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDdkQsT0FBTyxFQUVMLGdCQUFnQixFQUNoQixpQkFBaUIsR0FFbEIsTUFBTSxtQkFBbUIsQ0FBQztBQUczQixNQUFNLENBQU4sSUFBWSxVQUdYO0FBSEQsV0FBWSxVQUFVO0lBQ3BCLDZDQUFLLENBQUE7SUFDTCwrQ0FBTSxDQUFBO0FBQ1IsQ0FBQyxFQUhXLFVBQVUsS0FBVixVQUFVLFFBR3JCO0FBRUQsTUFBTSxDQUFOLElBQVksTUFHWDtBQUhELFdBQVksTUFBTTtJQUNoQixtQ0FBUSxDQUFBO0lBQ1IsdUNBQVUsQ0FBQTtBQUNaLENBQUMsRUFIVyxNQUFNLEtBQU4sTUFBTSxRQUdqQjtBQUVELElBQUssaUJBSUo7QUFKRCxXQUFLLGlCQUFpQjtJQUNwQiwrQkFBVSxDQUFBO0lBQ1YsNENBQXVCLENBQUE7SUFDdkIsOENBQXlCLENBQUE7QUFDM0IsQ0FBQyxFQUpJLGlCQUFpQixLQUFqQixpQkFBaUIsUUFJckI7QUFLRCxTQUFTLHVCQUF1QixDQUFDLEdBQVk7SUFDM0MsUUFBUSxHQUFHLENBQUMsSUFBSSxFQUFF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