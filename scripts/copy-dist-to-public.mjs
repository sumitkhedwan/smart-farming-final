import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve("dist");
const publicDir = resolve("public");

await mkdir(publicDir, { recursive: true });
await rm(resolve(publicDir, "assets"), { recursive: true, force: true });
await cp(dist, publicDir, { recursive: true, force: true });
