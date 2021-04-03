import { validateIntegerRange } from "./_utils.ts";
import { assert } from "../_util/assert.ts";
function createIterResult(value, done) {
    return { value, done };
}
export let defaultMaxListeners = 10;
export class EventEmitter {
    constructor() {
        this._events = new Map();
    }
    static get defaultMaxListeners() {
        return defaultMaxListeners;
    }
    static set defaultMaxListeners(value) {
        defaultMaxListeners = value;
    }
    _addListener(eventName, listener, prepend) {
        this.emit("newListener", eventName, listener);
        if (this._events.has(eventName)) {
            const listeners = this._events.get(eventName);
            if (prepend) {
                listeners.unshift(listener);
            }
            else {
                listeners.push(listener);
            }
        }
        else {
            this._events.set(eventName, [listener]);
        }
        const max = this.getMaxListeners();
        if (max > 0 && this.listenerCount(eventName) > max) {
            const warning = new Error(`Possible EventEmitter memory leak detected.
         ${this.listenerCount(eventName)} ${eventName.toString()} listeners.
         Use emitter.setMaxListeners() to increase limit`);
            warning.name = "MaxListenersExceededWarning";
            console.warn(warning);
        }
        return this;
    }
    addListener(eventName, listener) {
        return this._addListener(eventName, listener, false);
    }
    emit(eventName, ...args) {
        if (this._events.has(eventName)) {
            if (eventName === "error" &&
                this._events.get(EventEmitter.errorMonitor)) {
                this.emit(EventEmitter.errorMonitor, ...args);
            }
            const listeners = this._events.get(eventName).slice();
            for (const listener of listeners) {
                try {
                    listener.apply(this, args);
                }
                catch (err) {
                    this.emit("error", err);
                }
            }
            return true;
        }
        else if (eventName === "error") {
            if (this._events.get(EventEmitter.errorMonitor)) {
                this.emit(EventEmitter.errorMonitor, ...args);
            }
            const errMsg = args.length > 0 ? args[0] : Error("Unhandled error.");
            throw errMsg;
        }
        return false;
    }
    eventNames() {
        return Array.from(this._events.keys());
    }
    getMaxListeners() {
        return this.maxListeners || EventEmitter.defaultMaxListeners;
    }
    listenerCount(eventName) {
        if (this._events.has(eventName)) {
            return this._events.get(eventName).length;
        }
        else {
            return 0;
        }
    }
    static listenerCount(emitter, eventName) {
        return emitter.listenerCount(eventName);
    }
    _listeners(target, eventName, unwrap) {
        if (!target._events.has(eventName)) {
            return [];
        }
        const eventListeners = target._events.get(eventName);
        return unwrap
            ? this.unwrapListeners(eventListeners)
            : eventListeners.slice(0);
    }
    unwrapListeners(arr) {
        const unwrappedListeners = new Array(arr.length);
        for (let i = 0; i < arr.length; i++) {
            unwrappedListeners[i] = arr[i]["listener"] || arr[i];
        }
        return unwrappedListeners;
    }
    listeners(eventName) {
        return this._listeners(this, eventName, true);
    }
    rawListeners(eventName) {
        return this._listeners(this, eventName, false);
    }
    off(eventName, listener) {
        return this.removeListener(eventName, listener);
    }
    on(eventName, listener) {
        return this._addListener(eventName, listener, false);
    }
    once(eventName, listener) {
        const wrapped = this.onceWrap(eventName, listener);
        this.on(eventName, wrapped);
        return this;
    }
    onceWrap(eventName, listener) {
        const wrapper = function (...args) {
            this.context.removeListener(this.eventName, this.rawListener);
            this.listener.apply(this.context, args);
        };
        const wrapperContext = {
            eventName: eventName,
            listener: listener,
            rawListener: wrapper,
            context: this,
        };
        const wrapped = wrapper.bind(wrapperContext);
        wrapperContext.rawListener = wrapped;
        wrapped.listener = listener;
        return wrapped;
    }
    prependListener(eventName, listener) {
        return this._addListener(eventName, listener, true);
    }
    prependOnceListener(eventName, listener) {
        const wrapped = this.onceWrap(eventName, listener);
        this.prependListener(eventName, wrapped);
        return this;
    }
    removeAllListeners(eventName) {
        if (this._events === undefined) {
            return this;
        }
        if (eventName) {
            if (this._events.has(eventName)) {
                const listeners = this._events.get(eventName).slice();
                this._events.delete(eventName);
                for (const listener of listeners) {
                    this.emit("removeListener", eventName, listener);
                }
            }
        }
        else {
            const eventList = this.eventNames();
            eventList.map((value) => {
                this.removeAllListeners(value);
            });
        }
        return this;
    }
    removeListener(eventName, listener) {
        if (this._events.has(eventName)) {
            const arr = this._events.get(eventName);
            assert(arr);
            let listenerIndex = -1;
            for (let i = arr.length - 1; i >= 0; i--) {
                if (arr[i] == listener ||
                    (arr[i] && arr[i]["listener"] == listener)) {
                    listenerIndex = i;
                    break;
                }
            }
            if (listenerIndex >= 0) {
                arr.splice(listenerIndex, 1);
                this.emit("removeListener", eventName, listener);
                if (arr.length === 0) {
                    this._events.delete(eventName);
                }
            }
        }
        return this;
    }
    setMaxListeners(n) {
        if (n !== Infinity) {
            if (n === 0) {
                n = Infinity;
            }
            else {
                validateIntegerRange(n, "maxListeners", 0);
            }
        }
        this.maxListeners = n;
        return this;
    }
    static once(emitter, name) {
        return new Promise((resolve, reject) => {
            if (emitter instanceof EventTarget) {
                emitter.addEventListener(name, (...args) => {
                    resolve(args);
                }, { once: true, passive: false, capture: false });
                return;
            }
            else if (emitter instanceof EventEmitter) {
                const eventListener = (...args) => {
                    if (errorListener !== undefined) {
                        emitter.removeListener("error", errorListener);
                    }
                    resolve(args);
                };
                let errorListener;
                if (name !== "error") {
                    errorListener = (err) => {
                        emitter.removeListener(name, eventListener);
                        reject(err);
                    };
                    emitter.once("error", errorListener);
                }
                emitter.once(name, eventListener);
                return;
            }
        });
    }
    static on(emitter, event) {
        const unconsumedEventValues = [];
        const unconsumedPromises = [];
        let error = null;
        let finished = false;
        const iterator = {
            next() {
                const value = unconsumedEventValues.shift();
                if (value) {
                    return Promise.resolve(createIterResult(value, false));
                }
                if (error) {
                    const p = Promise.reject(error);
                    error = null;
                    return p;
                }
                if (finished) {
                    return Promise.resolve(createIterResult(undefined, true));
                }
                return new Promise(function (resolve, reject) {
                    unconsumedPromises.push({ resolve, reject });
                });
            },
            return() {
                emitter.removeListener(event, eventHandler);
                emitter.removeListener("error", errorHandler);
                finished = true;
                for (const promise of unconsumedPromises) {
                    promise.resolve(createIterResult(undefined, true));
                }
                return Promise.resolve(createIterResult(undefined, true));
            },
            throw(err) {
                error = err;
                emitter.removeListener(event, eventHandler);
                emitter.removeListener("error", errorHandler);
            },
            [Symbol.asyncIterator]() {
                return this;
            },
        };
        emitter.on(event, eventHandler);
        emitter.on("error", errorHandler);
        return iterator;
        function eventHandler(...args) {
            const promise = unconsumedPromises.shift();
            if (promise) {
                promise.resolve(createIterResult(args, false));
            }
            else {
                unconsumedEventValues.push(args);
            }
        }
        function errorHandler(err) {
            finished = true;
            const toError = unconsumedPromises.shift();
            if (toError) {
                toError.reject(err);
            }
            else {
                error = err;
            }
            iterator.return();
        }
    }
}
EventEmitter.captureRejectionSymbol = Symbol.for("nodejs.rejection");
EventEmitter.errorMonitor = Symbol("events.errorMonitor");
export default Object.assign(EventEmitter, { EventEmitter });
export const captureRejectionSymbol = EventEmitter.captureRejectionSymbol;
export const errorMonitor = EventEmitter.errorMonitor;
export const listenerCount = EventEmitter.listenerCount;
export const on = EventEmitter.on;
export const once = EventEmitter.once;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXZlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXVCQSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDbkQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBVTVDLFNBQVMsZ0JBQWdCLENBQUMsS0FBVSxFQUFFLElBQWE7SUFDakQsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztBQUN6QixDQUFDO0FBWUQsTUFBTSxDQUFDLElBQUksbUJBQW1CLEdBQUcsRUFBRSxDQUFDO0FBS3BDLE1BQU0sT0FBTyxZQUFZO0lBZ0J2QjtRQUNFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBZk0sTUFBTSxLQUFLLG1CQUFtQjtRQUNuQyxPQUFPLG1CQUFtQixDQUFDO0lBQzdCLENBQUM7SUFDTSxNQUFNLEtBQUssbUJBQW1CLENBQUMsS0FBYTtRQUNqRCxtQkFBbUIsR0FBRyxLQUFLLENBQUM7SUFDOUIsQ0FBQztJQVlPLFlBQVksQ0FDbEIsU0FBMEIsRUFDMUIsUUFBMkMsRUFDM0MsT0FBZ0I7UUFFaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDL0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUUzQyxDQUFDO1lBQ0YsSUFBSSxPQUFPLEVBQUU7Z0JBQ1gsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUM3QjtpQkFBTTtnQkFDTCxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzFCO1NBQ0Y7YUFBTTtZQUNMLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDekM7UUFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDbkMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxFQUFFO1lBQ2xELE1BQU0sT0FBTyxHQUFHLElBQUksS0FBSyxDQUN2QjtXQUNHLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRTt5REFDUCxDQUNsRCxDQUFDO1lBQ0YsT0FBTyxDQUFDLElBQUksR0FBRyw2QkFBNkIsQ0FBQztZQUM3QyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3ZCO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBR00sV0FBVyxDQUNoQixTQUEwQixFQUMxQixRQUEyQztRQUUzQyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBU00sSUFBSSxDQUFDLFNBQTBCLEVBQUUsR0FBRyxJQUFXO1FBQ3BELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDL0IsSUFDRSxTQUFTLEtBQUssT0FBTztnQkFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxFQUMzQztnQkFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQzthQUMvQztZQUNELE1BQU0sU0FBUyxHQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUNqQyxTQUFTLENBQ1ksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoQyxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRTtnQkFDaEMsSUFBSTtvQkFDRixRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDNUI7Z0JBQUMsT0FBTyxHQUFHLEVBQUU7b0JBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7aUJBQ3pCO2FBQ0Y7WUFDRCxPQUFPLElBQUksQ0FBQztTQUNiO2FBQU0sSUFBSSxTQUFTLEtBQUssT0FBTyxFQUFFO1lBQ2hDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUMvQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQzthQUMvQztZQUNELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sTUFBTSxDQUFDO1NBQ2Q7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFNTSxVQUFVO1FBQ2YsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQXNCLENBQUM7SUFDOUQsQ0FBQztJQU9NLGVBQWU7UUFDcEIsT0FBTyxJQUFJLENBQUMsWUFBWSxJQUFJLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQztJQUMvRCxDQUFDO0lBTU0sYUFBYSxDQUFDLFNBQTBCO1FBQzdDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDL0IsT0FBUSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQXVCLENBQUMsTUFBTSxDQUFDO1NBQ2xFO2FBQU07WUFDTCxPQUFPLENBQUMsQ0FBQztTQUNWO0lBQ0gsQ0FBQztJQUVELE1BQU0sQ0FBQyxhQUFhLENBQ2xCLE9BQXFCLEVBQ3JCLFNBQTBCO1FBRTFCLE9BQU8sT0FBTyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU8sVUFBVSxDQUNoQixNQUFvQixFQUNwQixTQUEwQixFQUMxQixNQUFlO1FBRWYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ2xDLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQXNCLENBQUM7UUFFMUUsT0FBTyxNQUFNO1lBQ1gsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDO1lBQ3RDLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFTyxlQUFlLENBQUMsR0FBc0I7UUFDNUMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFzQixDQUFDO1FBQ3RFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBRW5DLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxHQUFJLEdBQUcsQ0FBQyxDQUFDLENBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDL0Q7UUFDRCxPQUFPLGtCQUFrQixDQUFDO0lBQzVCLENBQUM7SUFHTSxTQUFTLENBQUMsU0FBMEI7UUFDekMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQU1NLFlBQVksQ0FDakIsU0FBMEI7UUFFMUIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUdNLEdBQUcsQ0FBQyxTQUEwQixFQUFFLFFBQXlCO1FBQzlELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQVNNLEVBQUUsQ0FDUCxTQUEwQixFQUMxQixRQUEyQztRQUUzQyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBTU0sSUFBSSxDQUFDLFNBQTBCLEVBQUUsUUFBeUI7UUFDL0QsTUFBTSxPQUFPLEdBQW9CLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUdPLFFBQVEsQ0FDZCxTQUEwQixFQUMxQixRQUF5QjtRQUV6QixNQUFNLE9BQU8sR0FBRyxVQVFkLEdBQUcsSUFBVztZQUVkLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUN6QixJQUFJLENBQUMsU0FBUyxFQUNkLElBQUksQ0FBQyxXQUE4QixDQUNwQyxDQUFDO1lBQ0YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUM7UUFDRixNQUFNLGNBQWMsR0FBRztZQUNyQixTQUFTLEVBQUUsU0FBUztZQUNwQixRQUFRLEVBQUUsUUFBUTtZQUNsQixXQUFXLEVBQUcsT0FBc0M7WUFDcEQsT0FBTyxFQUFFLElBQUk7U0FDZCxDQUFDO1FBQ0YsTUFBTSxPQUFPLEdBQUksT0FBTyxDQUFDLElBQUksQ0FDM0IsY0FBYyxDQUNnQixDQUFDO1FBQ2pDLGNBQWMsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDO1FBQ3JDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQzVCLE9BQU8sT0FBMEIsQ0FBQztJQUNwQyxDQUFDO0lBU00sZUFBZSxDQUNwQixTQUEwQixFQUMxQixRQUEyQztRQUUzQyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBT00sbUJBQW1CLENBQ3hCLFNBQTBCLEVBQzFCLFFBQXlCO1FBRXpCLE1BQU0sT0FBTyxHQUFvQixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN6QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFHTSxrQkFBa0IsQ0FBQyxTQUEyQjtRQUNuRCxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFO1lBQzlCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxJQUFJLFNBQVMsRUFBRTtZQUNiLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQy9CLE1BQU0sU0FBUyxHQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FFM0MsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDL0IsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7b0JBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2lCQUNsRDthQUNGO1NBQ0Y7YUFBTTtZQUNMLE1BQU0sU0FBUyxHQUFzQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDdkQsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQXNCLEVBQUUsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFNTSxjQUFjLENBQ25CLFNBQTBCLEVBQzFCLFFBQXlCO1FBRXpCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDL0IsTUFBTSxHQUFHLEdBRU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFNUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRVosSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdkIsS0FBSyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUV4QyxJQUNFLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxRQUFRO29CQUNsQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSyxHQUFHLENBQUMsQ0FBQyxDQUFxQixDQUFDLFVBQVUsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxFQUMvRDtvQkFDQSxhQUFhLEdBQUcsQ0FBQyxDQUFDO29CQUNsQixNQUFNO2lCQUNQO2FBQ0Y7WUFFRCxJQUFJLGFBQWEsSUFBSSxDQUFDLEVBQUU7Z0JBQ3RCLEdBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDakQsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtvQkFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7aUJBQ2hDO2FBQ0Y7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQVVNLGVBQWUsQ0FBQyxDQUFTO1FBQzlCLElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtZQUNsQixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ1gsQ0FBQyxHQUFHLFFBQVEsQ0FBQzthQUNkO2lCQUFNO2dCQUNMLG9CQUFvQixDQUFDLENBQUMsRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDNUM7U0FDRjtRQUVELElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQU9NLE1BQU0sQ0FBQyxJQUFJLENBQ2hCLE9BQW1DLEVBQ25DLElBQVk7UUFHWixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3JDLElBQUksT0FBTyxZQUFZLFdBQVcsRUFBRTtnQkFHbEMsT0FBTyxDQUFDLGdCQUFnQixDQUN0QixJQUFJLEVBQ0osQ0FBQyxHQUFHLElBQUksRUFBRSxFQUFFO29CQUNWLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEIsQ0FBQyxFQUNELEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FDL0MsQ0FBQztnQkFDRixPQUFPO2FBQ1I7aUJBQU0sSUFBSSxPQUFPLFlBQVksWUFBWSxFQUFFO2dCQUUxQyxNQUFNLGFBQWEsR0FBRyxDQUFDLEdBQUcsSUFBVyxFQUFRLEVBQUU7b0JBQzdDLElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRTt3QkFDL0IsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7cUJBQ2hEO29CQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDaEIsQ0FBQyxDQUFDO2dCQUNGLElBQUksYUFBOEIsQ0FBQztnQkFRbkMsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFO29CQUVwQixhQUFhLEdBQUcsQ0FBQyxHQUFRLEVBQVEsRUFBRTt3QkFDakMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7d0JBQzVDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDZCxDQUFDLENBQUM7b0JBRUYsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7aUJBQ3RDO2dCQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDO2dCQUNsQyxPQUFPO2FBQ1I7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFRTSxNQUFNLENBQUMsRUFBRSxDQUNkLE9BQXFCLEVBQ3JCLEtBQXNCO1FBR3RCLE1BQU0scUJBQXFCLEdBQVUsRUFBRSxDQUFDO1FBRXhDLE1BQU0sa0JBQWtCLEdBQVUsRUFBRSxDQUFDO1FBQ3JDLElBQUksS0FBSyxHQUFpQixJQUFJLENBQUM7UUFDL0IsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBRXJCLE1BQU0sUUFBUSxHQUFHO1lBRWYsSUFBSTtnQkFHRixNQUFNLEtBQUssR0FBUSxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxLQUFLLEVBQUU7b0JBQ1QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2lCQUN4RDtnQkFLRCxJQUFJLEtBQUssRUFBRTtvQkFDVCxNQUFNLENBQUMsR0FBbUIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFFaEQsS0FBSyxHQUFHLElBQUksQ0FBQztvQkFDYixPQUFPLENBQUMsQ0FBQztpQkFDVjtnQkFHRCxJQUFJLFFBQVEsRUFBRTtvQkFDWixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7aUJBQzNEO2dCQUdELE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxPQUFPLEVBQUUsTUFBTTtvQkFDMUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQy9DLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztZQUdELE1BQU07Z0JBQ0osT0FBTyxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQzVDLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUM5QyxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUVoQixLQUFLLE1BQU0sT0FBTyxJQUFJLGtCQUFrQixFQUFFO29CQUN4QyxPQUFPLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUNwRDtnQkFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDNUQsQ0FBQztZQUVELEtBQUssQ0FBQyxHQUFVO2dCQUNkLEtBQUssR0FBRyxHQUFHLENBQUM7Z0JBQ1osT0FBTyxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQzVDLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ2hELENBQUM7WUFHRCxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUM7Z0JBQ3BCLE9BQU8sSUFBSSxDQUFDO1lBQ2QsQ0FBQztTQUNGLENBQUM7UUFFRixPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNoQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztRQUVsQyxPQUFPLFFBQVEsQ0FBQztRQUdoQixTQUFTLFlBQVksQ0FBQyxHQUFHLElBQVc7WUFDbEMsTUFBTSxPQUFPLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDM0MsSUFBSSxPQUFPLEVBQUU7Z0JBQ1gsT0FBTyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQzthQUNoRDtpQkFBTTtnQkFDTCxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDbEM7UUFDSCxDQUFDO1FBR0QsU0FBUyxZQUFZLENBQUMsR0FBUTtZQUM1QixRQUFRLEdBQUcsSUFBSSxDQUFDO1lBRWhCLE1BQU0sT0FBTyxHQUFHLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzNDLElBQUksT0FBTyxFQUFFO2dCQUNYLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDckI7aUJBQU07Z0JBRUwsS0FBSyxHQUFHLEdBQUcsQ0FBQzthQUNiO1lBRUQsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3BCLENBQUM7SUFDSCxDQUFDOztBQXZmYSxtQ0FBc0IsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDeEQseUJBQVksR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQXlmN0QsZUFBZSxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7QUFFN0QsTUFBTSxDQUFDLE1BQU0sc0JBQXNCLEdBQUcsWUFBWSxDQUFDLHNCQUFzQixDQUFDO0FBQzFFLE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDO0FBQ3RELE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFDO0FBQ3hELE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDO0FBQ2xDLE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDIn0=