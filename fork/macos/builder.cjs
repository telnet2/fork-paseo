const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");
const root = path.resolve(__dirname, "../..");
const upstream = yaml.load(
  fs.readFileSync(path.join(root, "packages/desktop/electron-builder.yml"), "utf8"),
);
const tools = require("./toolchain.json");

// Derive from upstream on every build; keep only the cross-build differences here.
module.exports = {
  ...upstream,
  directories: { ...upstream.directories, output: path.join(root, "artifacts/macos-build") },
  electronDist: path.join(root, ".dev/build-tools", tools.electron.file),
  publish: null,
  mac: {
    ...upstream.mac,
    identity: null,
    hardenedRuntime: false,
    notarize: false,
    target: ["dir"],
  },
  files: [
    ...upstream.files,
    "!**/node_modules/@anthropic-ai/claude-agent-sdk-*/**",
    "!**/node_modules/@anthropic-ai/claude-agent-sdk/vendor/{ripgrep,tree-sitter-bash}/{x64-*,arm64-linux,arm64-win32}/**",
    "!**/node_modules/node-pty/prebuilds/{darwin-x64,linux-*,win32-*}/**",
    "!**/node_modules/node-pty/{build,third_party}/**",
    "!**/node_modules/sherpa-onnx-{linux-*,win-*,darwin-x64}/**",
    "!**/node_modules/@esbuild/{linux-*,darwin-x64,win32-*}/**",
    "!**/node_modules/esbuild/bin/esbuild",
    "!**/node_modules/@msgpackr-extract/msgpackr-extract-{linux-*,darwin-x64,win32-*}/**",
  ],
};
