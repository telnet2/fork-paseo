"""Check ad-hoc Mach-O CodeDirectory hashes without requiring a CMS certificate."""
import hashlib
import plistlib
import struct


def verify_adhoc(path):
    data = path.read_bytes()
    magic = data[:4]
    slices = [data]
    if magic in (b'\xca\xfe\xba\xbe', b'\xca\xfe\xba\xbf'):
        count = struct.unpack_from('>I', data, 4)[0]
        is64 = magic[-1] == 0xbf
        stride = 32 if is64 else 20
        slices = []
        for i in range(count):
            offset, size = struct.unpack_from('>QQ' if is64 else '>II', data, 16 + i*stride)
            slices.append(data[offset:offset+size])
    pages = 0
    for binary in slices:
        endian = '<' if binary[:4] in (b'\xcf\xfa\xed\xfe', b'\xce\xfa\xed\xfe') else '>'
        is64 = binary[:4] in (b'\xcf\xfa\xed\xfe', b'\xfe\xed\xfa\xcf')
        command = 32 if is64 else 28
        signature_offset = None
        for _ in range(struct.unpack_from(endian+'I', binary, 16)[0]):
            kind, size = struct.unpack_from(endian+'II', binary, command)
            assert size >= 8
            if kind == 0x1d:
                signature_offset, signature_size = struct.unpack_from(endian+'II', binary, command+8)
            command += size
        assert signature_offset is not None, f'Missing LC_CODE_SIGNATURE: {path}'
        signature = binary[signature_offset:signature_offset+signature_size]
        magic, length, count = struct.unpack_from('>III', signature)
        assert magic == 0xfade0cc0 and length <= len(signature), path
        blobs = {}
        for i in range(count):
            slot, offset = struct.unpack_from('>II', signature, 12+i*8)
            size = struct.unpack_from('>I', signature, offset+4)[0]
            blobs[slot] = signature[offset:offset+size]
        assert 0 in blobs, path
        for slot, cd in blobs.items():
            if slot != 0 and not 0x1000 <= slot <= 0x1005:
                continue
            magic, length, version, flags, hash_offset, identifier, specials, codes, limit = struct.unpack_from('>9I', cd)
            assert magic == 0xfade0c02 and flags & 2, f'Expected ad-hoc CodeDirectory: {path}'
            hash_size, hash_type, platform, exponent = struct.unpack_from('4B', cd, 36)
            algorithm = {1: 'sha1', 2: 'sha256', 3: 'sha256', 4: 'sha384'}[hash_type]
            def digest(content):
                return hashlib.new(algorithm, content).digest()[:hash_size]
            if limit == 0xffffffff and version >= 0x20300:
                limit = struct.unpack_from('>Q', cd, 56)[0]
            assert limit == signature_offset, f'Unexpected signed code limit: {path}'
            page_size = 1 << exponent if exponent else limit
            assert codes == (limit + page_size - 1) // page_size, path
            for i in range(codes):
                expected = cd[hash_offset+i*hash_size:hash_offset+(i+1)*hash_size]
                actual = digest(binary[i*page_size:min((i+1)*page_size, limit)])
                assert actual == expected, f'Code page {i} hash mismatch: {path}'
                pages += 1
            for i in range(1, specials+1):
                expected = cd[hash_offset-i*hash_size:hash_offset-(i-1)*hash_size]
                if expected == bytes(hash_size):
                    continue
                if i in blobs:
                    content = blobs[i]
                elif i == 1:
                    candidates = [path.parent/'Info.plist', path.parent/'Resources/Info.plist', path.parent.parent/'Info.plist']
                    candidates = [p for p in candidates if p.is_file() and plistlib.loads(p.read_bytes()).get('CFBundleExecutable') == path.name]
                    assert len(candidates) == 1, f'Cannot resolve Info.plist: {path}'
                    content = candidates[0].read_bytes()
                elif i == 3:
                    candidates = [path.parent/'_CodeSignature/CodeResources', path.parent.parent/'_CodeSignature/CodeResources']
                    candidates = [p for p in candidates if p.is_file()]
                    assert len(candidates) == 1, f'Cannot resolve CodeResources: {path}'
                    content = candidates[0].read_bytes()
                else:
                    raise AssertionError(f'Unhandled special slot {i}: {path}')
                assert digest(content) == expected, f'Special slot {i} hash mismatch: {path}'
    return pages
