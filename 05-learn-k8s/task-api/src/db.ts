import mysql from "mysql2/promise";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
}

const DB_HOST = process.env.DB_HOST || process.env.MYSQL_HOST;
const DB_PORT = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || "3306", 10);
const DB_USER = process.env.DB_USER || process.env.MYSQL_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || process.env.MYSQL_DATABASE || "taskdb";

let pool: mysql.Pool | null = null;
let initialized = false;

export function isDatabaseConfigured(): boolean {
  return Boolean(DB_HOST);
}

export function getDatabasePool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function initDatabase(): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    console.log("ℹ️  [DB] No DB_HOST configured. Running in in-memory / demo mode.");
    return false;
  }

  try {
    const db = getDatabasePool();
    // Test connection
    await db.query("SELECT 1");

    // Create tasks table if it does not exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    initialized = true;
    console.log(`✅ [DB] Connected successfully to MySQL at ${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ [DB] Connection attempt to MySQL failed (${error.message}). Will retry on requests.`);
    return false;
  }
}

// In-memory fallback if DB is not attached yet
const memoryTasks: Task[] = [
  { id: 1, title: "Learn Kubernetes Basics", description: "Read Lesson 01 and understand Pods", completed: true, created_at: new Date().toISOString() },
  { id: 2, title: "Master Kind & kubectl", description: "Use kind load docker-image", completed: true, created_at: new Date().toISOString() },
  { id: 3, title: "Connect to MySQL", description: "Deploy MySQL Service and query live tasks", completed: false, created_at: new Date().toISOString() },
];

export async function getAllTasks(): Promise<{ source: string; tasks: Task[] }> {
  if (isDatabaseConfigured()) {
    try {
      const db = getDatabasePool();
      const [rows] = await db.query("SELECT * FROM tasks ORDER BY id DESC");
      return { source: "mysql", tasks: rows as Task[] };
    } catch (err: any) {
      console.error("[DB Error]", err.message);
      // Fallback
    }
  }
  return { source: "memory-fallback", tasks: memoryTasks };
}

export async function getTaskById(id: number): Promise<Task | null> {
  if (isDatabaseConfigured()) {
    try {
      const db = getDatabasePool();
      const [rows]: any = await db.query("SELECT * FROM tasks WHERE id = ?", [id]);
      if (rows.length > 0) return rows[0] as Task;
      return null;
    } catch (err: any) {
      console.error("[DB Error]", err.message);
    }
  }
  return memoryTasks.find((t) => t.id === id) || null;
}

export async function createTask(title: string, description: string = ""): Promise<Task> {
  if (isDatabaseConfigured()) {
    try {
      const db = getDatabasePool();
      const [result]: any = await db.query(
        "INSERT INTO tasks (title, description, completed) VALUES (?, ?, FALSE)",
        [title, description]
      );
      const insertedId = result.insertId;
      return {
        id: insertedId,
        title,
        description,
        completed: false,
        created_at: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error("[DB Error]", err.message);
    }
  }

  const newTask: Task = {
    id: memoryTasks.length + 1,
    title,
    description,
    completed: false,
    created_at: new Date().toISOString(),
  };
  memoryTasks.unshift(newTask);
  return newTask;
}

export async function toggleTask(id: number): Promise<boolean> {
  if (isDatabaseConfigured()) {
    try {
      const db = getDatabasePool();
      await db.query("UPDATE tasks SET completed = NOT completed WHERE id = ?", [id]);
      return true;
    } catch (err: any) {
      console.error("[DB Error]", err.message);
      return false;
    }
  }
  const task = memoryTasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    return true;
  }
  return false;
}

export async function checkDbHealth(): Promise<{ status: string; details?: any }> {
  if (!isDatabaseConfigured()) {
    return { status: "unconfigured", details: "Running without MySQL backend" };
  }
  try {
    const db = getDatabasePool();
    await db.query("SELECT 1");
    return { status: "connected", host: `${DB_HOST}:${DB_PORT}`, database: DB_NAME };
  } catch (err: any) {
    return { status: "disconnected", error: err.message };
  }
}

