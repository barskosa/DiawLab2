import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { api, ApiError } from "../src/api.js";

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status });

test("GET carries the session cookie and preserves the JSON response", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/orders");
    assert.equal(options.credentials, "include");
    assert.equal(options.method, "GET");
    return json([{ id: "order-1", status: "PENDING" }]);
  };
  assert.deepEqual(await api("/orders"), [
    { id: "order-1", status: "PENDING" },
  ]);
});

test("every mutation fetches a fresh CSRF token, including after session rotation", async () => {
  let tokens = 0;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push(url);
    assert.equal(options.credentials, "include");
    if (url.endsWith("/csrf"))
      return json({ token: `csrf-${++tokens}`, headerName: "X-CSRF-TOKEN" });
    assert.equal(options.headers["X-CSRF-TOKEN"], `csrf-${tokens}`);
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.equal(JSON.parse(options.body).username, "client");
    return json({ id: "user" });
  };
  await api("/auth/login", { method: "POST", body: { username: "client" } });
  await api("/orders", { method: "POST", body: { username: "client" } });
  assert.deepEqual(calls, [
    "/api/auth/csrf",
    "/api/auth/login",
    "/api/auth/csrf",
    "/api/orders",
  ]);
});

test("a protected endpoint returning 401 announces session expiration", async () => {
  globalThis.window = new EventTarget();
  let expired = 0;
  window.addEventListener("rota:session-expired", () => expired++);
  globalThis.fetch = async () => json({ message: "Sessão encerrada" }, 401);
  await assert.rejects(
    api("/orders"),
    (error) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(expired, 1);
});

test("invalid login reports its error without expiring another session", async () => {
  globalThis.window = new EventTarget();
  let expired = 0;
  window.addEventListener("rota:session-expired", () => expired++);
  globalThis.fetch = async (url) =>
    url.endsWith("/csrf")
      ? json({ token: "csrf", headerName: "X-CSRF-TOKEN" })
      : json({ message: "Usuário ou senha inválidos." }, 401);
  await assert.rejects(
    api("/auth/login", { method: "POST", body: {} }),
    /Usuário ou senha inválidos/,
  );
  assert.equal(expired, 0);
});

test("a cancelled request remains AbortError and never becomes a connection error", async () => {
  const controller = new AbortController();
  controller.abort();
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.signal, controller.signal);
    throw new DOMException("Cancelled", "AbortError");
  };
  await assert.rejects(
    api("/orders", { signal: controller.signal }),
    (error) => error.name === "AbortError",
  );
});

test("an obsolete aborted 401 cannot expire the current session", async () => {
  const controller = new AbortController();
  controller.abort();
  globalThis.window = new EventTarget();
  let expired = 0;
  window.addEventListener("rota:session-expired", () => expired++);
  globalThis.fetch = async () => json({}, 401);
  await assert.rejects(
    api("/orders", { signal: controller.signal }),
    (error) => error.status === 401,
  );
  assert.equal(expired, 0);
});

test("validation errors retain field associations for accessible forms", async () => {
  globalThis.fetch = async () =>
    json(
      {
        message: "Confira os campos.",
        fieldErrors: { plate: "Placa inválida." },
      },
      400,
    );
  await assert.rejects(
    api("/vehicles"),
    (error) =>
      error.status === 400 && error.fieldErrors.plate === "Placa inválida.",
  );
});

test("network failures receive a clear connection message", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(
    api("/orders"),
    (error) => error.status === 0 && /conectar à API/.test(error.message),
  );
});

test("a successful empty response returns null", async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await api("/vehicles"), null);
});

test("an HTML fallback cannot be mistaken for valid application data", async () => {
  globalThis.fetch = async () =>
    new Response("<!doctype html><html></html>", { status: 200 });
  await assert.rejects(
    api("/orders"),
    (error) =>
      error.status === 502 && /resposta inesperada/.test(error.message),
  );
});
