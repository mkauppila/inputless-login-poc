import { Connection, ResultType } from "./connection/connection.ts";
import { createParams, } from "./connection/connection_params.ts";
import { Query, templateStringToQuery, } from "./query/query.ts";
import { isTemplateString } from "./utils.ts";
export class QueryClient {
    _executeQuery(_query, _result) {
        throw new Error(`"${this._executeQuery.name}" hasn't been implemented for class "${this.constructor.name}"`);
    }
    queryArray(query_template_or_config, ...args) {
        let query;
        if (typeof query_template_or_config === "string") {
            query = new Query(query_template_or_config, ...args);
        }
        else if (isTemplateString(query_template_or_config)) {
            query = templateStringToQuery(query_template_or_config, args);
        }
        else {
            query = new Query(query_template_or_config);
        }
        return this._executeQuery(query, ResultType.ARRAY);
    }
    queryObject(query_template_or_config, ...args) {
        let query;
        if (typeof query_template_or_config === "string") {
            query = new Query(query_template_or_config, ...args);
        }
        else if (isTemplateString(query_template_or_config)) {
            query = templateStringToQuery(query_template_or_config, args);
        }
        else {
            query = new Query(query_template_or_config);
        }
        return this._executeQuery(query, ResultType.OBJECT);
    }
}
export class Client extends QueryClient {
    constructor(config) {
        super();
        this._connection = new Connection(createParams(config));
    }
    _executeQuery(query, result) {
        return this._connection.query(query, result);
    }
    async connect() {
        await this._connection.startup();
    }
    async end() {
        await this._connection.end();
    }
}
export class PoolClient extends QueryClient {
    constructor(connection, releaseCallback) {
        super();
        this._connection = connection;
        this._releaseCallback = releaseCallback;
    }
    _executeQuery(query, result) {
        return this._connection.query(query, result);
    }
    async release() {
        await this._releaseCallback();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDcEUsT0FBTyxFQUdMLFlBQVksR0FDYixNQUFNLG1DQUFtQyxDQUFDO0FBQzNDLE9BQU8sRUFDTCxLQUFLLEVBT0wscUJBQXFCLEdBQ3RCLE1BQU0sa0JBQWtCLENBQUM7QUFDMUIsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRTlDLE1BQU0sT0FBTyxXQUFXO0lBT3RCLGFBQWEsQ0FBQyxNQUFhLEVBQUUsT0FBbUI7UUFDOUMsTUFBTSxJQUFJLEtBQUssQ0FDYixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSx3Q0FBd0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEdBQUcsQ0FDNUYsQ0FBQztJQUNKLENBQUM7SUFtQ0QsVUFBVSxDQUVSLHdCQUFxRSxFQUNyRSxHQUFHLElBQW9CO1FBRXZCLElBQUksS0FBSyxDQUFDO1FBQ1YsSUFBSSxPQUFPLHdCQUF3QixLQUFLLFFBQVEsRUFBRTtZQUNoRCxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztTQUN0RDthQUFNLElBQUksZ0JBQWdCLENBQUMsd0JBQXdCLENBQUMsRUFBRTtZQUNyRCxLQUFLLEdBQUcscUJBQXFCLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDL0Q7YUFBTTtZQUNMLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1NBQzdDO1FBRUQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUN2QixLQUFLLEVBQ0wsVUFBVSxDQUFDLEtBQUssQ0FDZSxDQUFDO0lBQ3BDLENBQUM7SUFxREQsV0FBVyxDQUlULHdCQUd3QixFQUN4QixHQUFHLElBQW9CO1FBRXZCLElBQUksS0FBSyxDQUFDO1FBQ1YsSUFBSSxPQUFPLHdCQUF3QixLQUFLLFFBQVEsRUFBRTtZQUNoRCxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztTQUN0RDthQUFNLElBQUksZ0JBQWdCLENBQUMsd0JBQXdCLENBQUMsRUFBRTtZQUNyRCxLQUFLLEdBQUcscUJBQXFCLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDL0Q7YUFBTTtZQUNMLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyx3QkFBNkMsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUN2QixLQUFLLEVBQ0wsVUFBVSxDQUFDLE1BQU0sQ0FDZSxDQUFDO0lBQ3JDLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxNQUFPLFNBQVEsV0FBVztJQUdyQyxZQUFZLE1BQTZDO1FBQ3ZELEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRUQsYUFBYSxDQUFDLEtBQVksRUFBRSxNQUFrQjtRQUM1QyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU87UUFDWCxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHO1FBQ1AsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQy9CLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxVQUFXLFNBQVEsV0FBVztJQUl6QyxZQUFZLFVBQXNCLEVBQUUsZUFBMkI7UUFDN0QsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUM5QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO0lBQzFDLENBQUM7SUFFRCxhQUFhLENBQUMsS0FBWSxFQUFFLE1BQWtCO1FBQzVDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7SUFDaEMsQ0FBQztDQUNGIn0=