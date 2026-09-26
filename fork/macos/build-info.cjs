const { execFileSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const version = require(path.join(root, "packages/desktop/package.json")).version;
const branch = git("branch", "--show-current") || "detached";
const commit = git("rev-parse", "HEAD");
const shortCommit = git("rev-parse", "--short=9", "HEAD");
const dirty = git("status", "--porcelain").length > 0;
const buildLabel = `${branch} · ${shortCommit}${dirty ? " · dirty" : ""}`;
process.stdout.write(
  JSON.stringify(
    {
      version,
      branch,
      commit,
      shortCommit,
      dirty,
      buildLabel,
      displayVersion: `${version} · ${buildLabel}`,
    },
    null,
    2,
  ) + "\n",
);
