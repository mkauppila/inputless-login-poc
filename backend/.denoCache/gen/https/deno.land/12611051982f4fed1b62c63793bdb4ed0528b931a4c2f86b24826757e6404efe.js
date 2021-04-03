var _a;
import { Buffer } from "../buffer.ts";
import Stream from "./stream.ts";
import { captureRejectionSymbol } from "../events.ts";
import { ERR_INVALID_ARG_TYPE, ERR_INVALID_OPT_VALUE, ERR_METHOD_NOT_IMPLEMENTED, ERR_STREAM_ALREADY_FINISHED, ERR_STREAM_CANNOT_PIPE, ERR_STREAM_DESTROYED, ERR_STREAM_NULL_VALUES, ERR_STREAM_WRITE_AFTER_END, ERR_UNKNOWN_ENCODING, } from "../_errors.ts";
import { clearBuffer, destroy, errorBuffer, errorOrDestroy, finishMaybe, kOnFinished, nop, onwrite, resetBuffer, writeOrBuffer, } from "./writable_internal.ts";
export class WritableState {
    constructor(options, stream) {
        this[_a] = [];
        this.afterWriteTickInfo = null;
        this.allBuffers = true;
        this.allNoop = true;
        this.buffered = [];
        this.bufferedIndex = 0;
        this.bufferProcessing = false;
        this.closed = false;
        this.closeEmitted = false;
        this.corked = 0;
        this.destroyed = false;
        this.ended = false;
        this.ending = false;
        this.errored = null;
        this.errorEmitted = false;
        this.finalCalled = false;
        this.finished = false;
        this.length = 0;
        this.needDrain = false;
        this.pendingcb = 0;
        this.prefinished = false;
        this.sync = true;
        this.writecb = null;
        this.writable = true;
        this.writelen = 0;
        this.writing = false;
        this.objectMode = !!options?.objectMode;
        this.highWaterMark = options?.highWaterMark ??
            (this.objectMode ? 16 : 16 * 1024);
        if (Number.isInteger(this.highWaterMark) && this.highWaterMark >= 0) {
            this.highWaterMark = Math.floor(this.highWaterMark);
        }
        else {
            throw new ERR_INVALID_OPT_VALUE("highWaterMark", this.highWaterMark);
        }
        this.decodeStrings = !options?.decodeStrings === false;
        this.defaultEncoding = options?.defaultEncoding || "utf8";
        this.onwrite = onwrite.bind(undefined, stream);
        resetBuffer(this);
        this.emitClose = options?.emitClose ?? true;
        this.autoDestroy = options?.autoDestroy ?? true;
        this.constructed = true;
    }
    getBuffer() {
        return this.buffered.slice(this.bufferedIndex);
    }
    get bufferedRequestCount() {
        return this.buffered.length - this.bufferedIndex;
    }
}
_a = kOnFinished;
class Writable extends Stream {
    constructor(options) {
        super();
        this._writev = null;
        this._writableState = new WritableState(options, this);
        if (options) {
            if (typeof options.write === "function") {
                this._write = options.write;
            }
            if (typeof options.writev === "function") {
                this._writev = options.writev;
            }
            if (typeof options.destroy === "function") {
                this._destroy = options.destroy;
            }
            if (typeof options.final === "function") {
                this._final = options.final;
            }
        }
    }
    [captureRejectionSymbol](err) {
        this.destroy(err);
    }
    get destroyed() {
        return this._writableState ? this._writableState.destroyed : false;
    }
    set destroyed(value) {
        if (this._writableState) {
            this._writableState.destroyed = value;
        }
    }
    get writable() {
        const w = this._writableState;
        return !w.destroyed && !w.errored && !w.ending && !w.ended;
    }
    set writable(val) {
        if (this._writableState) {
            this._writableState.writable = !!val;
        }
    }
    get writableFinished() {
        return this._writableState ? this._writableState.finished : false;
    }
    get writableObjectMode() {
        return this._writableState ? this._writableState.objectMode : false;
    }
    get writableBuffer() {
        return this._writableState && this._writableState.getBuffer();
    }
    get writableEnded() {
        return this._writableState ? this._writableState.ending : false;
    }
    get writableHighWaterMark() {
        return this._writableState && this._writableState.highWaterMark;
    }
    get writableCorked() {
        return this._writableState ? this._writableState.corked : 0;
    }
    get writableLength() {
        return this._writableState && this._writableState.length;
    }
    _undestroy() {
        const w = this._writableState;
        w.constructed = true;
        w.destroyed = false;
        w.closed = false;
        w.closeEmitted = false;
        w.errored = null;
        w.errorEmitted = false;
        w.ended = false;
        w.ending = false;
        w.finalCalled = false;
        w.prefinished = false;
        w.finished = false;
    }
    _destroy(err, cb) {
        cb(err);
    }
    destroy(err, cb) {
        const state = this._writableState;
        if (!state.destroyed) {
            queueMicrotask(() => errorBuffer(state));
        }
        destroy.call(this, err, cb);
        return this;
    }
    end(x, y, z) {
        const state = this._writableState;
        let chunk;
        let encoding;
        let cb;
        if (typeof x === "function") {
            chunk = null;
            encoding = null;
            cb = x;
        }
        else if (typeof y === "function") {
            chunk = x;
            encoding = null;
            cb = y;
        }
        else {
            chunk = x;
            encoding = y;
            cb = z;
        }
        if (chunk !== null && chunk !== undefined) {
            this.write(chunk, encoding);
        }
        if (state.corked) {
            state.corked = 1;
            this.uncork();
        }
        let err;
        if (!state.errored && !state.ending) {
            state.ending = true;
            finishMaybe(this, state, true);
            state.ended = true;
        }
        else if (state.finished) {
            err = new ERR_STREAM_ALREADY_FINISHED("end");
        }
        else if (state.destroyed) {
            err = new ERR_STREAM_DESTROYED("end");
        }
        if (typeof cb === "function") {
            if (err || state.finished) {
                queueMicrotask(() => {
                    cb(err);
                });
            }
            else {
                state[kOnFinished].push(cb);
            }
        }
        return this;
    }
    _write(chunk, encoding, cb) {
        if (this._writev) {
            this._writev([{ chunk, encoding }], cb);
        }
        else {
            throw new ERR_METHOD_NOT_IMPLEMENTED("_write()");
        }
    }
    pipe(dest) {
        errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE());
        return dest;
    }
    write(chunk, x, y) {
        const state = this._writableState;
        let encoding;
        let cb;
        if (typeof x === "function") {
            cb = x;
            encoding = state.defaultEncoding;
        }
        else {
            if (!x) {
                encoding = state.defaultEncoding;
            }
            else if (x !== "buffer" && !Buffer.isEncoding(x)) {
                throw new ERR_UNKNOWN_ENCODING(x);
            }
            else {
                encoding = x;
            }
            if (typeof y !== "function") {
                cb = nop;
            }
            else {
                cb = y;
            }
        }
        if (chunk === null) {
            throw new ERR_STREAM_NULL_VALUES();
        }
        else if (!state.objectMode) {
            if (typeof chunk === "string") {
                if (state.decodeStrings !== false) {
                    chunk = Buffer.from(chunk, encoding);
                    encoding = "buffer";
                }
            }
            else if (chunk instanceof Buffer) {
                encoding = "buffer";
            }
            else if (Stream._isUint8Array(chunk)) {
                chunk = Stream._uint8ArrayToBuffer(chunk);
                encoding = "buffer";
            }
            else {
                throw new ERR_INVALID_ARG_TYPE("chunk", ["string", "Buffer", "Uint8Array"], chunk);
            }
        }
        let err;
        if (state.ending) {
            err = new ERR_STREAM_WRITE_AFTER_END();
        }
        else if (state.destroyed) {
            err = new ERR_STREAM_DESTROYED("write");
        }
        if (err) {
            queueMicrotask(() => cb(err));
            errorOrDestroy(this, err, true);
            return false;
        }
        state.pendingcb++;
        return writeOrBuffer(this, state, chunk, encoding, cb);
    }
    cork() {
        this._writableState.corked++;
    }
    uncork() {
        const state = this._writableState;
        if (state.corked) {
            state.corked--;
            if (!state.writing) {
                clearBuffer(this, state);
            }
        }
    }
    setDefaultEncoding(encoding) {
        if (typeof encoding === "string") {
            encoding = encoding.toLowerCase();
        }
        if (!Buffer.isEncoding(encoding)) {
            throw new ERR_UNKNOWN_ENCODING(encoding);
        }
        this._writableState.defaultEncoding = encoding;
        return this;
    }
}
Writable.WritableState = WritableState;
export default Writable;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JpdGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ3cml0YWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN0QyxPQUFPLE1BQU0sTUFBTSxhQUFhLENBQUM7QUFDakMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ3RELE9BQU8sRUFDTCxvQkFBb0IsRUFDcEIscUJBQXFCLEVBQ3JCLDBCQUEwQixFQUMxQiwyQkFBMkIsRUFDM0Isc0JBQXNCLEVBQ3RCLG9CQUFvQixFQUNwQixzQkFBc0IsRUFDdEIsMEJBQTBCLEVBQzFCLG9CQUFvQixHQUNyQixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQ0wsV0FBVyxFQUNYLE9BQU8sRUFDUCxXQUFXLEVBQ1gsY0FBYyxFQUNkLFdBQVcsRUFDWCxXQUFXLEVBQ1gsR0FBRyxFQUNILE9BQU8sRUFDUCxXQUFXLEVBQ1gsYUFBYSxHQUNkLE1BQU0sd0JBQXdCLENBQUM7QUFpQ2hDLE1BQU0sT0FBTyxhQUFhO0lBMEN4QixZQUFZLE9BQW9DLEVBQUUsTUFBZ0I7UUF6Q2xFLFFBQWEsR0FBbUMsRUFBRSxDQUFDO1FBQ25ELHVCQUFrQixHQUEwQixJQUFJLENBQUM7UUFDakQsZUFBVSxHQUFHLElBQUksQ0FBQztRQUNsQixZQUFPLEdBQUcsSUFBSSxDQUFDO1FBRWYsYUFBUSxHQU1ILEVBQUUsQ0FBQztRQUNSLGtCQUFhLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLHFCQUFnQixHQUFHLEtBQUssQ0FBQztRQUN6QixXQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ2YsaUJBQVksR0FBRyxLQUFLLENBQUM7UUFFckIsV0FBTSxHQUFHLENBQUMsQ0FBQztRQUdYLGNBQVMsR0FBRyxLQUFLLENBQUM7UUFFbEIsVUFBSyxHQUFHLEtBQUssQ0FBQztRQUNkLFdBQU0sR0FBRyxLQUFLLENBQUM7UUFDZixZQUFPLEdB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