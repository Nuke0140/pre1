# PreO Rig Repair & Export — Blender 4.x
# Run this script from Blender's Scripting workspace.
# Put this .py file and PreO_Explorer_Phase2_Prototype.glb in the same folder.
#
# Output:
#   PreO_Explorer_Rigged_Starter.blend
#   PreO_Explorer_Rigged_Starter.glb
#   PreO_Rig_Repair_Report.txt
#
# Important:
# - This creates a real Blender Armature and JOINTS/WEIGHTS export data.
# - Mesh parts receive rigid 100%-to-one-bone weights (not smooth skinning).
# - Imported node animations are NOT automatically retargeted to the new armature.
#   The report explicitly records animation action names for manual/automated review.
# - Treat this as a rigging starter, not a production-approved asset.

import bpy, os, json, traceback
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
GLB_INPUT = os.path.join(ROOT, "PreO_Explorer_Phase2_Prototype.glb")
OUTPUT_DIR = os.path.join(ROOT, "PreO_Rig_Repair_Output")
os.makedirs(OUTPUT_DIR, exist_ok=True)
BLEND_OUT = os.path.join(OUTPUT_DIR, "PreO_Explorer_Rigged_Starter.blend")
GLB_OUT = os.path.join(OUTPUT_DIR, "PreO_Explorer_Rigged_Starter.glb")
REPORT_OUT = os.path.join(OUTPUT_DIR, "PreO_Rig_Repair_Report.txt")

BONE_NAMES = [
    "root","hips","spine","chest","neck","head",
    "shoulder_L","upper_arm_L","forearm_L","hand_L",
    "shoulder_R","upper_arm_R","forearm_R","hand_R",
    "thigh_L","shin_L","foot_L","thigh_R","shin_R","foot_R"
]
CLIP_NAMES = ["idle_breathe", "wave_welcome", "thinking", "celebrate", "sleep"]

def report_and_raise(message):
    with open(REPORT_OUT, "w", encoding="utf-8") as f:
        f.write("PREO RIG REPAIR: FAILED\n\n" + message + "\n")
        f.write(traceback.format_exc())
    raise RuntimeError(message)

if not os.path.isfile(GLB_INPUT):
    raise FileNotFoundError(
        "Prototype GLB not found. Put PreO_Explorer_Phase2_Prototype.glb "
        "in the same folder as this script, then run again."
    )

# Clean current scene, then import the existing prototype.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=GLB_INPUT)
bpy.context.view_layer.update()

scene_objects = list(bpy.context.scene.objects)
node_objs = {o.name: o for o in scene_objects if o.name in BONE_NAMES}
missing = sorted(set(BONE_NAMES) - set(node_objs))
if missing:
    report_and_raise("Missing expected skeleton nodes: " + ", ".join(missing))

mesh_objs = [o for o in scene_objects if o.type == "MESH"]
if not mesh_objs:
    report_and_raise("No mesh objects found in imported GLB.")

# Capture mesh world matrices and owner bones before replacing the node skeleton.
mesh_records = []
for obj in mesh_objs:
    ancestor = obj.parent
    owner = None
    while ancestor:
        if ancestor.name in BONE_NAMES:
            owner = ancestor.name
            break
        ancestor = ancestor.parent
    if owner is None:
        p = obj.matrix_world.translation
        owner = min(BONE_NAMES, key=lambda n: (node_objs[n].matrix_world.translation - p).length)
    mesh_records.append({"obj": obj, "world": obj.matrix_world.copy(), "owner": owner})

bone_world_heads = {n: node_objs[n].matrix_world.translation.copy() for n in BONE_NAMES}
bone_parent_names = {}
for name, obj in node_objs.items():
    p = obj.parent
    bone_parent_names[name] = p.name if p and p.name in BONE_NAMES else None

# Build armature at the captured world-space positions.
arm_data = bpy.data.armatures.new("PreO_Humanoid_Rig")
arm = bpy.data.objects.new("PreO_Rig", arm_data)
bpy.context.collection.objects.link(arm)
arm.matrix_world.identity()
bpy.context.view_layer.update()
bpy.context.view_layer.objects.active = arm
arm.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")

for name in BONE_NAMES:
    eb = arm_data.edit_bones.new(name)
    eb.head = bone_world_heads[name]
    child = next((c for c in BONE_NAMES if bone_parent_names.get(c) == name), None)
    if child:
        tail = bone_world_heads[child]
        if (tail - eb.head).length < 0.03:
            tail = eb.head + Vector((0, 0, 0.08))
    else:
        tail = eb.head + Vector((0, 0, 0.08))
    eb.tail = tail

for name in BONE_NAMES:
    parent_name = bone_parent_names.get(name)
    if parent_name and parent_name in arm_data.edit_bones:
        arm_data.edit_bones[name].parent = arm_data.edit_bones[parent_name]
        arm_data.edit_bones[name].use_connect = False

bpy.ops.object.mode_set(mode="OBJECT")
arm.show_in_front = True
arm_data.display_type = "OCTAHEDRAL"

# Assign rigid per-part weights and armature modifiers. Preserve the current
# appearance at bind pose by restoring each object's captured world transform.
for rec in mesh_records:
    obj, world, owner = rec["obj"], rec["world"], rec["owner"]
    obj.parent = None
    obj.matrix_world = world
    for mod in list(obj.modifiers):
        obj.modifiers.remove(mod)
    for vg in list(obj.vertex_groups):
        obj.vertex_groups.remove(vg)
    vg = obj.vertex_groups.new(name=owner)
    if len(obj.data.vertices):
        vg.add([v.index for v in obj.data.vertices], 1.0, "REPLACE")
    obj.parent = arm
    obj.matrix_parent_inverse = arm.matrix_world.inverted()
    obj.matrix_world = world
    mod = obj.modifiers.new("PreO_Armature", "ARMATURE")
    mod.object = arm
    obj["preo_weighting"] = "rigid_per_part"
    obj["preo_owner_bone"] = owner

# Remove imported skeleton empties after ownership and hierarchy are captured.
for name in BONE_NAMES:
    old = node_objs[name]
    if old.name in bpy.context.scene.objects:
        bpy.data.objects.remove(old, do_unlink=True)

actions = sorted({a.name for a in bpy.data.actions})
clip_status = {}
for clip in CLIP_NAMES:
    matches = [a for a in actions if clip in a]
    clip_status[clip] = {"imported_action_match": matches, "retargeted_to_new_armature": False}

scene = bpy.context.scene
scene["preo_required_clips"] = ",".join(CLIP_NAMES)
scene["preo_rigging_status"] = "RIGID_PART_WEIGHTS_STARTER_REVIEW_REQUIRED"
scene["preo_animation_retarget_status"] = "NOT_AUTOMATICALLY_RETARGETED"
scene["preo_notes"] = (
    "Rigging starter only. Rigid per-part weights. Imported animations may still "
    "target the removed node skeleton and require retargeting."
)


# Build five simple, named armature actions directly on the new rig.
scene = bpy.context.scene
# These are functional starter motions, not polished animator-authored motion.
def make_action(name, keyed_poses, frame_end=40, cyclic=False):
    action = bpy.data.actions.new(name=name)
    arm.animation_data_create()
    arm.animation_data.action = action
    scene.frame_start = 1
    scene.frame_end = frame_end
    # Ensure clean base pose for each action.
    for pb in arm.pose.bones:
        pb.rotation_mode = "XYZ"
        pb.rotation_euler = (0.0, 0.0, 0.0)
        pb.location = (0.0, 0.0, 0.0)
    for frame, pose_map in keyed_poses:
        scene.frame_set(frame)
        for bone_name, rot in pose_map.items():
            pb = arm.pose.bones.get(bone_name)
            if pb:
                pb.rotation_euler = rot
                pb.keyframe_insert(data_path="rotation_euler", frame=frame, group=bone_name)
        # Key all other bones at neutral to keep action deterministic.
        for pb in arm.pose.bones:
            if pb.name not in pose_map:
                pb.keyframe_insert(data_path="rotation_euler", frame=frame, group=pb.name)
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "BEZIER"
        if cyclic:
            mod = fc.modifiers.new(type="CYCLES")
    action["preo_clip_name"] = name
    action["preo_loop"] = bool(cyclic)
    return action

# radians
import math
def R(x=0.0, y=0.0, z=0.0):
    return (math.radians(x), math.radians(y), math.radians(z))

generated_clips = {}
generated_clips["idle_breathe"] = make_action("idle_breathe", [
    (1,  {"chest": R()}),
    (12, {"chest": R(-2,0,0), "spine": R(1,0,0)}),
    (24, {"chest": R(), "spine": R()}),
    (36, {"chest": R(-2,0,0), "spine": R(1,0,0)}),
    (48, {"chest": R(), "spine": R()}),
], frame_end=48, cyclic=True)

generated_clips["wave_welcome"] = make_action("wave_welcome", [
    (1,  {"upper_arm_R": R(0,0,0), "forearm_R": R(0,0,0)}),
    (8,  {"upper_arm_R": R(-15,0,-40), "forearm_R": R(0,0,-55)}),
    (14, {"upper_arm_R": R(-15,0,-40), "forearm_R": R(0,0,-25)}),
    (20, {"upper_arm_R": R(-15,0,-40), "forearm_R": R(0,0,-60)}),
    (26, {"upper_arm_R": R(-15,0,-40), "forearm_R": R(0,0,-25)}),
    (34, {"upper_arm_R": R(0,0,0), "forearm_R": R(0,0,0)}),
], frame_end=34)

generated_clips["thinking"] = make_action("thinking", [
    (1,  {"head": R(), "upper_arm_R": R()}),
    (10, {"head": R(0,5,0), "upper_arm_R": R(0,0,-20), "forearm_R": R(0,0,-35)}),
    (22, {"head": R(0,-3,0), "upper_arm_R": R(0,0,-20), "forearm_R": R(0,0,-35)}),
    (34, {"head": R(), "upper_arm_R": R(0,0,-20), "forearm_R": R(0,0,-35)}),
    (44, {"head": R(), "upper_arm_R": R(), "forearm_R": R()}),
], frame_end=44, cyclic=True)

generated_clips["celebrate"] = make_action("celebrate", [
    (1,  {"upper_arm_L": R(), "upper_arm_R": R()}),
    (8,  {"upper_arm_L": R(0,0,55), "upper_arm_R": R(0,0,-55)}),
    (16, {"upper_arm_L": R(0,0,70), "upper_arm_R": R(0,0,-70), "chest": R(-5,0,0)}),
    (24, {"upper_arm_L": R(0,0,55), "upper_arm_R": R(0,0,-55), "chest": R()}),
    (32, {"upper_arm_L": R(), "upper_arm_R": R()}),
], frame_end=32)

generated_clips["sleep"] = make_action("sleep", [
    (1,  {"head": R(), "spine": R()}),
    (16, {"head": R(12,0,0), "spine": R(2,0,0)}),
    (32, {"head": R(15,0,0), "spine": R(3,0,0)}),
    (48, {"head": R(12,0,0), "spine": R(2,0,0)}),
], frame_end=48, cyclic=True)

# Restore a neutral frame and retain all actions in the .blend.
arm.animation_data.action = generated_clips["idle_breathe"]
scene.frame_set(1)
scene["preo_generated_clips"] = ",".join(CLIP_NAMES)
scene["preo_animation_status"] = "GENERATED_STARTER_ACTIONS_REVIEW_REQUIRED"

# Save editable file and export selected rig + meshes.
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True)
for rec in mesh_records:
    obj = rec["obj"]
    if obj.name in bpy.context.scene.objects:
        obj.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
bpy.ops.export_scene.gltf(
    filepath=GLB_OUT,
    export_format="GLB",
    use_selection=True,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_skins=True,
    export_materials="EXPORT"
)

with open(REPORT_OUT, "w", encoding="utf-8") as f:
    f.write("PREO RIG REPAIR REPORT\n")
    f.write("======================\n")
    f.write("Result: starter files exported by Blender.\n")
    f.write("Armature: PreO_Rig\n")
    f.write("Bone count: %d\n" % len(BONE_NAMES))
    f.write("Mesh count: %d\n" % len(mesh_records))
    f.write("Weighting: rigid per-part (each mesh's vertices are 100%% assigned to one bone)\n")
    f.write("Animation clips generated: %s\n" % ", ".join(CLIP_NAMES))
    f.write("Production status: NOT APPROVED — rigid weights, joint deformation, animation quality, and export playback need review.\n\n")
    f.write("Imported actions found:\n")
    for name in actions:
        f.write(" - " + name + "\n")
    f.write("\nRequired clip review:\n")
    for clip, info in clip_status.items():
        f.write(" - %s: imported matches=%s; retargeted_to_new_armature=False\n" %
                (clip, ", ".join(info["imported_action_match"]) or "NONE"))
    f.write("\nFiles:\n" + BLEND_OUT + "\n" + GLB_OUT + "\n")

print("PreO rigging starter exported:")
print(BLEND_OUT)
print(GLB_OUT)
print(REPORT_OUT)
print("WARNING: rigid weights only; animation retargeting and visual playback remain to be checked.")
