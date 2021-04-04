import { Application } from "https://deno.land/x/oak@v6.5.0/mod.ts";
import { app } from "./api.ts";
// TODO put this to dev deps
import * as asserts from "https://deno.land/std@0.92.0/testing/asserts.ts";

const listen = (app: Application, port: number, abortSignal: AbortSignal) => {
  return new Promise<void>((resolve, reject) => {
    app.addEventListener("listen", () => {
      console.log(`Listening on port ${port}`);
      resolve();
    });
    app.addEventListener("error", (error) => {
      reject(error);
    });
    app.listen({ port, signal: abortSignal });
  });
};

Deno.test("the flow", async () => {
  const abortController = new AbortController();
  const port = 8000;
  await listen(app, port, abortController.signal);

  const getLoginCode = async () => {
    const result = await fetch("http://localhost:8000/loginCode");
    const json = await result.json();
    asserts.assertExists(json.loginCode);
    asserts.assertExists(json.fingerprint);
    return { loginCode: json.loginCode, fingerprint: json.fingerprint };
  };

  const allowLoginCode = async (loginCode: string) => {
    const result = await fetch(
      `http://localhost:8000/allowLoginCode?login-code=${loginCode}`,
      {
        method: "PUT",
      }
    );
    // Q: why does it leak resources unless the body is awaited?
    // https://dev.to/alxtsg/avoid-leaking-resources-in-deno-tests-10e0
    await result.text();
    asserts.assertEquals(result.status, 200);
  };

  const getAuthenticationToken = async (
    loginCode: string,
    fingerprint: string
  ) => {
    const result = await fetch(`http://localhost:8000/authenticationCode`, {
      headers: {
        "x-fingerprint": fingerprint,
        "x-login-code": loginCode,
      },
    });
    const json = await result.json();
    return json.authenticationToken;
  };

  const getData = async (authToken: string, fingerprint: string) => {
    const result = await fetch(`http://localhost:8000/data`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "x-fingerprint": fingerprint,
      },
    });
    const json = await result.json();
    return json.data;
  };

  const { loginCode, fingerprint } = await getLoginCode();
  await allowLoginCode(loginCode);
  const authToken = await getAuthenticationToken(loginCode, fingerprint);
  const data = await getData(authToken, fingerprint);
  asserts.assertEquals(data, "TODO: return the data after verifying the auth");

  abortController.abort();
});
