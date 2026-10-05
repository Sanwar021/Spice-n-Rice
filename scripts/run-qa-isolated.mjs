import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const envFile = Object.fromEntries(readFileSync(resolve(root, ".env"), "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#")).map((line) => {
  const at = line.indexOf("="); return [line.slice(0, at), line.slice(at + 1)];
}));
const source = new URL(envFile.DATABASE_URL);
if (!["127.0.0.1", "localhost", "::1"].includes(source.hostname)) throw new Error("QA requires a loopback PostgreSQL server");
const name = `qa_spicenrice_${Date.now()}_${randomBytes(3).toString("hex")}`;
const pgBin = process.platform === "win32" ? "C:\\Program Files\\PostgreSQL\\17\\bin" : "";
const command = (name) => {
  const local = pgBin ? resolve(pgBin, name + ".exe") : name;
  if (pgBin && !existsSync(local)) throw new Error(`PostgreSQL tool not found: ${local}`);
  return local;
};
const pgEnv = { ...process.env, PGPASSWORD: decodeURIComponent(source.password || "") };
const pgArgs = ["--host", source.hostname, "--port", source.port || "5432", "--username", decodeURIComponent(source.username)];
const databaseURL = new URL(source);
databaseURL.pathname = "/" + name;
const freePort = () => new Promise((done, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => { const port = server.address().port; server.close(() => done(port)); });
});
const waitFor = async (url, child) => {
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(`Service exited before ${url} was ready`);
    try { const response = await fetch(url); if (response.ok) return; } catch { /* still starting */ }
    await new Promise((done) => setTimeout(done, 300));
  }
  throw new Error(`Service did not become ready: ${url}`);
};
const run = (file, args, options) => new Promise((done, reject) => {
  const child = spawn(file, args, { ...options, stdio: "inherit", windowsHide: true });
  child.once("error", reject);
  child.once("exit", (code) => done(code));
});
const children = [];
let interrupted = false;
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {
  interrupted = true;
  for (const child of children) child.kill();
});
let created = false;
let exitCode = 1;
try {
  const result = spawnSync(command("createdb"), [...pgArgs, name], { env: pgEnv, windowsHide: true, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Could not create disposable QA database: ${result.stderr}`);
  created = true;
  const apiPort = await freePort();
  const webPort = await freePort();
  const qaDir = resolve(root, ".local", name);
  mkdirSync(qaDir, { recursive: true });
  const binary = resolve(qaDir, process.platform === "win32" ? "spice-qa.exe" : "spice-qa");
  if (await run("go", ["build", "-o", binary, "./cmd/server"], { cwd: resolve(root, "backend"), env: process.env }) !== 0) throw new Error("QA backend build failed");
  const origin = `http://127.0.0.1:${webPort}`;
  const apiTarget = `http://127.0.0.1:${apiPort}`;
  const api = spawn(binary, [], { cwd: resolve(root, "backend"), env: { ...process.env, ...envFile, DATABASE_URL: databaseURL.toString(), FRONTEND_ORIGIN: origin, LISTEN_ADDR: `127.0.0.1:${apiPort}`, MIGRATIONS_DIR: "migrations", UPLOAD_DIR: resolve(qaDir, "uploads") }, windowsHide: true, stdio: "inherit" });
  children.push(api);
  await waitFor(apiTarget + "/health", api);
  const web = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort), "--strictPort"], { cwd: resolve(root, "frontend"), env: { ...process.env, QA_API_TARGET: apiTarget }, windowsHide: true, stdio: "inherit" });
  children.push(web);
  await waitFor(origin, web);
  if (interrupted) throw new Error("QA run interrupted");
  exitCode = await run(process.execPath, ["node_modules/@playwright/test/cli.js", "test", ...(process.argv.slice(2))], { cwd: resolve(root, "frontend"), env: { ...process.env, QA_ISOLATED_BASE_URL: origin, QA_TEST_OUTPUT_DIR: resolve(qaDir, "test-results") } });
  if (interrupted) exitCode = 1;
} finally {
  for (const child of children.reverse()) child.kill();
  if (created) {
    const dropped = spawnSync(command("dropdb"), [...pgArgs, "--if-exists", "--force", name], { env: pgEnv, windowsHide: true, encoding: "utf8" });
    if (dropped.status !== 0) { console.error(`Could not remove disposable QA database ${name}: ${dropped.stderr}`); exitCode = 1; }
  }
}
process.exitCode = exitCode;
