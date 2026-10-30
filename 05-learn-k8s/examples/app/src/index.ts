import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) =>
  c.json({ message: "Hello Kubernetes!", version: process.env.APP_VERSION ?? "1.0.0" }),
);
app.get("/health", (c) => c.json({ status: "healthy" }));
app.get("/ready", (c) => c.json({ status: "ready" }));

export default { port: 3000, fetch: app.fetch };
