/**
 * Higgsfield asset slots.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 *
 * The brief asked for the 3D assets to be generated on Higgsfield. At build time
 * the connected account had 0 credits on the free plan and no unlimited allowance
 * (`balance` → {"credits": 0, "subscription_plan_type": "free"}), and the cheapest
 * image generation costs 2 credits — so nothing could be generated.
 *
 * Rather than block the whole page on that, every asset the scene would have taken
 * from Higgsfield is authored procedurally in src/scene/ and declared here as a
 * slot. The site is complete and running without them. When credits are topped up,
 * fill in `file` and flip `enabled` — no other file needs to change.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PIPELINE PER SLOT
 *
 *   1. generate_image  with the slot's `imagePrompt` (model: nano_banana_pro,
 *      aspect_ratio 1:1, resolution 2k — clean single subject, plain background,
 *      which is what the 3D converter needs).
 *   2. For `views: 4` slots, generate the same subject from the four listed angles
 *      and keep them consistent.
 *   3. generate_3d     with the resulting job_id(s):
 *        · 1 view  → model "image_to_3d",       should_texture: true, enable_pbr: true
 *        · 4 views → model "multi_image_to_3d", should_texture: true, enable_pbr: true
 *      Use `target_polycount` from the slot — the web budget, not the max.
 *   4. Download the GLB into public/models/ and set `file` + `enabled: true`.
 *
 * COST NOTE: preflight any call with get_cost:true before spending.
 */

export const assetSlots = [
  {
    id: 'dancer',
    label: 'Penari bedhaya — the figure at the centre of the pendopo',
    enabled: false,
    file: null, // e.g. '/models/dancer.glb'
    transform: { position: [0, 1.2, 0], rotation: [0, 0, 0], scale: 1 },
    replaces: 'dancer',
    views: 4,
    viewAngles: ['front', 'three-quarter left', 'left profile', 'back'],
    targetPolycount: 50000,
    /**
     * IMPORTANT — take the MESH only, never the animation.
     *
     * Meshy's rig library has 678 clips and not one is a Javanese dance. The whole
     * `Dancing` group is Western pop (FunnyDancing, Gangnam_Groove, Hip_Hop_Dance,
     * Bass_Beats); searching graceful / slow / traditional / ballet / tai chi
     * returns nothing. Bedhaya is slow, held in mendhak, with nyempurit wrists and
     * pacak gulu head slides — none of it exists in that library, and any clip
     * from it applied to a figure in kebaya looks absurd.
     *
     * So generate with `enable_rigging: true` and `enable_animation: FALSE`, then
     * drive the returned skeleton from src/scene/dance.js, which is where the
     * choreography lives and will keep living.
     */
    generateParams: {
      model: 'multi_image_to_3d',
      should_texture: true,
      enable_pbr: true,
      enable_rigging: true,
      enable_animation: false,
      pose_mode: 'a-pose',
      rigging_height_meters: 1.65,
      target_polycount: 50000,
    },
    imagePrompt:
      'Full-body A-pose of a young Javanese court dancer, photographed straight ' +
      'on, arms slightly away from the body. Wearing a fitted bright grass-green ' +
      'long-sleeve kebaya with two small gold brooches down the front, a brown ' +
      'leather sash belt, a brown-and-gold sogan batik jarit wrapped tightly from ' +
      'waist to ankle, and a vivid pink silk selendang knotted at the hip. Hair ' +
      'in a low sanggul bun with a gold hairpiece, gold teardrop earrings, bare ' +
      'feet. Neutral seamless studio background, flat even lighting, no shadows, ' +
      'whole figure in frame, photorealistic fabric.',
  },
  {
    id: 'pendopo',
    label: 'Pendopo joglo — the hero structure',
    enabled: false,
    file: null, // e.g. '/models/pendopo.glb'
    /** Where it goes and how it is oriented once loaded. */
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 },
    /** Replaces this procedural object when enabled. */
    replaces: 'pendopo',
    views: 4,
    viewAngles: ['front elevation', 'three-quarter left', 'side elevation', 'rear elevation'],
    targetPolycount: 60000,
    imagePrompt:
      'Architectural render of a Javanese joglo pendopo pavilion, open-sided, ' +
      'four central soko guru teak pillars, three-tiered shingled roof with ' +
      'flared eaves, gilded mustaka finial, raised pale limestone platform with ' +
      'three entry steps, carved gold fascia. Muted heritage palette: deep forest ' +
      'green #2C4A34, gold #C9A34E, cream #E8E2D0. Neutral seamless background, ' +
      'even studio lighting, no people, no ground shadow, full structure in frame, ' +
      'orthographic feel, photorealistic materials.',
  },
  {
    id: 'tumpang-sari',
    label: 'Tumpang sari — corbelled ceiling, seen at the interior beat',
    enabled: false,
    file: null,
    transform: { position: [0, 11.0, 0], rotation: [0, 0, 0], scale: 1 },
    replaces: 'tumpangSari',
    views: 1,
    targetPolycount: 40000,
    imagePrompt:
      'Looking straight up at a Javanese tumpang sari ceiling: seven stacked ' +
      'square timber frames stepping inward toward a central gilded rosette boss, ' +
      'batik parang motif panels on the soffits between tiers, aged teak beams ' +
      'alternating with gold-leafed beams. Deep forest green and gold on cream. ' +
      'Symmetrical, centred, dark neutral background, no people.',
  },
  {
    id: 'gamelan',
    label: 'Gamelan set — for the Culture section (not yet placed in-scene)',
    enabled: false,
    file: null,
    transform: { position: [0, 1.2, -8], rotation: [0, 0, 0], scale: 1 },
    replaces: null,
    views: 4,
    viewAngles: ['front', 'three-quarter left', 'side', 'top-down'],
    targetPolycount: 30000,
    imagePrompt:
      'A Javanese gamelan bonang set: rows of bronze kettle gongs resting on an ' +
      'ornately carved wooden frame painted deep green with gold leaf detailing. ' +
      'Warm aged bronze, single object, plain neutral background, even lighting, ' +
      'no people, entire instrument in frame.',
  },
  {
    id: 'mustaka',
    label: 'Mustaka finial — close detail for a future palace page',
    enabled: false,
    file: null,
    transform: { position: [0, 14.6, 0], rotation: [0, 0, 0], scale: 1 },
    replaces: null,
    views: 1,
    targetPolycount: 15000,
    imagePrompt:
      'A Javanese keraton roof finial (mustaka): stacked gilded brass disc, ' +
      'spherical bulb, and tapering spire, chased with floral rosette ornament. ' +
      'Warm gold #C9A34E, single object, plain neutral background, studio ' +
      'lighting, no background elements.',
  },
];

/**
 * Swaps in any enabled GLB, replacing the procedural stand-in it names.
 *
 * GLTFLoader is imported lazily so that a build with every slot disabled — the
 * current state — never ships the loader or pays for parsing it.
 *
 * Failures are logged and swallowed on purpose: a missing or malformed GLB should
 * leave the procedural scene standing, not blank the page.
 *
 * @param {import('three').Scene} scene
 * @param {Record<string, import('three').Object3D>} procedural  keyed by `replaces`
 */
export async function hydrateAssets(scene, procedural = {}) {
  const active = assetSlots.filter((s) => s.enabled && s.file);
  if (active.length === 0) return { loaded: [], skipped: assetSlots.length };

  const [{ GLTFLoader }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
  ]);

  const loader = new GLTFLoader();
  const loaded = [];

  await Promise.all(
    active.map(
      (slot) =>
        new Promise((resolve) => {
          loader.load(
            slot.file,
            (gltf) => {
              const model = gltf.scene;
              const { position, rotation, scale } = slot.transform;
              model.position.fromArray(position);
              model.rotation.fromArray(rotation);
              model.scale.setScalar(scale);
              model.traverse((o) => {
                if (o.isMesh) {
                  o.castShadow = true;
                  o.receiveShadow = true;
                }
              });

              const standIn = slot.replaces ? procedural[slot.replaces] : null;
              if (standIn) {
                standIn.visible = false;
                standIn.parent?.add(model);
              } else {
                scene.add(model);
              }

              loaded.push(slot.id);
              resolve();
            },
            undefined,
            (err) => {
              console.warn(`[mataram] asset slot "${slot.id}" failed to load:`, err);
              resolve();
            },
          );
        }),
    ),
  );

  return { loaded, skipped: assetSlots.length - loaded.length };
}
