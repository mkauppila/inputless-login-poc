import { Application, Router } from "https://deno.land/x/oak@v6.5.0/mod.ts";
import { v4 as uuidV4 } from "https://deno.land/std@0.92.0/uuid/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.2.4/mod.ts";
import * as crypto from "https://deno.land/std@0.92.0/node/crypto.ts";
import { Client } from "https://deno.land/x/postgres@v0.8.0/mod.ts";
import { connect } from "https://deno.land/x/redis@v0.21.0/mod.ts";

const client = new Client({
  user: "user",
  password: "password",
  hostname: "localhost",
  database: "public",
  port: 5432,
});
await client.connect();

const redis = await connect({
  hostname: "localhost",
  port: 6379,
});

export const app = new Application();

const pepper = "pepper";

// Handle cors headers
app.use(async (ctx, next) => {
  ctx.response.headers.append("Access-Control-Allow-Origin", "*");
  ctx.response.headers.append(
    "Access-Control-Allow-Headers",
    "x-login-code, x-fingerprint, authorization"
  );
  await next();
});

// Log incoming requests
// app.use(async (ctx, next) => {
//   console.log(ctx.request.url.href);
//   await next();
// });

const router = new Router();
router.get("/loginCode", async (ctx) => {
  try {
    // add a client finger print so other clients can't hijack this
    const loginCode = Math.ceil(Math.random() * 899_999) + 100_000;
    const fingerprint = uuidV4.generate();
    await client.queryObject(`
    insert into public.authentication (login_code, fingerprint) values ('${loginCode}', '${fingerprint}');
  `);

    ctx.response.body = {
      loginCode,
      fingerprint,
    };
  } catch (err) {
    console.log("err, ", err);
  }
});

// TODO Rename should be called authenticationToken!
router.get("/authenticationCode", async (ctx) => {
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

  const result = await client.queryObject<{
    login_code: string;
    fingerprint: string;
  }>(`
    select login_code, fingerprint from public.authentication where login_code = '${loginCode}' and fingerprint = '${fingerprint}'
  `);
  if (
    result.rowCount === 1 &&
    result.rows[0].login_code === loginCode &&
    result.rows[0].fingerprint === fingerprint
  ) {
    const key = loginCode;

    const authenticationToken = await redis.get(key);
    if (authenticationToken) {
      await redis.del(key);
      ctx.response.status = 200;
      ctx.response.headers.append("cache", "no-cache");
      ctx.response.body = { authenticationToken };
    } else {
      ctx.response.status = 404;
    }
  } else {
    ctx.response.status = 404;
  }
});

// const authenticator = (ctx:)

router.get("/data", async (ctx) => {
  const authorization = ctx.request.headers.get("authorization");
  const fingerprint = ctx.request.headers.get("x-fingerprint");
  console.log("authorization, ", authorization);
  if (authorization && fingerprint) {
    const tokens = authorization.split(" ");
    console.log("authorization, ", tokens);
    if (tokens[0] === "Bearer") {
      try {
        const token = tokens[1].trim();
        // get the hashs from postgres

        console.log("token: ", token);
        const d = await client.queryObject<{ hash_and_salt: string }>(`
        select hash_and_salt from public.authentication where fingerprint = '${fingerprint}';
      `);
        console.log("d ", d);
        const matches = await bcrypt.compare(
          token + pepper,
          d.rows[0].hash_and_salt
        );

        console.log("matches: ", matches);
        if (matches) {
          ctx.response.body = {
            data: "TODO: return the data after verifying the auth",
          };
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }
    return;
    // console.log("bcrypt compare: ", await bcrypt.compare(token + pepper, hash));
  }
  ctx.response.status = 401;
});

// rename verifyLoginCode?
router.put("/allowLoginCode", async (ctx) => {
  const loginCode = ctx.request.url.searchParams.get("login-code");
  if (loginCode === null) {
    ctx.response.status = 422;
    return;
  }

  const token = crypto.randomBytes(256).toString("hex");
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(token + pepper, salt);

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

  const key = loginCode;
  await redis.set(key, token);
  await redis.expire(key, 60);

  ctx.response.status = 200;
});

app.use(router.routes());
app.use(router.allowedMethods());

if (import.meta.main) {
  const port = 8000;
  app.addEventListener("listen", () => {
    console.log(`Listening on port ${port}`);
  });

  await app.listen({ port });
}
