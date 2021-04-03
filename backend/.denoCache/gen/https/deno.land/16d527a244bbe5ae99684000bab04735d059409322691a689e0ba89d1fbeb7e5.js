import Duplex from "./duplex.ts";
import { ERR_METHOD_NOT_IMPLEMENTED } from "../_errors.ts";
const kCallback = Symbol("kCallback");
export default class Transform extends Duplex {
    constructor(options) {
        super(options);
        this._read = () => {
            if (this[kCallback]) {
                const callback = this[kCallback];
                this[kCallback] = null;
                callback();
            }
        };
        this._write = (chunk, encoding, callback) => {
            const rState = this._readableState;
            const wState = this._writableState;
            const length = rState.length;
            this._transform(chunk, encoding, (err, val) => {
                if (err) {
                    callback(err);
                    return;
                }
                if (val != null) {
                    this.push(val);
                }
                if (wState.ended ||
                    length === rState.length ||
                    rState.length < rState.highWaterMark ||
                    rState.length === 0) {
                    callback();
                }
                else {
                    this[kCallback] = callback;
                }
            });
        };
        this._readableState.sync = false;
        this[kCallback] = null;
        if (options) {
            if (typeof options.transform === "function") {
                this._transform = options.transform;
            }
            if (typeof options.flush === "function") {
                this._flush = options.flush;
            }
        }
        this.on("prefinish", function () {
            if (typeof this._flush === "function" && !this.destroyed) {
                this._flush((er, data) => {
                    if (er) {
                        this.destroy(er);
                        return;
                    }
                    if (data != null) {
                        this.push(data);
                    }
                    this.push(null);
                });
            }
            else {
                this.push(null);
            }
        });
    }
    _transform(_chunk, _encoding, _callback) {
        throw new ERR_METHOD_NOT_IMPLEMENTED("_transform()");
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmb3JtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHJhbnNmb3JtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sTUFBTSxNQUFNLGFBQWEsQ0FBQztBQUdqQyxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFM0QsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBbUN0QyxNQUFNLENBQUMsT0FBTyxPQUFPLFNBQVUsU0FBUSxNQUFNO0lBSTNDLFlBQVksT0FBMEI7UUFDcEMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBa0NqQixVQUFLLEdBQUcsR0FBRyxFQUFFO1lBQ1gsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ25CLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQW1DLENBQUM7Z0JBQ25FLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7Z0JBQ3ZCLFFBQVEsRUFBRSxDQUFDO2FBQ1o7UUFDSCxDQUFDLENBQUM7UUFZRixXQUFNLEdBQUcsQ0FFUCxLQUFVLEVBQ1YsUUFBZ0IsRUFDaEIsUUFBd0MsRUFDeEMsRUFBRTtZQUNGLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7WUFDbkMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUNuQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBRTdCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDNUMsSUFBSSxHQUFHLEVBQUU7b0JBQ1AsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNkLE9BQU87aUJBQ1I7Z0JBRUQsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFO29CQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ2hCO2dCQUVELElBQ0UsTUFBTSxDQUFDLEtBQUs7b0JBQ1osTUFBTSxLQUFLLE1BQU0sQ0FBQyxNQUFNO29CQUN4QixNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxhQUFhO29CQUNwQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFDbkI7b0JBQ0EsUUFBUSxFQUFFLENBQUM7aUJBQ1o7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLFFBQVEsQ0FBQztpQkFDNUI7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztRQWxGQSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7UUFFakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUV2QixJQUFJLE9BQU8sRUFBRTtZQUNYLElBQUksT0FBTyxPQUFPLENBQUMsU0FBUyxLQUFLLFVBQVUsRUFBRTtnQkFDM0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO2FBQ3JDO1lBRUQsSUFBSSxPQUFPLE9BQU8sQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFO2dCQUN2QyxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7YUFDN0I7U0FDRjtRQUVELElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFO1lBQ25CLElBQUksT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQ3hELElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUU7b0JBQ3ZCLElBQUksRUFBRSxFQUFFO3dCQUNOLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQ2pCLE9BQU87cUJBQ1I7b0JBRUQsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO3dCQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUNqQjtvQkFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsQixDQUFDLENBQUMsQ0FBQzthQUNKO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDakI7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFVRCxVQUFVLENBRVIsTUFBVyxFQUNYLFNBQWlCLEVBRWpCLFNBQXFEO1FBRXJELE1BQU0sSUFBSSwwQkFBMEIsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUN2RCxDQUFDO0NBa0NGIn0=