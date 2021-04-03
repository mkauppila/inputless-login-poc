import { encode } from "./encode.ts";
import { decode } from "./decode.ts";
const commandTagRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
export function templateStringToQuery(template, args) {
    const text = template.reduce((curr, next, index) => {
        return `${curr}$${index}${next}`;
    });
    return new Query(text, ...args);
}
export class QueryResult {
    constructor(query) {
        this.query = query;
        this._done = false;
        this.warnings = [];
    }
    loadColumnDescriptions(description) {
        this.rowDescription = description;
    }
    handleCommandComplete(commandTag) {
        const match = commandTagRegexp.exec(commandTag);
        if (match) {
            this.command = match[1];
            if (match[3]) {
                this.rowCount = parseInt(match[3], 10);
            }
            else {
                this.rowCount = parseInt(match[2], 10);
            }
        }
    }
    insertRow(_row) {
        throw new Error("No implementation for insertRow is defined");
    }
    done() {
        this._done = true;
    }
}
export class QueryArrayResult extends QueryResult {
    constructor() {
        super(...arguments);
        this.rows = [];
    }
    insertRow(row_data) {
        if (this._done) {
            throw new Error("Tried to add a new row to the result after the result is done reading");
        }
        if (!this.rowDescription) {
            throw new Error("The row descriptions required to parse the result data weren't initialized");
        }
        const row = row_data.map((raw_value, index) => {
            const column = this.rowDescription.columns[index];
            if (raw_value === null) {
                return null;
            }
            return decode(raw_value, column);
        });
        this.rows.push(row);
    }
}
export class QueryObjectResult extends QueryResult {
    constructor() {
        super(...arguments);
        this.rows = [];
    }
    insertRow(row_data) {
        if (this._done) {
            throw new Error("Tried to add a new row to the result after the result is done reading");
        }
        if (!this.rowDescription) {
            throw new Error("The row descriptions required to parse the result data weren't initialized");
        }
        if (this.query.fields &&
            this.rowDescription.columns.length !== this.query.fields.length) {
            throw new RangeError("The fields provided for the query don't match the ones returned as a result " +
                `(${this.rowDescription.columns.length} expected, ${this.query.fields.length} received)`);
        }
        const row = row_data.reduce((row, raw_value, index) => {
            const column = this.rowDescription.columns[index];
            const name = this.query.fields?.[index] ?? column.name;
            if (raw_value === null) {
                row[name] = null;
            }
            else {
                row[name] = decode(raw_value, column);
            }
            return row;
        }, {});
        this.rows.push(row);
    }
}
export class Query {
    constructor(config_or_text, ...args) {
        let config;
        if (typeof config_or_text === "string") {
            config = { text: config_or_text, args };
        }
        else {
            const { fields, ...query_config } = config_or_text;
            if (fields) {
                const clean_fields = fields.map((field) => field.toString().toLowerCase());
                if ((new Set(clean_fields)).size !== clean_fields.length) {
                    throw new TypeError("The fields provided for the query must be unique");
                }
                this.fields = clean_fields;
            }
            config = query_config;
        }
        this.text = config.text;
        this.args = this._prepareArgs(config);
    }
    _prepareArgs(config) {
        const encodingFn = config.encoder ? config.encoder : encode;
        return (config.args || []).map(encodingFn);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJxdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsTUFBTSxFQUFjLE1BQU0sYUFBYSxDQUFDO0FBQ2pELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFHckMsTUFBTSxnQkFBZ0IsR0FBRyxvQ0FBb0MsQ0FBQztBQVk5RCxNQUFNLFVBQVUscUJBQXFCLENBQ25DLFFBQThCLEVBQzlCLElBQW9CO0lBRXBCLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLElBQUksS0FBSyxHQUFHLElBQUksRUFBRSxDQUFDO0lBQ25DLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBMkNELE1BQU0sT0FBTyxXQUFXO0lBU3RCLFlBQW1CLEtBQVk7UUFBWixVQUFLLEdBQUwsS0FBSyxDQUFPO1FBTnhCLFVBQUssR0FBRyxLQUFLLENBQUM7UUFJZCxhQUFRLEdBQW9CLEVBQUUsQ0FBQztJQUVKLENBQUM7SUFNbkMsc0JBQXNCLENBQUMsV0FBMkI7UUFDaEQsSUFBSSxDQUFDLGNBQWMsR0FBRyxXQUFXLENBQUM7SUFDcEMsQ0FBQztJQUVELHFCQUFxQixDQUFDLFVBQWtCO1FBQ3RDLE1BQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNoRCxJQUFJLEtBQUssRUFBRTtZQUNULElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBZ0IsQ0FBQztZQUN2QyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFFWixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxLQUFL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