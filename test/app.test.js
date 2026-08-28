import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import Joi from "joi";
import { createApp } from "../src/app.js";
import { validate } from "../src/middlewares/validate.js";

const startTestServer = async () => {
  const server = createApp().listen(0);
  await once(server, "listening");
  return server;
};

test("health endpoint reports the foundation service status", async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/v1/health`,
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, "System works well.");
  assert.equal(body.data.service, "pharmacy-management-system");
  assert.equal(body.data.database.connected, false);
});

test("unknown routes return the standard safe error shape", async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/v1/missing`,
  );
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.deepEqual(body, {
    success: false,
    message: "The requested resource was not found.",
    data: { code: "NOT_FOUND" },
  });
});

test("login rejects invalid credentials payload", async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/v1/auth/login`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "short" }),
    },
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.data.code, "VALIDATION_ERROR");
});

test("users list requires authentication", async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/v1/users`,
  );
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.data.code, "UNAUTHENTICATED");
});

test("pharmacies list requires authentication", async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/v1/pharmacies`,
  );
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.data.code, "UNAUTHENTICATED");
});

test("Joi validation middleware rejects invalid request input", async () => {
  const schema = Joi.object({ name: Joi.string().required() });
  const request = { body: {} };
  let receivedError;

  validate(schema)(request, {}, (error) => {
    receivedError = error;
  });

  assert.equal(receivedError.statusCode, 400);
  assert.equal(receivedError.code, "VALIDATION_ERROR");
  assert.equal(receivedError.message, "Request validation failed.");
  assert.equal(receivedError.details[0].path[0], "name");
});

test("Joi validation can replace Express 5 query", () => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
  });
  const request = {};
  Object.defineProperty(request, "query", {
    get: () => ({}),
  });

  let nextError;
  validate(schema, "query")(request, {}, (error) => {
    nextError = error;
  });

  assert.equal(nextError, undefined);
  assert.equal(request.validatedQuery.page, 1);
});
