"""Repack build/template.html into the single-file landing bundle.

Inverse of tools/extract.py: JSON-encodes the edited template (with `<`
escaped as \\u003C so the encoded string can live inside a <script> tag) and
splices it into the template block of repo-root index.html.

Usage:
    python tools/pack.py           # splice build/template.html into index.html
    python tools/pack.py --dry     # report what would change; write nothing

Safety: the result is re-decoded and compared against the input template
before anything is written; a no-op pack leaves index.html byte-identical.
"""
import argparse
import io
import json
import os
import re
import sys

TOOLS = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.dirname(TOOLS)
ROOT = os.path.dirname(LIB)
INDEX = os.path.join(ROOT, "index.html")
TEMPLATE = os.path.join(LIB, "build", "template.html")

TEMPLATE_RE = re.compile(r'(<script type="__bundler/template">)(.*?)(</script>)', re.S)


def encode_template(template):
    return json.dumps(template, ensure_ascii=False).replace("<", "\\u003C")


def main(dry):
    if not os.path.exists(TEMPLATE):
        sys.exit("no %s — run tools/extract.py first" % TEMPLATE)
    html = io.open(INDEX, "r", encoding="utf-8", newline="").read()
    template = io.open(TEMPLATE, "r", encoding="utf-8", newline="").read()

    encoded = encode_template(template)
    if json.loads(encoded) != template:          # self-check the encoding
        sys.exit("encode/decode self-check failed — refusing to write")

    m = TEMPLATE_RE.search(html)
    if not m:
        sys.exit("template block not found in index.html")
    if m.group(2) == encoded:
        print("no-op: template unchanged (%d chars)" % len(encoded))
        return
    delta = len(encoded) - len(m.group(2))
    if dry:
        print("would repack: encoded %d chars (%+d vs current)" % (len(encoded), delta))
        return
    new_html = html[:m.start(2)] + encoded + html[m.end(2):]
    io.open(INDEX, "w", encoding="utf-8", newline="").write(new_html)
    print("repacked index.html: encoded %d chars (%+d), file %d chars"
          % (len(encoded), delta, len(new_html)))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry", action="store_true", help="report only; write nothing")
    args = ap.parse_args()
    main(args.dry)
