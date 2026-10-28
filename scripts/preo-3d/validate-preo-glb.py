#!/usr/bin/env python3
"""Static GLB check. Usage: python scripts/preo-3d/validate-preo-glb.py path/to/file.glb"""
import json, os, struct, sys
REQUIRED = ["idle_breathe", "wave_welcome", "thinking", "celebrate", "sleep"]

def read_glb(path):
    with open(path, "rb") as handle:
        raw = handle.read()
    if len(raw) < 20:
        raise ValueError("File is too small to be GLB")
    magic, version, total = struct.unpack_from("<4sII", raw, 0)
    if magic != b"glTF" or version != 2 or total != len(raw):
        raise ValueError("Invalid GLB v2 header or length")
    pos, json_chunk = 12, None
    while pos < len(raw):
        if pos + 8 > len(raw):
            raise ValueError("Truncated GLB chunk header")
        length, kind = struct.unpack_from("<II", raw, pos)
        pos += 8
        if pos + length > len(raw):
            raise ValueError("Truncated GLB chunk payload")
        chunk = raw[pos:pos + length]
        pos += length
        if kind == 0x4E4F534A:
            json_chunk = chunk
    if json_chunk is None:
        raise ValueError("Missing GLB JSON chunk")
    return json.loads(json_chunk.decode("utf-8").rstrip(" \t\r\n\0"))

def main(path):
    doc = read_glb(path)
    animations = {a.get("name", ""): a for a in doc.get("animations", [])}
    primitives = [p for m in doc.get("meshes", []) for p in m.get("primitives", [])]
    skinned = sum("JOINTS_0" in p.get("attributes", {}) and "WEIGHTS_0" in p.get("attributes", {}) for p in primitives)
    errors = []
    for name in REQUIRED:
        if name not in animations:
            errors.append("Missing animation: " + name)
        elif not animations[name].get("channels"):
            errors.append("Animation has no channels: " + name)
    if not doc.get("skins"):
        errors.append("No glTF skin found")
    if not skinned:
        errors.append("No primitive has JOINTS_0 and WEIGHTS_0")
    print("File:", os.path.basename(path))
    print("Meshes/nodes/skins:", len(doc.get("meshes", [])), len(doc.get("nodes", [])), len(doc.get("skins", [])))
    print("Skinned primitives:", str(skinned)+"/"+str(len(primitives)))
    print("Animation names:", ", ".join(sorted(animations)) or "(none)")
    if errors:
        print("FAIL / NEEDS REVIEW")
        print("\n".join("- "+e for e in errors))
        return 1
    print("STATIC STRUCTURE PASS — visual playback still requires manual/runtime QA.")
    return 0

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/preo-3d/validate-preo-glb.py path/to/file.glb")
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
