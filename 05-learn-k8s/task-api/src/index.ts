import { Elysia, t } from "elysia";
import {
  initDatabase,
  getAllTasks,
  getTaskById,
  createTask,
  toggleTask,
  checkDbHealth,
} from "./db";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOSTNAME = process.env.HOSTNAME || "local-workstation";

// Attempt initial DB connection
initDatabase().catch(() => {});

export const app = new Elysia()
  // 1. Root / Welcome Route
  .get("/", () => ({
    app: "task-api",
    framework: "ElysiaJS (Bun)",
    message: "🦊 Hello from Task API running inside Kubernetes!",
    servedByPod: HOSTNAME,
    timestamp: new Date().toISOString(),
  }))

  // 2. Pod & Runtime Info (Great for verifying round-robin load balancing)
  .get("/info", async () => {
    const dbHealth = await checkDbHealth();
    return {
      podName: HOSTNAME,
      nodeEnv: process.env.NODE_ENV || "development",
      port: PORT,
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbHealth,
    };
  })

  // 3. Health check for Kubernetes Liveness & Readiness probes
  .get("/health", async () => {
    return {
      status: "healthy",
      pod: HOSTNAME,
      timestamp: new Date().toISOString(),
    };
  })

  // 4. Tasks / Todos API (connects to MySQL or memory fallback)
  .group("/tasks", (group) =>
    group
      .get("/", async () => {
        const result = await getAllTasks();
        return {
          pod: HOSTNAME,
          source: result.source,
          count: result.tasks.length,
          tasks: result.tasks,
        };
      })
      .get(
        "/:id",
        async ({ params: { id }, set }) => {
          const task = await getTaskById(parseInt(id, 10));
          if (!task) {
            set.status = 404;
            return { error: "Task not found" };
          }
          return { pod: HOSTNAME, task };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
      .post(
        "/",
        async ({ body, set }) => {
          const task = await createTask(body.title, body.description || "");
          set.status = 201;
          return {
            message: "Task created successfully",
            pod: HOSTNAME,
            task,
          };
        },
        {
          body: t.Object({
            title: t.String({ minLength: 1 }),
            description: t.Optional(t.String()),
          }),
        }
      )
      .patch(
        "/:id/toggle",
        async ({ params: { id }, set }) => {
          const success = await toggleTask(parseInt(id, 10));
          if (!success) {
            set.status = 404;
            return { error: "Task not found" };
          }
          return { message: "Task toggled", pod: HOSTNAME };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
  )

  .onError(({ code, set }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Route not found", pod: HOSTNAME };
    }
  });

app.listen(PORT);
console.log(`🦊 [task-api] Elysia is running at http://0.0.0.0:${PORT} (Pod: ${HOSTNAME})`);
