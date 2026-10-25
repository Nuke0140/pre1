# PreO productionization plan — next deliverable

## Goal
Turn the current blockout into a production-ready PreOne mascot. Current files are a prototype only.

## Must-pass gates
1. Visual review: compare front / side / 3-quarter views against the approved PreO concept.
2. Geometry: clean topology, non-overlapping parts, consistent scale/orientation, UVs and materials.
3. Rig: one humanoid armature with exact bone names; mesh vertices use JOINTS_0 / WEIGHTS_0 in GLB, not only rigidly parented pieces.
4. Animations: exact clips `idle_breathe`, `wave_welcome`, `thinking`, `celebrate`, `sleep`; each clip targets the final armature.
5. Playback: inspect every clip in Blender and a Three.js viewer; confirm looping/one-shot behavior and transitions.
6. Runtime: lazy-load the GLB, pause when offscreen/tab-hidden, honor reduced motion, use WebP fallback.
7. Performance: measure GLB size, first-load time, GPU frame time and mobile behavior on target devices.
8. Delivery: `.blend`, final `.glb`, preview renders, clip/bone manifest, validation report.

## Animation behavior contract
- `idle_breathe`: loop; default state.
- `wave_welcome`: one-shot, then return to `idle_breathe`.
- `thinking`: loop while the thinking state is active, then return to idle.
- `celebrate`: one-shot, then return to idle.
- `sleep`: loop while sleep state is active, then return to idle on wake.
- No root motion; runtime owns screen-space placement.
- Crossfade transitions rather than hard cuts where practical.

## Bone names
root, hips, spine, chest, neck, head,
shoulder_L, upper_arm_L, forearm_L, hand_L,
shoulder_R, upper_arm_R, forearm_R, hand_R,
thigh_L, shin_L, foot_L, thigh_R, shin_R, foot_R

## Runtime acceptance checklist
- [ ] GLB opens in Blender without errors.
- [ ] GLB opens in target Three.js version.
- [ ] All 5 animation names exist exactly.
- [ ] All 5 animations affect the final armature, not orphaned nodes.
- [ ] Skin weights deform shoulders, elbows, hips and knees acceptably.
- [ ] No visible mesh popping at animation boundaries.
- [ ] Reduced-motion uses static fallback.
- [ ] Hidden/offscreen animation pauses.
- [ ] File-size and performance budgets measured on representative devices.
- [ ] Final `.blend` source and preview renders are included.

## Honest current status
The existing prototype has a valid GLB container, 37 meshes, 57 nodes, the 5 named animation clips, and 20 expected named skeleton nodes. It is not production-ready: the mesh pieces are attached to skeleton nodes and do not yet have production-quality continuous skin weights. Blender execution and visual playback have not been verified in this environment. Do not treat a structural GLB parse as proof of animation correctness.
