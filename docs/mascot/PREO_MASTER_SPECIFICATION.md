# MASTER SPECIFICATION — PreO: The Explorer
## Production-Quality 3D Mascot Creation

> **Primary Visual Reference:** `public/images/preo_explorer_concept.jpg` (“PreO Explorer 3D Character Asset Sheet”). Recreate the exact character identity, proportions, hairstyle, outfit, colors, accessories, branding, and overall premium 3D animated-film quality. Do not substitute with a generic cartoon boy or low-poly blockout.

---

### 1. Character Identity & Proportions
- **Character:** PreO – The Explorer (Official friendly mascot of the PreOne Preschool Operating System).
- **Aesthetic:** High-end stylized 3D animated-film (Pixar / DreamWorks quality), designed for children aged 2–6.
- **Proportions:** Stylized toddler/child proportions: large expressive head, compact torso, short limbs, slightly oversized sneakers.
- **Skin:** Warm, light-to-medium skin tone with soft subsurface scattering (SSS).
- **Face & Eyes:** Large expressive brown eyes, glossy irises, crisp catchlights, rounded rosy cheeks, cute small nose, joyful smile.
- **Hair:** Thick, voluminous, tousled dark-chocolate brown hair with warm auburn highlights and individually sculpted chunky clumps.
- **Goggles:** Purple futuristic explorer goggles with translucent lavender lenses, glossy violet frames, and circular side accents.

---

### 2. Exact Outfit, Brand Markings & Accessories

| Item | Specification | Material / Texturing |
| :--- | :--- | :--- |
| **T-Shirt** | White short-sleeved crew-neck with purple collar and sleeve trim. | Soft cotton fabric shader. Displays official **“PreOne”** brandmark + paw mark crisply on chest (UV mapped, no text distortion). |
| **Shorts** | Rich royal-blue athletic shorts with white dual side stripes and purple piping at hem. | Detailed textile weave, subtle fabric seams and realistic creases. |
| **Backpack** | Compact royal-blue explorer backpack with padded straps following shoulders. | Structured canvas fabric, white paw-print + PreOne logo on pocket, front zipper seam, dedicated animation root bone. |
| **Wristbands** | Blue-purple wristbands on both wrists. | Glossy finish with circular white/cyan glowing elements (**Emissive** PBR channel). |
| **Sneakers & Socks** | High-top purple sneakers with white laces, chunky white rubber soles, white side circle accents, paw-print toe details. Crew socks: white with purple twin stripes. | Synthetic purple leather, rubber sole tread, eyelets, stitched seams. |

---

### 3. Technical Modeling Specifications

- **Polygon Target:** ~18,420 polygons (Triangles/Evaluated Quads).
- **Vertex Target:** ~12,306 vertices.
- **Topology:** Clean quad-dominant topology with deformation loops around shoulders, elbows, wrists, hips, knees, ankles, jaw, and eyes.
- **Geometry Parts:** Modeled as separate clean sub-meshes (Head/Body, Hair, Goggles, Shirt, Shorts, Backpack, Wristbands, Shoes, Socks).
- **Fingers:** Fully modeled fingers with usable thumb opposition.

---

### 4. UV & PBR Material Channels (2048 × 2048)

| Material | BaseColor | Roughness | Metallic | Special Attributes |
| :--- | :--- | :--- | :--- | :--- |
| **Skin** | Peach warm (#F7D0B4) | 0.55 | 0.0 | Subsurface Scattering (warm red/orange scatter radius) |
| **Hair** | Dark Chocolate (#3D2214) | 0.60 | 0.0 | Specular anisotropic sheen with auburn highlights |
| **T-Shirt** | Crisp White (#FFFFFF) + Purple Trim | 0.70 | 0.0 | PreOne vector logo UV baked |
| **Shorts** | Royal Blue (#1E3A8A) | 0.65 | 0.0 | White stripes & purple trim |
| **Backpack** | Royal Blue (#1D4ED8) | 0.50 | 0.05 | White Paw Logo |
| **Goggles** | Transparent Violet (#A855F7) | 0.15 | 0.1 | Transmission / Alpha blend (0.65), physical clearcoat |
| **Wristband** | Indigo Violet (#6366F1) | 0.20 | 0.1 | Center circle Emissive (Intensity 2.5, white/cyan) |
| **Sneakers** | Purple (#7C3AED) + White | 0.40 | 0.0 | White rubber sole (Roughness 0.35) |

---

### 5. Rigging & Bone Hierarchy
```text
root
 └── hips
      ├── spine
      │    └── chest
      │         ├── neck
      │         │    └── head
      │         │         ├── eye_L & eye_R (look-at controls)
      │         │         ├── jaw & mouth controls
      │         │         └── goggles_root
      │         ├── shoulder_L ── upper_arm_L ── forearm_L ── hand_L (fingers 1-5)
      │         ├── shoulder_R ── upper_arm_R ── forearm_R ── hand_R (fingers 1-5)
      │         └── backpack_root
      ├── thigh_L ── shin_L ── foot_L ── toe_L
      └── thigh_R ── shin_R ── foot_R ── toe_R
```

---

### 6. Five Required Animation Clips

1. **`idle_breathe` (Loop)**: Gentle breathing, subtle torso expansion, natural blinking, slight head drift.
2. **`wave_welcome` (One-shot)**: PreO raises right arm and waves in a cheerful, friendly greeting, looking at camera.
3. **`thinking` (Loop)**: Head tilts slightly, hand touches chin, thoughtful gaze shift.
4. **`celebrate` (One-shot)**: Joyful jump, arms raised in victory, wide enthusiastic smile.
5. **`sleep` (Loop)**: Settles comfortably, eyes close, soft peaceful breathing.

---

### 7. Five Facial Expressions
- **Normal**: Friendly open eyes, gentle smile.
- **Happy**: Crescent closed eyes, broad beaming smile.
- **Wink**: One eye playfully winked, confident grin.
- **Surprised**: Big rounded eyes, lifted brows, open "O" mouth.
- **Thinking**: Inquisitive side glance, slight mouth slant.

---

### 8. Target Deliverables
- `PreO_Explorer_Production.blend` (Clean Blender source with Armature & Shapekeys)
- `PreO_Explorer_Production.glb` (Skinned GLTF 2.0 with embedded PBR textures & 5 animation clips)
- `PreO_QA_Report.json` (Geometry statistics, bone count, clip validation)
