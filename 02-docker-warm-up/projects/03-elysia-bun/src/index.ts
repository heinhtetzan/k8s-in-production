import { Elysia, t } from "elysia";

export const app = new Elysia()
  .get("/", () => ({
    message: "Hello Elysia",
  }))
  .get("/reverse/:word", ({ params: { word } }) => ({
    message: word.split("").reverse().join(""),
  }))
  .post(
    "/area",
    ({ body }) => ({
      message: body.width * body.height,
    }),
    {
      body: t.Object({
        width: t.Number(),
        height: t.Number(),
      }),
    }
  )
  .onError(({ code, set }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        message: "Route not found",
      };
    }
  });

if (process.env.NODE_ENV !== "test") {
  app.listen(3000);
  console.log(`🦊 Elysia is running at http://localhost:${app.server?.port}`);
}
