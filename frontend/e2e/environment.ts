import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";


const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(currentDirectory, "../..");
const backendDirectory = path.join(projectRoot, "backend");
const composeFile = path.join(projectRoot, "docker-compose.e2e.yml");
const pythonExecutable =
  process.platform === "win32"
    ? path.join(backendDirectory, ".venv", "Scripts", "python.exe")
    : path.join(backendDirectory, ".venv", "bin", "python");

export const e2eDatabaseUrl =
  "postgresql+psycopg://qual_ai_e2e:qual_ai_e2e@127.0.0.1:5434/qual_ai_e2e";

export function runDockerCompose(...args: string[]) {
  execFileSync("docker", ["compose", "-f", composeFile, ...args], {
    cwd: projectRoot,
    stdio: "inherit",
  });
}

export function runMigrations() {
  execFileSync(pythonExecutable, ["-m", "alembic", "upgrade", "head"], {
    cwd: backendDirectory,
    env: {
      ...process.env,
      DATABASE_URL: e2eDatabaseUrl,
    },
    stdio: "inherit",
  });
}
