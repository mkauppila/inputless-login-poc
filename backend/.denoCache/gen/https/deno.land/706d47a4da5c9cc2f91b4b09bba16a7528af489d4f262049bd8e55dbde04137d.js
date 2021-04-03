var _a, _b, _c, _d;
import finished from "./end_of_stream.ts";
import Readable from "./readable.ts";
import { destroyer } from "./destroy.ts";
const kLastResolve = Symbol("lastResolve");
const kLastReject = Symbol("lastReject");
const kError = Symbol("error");
const kEnded = Symbol("ended");
const kLastPromise = Symbol("lastPromise");
const kHandlePromise = Symbol("handlePromise");
const kStream = Symbol("stream");
function initIteratorSymbols(o, symbols) {
    const properties = {};
    for (const sym in symbols) {
        properties[sym] = {
            configurable: false,
            enumerable: false,
            writable: true,
        };
    }
    Object.defineProperties(o, properties);
}
function createIterResult(value, done) {
    return { value, done };
}
function readAndResolve(iter) {
    const resolve = iter[kLastResolve];
    if (resolve !== null) {
        const data = iter[kStream].read();
        if (data !== null) {
            iter[kLastPromise] = null;
            iter[kLastResolve] = null;
            iter[kLastReject] = null;
            resolve(createIterResult(data, false));
        }
    }
}
function onReadable(iter) {
    queueMicrotask(() => readAndResolve(iter));
}
function wrapForNext(lastPromise, iter) {
    return (resolve, reject) => {
        lastPromise.then(() => {
            if (iter[kEnded]) {
                resolve(createIterResult(undefined, true));
                return;
            }
            iter[kHandlePromise](resolve, reject);
        }, reject);
    };
}
function finish(self, err) {
    return new Promise((resolve, reject) => {
        const stream = self[kStream];
        finished(stream, (err) => {
            if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
                reject(err);
            }
            else {
                resolve(createIterResult(undefined, true));
            }
        });
        destroyer(stream, err);
    });
}
const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () { }).prototype);
export class ReadableStreamAsyncIterator {
    constructor(stream) {
        this[_a] = null;
        this[_b] = (resolve, reject) => {
            const data = this[kStream].read();
            if (data) {
                this[kLastPromise] = null;
                this[kLastResolve] = null;
                this[kLastReject] = null;
                resolve(createIterResult(data, false));
            }
            else {
                this[kLastResolve] = resolve;
                this[kLastReject] = reject;
            }
        };
        this[_c] = null;
        this[_d] = null;
        this[Symbol.asyncIterator] = AsyncIteratorPrototype[Symbol.asyncIterator];
        this[kEnded] = stream.readableEnded || stream._readableState.endEmitted;
        this[kStream] = stream;
        initIteratorSymbols(this, [
            kEnded,
            kError,
            kHandlePromise,
            kLastPromise,
            kLastReject,
            kLastResolve,
            kStream,
        ]);
    }
    get stream() {
        return this[kStream];
    }
    next() {
        const error = this[kError];
        if (error !== null) {
            return Promise.reject(error);
        }
        if (this[kEnded]) {
            return Promise.resolve(createIterResult(undefined, true));
        }
        if (this[kStream].destroyed) {
            return new Promise((resolve, reject) => {
                if (this[kError]) {
                    reject(this[kError]);
                }
                else if (this[kEnded]) {
                    resolve(createIterResult(undefined, true));
                }
                else {
                    finished(this[kStream], (err) => {
                        if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
                            reject(err);
                        }
                        else {
                            resolve(createIterResult(undefined, true));
                        }
                    });
                }
            });
        }
        const lastPromise = this[kLastPromise];
        let promise;
        if (lastPromise) {
            promise = new Promise(wrapForNext(lastPromise, this));
        }
        else {
            const data = this[kStream].read();
            if (data !== null) {
                return Promise.resolve(createIterResult(data, false));
            }
            promise = new Promise(this[kHandlePromise]);
        }
        this[kLastPromise] = promise;
        return promise;
    }
    return() {
        return finish(this);
    }
    throw(err) {
        return finish(this, err);
    }
}
_a = kError, _b = kHandlePromise, _c = kLastReject, _d = kLastResolve;
const createReadableStreamAsyncIterator = (stream) => {
    if (typeof stream.read !== "function") {
        const src = stream;
        stream = new Readable({ objectMode: true }).wrap(src);
        finished(stream, (err) => destroyer(src, err));
    }
    const iterator = new ReadableStreamAsyncIterator(stream);
    iterator[kLastPromise] = null;
    finished(stream, { writable: false }, (err) => {
        if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") {
            const reject = iterator[kLastReject];
            if (reject !== null) {
                iterator[kLastPromise] = null;
                iterator[kLastResolve] = null;
                iterator[kLastReject] = null;
                reject(err);
            }
            iterator[kError] = err;
            return;
        }
        const resolve = iterator[kLastResolve];
        if (resolve !== null) {
            iterator[kLastPromise] = null;
            iterator[kLastResolve] = null;
            iterator[kLastReject] = null;
            resolve(createIterResult(undefined, true));
        }
        iterator[kEnded] = true;
    });
    stream.on("readable", onReadable.bind(null, iterator));
    return iterator;
};
export default createReadableStreamAsyncIterator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmNfaXRlcmF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhc3luY19pdGVyYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUEsT0FBTyxRQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDMUMsT0FBTyxRQUFRLE1BQU0sZUFBZSxDQUFDO0FBRXJDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFekMsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzNDLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN6QyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQy9CLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUMzQyxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDL0MsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBU2pDLFNBQVMsbUJBQW1CLENBQzFCLENBQThCLEVBQzlCLE9BQWlCO0lBRWpCLE1BQU0sVUFBVSxHQUEwQixFQUFFLENBQUM7SUFDN0MsS0FBSyxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUU7UUFDekIsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHO1lBQ2hCLFlBQVksRUFBRSxLQUFLO1lBQ25CLFVBQVUsRUFBRSxLQUFLO1lBQ2pCLFFBQVEsRUFBRSxJQUFJO1NBQ2YsQ0FBQztLQUNIO0lBQ0QsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FDdkIsS0FBbUIsRUFDbkIsSUFBYTtJQUViLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7QUFDekIsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLElBQWlDO0lBQ3ZELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNuQyxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7UUFDcEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2xDLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtZQUNqQixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQzFCLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDMUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUN6QixPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDeEM7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxJQUFpQztJQUNuRCxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDN0MsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUNsQixXQUE0QyxFQUM1QyxJQUFpQztJQUVqQyxPQUFPLENBQ0wsT0FBZ0QsRUFDaEQsTUFBOEIsRUFDOUIsRUFBRTtRQUNGLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQ3BCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNoQixPQUFPLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLE9BQU87YUFDUjtZQUVELElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2IsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsTUFBTSxDQUFDLElBQWlDLEVBQUUsR0FBVztJQUM1RCxPQUFPLElBQUksT0FBTyxDQUNoQixDQUNFLE9BQWlELEVBQ2pELE1BQThCLEVBQzlCLEVBQUU7UUFDRixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFN0IsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ3ZCLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssNEJBQTRCLEVBQUU7Z0JBQ3BELE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNiO2lCQUFNO2dCQUNMLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUM1QztRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsU0FBUyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN6QixDQUFDLENBQ0YsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLHNCQUFzQixHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQ2xELE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxTQUFTLENBQUMsTUFBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQ3ZELENBQUM7QUFFRixNQUFNLE9BQU8sMkJBQTJCO0lBeUJ0QyxZQUFZLE1BQWdCO1FBdEI1QixRQUFRLEdBQWlCLElBQUksQ0FBQztRQUM5QixRQUFnQixHQUFHLENBQ2pCLE9BQWdELEVBQ2hELE1BQThCLEVBQzlCLEVBQUU7WUFDRixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEMsSUFBSSxJQUFJLEVBQUU7Z0JBQ1IsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDekIsT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ3hDO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxPQUFPLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxNQUFNLENBQUM7YUFDNUI7UUFDSCxDQUFDLENBQUM7UUFFRixRQUFhLEdBQW9DLElBQUksQ0FBQztRQUN0RCxRQUFjLEdBQXFELElBQUksQ0FBQztRQUV4RSxLQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7UUFHcEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxhQUFhLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUM7UUFDeEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE1BQU0sQ0FBQztRQUN2QixtQkFBbUIsQ0FBQyxJQUFJLEVBQUU7WUFDeEIsTUFBTTtZQUNOLE1BQU07WUFDTixjQUFjO1lBQ2QsWUFBWTtZQUNaLFdBQVc7WUFDWCxZQUFZO1lBQ1osT0FBTztTQUNSLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxJQUFJLE1BQU07UUFDUixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRUQsSUFBSTtRQUNGLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7WUFDbEIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzlCO1FBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDaEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQzNEO1FBRUQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFFO1lBQzNCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ3JDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7aUJBQ3RCO3FCQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUN2QixPQUFPLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7aUJBQzVDO3FCQUFNO29CQUNMLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTt3QkFDOUIsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyw0QkFBNEIsRUFBRTs0QkFDcEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3lCQUNiOzZCQUFNOzRCQUNMLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzt5QkFDNUM7b0JBQ0gsQ0FBQyxDQUFDLENBQUM7aUJBQ0o7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNKO1FBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3ZDLElBQUksT0FBTyxDQUFDO1FBRVosSUFBSSxXQUFXLEVBQUU7WUFDZixPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ3ZEO2FBQU07WUFDTCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEMsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO2dCQUNqQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFDdkQ7WUFFRCxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7U0FDN0M7UUFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsT0FBTyxDQUFDO1FBRTdCLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxNQUFNO1FBQ0osT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFVO1FBQ2QsT0FBTyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLENBQUM7Q0FDRjtLQTlGRSxNQUFNLE9BQ04sY0FBYyxPQWdCZCxXQUFXLE9BQ1gsWUFBWTtBQThFZixNQUFNLGlDQUFpQyxHQUFHLENBQUMsTUFBdUIsRUFBRSxFQUFFO0lBRXBFLElBQUksT0FBUSxNQUFjLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRTtRQUM5QyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUM7UUFDbkIsTUFBTSxHQUFHLElBQUksUUFBUSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztLQUNoRDtJQUVELE1BQU0sUUFBUSxHQUFHLElBQUksMkJBQTJCLENBQUMsTUFBa0IsQ0FBQyxDQUFDO0lBQ3JFLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLENBQUM7SUFFOUIsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQzVDLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssNEJBQTRCLEVBQUU7WUFDcEQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3JDLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtnQkFDbkIsUUFBUSxDQUFDLFlBQVksQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDOUIsUUFBUSxDQUFDLFlBQVksQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDOUIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDN0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2I7WUFDRCxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ3ZCLE9BQU87U0FDUjtRQUVELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN2QyxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7WUFDcEIsUUFBUSxDQUFDLFlBQVksQ0FBQyxHQUFHLElBQUksQ0FBQztZQUM5QixRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxDQUFDO1lBQzlCLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDN0IsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQzVDO1FBQ0QsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztJQUMxQixDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFFdkQsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQyxDQUFDO0FBRUYsZUFBZSxpQ0FBaUMsQ0FBQyJ9