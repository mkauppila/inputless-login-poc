import { parseDsn } from "../utils.ts";
function getPgEnv() {
    return {
        database: Deno.env.get("PGDATABASE"),
        hostname: Deno.env.get("PGHOST"),
        port: Deno.env.get("PGPORT"),
        user: Deno.env.get("PGUSER"),
        password: Deno.env.get("PGPASSWORD"),
        applicationName: Deno.env.get("PGAPPNAME"),
    };
}
export class ConnectionParamsError extends Error {
    constructor(message) {
        super(message);
        this.name = "ConnectionParamsError";
    }
}
function formatMissingParams(missingParams) {
    return `Missing connection parameters: ${missingParams.join(", ")}`;
}
function assertRequiredOptions(options, requiredKeys, has_env_access) {
    const missingParams = [];
    for (const key of requiredKeys) {
        if (options[key] === "" ||
            options[key] === null ||
            options[key] === undefined) {
            missingParams.push(key);
        }
    }
    if (missingParams.length) {
        let missing_params_message = formatMissingParams(missingParams);
        if (!has_env_access) {
            missing_params_message +=
                "\nConnection parameters can be read from environment variables only if Deno is run with env permission";
        }
        throw new ConnectionParamsError(missing_params_message);
    }
}
function parseOptionsFromDsn(connString) {
    const dsn = parseDsn(connString);
    if (dsn.driver !== "postgres") {
        throw new ConnectionParamsError(`Supplied DSN has invalid driver: ${dsn.driver}.`);
    }
    return {
        ...dsn,
        applicationName: dsn.params.application_name,
    };
}
const DEFAULT_OPTIONS = {
    applicationName: "deno_postgres",
    hostname: "127.0.0.1",
    port: "5432",
    tls: {
        enforce: false,
    },
};
export function createParams(params = {}) {
    if (typeof params === "string") {
        params = parseOptionsFromDsn(params);
    }
    let pgEnv = {};
    let has_env_access = true;
    try {
        pgEnv = getPgEnv();
    }
    catch (e) {
        if (e instanceof Deno.errors.PermissionDenied) {
            has_env_access = false;
        }
        else {
            throw e;
        }
    }
    let port;
    if (params.port) {
        port = String(params.port);
    }
    else if (pgEnv.port) {
        port = String(pgEnv.port);
    }
    else {
        port = DEFAULT_OPTIONS.port;
    }
    const connection_options = {
        applicationName: params.applicationName ?? pgEnv.applicationName ??
            DEFAULT_OPTIONS.applicationName,
        database: params.database ?? pgEnv.database,
        hostname: params.hostname ?? pgEnv.hostname ?? DEFAULT_OPTIONS.hostname,
        password: params.password ?? pgEnv.password,
        port,
        tls: {
            enforce: !!params?.tls?.enforce ?? DEFAULT_OPTIONS.tls.enforce,
        },
        user: params.user ?? pgEnv.user,
    };
    assertRequiredOptions(connection_options, ["database", "hostname", "port", "user", "applicationName"], has_env_access);
    const connection_parameters = {
        ...connection_options,
        database: connection_options.database,
        port: parseInt(connection_options.port, 10),
        user: connection_options.user,
    };
    if (isNaN(connection_parameters.port)) {
        throw new ConnectionParamsError(`Invalid port ${connection_parameters.port}`);
    }
    return connection_parameters;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbl9wYXJhbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb25uZWN0aW9uX3BhcmFtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBbUJ2QyxTQUFTLFFBQVE7SUFDZixPQUFPO1FBQ0wsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQztRQUNwQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQ2hDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7UUFDNUIsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztRQUM1QixRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDO1FBQ3BDLGVBQWUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7S0FDM0MsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLE9BQU8scUJBQXNCLFNBQVEsS0FBSztJQUM5QyxZQUFZLE9BQWU7UUFDekIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2YsSUFBSSxDQUFDLElBQUksR0FBRyx1QkFBdUIsQ0FBQztJQUN0QyxDQUFDO0NBQ0Y7QUFnQ0QsU0FBUyxtQkFBbUIsQ0FBQyxhQUF1QjtJQUNsRCxPQUFPLGtDQUNMLGFBQWEsQ0FBQyxJQUFJLENBQ2hCLElBQUksQ0FFUixFQUFFLENBQUM7QUFDTCxDQUFDO0FBU0QsU0FBUyxxQkFBcUIsQ0FDNUIsT0FBMEIsRUFDMUIsWUFBeUMsRUFFekMsY0FBdUI7SUFFdkIsTUFBTSxhQUFhLEdBQWdDLEVBQUUsQ0FBQztJQUN0RCxLQUFLLE1BQU0sR0FBRyxJQUFJLFlBQVksRUFBRTtRQUM5QixJQUNF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