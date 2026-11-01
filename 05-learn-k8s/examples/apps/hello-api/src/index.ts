import { Elysia } from "elysia";

const app = new Elysia()
  .get('/', () => process.env.MESSAGE || 'hello')
  .get('/hi', () => 'hi')
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

