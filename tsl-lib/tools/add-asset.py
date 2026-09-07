"""Add (or replace) a binary asset in the single-file landing bundle.

The bundle keeps its fonts, three.js builds and card images base64/gzip-encoded
in <script type="__bundler/manifest">, keyed by uuid; the template refers to
them as `src="<uuid>"`. extract.py reads that map. This writes to it, which is
the piece that was missing — adding a new Lab card image was previously a
"pack-tool change", i.e. this file.

Usage (from the repo root or anywhere):
    python tools/add-asset.py shot.webp --mime image/webp
    python tools/add-asset.py shot.webp --mime image/webp --uuid <existing>
    python tools/add-asset.py shot.webp --mime image/webp --dry

Prints the uuid to reference from the template. Re-running with --uuid
replaces that asset's bytes in place, so refreshing a screenshot does not
strand the old one or require a template edit.

Serialization contract: the manifest is `json.dumps(dict)` with Python's
default separators, verified here by re-decoding before anything is written.
Nothing else in index.html is touched.
"""
import argparse
import base64
import gzip
import io
import json
import os
import re
import sys
import uuid as uuidlib

TOOLS = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.dirname(TOOLS)
ROOT = os.path.dirname(LIB)
INDEX = os.path.join(ROOT, "index.html")

MANIFEST_RE = re.compile(r'(<script type="__bundler/manifest">)(.*?)(</script>)', re.S)

# The bundle is deliberately small and its size is tracked; a card image has no
# business being a megabyte. Overridable, but it should be a decision.
SOFT_LIMIT = 160 * 1024


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("file", help="the asset to embed")
    ap.add_argument("--mime", required=True, help='e.g. "image/webp", "font/woff2"')
    ap.add_argument("--uuid", help="replace this existing asset instead of adding one")
    ap.add_argument("--dry", action="store_true", help="report only; write nothing")
    ap.add_argument("--force", action="store_true", help="allow an asset over the soft size limit")
    args = ap.parse_args()

    blob = open(args.file, "rb").read()
    if not blob:
        sys.exit("%s is empty" % args.file)
    if len(blob) > SOFT_LIMIT and not args.force:
        sys.exit("%s is %.0f KB, over the %.0f KB soft limit — shrink it, or pass --force"
                 % (args.file, len(blob) / 1024.0, SOFT_LIMIT / 1024.0))

    # Compress only when it actually helps. Already-compressed formats (webp,
    # woff2) usually grow under gzip, and storing them inflated would be a
    # silent size regression in a bundle whose size is a stated feature.
    packed = gzip.compress(blob, 9)
    compressed = len(packed) < len(blob)
    payload = packed if compressed else blob
    data = base64.b64encode(payload).decode("ascii")

    html = io.open(INDEX, "r", encoding="utf-8", newline="").read()
    m = MANIFEST_RE.search(html)
    if not m:
        sys.exit("manifest block not found in index.html")
    manifest = json.loads(m.group(2))
    if json.dumps(manifest) != m.group(2):
        sys.exit("manifest does not round-trip with json.dumps defaults — refusing to write")

    key = args.uuid or str(uuidlib.uuid4())
    replacing = key in manifest
    if args.uuid and not replacing:
        sys.exit("uuid %s is not in the manifest — omit --uuid to add a new asset" % key)

    old_len = len(manifest[key]["data"]) if replacing else 0
    manifest[key] = {"mime": args.mime, "compressed": compressed, "data": data}

    encoded = json.dumps(manifest)
    if json.loads(encoded) != manifest:
        sys.exit("encode/decode self-check failed — refusing to write")

    delta = len(encoded) - len(m.group(2))
    print("%s %s" % ("replacing" if replacing else "adding", key))
    print("  %s  %d bytes -> %d encoded (%s)"
          % (args.mime, len(blob), len(data), "gzip" if compressed else "stored"))
    if replacing:
        print("  previous encoded payload: %d chars" % old_len)
    print("  index.html %+d chars (%.2f MB -> %.2f MB)"
          % (delta, len(html) / 1048576.0, (len(html) + delta) / 1048576.0))

    if args.dry:
        print("--dry: nothing written")
        return

    io.open(INDEX, "w", encoding="utf-8", newline="").write(
        html[:m.start(2)] + encoded + html[m.end(2):])
    print("\nwrote index.html")
    if not replacing:
        print('reference it from the template as: src="%s"' % key)


if __name__ == "__main__":
    main()
