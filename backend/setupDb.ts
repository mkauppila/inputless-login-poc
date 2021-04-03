import { Client } from "https://deno.land/x/postgres@v0.8.0/mod.ts";

// TODO use the environment variables
const client = new Client({
  user: "user",
  password: "password",
  hostname: "localhost",
  database: "public",
  port: 5432,
});
await client.connect();

await client.queryObject(`
  drop schema public cascade;
`);

await client.queryObject(`
  create schema if not exists public;
`);

await client.queryObject(`
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
`);

await client.queryObject(`
  create table public.authentication (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    login_code text UNIQUE NOT NULL,
    fingerprint text unique NOT NULL,
    hash_and_salt text
  );
`);

await client.end();
