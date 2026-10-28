# PreO 3D Mascot Pipeline (Starter)

This directory contains a Blender rigging/export helper and a static GLB validator for the PreO mascot prototype.

## Files
- `PreO_Rig_Repair_Export_Blender.py`: Blender 4.x starter script.
- `validate-preo-glb.py`: static GLB structure validator.

## Run the Blender helper
1. Download the current prototype GLB from the project handoff package.
2. Place `PreO_Explorer_Phase2_Prototype.glb` beside `PreO_Rig_Repair_Export_Blender.py`.
3. Open the script in Blender 4.x > Scripting and click **Run Script**.
4. Inspect `PreO_Rig_Repair_Output/REPORT.txt`, open the generated .blend, and test each action.
5. Run `python scripts/preo-3d/validate-preo-glb.py PreO_Rig_Repair_Output/PreO_Explorer_Rigged_Starter.glb`.

## Important status
This is a **development starter**, not a production-approved mascot. The helper assigns rigid 100% per-part weights. That can create visible seams or unnatural joint motion. The five actions are simple placeholders, not animator-polished. A passing static validator cannot confirm visual quality, correct coordinate conventions, clip looping, or browser playback.

Before app integration:
- inspect the bind pose and all deformations in Blender;
- verify all five exported clips by playing them in the target Three.js/browser runtime;
- run project lint/build/tests;
- keep the existing Lottie/WebP mascot as the safe production fallback until 3D QA passes.

No GLB binary is committed by this change because the source asset needs review and binary validation first.
