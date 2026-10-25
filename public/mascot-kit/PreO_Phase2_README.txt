# PreO Phase 2 — Rigging handoff

## Included
- `PreO_Explorer_Phase2_Prototype.glb`: generated visual blockout with the five required named clips.
- `PreO_Phase2_Asset_Manifest.json`: bone and clip manifest.
- `PreO_Phase2_Validation_Report.json`: structural validation results.
- `PreO_Phase2_Rig_Cleanup_Helper.py`: experimental Blender helper for starting rig cleanup.

## Important status
This is a prototype/handoff package, NOT a production-approved rigged character.
The GLB structure and required clip names were checked programmatically. Blender itself was not available in the build environment, so visual playback, bone deformation, and export from Blender have not been tested.
The prototype meshes are separate pieces attached to named skeleton nodes. They do not yet have production-quality smooth skin weights. The helper script is experimental and may require path adjustment and manual cleanup.

## Next steps in Blender
1. Open Blender and switch to Scripting.
2. Open the helper script.
3. Update `GLB_INPUT` to the full path of the prototype GLB on your computer.
4. Update `OUTPUT_DIR` to a folder you can write to.
5. Save the script, then Run Script.
6. Inspect the resulting `.blend`: armature alignment, mesh parts, animation clips, and playback.
7. Do not ship the result until clips are confirmed to animate the new armature correctly and mesh deformation is reviewed.

## Required clip names
- idle_breathe
- wave_welcome
- thinking
- celebrate
- sleep

## Required bone names
root, hips, spine, chest, neck, head,
shoulder_L, upper_arm_L, forearm_L, hand_L,
shoulder_R, upper_arm_R, forearm_R, hand_R,
thigh_L, shin_L, foot_L, thigh_R, shin_R, foot_R
