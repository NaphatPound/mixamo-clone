# Auto-Rig 3D Web Tool — Implementation Plan for Claude Code

> A web-based auto-rigging tool similar to Mixamo but supporting more than humanoid characters (quadrupeds, creatures, custom skeletons). Built with React + TypeScript + Three.js.

---

## Project Overview

### Goal
Build a browser-based 3D auto-rigging tool where users can:
1. Upload a 3D model (GLB/FBX/OBJ)
2. Choose a skeleton template (humanoid, quadruped, creature, or custom)
3. Place landmark markers on the mesh OR use auto-detection
4. Auto-generate skeleton with proper bone hierarchy
5. Auto-compute skinning weights via heat diffusion
6. Preview the rig with test animations
7. Export the rigged model (GLB/FBX)

### Tech Stack
- **Framework**: React 18+ with TypeScript, Vite
- **3D Engine**: Three.js + @react-three/fiber + @react-three/drei
- **State Management**: Zustand
- **UI**: Radix UI + custom CSS (dark theme, glassmorphism)
- **Export**: glTF exporter from Three.js

---

## Phase 1: Project Setup & Core Viewer

### Step 1.1 — Initialize Project
```bash
npx -y create-vite@latest ./ --template react-ts
npm install three @react-three/fiber @react-three/drei zustand
npm install @types/three -D
npm install three-mesh-bvh
```

### Step 1.2 — Project Structure
```
src/
├── main.tsx
├── App.tsx
├── index.css                    # Global styles, dark theme, design tokens
├── components/
│   ├── Layout/
│   │   ├── Header.tsx           # App bar with logo, file menu
│   │   ├── Sidebar.tsx          # Tool panels container
│   │   └── StatusBar.tsx        # Bottom status info
│   ├── Viewport/
│   │   ├── Viewport3D.tsx       # Main R3F Canvas wrapper
│   │   ├── ModelViewer.tsx      # Loaded mesh display
│   │   ├── GridFloor.tsx        # Reference grid
│   │   ├── SceneControls.tsx    # Orbit, zoom controls
│   │   └── SkeletonOverlay.tsx  # Bone visualization
│   ├── Panels/
│   │   ├── ImportPanel.tsx      # Upload & file management
│   │   ├── TemplatePanel.tsx    # Skeleton template selector
│   │   ├── MarkerPanel.tsx      # Landmark marker controls
│   │   ├── RigPanel.tsx         # Rig generation controls
│   │   ├── WeightPanel.tsx      # Weight paint visualization
│   │   ├── PreviewPanel.tsx     # Animation preview controls
│   │   └── ExportPanel.tsx      # Export options
│   └── UI/
│       ├── Button.tsx
│       ├── Slider.tsx
│       ├── Select.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
├── core/
│   ├── loader/
│   │   ├── ModelLoader.ts       # GLB/FBX/OBJ import
│   │   └── MeshAnalyzer.ts      # Bounding box, center, scale normalization
│   ├── skeleton/
│   │   ├── SkeletonTemplate.ts  # Template data structures
│   │   ├── HumanoidTemplate.ts  # 65-bone humanoid skeleton
│   │   ├── QuadrupedTemplate.ts # 40-bone quadruped skeleton
│   │   ├── BirdTemplate.ts      # Avian skeleton
│   │   ├── CustomTemplate.ts    # User-defined skeleton builder
│   │   └── TemplateFitter.ts    # Fit template to mesh landmarks
│   ├── markers/
│   │   ├── LandmarkMarker.ts    # Draggable 3D marker on mesh surface
│   │   ├── MarkerPresets.ts     # Required markers per template type
│   │   └── SurfaceSnap.ts       # Raycast marker to mesh surface
│   ├── rigging/
│   │   ├── BoneGenerator.ts     # Create THREE.Bone hierarchy from template
│   │   ├── BoneFitter.ts        # Position bones to match landmarks
│   │   └── SkeletonBuilder.ts   # Assemble final skeleton
│   ├── skinning/
│   │   ├── HeatDiffusion.ts     # Volumetric heat diffusion weights
│   │   ├── VoxelGrid.ts         # Mesh voxelization for heat sim
│   │   ├── WeightSmooth.ts      # Post-process weight smoothing
│   │   └── SkinBinder.ts        # Apply weights to SkinnedMesh
│   ├── preview/
│   │   ├── TestAnimations.ts    # Built-in test poses/animations
│   │   └── AnimationPlayer.ts   # Playback controller
│   └── export/
│       ├── GLTFExporter.ts      # Export as .glb
│       └── FBXExporter.ts       # Export as .fbx
├── store/
│   ├── useAppStore.ts           # Global app state
│   ├── useModelStore.ts         # Loaded model state
│   ├── useRigStore.ts           # Skeleton & rig state
│   └── useUIStore.ts            # UI panel state
└── utils/
    ├── math.ts                  # Vector/quaternion helpers
    ├── meshUtils.ts             # Geometry analysis utilities
    └── constants.ts             # App-wide constants
```

### Step 1.3 — Model Loader
- Support GLB (via `GLTFLoader`), FBX (via `FBXLoader`), OBJ (via `OBJLoader`)
- Auto-normalize: center model at origin, scale to unit bounding box
- Extract mesh geometry for analysis

### Step 1.4 — 3D Viewport
- R3F Canvas with orbit controls, grid, lighting
- Display loaded model with wireframe toggle
- Camera auto-fit to model bounds

---

## Phase 2: Skeleton Templates & Landmark System

### Step 2.1 — Skeleton Templates
Define skeleton templates as typed data structures:

```typescript
interface BoneDefinition {
  name: string;
  parent: string | null;
  defaultLocalPosition: [number, number, number];  // relative to parent
  landmarkKey?: string;  // which landmark drives this bone's position
  constraints?: {
    rotationMin?: [number, number, number];
    rotationMax?: [number, number, number];
  };
}

interface SkeletonTemplate {
  id: string;
  name: string;
  type: 'humanoid' | 'quadruped' | 'bird' | 'custom';
  bones: BoneDefinition[];
  requiredLandmarks: LandmarkDefinition[];
  optionalLandmarks: LandmarkDefinition[];
  testAnimations: string[];
}
```

#### Humanoid Template (65+ bones)
Hips → Spine → Chest → UpperChest → Neck → Head
+ Shoulders → UpperArm → LowerArm → Hand → 5 Fingers × 3 joints each (L/R)
+ UpperLeg → LowerLeg → Foot → Toes (L/R)

#### Quadruped Template (40+ bones)
Root → Spine chain (4) → Neck → Head → Jaw
+ Front legs: Shoulder → UpperArm → LowerArm → Paw (L/R)
+ Hind legs: Hip → UpperLeg → LowerLeg → Paw (L/R)
+ Tail chain (4-6 bones)

#### Bird Template
Root → Spine → Neck chain → Head + Beak
+ Wings: Shoulder → UpperWing → LowerWing → WingTip → Feathers
+ Legs: Hip → UpperLeg → LowerLeg → Foot → 3 Toes

### Step 2.2 — Landmark Marker System
- Click mesh surface to place color-coded landmark markers
- Markers snap to mesh surface via raycasting with `three-mesh-bvh`
- Drag to reposition markers along mesh surface
- Visual guide showing required vs optional vs placed markers
- Each template defines which landmarks are required:
  - **Humanoid**: Head top, chin, shoulders, elbows, wrists, fingertips, hips, knees, ankles, toes (min 13 landmarks)
  - **Quadruped**: Head, neck base, spine points, tail root, each leg joint (min 15)

### Step 2.3 — Template Fitting Algorithm
```
1. Collect all placed landmark positions
2. Load template bone hierarchy
3. For each bone with a landmarkKey:
   a. Set bone world position to landmark position
   b. Compute local position relative to parent bone
4. For bones without landmarks:
   a. Interpolate position between nearest landmarks
   b. Use template proportions as guide
5. Validate: check bone lengths, detect crossed/inverted joints
6. Output: positioned THREE.Bone hierarchy
```

---

## Phase 3: Auto-Skinning (Heat Diffusion)

### Step 3.1 — Mesh Voxelization
```
1. Compute mesh AABB
2. Create 3D grid (resolution: 64³ default, configurable)
3. For each voxel center, cast rays to determine inside/outside
4. Mark solid voxels (inside mesh)
5. Map bones to nearest voxels (bone = heat source)
```

### Step 3.2 — Heat Diffusion Solver
```
1. Initialize temperature grid: bone voxels = 1.0, others = 0.0
2. For each bone, run diffusion independently:
   a. Iteratively spread heat to neighboring solid voxels
   b. heat[i] = average(neighbors) with damping
   c. Run for N iterations (50-100)
3. For each mesh vertex:
   a. Find nearest solid voxel
   b. Read heat values from all bones
   c. Normalize weights (sum = 1.0)
   d. Keep top 4 bone influences (GPU limit)
```

### Step 3.3 — Weight Smoothing & Binding
- Laplacian smoothing pass on vertex weights
- Eliminate micro-weights below threshold (0.01)
- Re-normalize after cleanup
- Apply as `skinIndex` and `skinWeight` buffer attributes
- Create `THREE.SkinnedMesh` with skeleton

---

## Phase 4: Preview & Animation

### Step 4.1 — Built-in Test Animations
- **T-Pose / A-Pose**: Verify rest pose
- **Wave**: Test upper body (arms)
- **Walk Cycle**: Test full body (procedural)
- **Tail Wag**: Test appendages (quadruped)
- **Wing Flap**: Test wing bones (bird)
- **Bend Test**: Rotate each joint individually to check weights

### Step 4.2 — Animation Player
- Play/pause/scrub timeline
- Speed control
- Per-bone rotation test (click bone → rotate slider)
- Weight visualization mode (heat map overlay per bone)

---

## Phase 5: Export

### Step 5.1 — GLB Export
- Use `THREE.GLTFExporter` to export SkinnedMesh with skeleton
- Include bone hierarchy, skin weights, bind matrices
- Optional: embed test animation clips

### Step 5.2 — FBX Export  
- Convert to FBX format using custom serializer or library
- Maintain bone names compatible with Unity/Unreal/Blender

---

## Phase 6: UI & Polish

### Step 6.1 — Design System
- Dark theme with accent colors (cyan/purple gradient)
- Glassmorphism panels with backdrop blur
- Smooth transitions and micro-animations
- Responsive layout: sidebar + viewport

### Step 6.2 — Workflow Wizard
Step-by-step guided flow:
1. **Import** → Upload model file
2. **Template** → Choose skeleton type
3. **Landmarks** → Place required markers
4. **Rig** → Generate skeleton (progress bar)
5. **Preview** → Test with animations
6. **Export** → Download rigged model

### Step 6.3 — Advanced Features
- Symmetry mode (mirror landmarks L/R)
- Bone constraint editor
- Weight paint brush (manual touch-up)
- Undo/redo for all operations
- Multiple model comparison view

---

## Implementation Order for Claude Code

Execute phases in this order:

```
Phase 1 → Phase 6.1 (design) → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6.2-6.3
```

### Detailed Execution Steps

#### 1. Project Init (Phase 1.1)
```bash
cd g:\project\mixamo
npx -y create-vite@latest ./ --template react-ts
npm install three @react-three/fiber @react-three/drei zustand three-mesh-bvh
npm install @types/three -D
```

#### 2. Design System & Layout (Phase 1.2 + 6.1)
- Create `index.css` with full dark theme design system
- Build `Header`, `Sidebar`, `StatusBar` layout components
- Build reusable UI components (`Button`, `Slider`, `Select`, `Modal`, `Toast`)

#### 3. 3D Viewport (Phase 1.3 + 1.4)
- Implement `ModelLoader.ts` for GLB/FBX/OBJ
- Build `Viewport3D`, `ModelViewer`, `GridFloor`, `SceneControls`
- Add `MeshAnalyzer` for auto-centering/scaling

#### 4. Skeleton Templates (Phase 2.1)
- Define `SkeletonTemplate` interfaces
- Implement `HumanoidTemplate`, `QuadrupedTemplate`, `BirdTemplate`
- Build `TemplatePanel` UI for selection

#### 5. Landmark System (Phase 2.2 + 2.3)
- Implement `LandmarkMarker`, `SurfaceSnap`, `MarkerPresets`
- Build `MarkerPanel` UI with visual guide
- Implement `TemplateFitter` algorithm

#### 6. Auto-Skinning Engine (Phase 3)
- Implement `VoxelGrid` mesh voxelization
- Implement `HeatDiffusion` solver
- Implement `WeightSmooth` and `SkinBinder`
- Build `RigPanel` with progress indicator

#### 7. Preview System (Phase 4)
- Create procedural test animations per template type
- Build `AnimationPlayer` with timeline
- Add weight visualization heat map mode
- Build `PreviewPanel` controls

#### 8. Export (Phase 5)
- Implement GLB export with `GLTFExporter`
- Build `ExportPanel` with format options

#### 9. Polish (Phase 6.2 + 6.3)
- Add wizard workflow stepper
- Add symmetry mode, undo/redo
- Add weight paint brush
- Final UI polish, animations, responsiveness

---

## Key Algorithms Reference

### Heat Diffusion Pseudocode
```typescript
function computeHeatWeights(voxelGrid: VoxelGrid, bones: THREE.Bone[]): Float32Array[] {
  const weights: Float32Array[] = bones.map(() => new Float32Array(voxelGrid.totalVoxels));
  
  // Initialize: set bone voxels as heat sources
  for (let b = 0; b < bones.length; b++) {
    const boneVoxel = voxelGrid.worldToVoxel(bones[b].getWorldPosition(new THREE.Vector3()));
    weights[b][voxelGrid.index(boneVoxel.x, boneVoxel.y, boneVoxel.z)] = 1.0;
  }
  
  // Diffuse heat iteratively
  for (let iter = 0; iter < 80; iter++) {
    for (let b = 0; b < bones.length; b++) {
      const newWeights = new Float32Array(weights[b]);
      for (let i = 0; i < voxelGrid.totalVoxels; i++) {
        if (!voxelGrid.isSolid(i)) continue;
        const neighbors = voxelGrid.getNeighbors(i);
        let sum = 0, count = 0;
        for (const n of neighbors) {
          if (voxelGrid.isSolid(n)) { sum += weights[b][n]; count++; }
        }
        if (count > 0) newWeights[i] = sum / count;
      }
      weights[b] = newWeights;
      // Re-pin bone source voxels
      const bv = voxelGrid.worldToVoxel(bones[b].getWorldPosition(new THREE.Vector3()));
      weights[b][voxelGrid.index(bv.x, bv.y, bv.z)] = 1.0;
    }
  }
  return weights;
}
```

### Template Fitting Pseudocode
```typescript
function fitTemplateToBones(template: SkeletonTemplate, landmarks: Map<string, THREE.Vector3>): THREE.Bone {
  const boneMap = new Map<string, THREE.Bone>();
  
  for (const def of template.bones) {
    const bone = new THREE.Bone();
    bone.name = def.name;
    
    if (def.landmarkKey && landmarks.has(def.landmarkKey)) {
      // Position from user-placed landmark
      const worldPos = landmarks.get(def.landmarkKey)!;
      if (def.parent && boneMap.has(def.parent)) {
        const parent = boneMap.get(def.parent)!;
        const parentWorldPos = new THREE.Vector3();
        parent.getWorldPosition(parentWorldPos);
        bone.position.copy(worldPos.clone().sub(parentWorldPos));
      } else {
        bone.position.copy(worldPos);
      }
    } else {
      // Use template default offset
      bone.position.set(...def.defaultLocalPosition);
    }
    
    if (def.parent && boneMap.has(def.parent)) {
      boneMap.get(def.parent)!.add(bone);
    }
    boneMap.set(def.name, bone);
  }
  
  return boneMap.get(template.bones[0].name)!; // root bone
}
```

---

## Verification Plan

### Automated Tests
```bash
npm run build          # Verify no TypeScript errors
npm run dev            # Start dev server, check console for errors
```

### Browser Testing (per phase)
1. **Phase 1**: Upload GLB/FBX/OBJ → model appears centered in viewport
2. **Phase 2**: Select template → place landmarks → markers snap to surface
3. **Phase 3**: Click "Generate Rig" → skeleton appears inside mesh, weights visualize correctly
4. **Phase 4**: Play test animation → model deforms smoothly
5. **Phase 5**: Export GLB → re-import in Blender to verify rig integrity

### Manual Verification
- Import a T-pose humanoid → rig with humanoid template → export → open in Blender
- Import a quadruped model → rig with quadruped template → verify leg deformation
- Test edge cases: non-manifold mesh, very high/low poly models
