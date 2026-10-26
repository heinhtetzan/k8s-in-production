import { describe, expect, test } from "bun:test";
import { app } from "./index";

describe("app routes", () => {
  test("GET / returns a greeting", async () => {
    const response = await app.handle(new Request("http://localhost/"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Hello Elysia" });
  });

  test("GET /reverse/:word reverses the word", async () => {
    const response = await app.handle(
      new Request("http://localhost/reverse/elysia")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "aisyle" });
  });

  test("POST /area multiplies width by height", async () => {
    const response = await app.handle(
      new Request("http://localhost/area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ width: 4, height: 5 }),
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 20 });
  });

  test("POST /area rejects invalid input", async () => {
    const response = await app.handle(
      new Request("http://localhost/area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ width: "4", height: 5 }),
      })
    );

    expect(response.status).toBe(422);
  });

  test("unknown routes return a 404 message", async () => {
    const response = await app.handle(
      new Request("http://localhost/unknown")
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Route not found" });
  });
});
