"""Extract the editable pieces out of the single-file landing bundle.

The site (repo-root index.html) is a self-extracting bundle: the real page
lives JSON-encoded in <script type="__bundler/template">, and binary assets
(fonts, the three.js builds, the dc-runtime) live base64/gzip-encoded in
<script type="__bundler/manifest"> keyed by uuid.

Usage (from anywhere; paths are resolved relative to this file):
    python tools/extract.py            # template -> ../build/template.html
    python tools/extract.py --assets   # also decode the three.js builds
                                       #   -> ../bench/vendor/three.core.min.js
                                       #   -> ../bench/vendor/three.webgpu.min.js
    python tools/extract.py --check    # round-trip: re-encode the template and
                                       # verify it reproduces index.html byte-
                                       # for-byte; writes nothing

Round-trip contract (pack.py is the inverse):
    encoded = json.dumps(template, ensure_ascii=False).replace("<", "\\u003C")
"""
import argparse
import base64
import gzip
import io
import json
import os
import re
import sys

TOOLS = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.dirname(TOOLS)                # tsl-lib/
ROOT = os.path.dirname(LIB)                 # repo root
INDEX = os.path.join(ROOT, "index.html")
BUILD = os.path.join(LIB, "build")
VENDOR = os.path.join(LIB, "bench", "vendor")

TEMPLATE_RE = re.compile(r'(<script type="__bundler/template">)(.*?)(</script>)', re.S)
MANIFEST_RE = re.compile(r'<script type="__bundler/manifest">(.*?)</script>', re.S)


def encode_template(template):
    return json.dumps(template, ensure_ascii=False).replace("<", "\\u003C")


def read_index():
    return io.open(INDEX, "r", encoding="utf-8", newline="").read()


def get_template(html):
    m = TEMPLATE_RE.search(html)
    if not m:
        sys.exit("template block not found in index.html")
    return m


def cmd_extract():
    html = read_index()
    template = json.loads(get_template(html).group(2))
    os.makedirs(BUILD, exist_ok=True)
    out = os.path.join(BUILD, "template.html")
    io.open(out, "w", encoding="utf-8", newline="").write(template)
    print("extracted %s (%d chars)" % (out, len(template)))


def cmd_check():
    html = read_index()
    m = get_template(html)
    raw, template = m.group(2), json.loads(m.group(2))
    re_encoded = encode_template(template)
    if re_encoded == raw:
        print("round-trip OK: re-encoded template is byte-identical (%d chars)" % len(raw))
        return
    # locate first divergence for diagnosis
    i = next((k for k in range(min(len(raw), len(re_encoded))) if raw[k] != re_encoded[k]),
             min(len(raw), len(re_encoded)))
    sys.exit("round-trip FAILED at encoded char %d\n  original: %r\n  re-made : %r"
             % (i, raw[max(0, i - 40):i + 40], re_encoded[max(0, i - 40):i + 40]))


def cmd_assets():
    html = read_index()
    m = MANIFEST_RE.search(html)
    if not m:
        sys.exit("manifest block not found in index.html")
    manifest = json.loads(m.group(1))

    decoded_js = {}
    print("uuid                                  mime              bytes")
    for uuid, entry in manifest.items():
        blob = base64.b64decode(entry["data"])
        if entry.get("compressed"):
            blob = gzip.decompress(blob)
        print("%s  %-16s %9d" % (uuid, entry["mime"], len(blob)))
        if entry["mime"] == "text/javascript":
            decoded_js[uuid] = blob

    # No filenames in the manifest — identify the three.js builds by content:
    # the webgpu build imports './three.core.min.js'; the core build is the
    # other large js asset (the ~60KB dc-runtime never matches either test).
    webgpu = next((u for u, b in decoded_js.items() if b"./three.core.min.js" in b), None)
    core = next((u for u, b in sorted(decoded_js.items(), key=lambda kv: -len(kv[1]))
                 if u != webgpu and len(b) > 200_000), None)
    if not webgpu or not core:
        sys.exit("could not identify three.js builds (webgpu=%s core=%s)" % (webgpu, core))

    # minified: REVISION is exported via an alias ("t as REVISION") — resolve
    # the alias to its string literal; the bench runner records the runtime
    # THREE.REVISION as the authoritative value
    rev = None
    alias = re.search(rb'(\w+) as REVISION', decoded_js[core])
    if alias:
        rev = re.search(rb'(?:const|let|var|,)\s*' + alias.group(1) + rb'\s*=\s*["\']([\d.a-z-]+)["\']',
                       decoded_js[core])
    os.makedirs(VENDOR, exist_ok=True)
    for uuid, name in ((core, "three.core.min.js"), (webgpu, "three.webgpu.min.js")):
        out = os.path.join(VENDOR, name)
        open(out, "wb").write(decoded_js[uuid])
        print("wrote %s (%d bytes, uuid %s)" % (out, len(decoded_js[uuid]), uuid))
    print("three.js revision: %s" % (rev.group(1).decode() if rev else "NOT FOUND"))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--assets", action="store_true", help="also decode the three.js builds into bench/vendor/")
    ap.add_argument("--check", action="store_true", help="verify encode(decode(template)) is byte-identical; write nothing")
    args = ap.parse_args()
    if args.check:
        cmd_check()
    else:
        cmd_extract()
        if args.assets:
            cmd_assets()
