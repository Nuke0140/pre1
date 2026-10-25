// PreO mascot animation controller — Three.js ES module.
// Usage: import * as THREE from "three"; import { createPreOAnimationController } from "./PreO_ThreeJS_Animation_Controller_v2.js";
const REQUIRED_CLIPS = ["idle_breathe", "wave_welcome", "thinking", "celebrate", "sleep"];
const ONE_SHOT = new Set(["wave_welcome", "celebrate"]);
const LOOPED_REACTIONS = new Set(["thinking", "sleep"]);

export function validatePreOClips(animations) {
  const names = new Set(animations.map((clip) => clip.name));
  const missing = REQUIRED_CLIPS.filter((name) => !names.has(name));
  if (missing.length) throw new Error(`PreO GLB missing animation clips: ${missing.join(", ")}`);
  return true;
}

export function createPreOAnimationController(THREE, mixer, animations, options = {}) {
  if (!THREE?.LoopOnce || !THREE?.LoopRepeat) throw new Error("Pass the imported THREE namespace as the first argument.");
  validatePreOClips(animations);
  const fadeSeconds = options.fadeSeconds ?? 0.18;
  const actions = new Map(animations.map((clip) => [clip.name, mixer.clipAction(clip)]));
  let currentName = null;
  let disposed = false;

  function play(name, config = {}) {
    if (disposed) throw new Error("PreO animation controller has been disposed.");
    const next = actions.get(name);
    if (!next) throw new Error(`Unknown PreO animation: ${name}`);
    const loop = config.loop ?? (name === "idle_breathe" || LOOPED_REACTIONS.has(name));
    const fade = config.fadeSeconds ?? fadeSeconds;
    const previous = currentName ? actions.get(currentName) : null;
    if (previous === next && next.isRunning()) return next;
    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(1);
    next.clampWhenFinished = !loop;
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.fadeIn(fade).play();
    if (previous && previous !== next) previous.fadeOut(fade);
    currentName = name;
    return next;
  }

  function playIdle() { return play("idle_breathe", { loop: true }); }
  function react(name) {
    if (ONE_SHOT.has(name)) return play(name, { loop: false });
    if (LOOPED_REACTIONS.has(name)) return play(name, { loop: true });
    throw new Error(`Unsupported PreO reaction: ${name}`);
  }
  function onFinished(event) {
    const finishedName = event.action?.getClip?.().name;
    if (finishedName && ONE_SHOT.has(finishedName) && currentName === finishedName) playIdle();
  }
  mixer.addEventListener("finished", onFinished);
  function stopAll() { actions.forEach((action) => action.stop()); currentName = null; }
  function dispose() { if (disposed) return; stopAll(); mixer.removeEventListener("finished", onFinished); disposed = true; }
  return { play, playIdle, react, stopAll, dispose, getCurrentName: () => currentName };
}

/* Example:
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createPreOAnimationController } from "./PreO_ThreeJS_Animation_Controller_v2.js";
const gltf = await new GLTFLoader().loadAsync("/models/PreO_Explorer_Phase2_Prototype.glb");
scene.add(gltf.scene);
const mixer = new THREE.AnimationMixer(gltf.scene);
const preO = createPreOAnimationController(THREE, mixer, gltf.animations);
preO.playIdle();
// In animation loop: mixer.update(deltaSeconds);
// Example reactions: preO.react("wave_welcome"), preO.react("thinking"), preO.react("celebrate"), preO.react("sleep").
// Dispose when removing the mascot: preO.dispose().
*/
