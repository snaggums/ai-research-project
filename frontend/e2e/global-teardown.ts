import { runDockerCompose } from "./environment";


export default function globalTeardown() {
  runDockerCompose("down");
}

