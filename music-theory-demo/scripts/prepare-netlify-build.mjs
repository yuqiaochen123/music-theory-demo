#!/usr/bin/env node
import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "dist", "client");

if (!existsSync(path.join(client, "index.html"))) {
  throw new Error("Missing Vite build output: dist/client/index.html");
}

for (const directory of ["src", "vendor", "assets"]) {
  const source = path.join(root, directory);
  if (existsSync(source)) {
    cpSync(source, path.join(client, directory), { recursive: true });
  }
}

console.log("Prepared Netlify build: copied classic scripts and local assets");
