/**
 * Choreography for the pendopo dancer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS IS HAND-AUTHORED
 *
 * Higgsfield's rig library has 678 motion-capture actions and not one of them is
 * a Javanese dance. The entire `Dancing` group is Western pop — FunnyDancing,
 * Gangnam_Groove, Hip_Hop_Dance, Bass_Beats — and searching for graceful, slow,
 * traditional, ballet or tai chi returns nothing. Bolting any of those onto a
 * figure in kebaya would be worse than no dance at all.
 *
 * So the choreography is written here, in the vocabulary it should be in. Even
 * once credits exist and Higgsfield can supply the *mesh*, the *motion* still has
 * to come from this file.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * VOCABULARY ENCODED HERE (golek / bedhaya idiom)
 *
 *   mendhak      the standing base: knees bent and turned out, pelvis dropped.
 *                Never straightens. This alone is most of what makes a pose read
 *                as Javanese rather than as a person standing still.
 *   nyempurit    the hand: wrist sharply flexed back, fingers curled, thumb and
 *                middle finger meeting. Modelled as a hard wrist rotation.
 *   pacak gulu   the head: a lateral slide of the neck, not a turn. Small, and
 *                offset in time from the arms.
 *   ukel         the slow inward-outward rotation of the forearm and wrist that
 *                links one arm position to the next.
 *   seblak       the flick that throws the selendang clear of the arm.
 *
 * Everything is slow. Javanese court dance has no accents and no bounce; the
 * interpolation below is deliberately soft for the same reason.
 *
 * ANGLE CONVENTIONS
 *   The figure faces +Z (toward the arriving camera).
 *   Every limb group hangs along its local -Y, so a bare rotation of 0 is the
 *   anatomical rest pose.
 *   Z rotation abducts a limb sideways, multiplied by `side` (+1 left, -1 right)
 *   so the same number moves both arms outward.
 *   Negative X rotation swings a limb forward.
 */

/** Joints the poses may address. Anything omitted from a pose stays at zero. */
export const JOINTS = [
  'pelvis',
  'spine',
  'chest',
  'neck',
  'head',
  'upperArmL',
  'forearmL',
  'handL',
  'upperArmR',
  'forearmR',
  'handR',
  'thighL',
  'shinL',
  'footL',
  'thighR',
  'shinR',
  'footR',
];

const D = Math.PI / 180;

/**
 * One pose. `lift` is the pelvis height offset in metres (negative = deeper
 * mendhak); every other entry is [x, y, z] in radians.
 *
 * The eight poses form one closed phrase — pose 7 leads back into pose 0 — so the
 * sequence can be looped across the scroll without a visible seam.
 */
export const POSES = [
  // 0 — sembah: the opening salute. Palms together at the chest, deepest mendhak.
  {
    lift: -0.13,
    spine: [2 * D, 0, 0],
    chest: [3 * D, 0, 0],
    neck: [8 * D, 0, 0],
    head: [4 * D, 0, 0],
    upperArmL: [-42 * D, 0, 26 * D],
    forearmL: [-88 * D, 0, -34 * D],
    handL: [-24 * D, 0, -18 * D],
    upperArmR: [-42 * D, 0, 26 * D],
    forearmR: [-88 * D, 0, -34 * D],
    handR: [-24 * D, 0, -18 * D],
    thighL: [-6 * D, 26 * D, 5 * D],
    shinL: [9 * D, 0, 0],
    thighR: [-6 * D, 26 * D, 5 * D],
    shinR: [9 * D, 0, 0],
  },

  // 1 — the arms open outward, wrists already breaking into nyempurit.
  {
    lift: -0.1,
    spine: [0, -5 * D, 0],
    chest: [0, -4 * D, 0],
    neck: [3 * D, 6 * D, -5 * D],
    upperArmL: [-14 * D, 0, 58 * D],
    forearmL: [-30 * D, 0, -22 * D],
    handL: [-58 * D, 0, -14 * D],
    upperArmR: [-14 * D, 0, 52 * D],
    forearmR: [-26 * D, 0, -20 * D],
    handR: [-58 * D, 0, -14 * D],
    thighL: [-4 * D, 24 * D, 4.5 * D],
    shinL: [7.5 * D, 0, 0],
    thighR: [-8 * D, 28 * D, 5.5 * D],
    shinR: [10 * D, 0, 0],
  },

  // 2 — the reference photograph: right arm high with the selendang, left hand
  // low at the hip, torso turned into the extended side.
  {
    lift: -0.11,
    spine: [0, -14 * D, 3 * D],
    chest: [0, -10 * D, 2 * D],
    neck: [6 * D, 14 * D, -8 * D],
    head: [3 * D, 6 * D, 0],
    upperArmR: [-56 * D, 0, 74 * D],
    forearmR: [-16 * D, 0, -10 * D],
    handR: [-66 * D, 0, -8 * D],
    upperArmL: [10 * D, 0, 20 * D],
    forearmL: [-58 * D, 0, -46 * D],
    handL: [-48 * D, 0, -12 * D],
    thighL: [-3 * D, 22 * D, 4 * D],
    shinL: [7 * D, 0, 0],
    thighR: [-10 * D, 30 * D, 6 * D],
    shinR: [11.5 * D, 0, 0],
    footR: [-14 * D, 0, 0],
  },

  // 3 — weight transfers; arms drop through the low pass, pacak gulu the other way.
  {
    lift: -0.15,
    spine: [0, 4 * D, -2 * D],
    chest: [0, 3 * D, 0],
    neck: [4 * D, -12 * D, 7 * D],
    head: [0, -5 * D, 0],
    upperArmL: [-8 * D, 0, 32 * D],
    forearmL: [-44 * D, 0, -30 * D],
    handL: [-62 * D, 0, -16 * D],
    upperArmR: [-6 * D, 0, 30 * D],
    forearmR: [-40 * D, 0, -28 * D],
    handR: [-62 * D, 0, -16 * D],
    thighL: [-11 * D, 30 * D, 6 * D],
    shinL: [12.4 * D, 0, 0],
    thighR: [-3 * D, 22 * D, 4 * D],
    shinR: [7 * D, 0, 0],
    footL: [-12 * D, 0, 0],
  },

  // 4 — mirror of 2: left arm carries, right settles at the waist.
  {
    lift: -0.11,
    spine: [0, 14 * D, -3 * D],
    chest: [0, 10 * D, -2 * D],
    neck: [6 * D, -14 * D, 8 * D],
    head: [3 * D, -6 * D, 0],
    upperArmL: [-56 * D, 0, 74 * D],
    forearmL: [-16 * D, 0, -10 * D],
    handL: [-66 * D, 0, -8 * D],
    upperArmR: [10 * D, 0, 20 * D],
    forearmR: [-58 * D, 0, -46 * D],
    handR: [-48 * D, 0, -12 * D],
    thighL: [-10 * D, 30 * D, 6 * D],
    shinL: [11.5 * D, 0, 0],
    thighR: [-3 * D, 22 * D, 4 * D],
    shinR: [7 * D, 0, 0],
    footL: [-14 * D, 0, 0],
  },

  // 5 — seblak: both arms sweep wide and the wrists snap, throwing the selendang.
  {
    lift: -0.08,
    spine: [-3 * D, 0, 0],
    chest: [-4 * D, 0, 0],
    neck: [-2 * D, 0, 0],
    head: [-3 * D, 0, 0],
    upperArmL: [-8 * D, 0, 88 * D],
    forearmL: [-12 * D, 0, -14 * D],
    handL: [-72 * D, 0, -6 * D],
    upperArmR: [-8 * D, 0, 88 * D],
    forearmR: [-12 * D, 0, -14 * D],
    handR: [-72 * D, 0, -6 * D],
    thighL: [-5 * D, 27 * D, 5 * D],
    shinL: [8.5 * D, 0, 0],
    thighR: [-5 * D, 27 * D, 5 * D],
    shinR: [8.5 * D, 0, 0],
  },

  // 6 — ukel: forearms rotate in, arms fold across, the body turns away.
  {
    lift: -0.14,
    spine: [1 * D, -18 * D, 0],
    chest: [2 * D, -12 * D, 0],
    neck: [5 * D, 16 * D, -6 * D],
    head: [2 * D, 8 * D, 0],
    upperArmL: [-30 * D, 0, 22 * D],
    forearmL: [-74 * D, -30 * D, -40 * D],
    handL: [-54 * D, 0, -20 * D],
    upperArmR: [-46 * D, 0, 44 * D],
    forearmR: [-52 * D, 26 * D, -24 * D],
    handR: [-60 * D, 0, -12 * D],
    thighL: [-9 * D, 28 * D, 5.5 * D],
    shinL: [11 * D, 0, 0],
    thighR: [-6 * D, 25 * D, 4.5 * D],
    shinR: [9 * D, 0, 0],
  },

  // 7 — the phrase resolves back toward the opening, arms gathering inward.
  {
    lift: -0.12,
    spine: [1 * D, -6 * D, 0],
    chest: [2 * D, -4 * D, 0],
    neck: [7 * D, 4 * D, -3 * D],
    head: [3 * D, 2 * D, 0],
    upperArmL: [-32 * D, 0, 34 * D],
    forearmL: [-70 * D, 0, -34 * D],
    handL: [-40 * D, 0, -18 * D],
    upperArmR: [-32 * D, 0, 34 * D],
    forearmR: [-70 * D, 0, -34 * D],
    handR: [-40 * D, 0, -18 * D],
    thighL: [-6 * D, 26 * D, 5 * D],
    shinL: [9 * D, 0, 0],
    thighR: [-6 * D, 26 * D, 5 * D],
    shinR: [9 * D, 0, 0],
  },
];

/** Cosine ease — no linear ramps and no overshoot, which is the whole idiom. */
function ease(t) {
  return 0.5 - Math.cos(Math.PI * t) * 0.5;
}

const ZERO = [0, 0, 0];

/**
 * Samples the phrase at `u` (0→1 across the whole sequence) into `out`.
 *
 * `out` is mutated rather than returned fresh — this runs every frame and the
 * pose is ~17 joints of three floats.
 */
export function samplePose(u, out) {
  const n = POSES.length;
  // Wrap, so the phrase closes back onto pose 0.
  const scaled = ((u % 1) + 1) % 1 * n;
  const i = Math.floor(scaled);
  const f = ease(scaled - i);

  const a = POSES[i % n];
  const b = POSES[(i + 1) % n];

  out.lift = (a.lift ?? 0) + ((b.lift ?? 0) - (a.lift ?? 0)) * f;

  for (const joint of JOINTS) {
    const ra = a[joint] ?? ZERO;
    const rb = b[joint] ?? ZERO;
    let slot = out[joint];
    if (!slot) slot = out[joint] = [0, 0, 0];
    slot[0] = ra[0] + (rb[0] - ra[0]) * f;
    slot[1] = ra[1] + (rb[1] - ra[1]) * f;
    slot[2] = ra[2] + (rb[2] - ra[2]) * f;
  }

  return out;
}

/** An empty pose object shaped for `samplePose` to fill. */
export function makePoseBuffer() {
  const out = { lift: 0 };
  for (const j of JOINTS) out[j] = [0, 0, 0];
  return out;
}
