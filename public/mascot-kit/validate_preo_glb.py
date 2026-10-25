#!/usr/bin/env python3
"""Static GLB validation for PreO export. Usage: python validate_preo_glb.py file.glb"""
import json, struct, sys, os
required = ["idle_breathe", "wave_welcome", "thinking", "celebrate", "sleep"]
def load_glb(path):
    data = open(path, "rb").read()
    if len(data) < 20:
        raise ValueError("File too small to be a GLB")
    magic, version, length = struct.unpack_from("<4sII", data, 0)
    if magic != b"glTF" or version != 2 or length != len(data):
        raise ValueError("Invalid GLB header/length")
    pos = 12
    chunks = []
    while pos < len(data):
        clen, ctype = struct.unpack_from("<II", data, pos)
        pos += 8
        chunks.append((ctype, data[pos:pos+clen]))
        pos += clen
    json_chunk = next((c for t,c in chunks if t == 0x4E4F534A), None)
    if json_chunk is None: raise ValueError("Missing JSON chunk")
    return json.loads(json_chunk.decode("utf-8").rstrip(" \t\r\n\0")), chunks
def main(path):
    g, chunks = load_glb(path)
    animations = {a.get("name",""): a for a in g.get("animations",[])}
    nodes = g.get("nodes", [])
    meshes = g.get("meshes", [])
    skins = g.get("skins", [])
    attrs = [p.get("attributes",{}) for m in meshes for p in m.get("primitives",[])]
    jointed = sum(1 for a in attrs if "JOINTS_0" in a and "WEIGHTS_0" in a)
    bad = []
    for name in required:
        if name not in animations: bad.append("Missing animation: "+name)
        elif not animations[name].get("channels"): bad.append("Animation has no channels: "+name)
    print("GLB:", os.path.basename(path))
    print("Meshes:", len(meshes), "| Nodes:", len(nodes), "| Skins:", len(skins))
    print("Animation clips:", ", ".join(sorted(animations)) or "(none)")
    print("Primitives with JOINTS_0 + WEIGHTS_0:", f"{jointed}/{len(attrs)}")
    print("Animation channel counts:", {n:len(animations[n].get("channels",[])) for n in required if n in animations})
    if not skins: bad.append("No skin object found")
    if not jointed: bad.append("No skinned mesh primitives found")
    if bad:
        print("RESULT: FAIL / NEEDS REVIEW")
        for item in bad: print("-", item)
        return 1
    print("RESULT: STATIC STRUCTURE PASS — this does not prove visual animation playback.")
    return 0
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate_preo_glb.py file.glb"); sys.exit(2)
    sys.exit(main(sys.argv[1]))
