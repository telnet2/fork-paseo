#!/usr/bin/env python3
"""Prepare the Linux x64 toolchain and lockfile-pinned Darwin optional packages."""
import base64
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.request

root = Path(__file__).resolve().parents[2]
cache = root / ".dev/build-tools"
cache.mkdir(parents=True, exist_ok=True)
manifest = json.loads((root / "fork/macos/toolchain.json").read_text())
assert platform.system() == "Linux" and platform.machine() == "x86_64", "This cross-build toolchain requires Linux x64"

def fetch(url, target, algorithm, expected):
    if not target.exists():
        temporary = target.with_suffix(target.suffix + ".part")
        try:
            with urllib.request.urlopen(url, timeout=120) as response, temporary.open("wb") as output:
                shutil.copyfileobj(response, output)
            temporary.replace(target)
        finally:
            temporary.unlink(missing_ok=True)
    with target.open("rb") as source:
        actual = hashlib.file_digest(source, algorithm).digest()
    assert actual == expected, f"Checksum mismatch: {target.name}"

def extract_verified_archive(package, destination):
    destination = Path(destination).resolve()
    for member in package.getmembers():
        target = (destination / member.name).resolve()
        assert target.is_relative_to(destination), f"Unsafe archive path: {member.name}"
        assert member.isfile() or member.isdir() or member.issym() or member.islnk(), member.name
        if member.issym() or member.islnk():
            parent = target.parent if member.issym() else destination
            assert (parent / member.linkname).resolve().is_relative_to(destination), member.linkname
        package.extract(member, destination)

for tool in manifest.values():
    archive = cache / tool["file"]
    fetch(tool["url"], archive, "sha256", bytes.fromhex(tool["sha256"]))
    if "directory" in tool and not (cache / tool["directory"]).is_dir():
        with tarfile.open(archive) as package:
            extract_verified_archive(package, cache)

node_dir = cache / manifest["node"]["directory"] / "bin"
env = {**os.environ, "PATH": str(node_dir) + os.pathsep + os.environ["PATH"]}
if "--install" in sys.argv:
    subprocess.run(["npm", "ci"], cwd=root, env=env, check=True)
assert (root / "node_modules").is_dir(), "Run prepare.py --install for a fresh checkout"

lock = json.loads((root / "package-lock.json").read_text())
for relative in [
    "node_modules/sherpa-onnx-darwin-arm64",
    "packages/server/node_modules/@esbuild/darwin-arm64",
    "node_modules/@msgpackr-extract/msgpackr-extract-darwin-arm64",
]:
    package = lock["packages"][relative]
    algorithm, encoded = package["integrity"].split("-", 1)
    archive = cache / (relative.replace("/", "_") + "-" + package["version"] + ".tgz")
    fetch(package["resolved"], archive, algorithm, base64.b64decode(encoded))
    destination = root / relative
    # Always restore from the verified archive, including after npm ci.
    with tempfile.TemporaryDirectory(dir=cache) as temporary:
        with tarfile.open(archive) as bundle:
            extract_verified_archive(bundle, temporary)
        destination.mkdir(parents=True, exist_ok=True)
        shutil.copytree(Path(temporary) / "package", destination, dirs_exist_ok=True)
print("Verified toolchain and restored Darwin arm64 optional dependencies.")
