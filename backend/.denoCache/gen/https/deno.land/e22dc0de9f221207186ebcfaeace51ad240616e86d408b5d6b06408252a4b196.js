import { captureRejectionSymbol } from "../events.ts";
import Readable, { ReadableState } from "./readable.ts";
import Stream from "./stream.ts";
import Writable, { WritableState } from "./writable.ts";
import { Buffer } from "../buffer.ts";
import { ERR_STREAM_ALREADY_FINISHED, ERR_STREAM_DESTROYED, ERR_UNKNOWN_ENCODING, } from "../_errors.ts";
import createReadableStreamAsyncIterator from "./async_iterator.ts";
import { computeNewHighWaterMark, emitReadable, fromList, howMuchToRead, nReadingNextTick, updateReadableListening, } from "./readable_internal.ts";
import { kOnFinished } from "./writable_internal.ts";
import { endDuplex, finishMaybe, onwrite, readableAddChunk, } from "./duplex_internal.ts";
export { errorOrDestroy } from "./duplex_internal.ts";
class Duplex extends Stream {
    constructor(options) {
        super();
        this.allowHalfOpen = true;
        this._read = Readable.prototype._read;
        this._undestroy = Readable.prototype._undestroy;
        this.isPaused = Readable.prototype.isPaused;
        this.off = this.removeListener;
        this.pause = Readable.prototype.pause;
        this.pipe = Readable.prototype.pipe;
        this.resume = Readable.prototype.resume;
        this.setEncoding = Readable.prototype.setEncoding;
        this.unpipe = Readable.prototype.unpipe;
        this.wrap = Readable.prototype.wrap;
        this._write = Writable.prototype._write;
        this.write = Writable.prototype.write;
        this.cork = Writable.prototype.cork;
        this.uncork = Writable.prototype.uncork;
        if (options) {
            if (options.allowHalfOpen === false) {
                this.allowHalfOpen = false;
            }
            if (typeof options.destroy === "function") {
                this._destroy = options.destroy;
            }
            if (typeof options.final === "function") {
                this._final = options.final;
            }
            if (typeof options.read === "function") {
                this._read = options.read;
            }
            if (options.readable === false) {
                this.readable = false;
            }
            if (options.writable === false) {
                this.writable = false;
            }
            if (typeof options.write === "function") {
                this._write = options.write;
            }
            if (typeof options.writev === "function") {
                this._writev = options.writev;
            }
        }
        const readableOptions = {
            autoDestroy: options?.autoDestroy,
            defaultEncoding: options?.defaultEncoding,
            destroy: options?.destroy,
            emitClose: options?.emitClose,
            encoding: options?.encoding,
            highWaterMark: options?.highWaterMark ?? options?.readableHighWaterMark,
            objectMode: options?.objectMode ?? options?.readableObjectMode,
            read: options?.read,
        };
        const writableOptions = {
            autoDestroy: options?.autoDestroy,
            decodeStrings: options?.decodeStrings,
            defaultEncoding: options?.defaultEncoding,
            destroy: options?.destroy,
            emitClose: options?.emitClose,
            final: options?.final,
            highWaterMark: options?.highWaterMark ?? options?.writableHighWaterMark,
            objectMode: options?.objectMode ?? options?.writableObjectMode,
            write: options?.write,
            writev: options?.writev,
        };
        this._readableState = new ReadableState(readableOptions);
        this._writableState = new WritableState(writableOptions, this);
        this._writableState.onwrite = onwrite.bind(undefined, this);
    }
    [captureRejectionSymbol](err) {
        this.destroy(err);
    }
    [Symbol.asyncIterator]() {
        return createReadableStreamAsyncIterator(this);
    }
    _destroy(error, callback) {
        callback(error);
    }
    destroy(err, cb) {
        const r = this._readableState;
        const w = this._writableState;
        if (w.destroyed || r.destroyed) {
            if (typeof cb === "function") {
                cb();
            }
            return this;
        }
        if (err) {
            err.stack;
            if (!w.errored) {
                w.errored = err;
            }
            if (!r.errored) {
                r.errored = err;
            }
        }
        w.destroyed = true;
        r.destroyed = true;
        this._destroy(err || null, (err) => {
            if (err) {
                err.stack;
                if (!w.errored) {
                    w.errored = err;
                }
                if (!r.errored) {
                    r.errored = err;
                }
            }
            w.closed = true;
            r.closed = true;
            if (typeof cb === "function") {
                cb(err);
            }
            if (err) {
                queueMicrotask(() => {
                    const r = this._readableState;
                    const w = this._writableState;
                    if (!w.errorEmitted && !r.errorEmitted) {
                        w.errorEmitted = true;
                        r.errorEmitted = true;
                        this.emit("error", err);
                    }
                    r.closeEmitted = true;
                    if (w.emitClose || r.emitClose) {
                        this.emit("close");
                    }
                });
            }
            else {
                queueMicrotask(() => {
                    const r = this._readableState;
                    const w = this._writableState;
                    r.closeEmitted = true;
                    if (w.emitClose || r.emitClose) {
                        this.emit("close");
                    }
                });
            }
        });
        return this;
    }
    on(ev, fn) {
        const res = super.on.call(this, ev, fn);
        const state = this._readableState;
        if (ev === "data") {
            state.readableListening = this.listenerCount("readable") > 0;
            if (state.flowing !== false) {
                this.resume();
            }
        }
        else if (ev === "readable") {
            if (!state.endEmitted && !state.readableListening) {
                state.readableListening = state.needReadable = true;
                state.flowing = false;
                state.emittedReadable = false;
                if (state.length) {
                    emitReadable(this);
                }
                else if (!state.reading) {
                    queueMicrotask(() => nReadingNextTick(this));
                }
            }
        }
        return res;
    }
    push(chunk, encoding) {
        return readableAddChunk(this, chunk, encoding, false);
    }
    read(n) {
        if (n === undefined) {
            n = NaN;
        }
        const state = this._readableState;
        const nOrig = n;
        if (n > state.highWaterMark) {
            state.highWaterMark = computeNewHighWaterMark(n);
        }
        if (n !== 0) {
            state.emittedReadable = false;
        }
        if (n === 0 &&
            state.needReadable &&
            ((state.highWaterMark !== 0
                ? state.length >= state.highWaterMark
                : state.length > 0) ||
                state.ended)) {
            if (state.length === 0 && state.ended) {
                endDuplex(this);
            }
            else {
                emitReadable(this);
            }
            return null;
        }
        n = howMuchToRead(n, state);
        if (n === 0 && state.ended) {
            if (state.length === 0) {
                endDuplex(this);
            }
            return null;
        }
        let doRead = state.needReadable;
        if (state.length === 0 || state.length - n < state.highWaterMark) {
            doRead = true;
        }
        if (state.ended || state.reading || state.destroyed || state.errored ||
            !state.constructed) {
            doRead = false;
        }
        else if (doRead) {
            state.reading = true;
            state.sync = true;
            if (state.length === 0) {
                state.needReadable = true;
            }
            this._read();
            state.sync = false;
            if (!state.reading) {
                n = howMuchToRead(nOrig, state);
            }
        }
        let ret;
        if (n > 0) {
            ret = fromList(n, state);
        }
        else {
            ret = null;
        }
        if (ret === null) {
            state.needReadable = state.length <= state.highWaterMark;
            n = 0;
        }
        else {
            state.length -= n;
            if (state.multiAwaitDrain) {
                state.awaitDrainWriters.clear();
            }
            else {
                state.awaitDrainWriters = null;
            }
        }
        if (state.length === 0) {
            if (!state.ended) {
                state.needReadable = true;
            }
            if (nOrig !== n && state.ended) {
                endDuplex(this);
            }
        }
        if (ret !== null) {
            this.emit("data", ret);
        }
        return ret;
    }
    removeAllListeners(ev) {
        const res = super.removeAllListeners(ev);
        if (ev === "readable" || ev === undefined) {
            queueMicrotask(() => updateReadableListening(this));
        }
        return res;
    }
    removeListener(ev, fn) {
        const res = super.removeListener.call(this, ev, fn);
        if (ev === "readable") {
            queueMicrotask(() => updateReadableListening(this));
        }
        return res;
    }
    unshift(chunk, encoding) {
        return readableAddChunk(this, chunk, encoding, true);
    }
    get readable() {
        return this._readableState?.readable &&
            !this._readableState?.destroyed &&
            !this._readableState?.errorEmitted &&
            !this._readableState?.endEmitted;
    }
    set readable(val) {
        if (this._readableState) {
            this._readableState.readable = val;
        }
    }
    get readableHighWaterMark() {
        return this._readableState.highWaterMark;
    }
    get readableBuffer() {
        return this._readableState && this._readableState.buffer;
    }
    get readableFlowing() {
        return this._readableState.flowing;
    }
    set readableFlowing(state) {
        if (this._readableState) {
            this._readableState.flowing = state;
        }
    }
    get readableLength() {
        return this._readableState.length;
    }
    get readableObjectMode() {
        return this._readableState ? this._readableState.objectMode : false;
    }
    get readableEncoding() {
        return this._readableState ? this._readableState.encoding : null;
    }
    get readableEnded() {
        return this._readableState ? this._readableState.endEmitted : false;
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
    get destroyed() {
        if (this._readableState === undefined ||
            this._writableState === undefined) {
            return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
    }
    set destroyed(value) {
        if (this._readableState && this._writableState) {
            this._readableState.destroyed = value;
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
}
export default Duplex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHVwbGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZHVwbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN0RCxPQUFPLFFBQVEsRUFBRSxFQUFFLGFBQWEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN4RCxPQUFPLE1BQU0sTUFBTSxhQUFhLENBQUM7QUFDakMsT0FBTyxRQUFRLEVBQUUsRUFBRSxhQUFhLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDeEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN0QyxPQUFPLEVBQ0wsMkJBQTJCLEVBQzNCLG9CQUFvQixFQUNwQixvQkFBb0IsR0FDckIsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxpQ0FBaUMsTUFBTSxxQkFBcUIsQ0FBQztBQUVwRSxPQUFPLEVBRUwsdUJBQXVCLEVBQ3ZCLFlBQVksRUFDWixRQUFRLEVBQ1IsYUFBYSxFQUNiLGdCQUFnQixFQUNoQix1QkFBdUIsR0FDeEIsTUFBTSx3QkFBd0IsQ0FBQztBQUNoQyxPQUFPLEVBQUUsV0FBVyxFQUFVLE1BQU0sd0JBQXdCLENBQUM7QUFDN0QsT0FBTyxFQUNMLFNBQVMsRUFDVCxXQUFXLEVBQ1gsT0FBTyxFQUNQLGdCQUFnQixHQUNqQixNQUFNLHNCQUFzQixDQUFDO0FBQzlCLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQXlDdEQsTUFBTSxNQUFPLFNBQVEsTUFBTTtJQVN6QixZQUFZLE9BQXVCO1FBQ2pDLEtBQUssRUFBRSxDQUFDO1FBVFYsa0JBQWEsR0FBRyxJQUFJLENBQUM7UUE2R3JCLFVBQUssR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztRQUVqQyxlQUFVLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7UUFvRjNDLGFBQVEsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFD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