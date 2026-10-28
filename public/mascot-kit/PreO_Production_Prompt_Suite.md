# PreO: The Explorer — Production 3D Creation & AI Prompt Suite

> **Project:** PreOne Preschool Operating System  
> **Asset Name:** `PreO_Explorer_Production`  
> **Primary Visual Reference:** `public/images/preo_explorer_concept.jpg` (“PreO Explorer 3D Character Asset Sheet” & `preo.pdf`)  
> **Target Deliverables:** `PreO_Explorer_Production.blend` + `PreO_Explorer_Production.glb`  
> **Core Targets:** 18,420 Polygons &bull; 12,306 Vertices &bull; 2048 × 2048 PBR Textures &bull; Skinned Humanoid Rig &bull; 5 Animation Clips

---

## 1. Master Production Prompt — 3D Artist / Blender

```text
PREO: THE EXPLORER
Final Production 3D Character — Master Specification
Project: PreOne Preschool Operating System
Asset name: PreO_Explorer_Production
Primary reference: "PreO Explorer 3D Character Asset Sheet" and preo.pdf
Target deliverables: Editable Blender project (.blend) and production-ready animated glTF 2.0 (.glb).

A. Objective
Create a complete, production-quality, fully rigged 3D mascot that faithfully recreates PreO: The Explorer from the supplied reference sheet.
The reference sheet is the source of truth for character identity, proportions, hairstyle, face, outfit, accessories, brand placement, materials, expressions, and animation poses. Do not redesign the character, substitute a generic cartoon child, or simplify the result into a low-poly prototype.
The character is a friendly, curious, energetic child mascot for a preschool learning platform serving children aged 2–6. The visual style should resemble a polished, high-end stylized 3D animated feature film.

B. Character identity and proportions
Create one consistent character with the following features:
- Large expressive childlike head, compact torso, short limbs, and chunky sneakers.
- Warm light-to-medium skin tone, rounded cheeks, small nose, and a friendly smile.
- Large brown eyes with glossy irises, visible catchlights, and expressive eyelids.
- Thick, voluminous, tousled dark-chocolate-brown hair with warm auburn highlights and distinct sculpted clumps.
- Purple futuristic explorer goggles with glossy frames, transparent lavender-purple lenses, and circular side details.
- Stable facial proportions and recognizable silhouette across all views, expressions, and animations.
Use sculpted forms and carefully controlled highlights to create a premium animated-film appearance. Avoid photorealistic adult anatomy, overly realistic skin pores, flat cartoon shading, and exaggerated redesigns.

C. Outfit and accessories
1. T-shirt: White short-sleeved crew-neck shirt. Purple collar and sleeve trim. Official PreOne logo and paw-inspired symbol on the chest. Realistic cotton shading, subtle folds, seams, and appropriate thickness. Use a clean UV-mapped logo texture or approved logo asset. Do not rely on AI-generated lettering for the final brand mark.
2. Shorts: Royal-blue athletic shorts. White side stripes and purple-and-white piping at the hems. Soft textile shading, realistic folds, and visible seam construction.
3. Backpack: Royal-blue structured explorer backpack. Padded shoulder straps, front zipper pocket, stitching, and clearly defined compartments. White PreOne paw symbol and brand name on the front. Separate mesh objects where useful and a dedicated backpack root control. Backpack must follow the body naturally during movement.
4. Wristbands: Blue-purple wristbands on both wrists. Glossy material with white/cyan circular emissive power-ring details. Controlled emission that remains visible without overexposure.
5. Sneakers: Purple high-top sneakers. White laces, chunky white soles, purple upper material, and circular side accents. Paw-inspired decorative details where shown in the reference. Separate material zones for upper, sole, laces, trim, and decorative parts.
6. Socks: White crew socks with two purple stripes. Knitted cotton appearance with appropriate thickness and deformation.

D. Geometry and modeling
Build a complete, watertight where appropriate, deformation-ready character mesh. Include all visible and hidden surfaces needed for arbitrary camera angles and animation.
- Target Polygons: ~18,420 (evaluated quads/triangles).
- Target Vertices: ~12,306.
- Target format: glTF 2.0 .glb.
- Target file size: ~1.2 MB.
Requirements:
- Clean topology and sensible edge flow around shoulders, elbows, wrists, hips, knees, ankles, neck, jaw, and facial features.
- Properly modeled hands, separate fingers, and articulating thumbs.
- No unintended holes, inverted normals, broken surfaces, obvious intersections, or disconnected visible parts.
- Separate hair, goggles, clothing, backpack, wristbands, socks, and shoes as appropriate.
- Preserve the reference silhouette from front, three-quarter, side, and back views.

E. UV mapping and PBR materials
Use 2048 × 2048 texture sets for principal materials. Support Base Color, Roughness, Metallic, Normal, Emissive, and Transmission/alpha-based transparency for goggles.
- Skin: soft, warm, moderately rough, with restrained subsurface scattering in the source render.
- Hair: dark brown with auburn highlights and controlled specular response.
- Shirt: white cotton with clean purple trim and correctly oriented branding.
- Shorts: rich royal-blue fabric with white stripes.
- Backpack: structured blue canvas with seams and clear pocket details.
- Goggles: lavender-purple transparent lenses with glossy frames and appropriate reflections.
- Wristbands: blue-purple glossy material with white/cyan emissive rings.
- Shoes: purple synthetic material, white rubber soles, and detailed laces.
- Socks: white knitted cotton with purple stripes.
Ensure the final GLB materials render correctly in the intended Three.js environment.

F. Humanoid rig and skinning
Create a production-quality humanoid armature with validated skin weights.
Required hierarchy: Root / global control, Hips, Spine, Chest, Neck, Head, Left and right clavicles, Upper arms, Forearms, Wrists and hands, Finger and thumb joints, Left and right thighs, Shins, Ankles and feet, Facial controls for eyes, eyelids, eyebrows, and jaw, Optional eye-target, backpack-root, goggles, and accessory controls.
Requirements: Proper vertex-group weighting and deformation testing. Appropriate joint-index and joint-weight attributes for every skinned mesh in the exported GLB. Natural joint deformation without collapsing or stretching artifacts.

G. Five required animation clips (Exact names required)
1. idle_breathe (Loop): Relaxed neutral stance with gentle breathing, subtle torso expansion, natural blinking, and slight head drift. Seamless loop.
2. wave_welcome (One-shot): PreO raises the right arm and waves warmly with eye contact and a smiling expression. Controlled return to idle.
3. thinking (Loop): Hand under chin, slight head tilt, thoughtful gaze. Seamless loop.
4. celebrate (One-shot): Joyful jump with both arms raised, broad smile, controlled landing without foot sliding.
5. sleep (Loop): Comfortable resting pose, closed eyes, peaceful breathing. Seamless loop.

H. Facial expressions
Create five recognizable expressions: Normal, Happy, Wink, Surprised, Thinking via blend shapes.

I. Required presentation views
Verify and render: Front, Three-quarter front, Side, Back, Three-quarter back, plus facial expression and wireframe views.

J. Deliverables
- PreO_Explorer_Production.blend (Blender source)
- PreO_Explorer_Production.glb (Runtime GLB with embedded PBR textures and 5 clips)
- PBR textures (2048×2048)
- Technical QA report
```

---

## 2. AI Image-to-3D Prompt (Meshy, Tripo3D, Rodin, CSM, Luma)

> **Instructions:** Upload `public/images/preo_explorer_concept.jpg` as the primary image reference in the Image-to-3D generator, then copy-paste the prompt below into the text description prompt field.

```text
Create a complete, high-quality, stylized 3D character model of PreO: The Explorer, faithfully based on the uploaded character reference sheet.

Reproduce the same childlike character identity, large expressive brown eyes, warm rounded face, joyful smile, voluminous tousled dark-chocolate hair with auburn highlights, purple transparent explorer goggles, white PreOne T-shirt with purple trim, royal-blue shorts, structured royal-blue PreOne backpack, blue-purple wristbands with circular emissive accents, white crew socks with purple stripes, and purple high-top sneakers with white laces and chunky white soles.

Preserve the reference's proportions, silhouette, hairstyle, colors, accessories, and premium stylized 3D animated-feature-film aesthetic. Model the complete head, body, fingers, thumbs, clothing, shoes, goggles, backpack, and accessories. Produce clean, connected geometry with sensible edge flow and a deformation-friendly topology. Keep clothing, hair, goggles, backpack, wristbands, and shoes separately identifiable where appropriate.

Create a front-facing neutral standing pose with both feet grounded, arms slightly away from the torso, hands clearly separated from the body, fingers anatomically organized, and a relaxed friendly expression. Ensure the entire character is visible from the top of the hair to the bottom of both shoes.

Use realistic stylized PBR materials: soft skin, sculpted layered hair, white cotton fabric, royal-blue textile, glossy purple accessories, physically plausible translucent lavender goggles, and white/cyan wristband emissive rings. Preserve correct material separation and prepare the mesh for UV mapping and texture baking.

The output must be a true three-dimensional mesh, not a flat image, billboard, depth-map card, or turntable collage. Do not combine several character views into one model. Use the supplied sheet as visual guidance, not as geometry to include in the output.

Technical goal: an editable, full-body, animation-ready 3D character suitable for further rigging in Blender and export to glTF 2.0 GLB for a Three.js application. Aim for approximately 18,420 polygons and 12,306 vertices, while prioritizing correct anatomy, silhouette, and deformation quality. Prepare for 2048 × 2048 PBR textures.

Keep the official PreOne logo as a separate UV-mapped texture or replaceable material detail so that it can be corrected after generation. Preserve the five intended animation requirements for subsequent rigging: idle_breathe, wave_welcome, thinking, celebrate, and sleep.

Render the finished model in a neutral studio setup with a simple light background, soft key and fill lighting, subtle rim lighting, full-body framing, and no cropped extremities.

Do not: redesign the character, change the face, change the hairstyle, change the clothing colors, omit the goggles or backpack, generate misspelled branding, add extra limbs or fingers, merge fingers into mitten-like hands, produce broken geometry, leave holes, create floating accessories, generate a low-poly blockout, or return only a 2D image.
```

---

## 3. Negative Prompt

```text
low-poly prototype, blockout mesh, generic cartoon child, different character identity, adult body proportions, photorealistic human, flat 2D image, billboard, depth-map plane, multiple characters fused together, incorrect face, incorrect hairstyle, blonde hair, straight hair, missing goggles, opaque goggles, missing backpack, missing wristbands, missing shoes, incorrect shirt, incorrect colors, misspelled PreOne, mirrored logo, unreadable brand mark, extra limbs, extra fingers, missing fingers, fused fingers, malformed hands, broken joints, intersecting meshes, floating accessories, holes in geometry, inverted normals, disconnected surfaces, poor topology, stretched UVs, blurry textures, missing materials, excessive bloom, overexposed skin, cropped feet, cropped hair, incomplete body, static image instead of 3D mesh.
```

---

## 4. Rigging & Animation Post-Process Prompt (Blender Phase)

```text
Take the completed PreO: The Explorer character mesh and create a production-quality humanoid rig in Blender. Preserve the approved mesh, proportions, face, outfit, branding, materials, and accessories without redesigning them.

Create a root/global control, hips, spine, chest, neck, head, clavicles, upper arms, forearms, wrists, hands, fingers, thumbs, thighs, shins, ankles, and feet. Add facial controls or blend shapes for eyelids, eyes, eyebrows, and jaw. Provide separate backpack and accessory controls where appropriate.

Skin the body and deforming clothing with validated vertex weights. Test shoulders, elbows, wrists, hips, knees, ankles, fingers, and the neck. Ensure that the backpack straps and accessories follow the character without floating or penetrating the body.

Create five named animation clips:
1. idle_breathe: seamless gentle breathing and subtle head drift.
2. wave_welcome: right-arm greeting wave followed by a controlled return to idle.
3. thinking: hand under chin, slight head tilt, thoughtful gaze, seamless loop.
4. celebrate: joyful jump, both arms raised, broad smile, controlled landing.
5. sleep: peaceful resting pose, closed eyes, gentle breathing, seamless loop.

Create Normal, Happy, Wink, Surprised, and Thinking facial expressions. Export a glTF 2.0 GLB containing the skinned character, required materials, embedded textures, and all five animations.

Validate the exported file in a glTF viewer. Confirm that every required animation is present, selectable, and plays correctly. Report any unsupported feature, missing weight, deformation defect, or export limitation rather than claiming unverified success.
```

---

## 5. Technical Delivery QA Acceptance Checklist

- [ ] **1. Identity Alignment:** Reference sheet and approved character identity match closely.
- [ ] **2. Multi-Angle Verification:** Front, 3/4 front, side, back, and 3/4 back silhouettes verified.
- [ ] **3. Branding Accuracy:** PreOne logo and paw symbol correctly spelled, oriented, and crisp.
- [ ] **4. Topology Targets:** Measured ~18,420 polygons and ~12,306 vertices with clean deformation loops.
- [ ] **5. PBR Materials:** 2048 × 2048 textures with BaseColor, Roughness, Metallic, Normal, Emissive, and Transmission/Alpha.
- [ ] **6. Armature & Weights:** Humanoid skeleton skinned with smooth weights (`JOINTS_0`, `WEIGHTS_0`).
- [ ] **7. Exact Clip Names:** `idle_breathe`, `wave_welcome`, `thinking`, `celebrate`, and `sleep` properly exported.
- [ ] **8. Facial Blendshapes:** Normal, Happy, Wink, Surprised, and Thinking expressions functional.
- [ ] **9. Independent glTF Validation:** GLB opens and passes schema check in official Khronos / Three.js viewer.
- [ ] **10. In-App Runtime Test:** Model loads and plays smoothly in `PreOMascot3D.tsx` on [http://localhost:3000](http://localhost:3000).
- [ ] **11. Deliverable Package:** `PreO_Explorer_Production.blend`, `.glb`, texture sets, and QA report filed.
