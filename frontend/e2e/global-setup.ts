import { runDockerCompose, runMigrations } from "./environment";


export default function globalSetup() {
  try {
    runDockerCompose("up", "-d", "--wait", "postgres-e2e");
    runMigrations();
  } catch (error) {
    try {
      runDockerCompose("down");
    } catch {
      // Preserve the original startup error.
    }
    throw error;
  }
}

