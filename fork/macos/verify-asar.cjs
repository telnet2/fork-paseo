const assert = require("node:assert/strict");
const fs = require("node:fs");
const crypto = require("node:crypto");
const asar = require("@electron/asar");
const plist = require("plist");
const resources = "artifacts/macos-build/mac-arm64/Paseo.app/Contents/Resources";
const archive = `${resources}/app.asar`;
const required = [
  "dist/main.js",
  "node_modules/@getpaseo/server/dist/server/server/agent/providers/fork/trae-queue-status.js",
  "node_modules/@getpaseo/protocol/dist/fork/queue-status.js",
  "node_modules/@getpaseo/server/dist/scripts/supervisor-entrypoint.js",
  "node_modules/@getpaseo/cli/dist/index.js",
  "node_modules/node-pty/prebuilds/darwin-arm64/pty.node",
  "node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper",
  "node_modules/@esbuild/darwin-arm64/bin/esbuild",
  "node_modules/sherpa-onnx-darwin-arm64/sherpa-onnx.node",
  "node_modules/@msgpackr-extract/msgpackr-extract-darwin-arm64/node.napi.glibc.node",
];
for (const file of required) {
  const entry = asar.statFile(archive, file);
  assert.ok(entry.size > 0, file);
  if (!file.endsWith(".js")) {
    assert.equal(entry.unpacked, true, file);
    assert.ok(fs.existsSync(`${archive}.unpacked/${file}`), file);
  }
}
assert.ok(fs.existsSync(`${resources}/app-dist/index.html`));
assert.ok(fs.statSync(`${resources}/bin/paseo`).mode & 0o100);
const metadata = plist.parse(fs.readFileSync(`${resources}/../Info.plist`, "utf8"));
const hash = crypto
  .createHash("sha256")
  .update(asar.getRawHeader(archive).headerString)
  .digest("hex");
assert.equal(metadata.ElectronAsarIntegrity["Resources/app.asar"].hash, hash);
const files = asar.listPackage(archive);
assert.equal(
  files.filter((f) =>
    /\/(?:sherpa-onnx-linux|@esbuild\/linux|msgpackr-extract-linux|prebuilds\/(?:linux|darwin-x64|win32))/.test(
      f,
    ),
  ).length,
  0,
);
console.log("ASAR integrity, renderer, CLI, daemon, and Darwin native dependencies verified.");

const rendererFiles = fs
  .readdirSync(resources + "/app-dist", { recursive: true })
  .filter((file) => String(file).endsWith(".js"));
assert.ok(
  rendererFiles.some((file) =>
    fs.readFileSync(resources + "/app-dist/" + file, "utf8").includes("agent-queue-status"),
  ),
  "Queue chip missing from renderer",
);

assert(
  rendererFiles.some((file) =>
    fs.readFileSync(resources + "/app-dist/" + file, "utf8").includes("paseo.fork.custom-css.v1"),
  ),
  "Custom CSS settings missing from renderer",
);
