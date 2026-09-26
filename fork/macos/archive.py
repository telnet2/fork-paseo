import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import stat
import struct
import subprocess
import zipfile
from verify_adhoc import verify_adhoc

root = Path(__file__).resolve().parents[2]
app = root / 'artifacts/macos-build/mac-arm64/Paseo.app'
plist = plistlib.loads((app / 'Contents/Info.plist').read_bytes())
assert plist['CFBundleIdentifier'] == 'sh.paseo.desktop'
assert plist['CFBundleExecutable'] == 'Paseo'
arm64 = 0x100000c
native_files = []
verified_code_pages = 0
for directory, dirs, files in os.walk(app, followlinks=False):
    for name in dirs + files:
        p = Path(directory) / name
        if p.is_symlink():
            assert p.exists(), f'Broken symlink: {p}'
    for name in files:
        p = Path(directory) / name
        if p.is_symlink():
            continue
        with p.open('rb') as f:
            header = f.read(4096)
        assert header[:4] != b'\x7fELF', f'Linux binary in Mac bundle: {p}'
        assert not (p.suffix in ('.exe', '.dll') and header[:2] == b'MZ'), f'Windows binary: {p}'
        magic = header[:4]
        if magic in (b'\xcf\xfa\xed\xfe', b'\xce\xfa\xed\xfe'):
            arches = [struct.unpack_from('<I', header, 4)[0]]
        elif magic in (b'\xfe\xed\xfa\xcf', b'\xfe\xed\xfa\xce'):
            arches = [struct.unpack_from('>I', header, 4)[0]]
        elif magic in (b'\xca\xfe\xba\xbe', b'\xca\xfe\xba\xbf'):
            count = struct.unpack_from('>I', header, 4)[0]
            stride = 32 if magic[-1] == 0xbf else 20
            arches = [struct.unpack_from('>I', header, 8+i*stride)[0] for i in range(count)]
        else:
            assert p.suffix != '.node', f'Unrecognized native addon: {p}'
            continue
        assert arm64 in arches, f'No arm64 code in {p}'
        verified_code_pages += verify_adhoc(p)
        native_files.append(str(p.relative_to(app)))

# Check the resource hashes recorded by the recursive bundle signer.
resource_hashes = 0
for resource_file in app.rglob('_CodeSignature/CodeResources'):
    contents = resource_file.parent.parent
    resources = plistlib.loads(resource_file.read_bytes())
    for relative, entry in resources.get('files2', {}).items():
        target = contents / relative
        if isinstance(entry, bytes):
            assert hashlib.sha1(target.read_bytes()).digest() == entry, target
            resource_hashes += 1
        elif isinstance(entry, dict):
            if 'symlink' in entry:
                assert os.readlink(target) == entry['symlink'], target
            for key, algorithm in [('hash', 'sha1'), ('hash2', 'sha256')]:
                if key in entry:
                    assert hashlib.new(algorithm, target.read_bytes()).digest() == entry[key], target
                    resource_hashes += 1

build_info = json.loads((root / '.dev/fork-build-info.json').read_text())
version = plist['CFBundleShortVersionString']
assert version == build_info['version']
source_revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
source_dirty = bool(subprocess.check_output(['git', 'status', '--porcelain'], cwd=root, text=True).strip())
assert source_revision == build_info['commit'], 'HEAD changed during the build'
assert source_dirty == build_info['dirty'], 'Working-tree state changed during the build'
commit = build_info['shortCommit']
branch = build_info['branch']
branch_slug = re.sub(r'[^A-Za-z0-9._-]+', '-', branch).strip('-') or 'detached'
output = root / 'artifacts' / f'Paseo-{version}-{branch_slug}-{commit}-macos-arm64.zip'
note = root / 'fork/macos/INSTALL-MACOS.txt'
assert note.is_file()
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as archive:
    for directory, dirs, files in os.walk(app, followlinks=False):
        for name in sorted(dirs + files):
            p = Path(directory) / name
            relative = str(p.relative_to(app.parent))
            if p.is_symlink():
                entry = zipfile.ZipInfo(relative)
                entry.create_system = 3
                entry.external_attr = p.lstat().st_mode << 16
                archive.writestr(entry, os.readlink(p))
            else:
                archive.write(p, relative)
    archive.write(note, note.name)
    archive.write(root / 'fork/CHANGELOG.md', 'FORK-CHANGELOG.md')
    archive.write(root / '.dev/fork-build-info.json', 'BUILD-INFO.json')
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None, 'ZIP integrity failed'
    executable = archive.getinfo('Paseo.app/Contents/MacOS/Paseo')
    assert executable.external_attr >> 16 & stat.S_IXUSR, 'Executable bit lost in ZIP'
    assert stat.S_ISLNK(archive.getinfo('Paseo.app/Contents/Frameworks/Electron Framework.framework/Versions/Current').external_attr >> 16)
digest = hashlib.file_digest(output.open('rb'), 'sha256').hexdigest()
output.with_suffix(output.suffix + '.sha256').write_text(f'{digest}  {output.name}\n')
report = {'source_revision': source_revision, 'source_dirty': source_dirty, 'fork_branch': branch, 'display_version': build_info['displayVersion'], 'artifact': output.name, 'bytes': output.stat().st_size, 'sha256': digest, 'commit': commit, 'version': version, 'minimum_macos': plist['LSMinimumSystemVersion'], 'signing': 'ad-hoc; not Apple notarized', 'macos_runtime_tested': False, 'verified_arm64_macho_files': native_files, 'verified_resource_hashes': resource_hashes, 'verified_code_pages': verified_code_pages, 'signature_verification': 'Independent CodeDirectory page and special-slot hashes; rcodesign verify rejects empty ad-hoc CMS signatures; Apple codesign validation requires macOS'}
output.with_suffix(output.suffix + '.verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({**report, 'verified_arm64_macho_files': len(native_files)}, indent=2))
