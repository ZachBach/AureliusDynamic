"""Extract the web fonts out of the single-file landing bundle.

The bundle inlines every face it uses: the @font-face rules live in the
template with `url("<uuid>")`, and the woff2 payloads live base64/gzip-encoded
in the manifest under those uuids. This decodes both halves and writes a
self-contained font directory -- the woff2 files plus a `fonts.css` whose rules
are the bundle's own, with the uuid urls rewritten to local filenames.

Usage (from anywhere; paths resolve relative to this file):
    python tools/extract-fonts.py --dest ../aureliusLearn/fonts
    python tools/extract-fonts.py --dest ../fonts --family "Space Grotesk" \
                                                  --family "JetBrains Mono"
    python tools/extract-fonts.py --dest /tmp/f --dry

Why this exists: the six dossier sub-pages still link a fonts.googleapis.com
stylesheet, which hands Google the visitor's IP. Every face is already in the
bundle, so self-hosting costs no new payload and no third party -- this is the
tool that gets them out. See znatodos section 8a.

The bundle is the source of truth. Nothing here writes back to it.
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

TEMPLATE_RE = re.compile(r'<script type="__bundler/template">(.*?)</script>', re.S)
MANIFEST_RE = re.compile(r'<script type="__bundler/manifest">(.*?)</script>', re.S)
FACE_RE = re.compile(r"@font-face\s*\{(.*?)\}", re.S)
URL_RE = re.compile(r"""url\(\s*["']?([0-9a-fA-F-]{36})["']?\s*\)""")
DECL_RE = re.compile(r"([a-z-]+)\s*:\s*([^;]+)")

# Google's standard subset partition, identified by a range literal unique to
# each block. Most specific first. An unrecognised block keeps a numbered label
# rather than being guessed at -- a wrong name here would be a file that looks
# like latin and is not, which only shows up as tofu on somebody's page.
SUBSETS = (
    (("U+0460-052F",), "cyrillic-ext"),
    (("U+0400-045F",), "cyrillic"),
    (("U+1F00-1FFF",), "greek-ext"),
    (("U+0370-0377", "U+0370-03FF"), "greek"),
    (("U+1EA0-1EF9",), "vietnamese"),
    (("U+0100-02BA", "U+0100-024F"), "latin-ext"),
    (("U+0000-00FF",), "latin"),
)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.strip().strip("'\"").lower()).strip("-")


def subset_of(unicode_range, seen):
    for needles, label in SUBSETS:
        if any(n in unicode_range for n in needles):
            return label
    seen["n"] += 1
    return "subset%d" % seen["n"]


def decls_of(body):
    out = {}
    for name, value in DECL_RE.findall(body):
        out[name] = value.strip()
    return out


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dest", required=True,
                    help="directory to write the woff2 files and fonts.css into")
    ap.add_argument("--family", action="append", default=[],
                    help="only this family (repeatable); default is every family")
    ap.add_argument("--dry", action="store_true", help="report, write nothing")
    args = ap.parse_args()

    html = io.open(INDEX, "r", encoding="utf-8", newline="").read()
    tm = TEMPLATE_RE.search(html)
    mm = MANIFEST_RE.search(html)
    if not tm or not mm:
        sys.exit("index.html: template or manifest block not found")
    template = json.loads(tm.group(1))
    manifest = json.loads(mm.group(1))

    wanted = {f.lower() for f in args.family}
    faces, names, seen = [], {}, {"n": 0}

    for body in FACE_RE.findall(template):
        m = URL_RE.search(body)
        if not m:
            continue
        d = decls_of(body)
        family = d.get("font-family", "").strip("'\"")
        if wanted and family.lower() not in wanted:
            continue
        uuid = m.group(1)
        if uuid not in manifest:
            sys.exit("face %r references uuid %s, absent from the manifest" % (family, uuid))
        if uuid not in names:
            base = "%s-%s" % (slug(family), subset_of(d.get("unicode-range", ""), seen))
            name, n = base, 1
            while name in names.values():
                n += 1
                name = "%s-%d" % (base, n)
            names[uuid] = name
        faces.append((body, uuid, family, d.get("font-weight", "400")))

    if not faces:
        sys.exit("no @font-face rules matched (families requested: %s)"
                 % (", ".join(args.family) or "all"))

    # Decode payloads and confirm each really is a woff2 before writing it out:
    # the manifest is keyed by uuid with no filenames, so a mis-parse would
    # otherwise land silently as a .woff2 full of javascript.
    blobs = {}
    for uuid in names:
        entry = manifest[uuid]
        blob = base64.b64decode(entry["data"])
        if entry.get("compressed"):
            blob = gzip.decompress(blob)
        if blob[:4] != b"wOF2":
            sys.exit("uuid %s (%s) is not woff2 -- mime says %r, magic is %r"
                     % (uuid, names[uuid], entry.get("mime"), blob[:4]))
        blobs[uuid] = blob

    css = ["/* Generated by tsl-lib/tools/extract-fonts.py from the landing",
           "   bundle's own @font-face rules. Do not hand-edit: re-run the tool.",
           "   Every face is served from this directory -- no third party. */", ""]
    for body, uuid, _family, _weight in faces:
        css.append("@font-face {%s}" % URL_RE.sub(
            'url("./%s.woff2")' % names[uuid], body).rstrip())
    css_text = "\n".join(css) + "\n"

    by_family = {}
    for _body, uuid, family, weight in faces:
        by_family.setdefault(family, set()).add(weight)
    for family in sorted(by_family):
        print("%-16s weights %s" % (family, ", ".join(sorted(by_family[family]))))
    total = sum(len(b) for b in blobs.values())
    for uuid in sorted(names, key=lambda u: names[u]):
        print("  %-28s %7d bytes" % (names[uuid] + ".woff2", len(blobs[uuid])))
    print("%d faces, %d files, %.1f KB" % (len(faces), len(blobs), total / 1024.0))

    if args.dry:
        print("--dry: nothing written")
        return

    dest = os.path.abspath(args.dest)
    os.makedirs(dest, exist_ok=True)
    for uuid, name in names.items():
        open(os.path.join(dest, name + ".woff2"), "wb").write(blobs[uuid])
    io.open(os.path.join(dest, "fonts.css"), "w", encoding="utf-8", newline="\n").write(css_text)
    print("wrote %s" % dest)


if __name__ == "__main__":
    main()
