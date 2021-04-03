import { Application, Router } from "https://deno.land/x/oak@v6.5.0/mod.ts";
import { v4 as uuidV4 } from "https://deno.land/std@0.92.0/token/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";
import * as crypto from "https://deno.land/std@0.92.0/node/crypto.ts";
import { Client } from "https://deno.land/x/postgres@v0.8.0/mod.ts";

const client = new Client({
  user: "user",
  password: "password",
  hostname: "localhost",
  database: "public",
  port: 5432,
});
await client.connect();

const app = new Application();

app.use(async (ctx, next) => {
  ctx.response.headers.append("Access-Control-Allow-Origin", "*");
  await next();
});

const router = new Router();
router.get("/loginCode", async (ctx) => {
  // add a client finger print so other clients can't hijack this
  const loginCode = Math.ceil(Math.random() * 899_999) + 100_000;
  await client.queryObject(`
    insert into public.authentication (login_code) values (${loginCode});
  `);

  const fingerprint = uuidV4.generate();
  ctx.response.body = {
    loginCode,
    fingerprint,
  };
});

router.get("/authenticationCode", (ctx) => {
  const loginCode = ctx.request.headers.get("x-login-code");
  const fingerprint = ctx.request.headers.get("x-fingerprint");
  if (loginCode === null) {
    ctx.response.status = 422;
    return;
  }
  if (fingerprint === null) {
    ctx.response.status = 422;
    return;
  }

  // fetch the auth token from redis
  // and delete it

  ctx.response.body = { authenticationToken: "TODO" };
});

router.get("/data", (ctx) => {
  // console.log("bcrypt compare: ", await bcrypt.compare(token + pepper, hash));
  ctx.response.body = "TODO: return the data after verifying the auth";
});

router.get("/allowLoginCode", async (ctx) => {
  const loginCode = ctx.request.headers.get("x-login-code");
  const fingerprint = ctx.request.headers.get("x-login-code");
  if (loginCode === null) {
    ctx.response.status = 422;
    return;
  }
  if (fingerprint === null) {
    ctx.response.status = 422;
    return;
  }

  const token = crypto.randomBytes(256).toString();
  const pepper = crypto.randomBytes(256).toString();
  // No need to store the salt, bcrypt handles this!
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(token + pepper, salt);
  console.log(token, pepper, salt, hash);

  console.log("update db");
  try {
    await client.queryObject(`
        update public.authentication 
           set hash_and_salt = '${hash}'
         where login_code = '${loginCode}';
      `);
  } catch (e) {
    console.log(e);
  } finally {
    console.log("db update okay");
  }

  // TODO: store loginCode:token pair to redis with fairly short TTL
  // store the auth token to redis with key logincode+fingerprint

  ctx.response.status = 200;
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = 8000;
app.addEventListener("listen", () => {
  console.log(`Listening on port ${port}`);
});

await app.listen({ port });
