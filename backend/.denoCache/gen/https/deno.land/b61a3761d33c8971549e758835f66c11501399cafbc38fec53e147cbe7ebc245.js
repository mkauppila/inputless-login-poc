import { PoolClient, QueryClient } from "./client.ts";
import { Connection } from "./connection/connection.ts";
import { createParams, } from "./connection/connection_params.ts";
import { DeferredStack } from "./connection/deferred.ts";
export class Pool extends QueryClient {
    constructor(connectionParams, maxSize, lazy) {
        super();
        this._connectionParams = createParams(connectionParams);
        this._maxSize = maxSize;
        this._lazy = !!lazy;
        this.ready = this._startup();
    }
    _executeQuery(query, result) {
        return this._execute(query, result);
    }
    async _createConnection() {
        const connection = new Connection(this._connectionParams);
        await connection.startup();
        return connection;
    }
    get maxSize() {
        return this._maxSize;
    }
    get size() {
        if (this._availableConnections == null) {
            return 0;
        }
        return this._availableConnections.size;
    }
    get available() {
        if (this._availableConnections == null) {
            return 0;
        }
        return this._availableConnections.available;
    }
    async _startup() {
        const initSize = this._lazy ? 1 : this._maxSize;
        const connecting = [...Array(initSize)].map(async () => await this._createConnection());
        this._connections = await Promise.all(connecting);
        this._availableConnections = new DeferredStack(this._maxSize, this._connections, this._createConnection.bind(this));
    }
    async _execute(query, type) {
        await this.ready;
        const connection = await this._availableConnections.pop();
        try {
            return await connection.query(query, type);
        }
        catch (error) {
            throw error;
        }
        finally {
            this._availableConnections.push(connection);
        }
    }
    async connect() {
        await this.ready;
        const connection = await this._availableConnections.pop();
        const release = () => this._availableConnections.push(connection);
        return new PoolClient(connection, release);
    }
    async end() {
        await this.ready;
        while (this.available > 0) {
            const conn = await this._availableConnections.pop();
            await conn.end();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9vbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBvb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDdEQsT0FBTyxFQUFFLFVBQVUsRUFBYyxNQUFNLDRCQUE0QixDQUFDO0FBQ3BFLE9BQU8sRUFJTCxZQUFZLEdBQ2IsTUFBTSxtQ0FBbUMsQ0FBQztBQUMzQyxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFHekQsTUFBTSxPQUFPLElBQUssU0FBUSxXQUFXO0lBUW5DLFlBQ0UsZ0JBQWtFLEVBQ2xFLE9BQWUsRUFDZixJQUFjO1FBRWQsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsaUJBQWlCLEdBQUcsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFFRCxhQUFhLENBQUMsS0FBWSxFQUFFLE1BQWtCO1FBQzVDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVPLEtBQUssQ0FBQyxpQkFBaUI7UUFDN0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDMUQsTUFBTSxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUdELElBQUksT0FBTztRQUNULE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztJQUN2QixDQUFDO0lBR0QsSUFBSSxJQUFJO1FBQ04sSUFBSSxJQUFJLENBQUMscUJBQXFCLElBQUksSUFBSSxFQUFFO1lBQ3RDLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7UUFDRCxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7SUFDekMsQ0FBQztJQUdELElBQUksU0FBUztRQUNYLElBQUksSUFBSSxDQUFDLHFCQUFxQixJQUFJLElBQUksRUFBRTtZQUN0QyxPQUFPLENBQUMsQ0FBQztTQUNWO1FBQ0QsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFDO0lBQzlDLENBQUM7SUFFTyxLQUFLLENBQUMsUUFBUTtRQUNwQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDaEQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUNyRCxNQUFNLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUMvQixDQUFDO1FBQ0YsSUFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksYUFBYSxDQUM1QyxJQUFJLENBQUMsUUFBUSxFQUNiLElBQUksQ0FBQyxZQUFZLEVBQ2pCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQ2xDLENBQUM7SUFDSixDQUFDO0lBRU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFZLEVBQUUsSUFBZ0I7UUFDbkQsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ2pCLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzFELElBQUk7WUFDRixPQUFPLE1BQU0sVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDNUM7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE1BQU0sS0FBSyxDQUFDO1NBQ2I7Z0JBQVM7WUFDUixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzdDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPO1FBQ1gsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ2pCLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzFELE1BQU0sT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEUsT0FBTyxJQUFJLFVBQVUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHO1FBQ1AsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUU7WUFDekIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDcEQsTUFBTSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDbEI7SUFDSCxDQUFDO0NBQ0YifQ==