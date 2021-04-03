import { Application, Router } from "https://deno.land/x/oak@v6.5.0/mod.ts";

const app = new Application();

app.use(async (ctx, next) => {
  ctx.response.headers.append("Access-Control-Allow-Origin", "*");
  await next();
});

const router = new Router();
router.get("/loginCode", (ctx) => {
  const loginCode = Math.ceil(Math.random() * 999999);
  ctx.response.body = {
    loginCode,
  };
});

router.get("/authenticationCode", (ctx) => {
  ctx.response.body = { authenticationToken: "TODO" };
});

router.get("/data", (ctx) => {
  ctx.response.body = "TODO: return the data after verifying the auth";
});

router.get("allowLoginCode", (ctx) => {
  const loginCode = ctx.request.headers.get("x-login-code");
  // login code is still free in the database?
  //   Generate new auth token (w/ salt and pepper)
  // . Store the hash of token
  //   return

  // take the login code and give it authentication token
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
