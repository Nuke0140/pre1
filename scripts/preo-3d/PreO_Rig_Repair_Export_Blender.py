"""PreO 3D mascot rigging starter for Blender 4.x.

Usage:
  1. Put PreO_Explorer_Phase2_Prototype.glb beside this script.
  2. Open this script in Blender > Scripting > Run Script.
  3. Outputs go to ./PreO_Rig_Repair_Output/.

This is a reproducible STARTER, not production approval:
- Mesh parts get rigid 100% weights to one bone.
- Five simple placeholder actions are authored.
- Review deformation and playback in Blender before shipping.
"""
import bpy, os, math
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(ROOT, "PreO_Explorer_Phase2_Prototype.glb")
OUT = os.path.join(ROOT, "PreO_Rig_Repair_Output")
os.makedirs(OUT, exist_ok=True)
if not os.path.isfile(SOURCE):
    raise FileNotFoundError("Place PreO_Explorer_Phase2_Prototype.glb beside this script.")

BONES = [
    "root","hips","spine","chest","neck","head",
    "shoulder_L","upper_arm_L","forearm_L","hand_L",
    "shoulder_R","upper_arm_R","forearm_R","hand_R",
    "thigh_L","shin_L","foot_L","thigh_R","shin_R","foot_R"
]
CLIPS = ["idle_breathe","wave_welcome","thinking","celebrate","sleep"]

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=SOURCE)
bpy.context.view_layer.update()
objects = list(bpy.context.scene.objects)
nodes = {o.name:o for o in objects if o.name in BONES}
missing = sorted(set(BONES)-set(nodes))
if missing:
    raise RuntimeError("Expected skeleton nodes missing from source GLB: "+", ".join(missing))
meshes = [o for o in objects if o.type=="MESH"]
if not meshes:
    raise RuntimeError("No mesh objects found in source GLB.")

owner_map, world_map = {}, {}
for obj in meshes:
    world_map[obj.name] = obj.matrix_world.copy()
    parent, owner = obj.parent, None
    while parent:
        if parent.name in BONES:
            owner = parent.name
            break
        parent = parent.parent
    if owner is None:
        p = obj.matrix_world.translation
        owner = min(BONES, key=lambda n:(nodes[n].matrix_world.translation-p).length)
    owner_map[obj.name] = owner

head = {n:nodes[n].matrix_world.translation.copy() for n in BONES}
parent_name = {n:(nodes[n].parent.name if nodes[n].parent and nodes[n].parent.name in BONES else None) for n in BONES}
arm_data = bpy.data.armatures.new("PreO_Humanoid_Rig")
arm = bpy.data.objects.new("PreO_Rig", arm_data)
bpy.context.collection.objects.link(arm)
arm.matrix_world.identity()
bpy.context.view_layer.objects.active = arm
arm.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
for name in BONES:
    bone = arm_data.edit_bones.new(name)
    bone.head = head[name]
    child = next((n for n in BONES if parent_name[n]==name), None)
    tail = head[child] if child else head[name]+Vector((0,0,0.08))
    if (tail-bone.head).length < 0.03:
        tail = bone.head + Vector((0,0,0.08))
    bone.tail = tail
for name in BONES:
    p = parent_name[name]
    if p and p in arm_data.edit_bones:
        arm_data.edit_bones[name].parent = arm_data.edit_bones[p]
bpy.ops.object.mode_set(mode="OBJECT")
arm.show_in_front = True

for obj in meshes:
    world = world_map[obj.name]
    owner = owner_map[obj.name]
    obj.parent = None
    obj.matrix_world = world
    for mod in list(obj.modifiers):
        obj.modifiers.remove(mod)
    for group in list(obj.vertex_groups):
        obj.vertex_groups.remove(group)
    group = obj.vertex_groups.new(name=owner)
    if obj.data.vertices:
        group.add([v.index for v in obj.data.vertices], 1.0, "REPLACE")
    obj.parent = arm
    obj.matrix_parent_inverse = arm.matrix_world.inverted()
    obj.matrix_world = world
    mod = obj.modifiers.new("PreO_Armature", "ARMATURE")
    mod.object = arm
    obj["preo_weighting"] = "rigid_per_part"
    obj["preo_owner_bone"] = owner

for name in BONES:
    bpy.data.objects.remove(nodes[name], do_unlink=True)

scene = bpy.context.scene
def R(x=0,y=0,z=0):
    return (math.radians(x), math.radians(y), math.radians(z))

def action(name, frames, end, cyclic=False):
    arm.animation_data_create()
    act = bpy.data.actions.new(name)
    arm.animation_data.action = act
    for pose_bone in arm.pose.bones:
        pose_bone.rotation_mode = "XYZ"
    for frame, values in frames:
        scene.frame_set(frame)
        for pose_bone in arm.pose.bones:
            pose_bone.rotation_euler = values.get(pose_bone.name, (0,0,0))
            pose_bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=pose_bone.name)
    for curve in act.fcurves:
        for point in curve.keyframe_points:
            point.interpolation = "BEZIER"
        if cyclic:
            curve.modifiers.new("CYCLES")
    act["preo_clip_name"] = name
    act["preo_loop"] = cyclic
    return act

acts = [
    action("idle_breathe", [(1,{}),(12,{"chest":R(-2)}),(24,{})],24,True),
    action("wave_welcome", [(1,{}),(8,{"upper_arm_R":R(0,0,-40),"forearm_R":R(0,0,-55)}),(16,{"upper_arm_R":R(0,0,-40),"forearm_R":R(0,0,-25)}),(24,{})],24),
    action("thinking", [(1,{}),(12,{"head":R(0,5),"upper_arm_R":R(0,0,-20),"forearm_R":R(0,0,-35)}),(24,{})],24,True),
    action("celebrate", [(1,{}),(8,{"upper_arm_L":R(0,0,55),"upper_arm_R":R(0,0,-55)}),(16,{"upper_arm_L":R(0,0,70),"upper_arm_R":R(0,0,-70),"chest":R(-5)}),(24,{})],24),
    action("sleep", [(1,{}),(16,{"head":R(12),"spine":R(2)}),(32,{"head":R(15),"spine":R(3)})],32,True),
]
scene["preo_status"] = "STARTER_ONLY_REVIEW_REQUIRED"
scene["preo_clip_names"] = ",".join(CLIPS)
arm.animation_data.action = acts[0]
scene.frame_start, scene.frame_end = 1, 32
scene.frame_set(1)
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True)
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,"PreO_Explorer_Rigged_Starter.blend"))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,"PreO_Explorer_Rigged_Starter.glb"),
    export_format="GLB", use_selection=True, export_animations=True,
    export_animation_mode="ACTIONS", export_skins=True, export_materials="EXPORT")
with open(os.path.join(OUT,"REPORT.txt"),"w",encoding="utf-8") as f:
    f.write("PreO rig starter export complete.\n")
    f.write("Mesh objects: %d\n" % len(meshes))
    f.write("Actions authored: %s\n" % ", ".join(CLIPS))
    f.write("Weighting: rigid 100%% per mesh part, NOT smooth skinning.\n")
    f.write("Required before production: inspect bind pose, deformation, clip playback and exported GLB in target runtime.\n")
print("Starter exported. Review REPORT.txt; this is not production-approved.")
