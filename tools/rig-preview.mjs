/**
 * Renders the fitted statue rig to PNG, headlessly.
 *
 *   node tools/rig-preview.mjs [outDir]
 *
 * The rig in src/scene/statueRig.js is fitted to a mesh by measurement, and the
 * only way to know whether the bones landed in the right places is to look at it.
 * This loads the real module, applies poses, and rasterises the result — no
 * browser, no dev server, so the rig stays checkable when neither is available.
 *
 * Kept in the repo because any change to the landmark fractions or the weighting
 * needs re-checking the same way.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { StatueRig, BONES, computeRegions, REGION } from '../src/scene/statueRig.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB = resolve(HERE, '../public/models/dancer.glb');
const OUT = resolve(process.argv[2] ?? resolve(HERE, '../.rig-preview'));
mkdirSync(OUT, { recursive: true });

// ── minimal PNG writer ──────────────────────────────────────────────────────
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (b) => {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const l = Buffer.alloc(4);
  l.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc32(td));
  return Buffer.concat([l, td, c]);
};
function writePNG(path, w, h, gray) {
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    Buffer.from(gray.subarray(y * w, y * w + w)).copy(raw, y * (w + 1) + 1);
  }
  const ih = Buffer.alloc(13);
  ih.writeUInt32BE(w, 0);
  ih.writeUInt32BE(h, 4);
  ih[8] = 8; // 8-bit greyscale
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ih),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

// ── GLB -> BufferGeometry (no GLTFLoader: it wants a DOM) ───────────────────
const buf = readFileSync(GLB);
let off = 12;
let json = null;
let bin = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off);
  const type = buf.readUInt32LE(off + 4);
  const d = buf.subarray(off + 8, off + 8 + len);
  if (type === 0x4e4f534a) json = JSON.parse(d.toString('utf8'));
  else bin = d;
  off += 8 + len + ((4 - (len % 4)) % 4);
}
const COMP = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NUM = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const read = (i) => {
  const a = json.accessors[i];
  const bv = json.bufferViews[a.bufferView];
  return new COMP[a.componentType](
    bin.buffer,
    bin.byteOffset + (bv.byteOffset ?? 0) + (a.byteOffset ?? 0),
    a.count * NUM[a.type],
  );
};
const prim = json.meshes[0].primitives[0];
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(read(prim.attributes.POSITION)), 3));
geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(read(prim.attributes.NORMAL)), 3));
geo.setIndex(new THREE.BufferAttribute(new Uint32Array(read(prim.indices)), 1));

const rig = new StatueRig(geo, 1.68);

console.log('crown height:', rig.height, ' verts:', geo.attributes.position.count);
console.log('\nbone heads:');
BONES.forEach((b, i) => {
  const h = rig.boneHead[i];
  console.log(`  ${b.name.padEnd(11)} (${h.x.toFixed(3)}, ${h.y.toFixed(3)}, ${h.z.toFixed(3)})`);
});
console.log('\nhand tips  L', rig.handTipL.toArray().map((v) => +v.toFixed(3)),
  ' R', rig.handTipR.toArray().map((v) => +v.toFixed(3)));

const counts = new Array(BONES.length).fill(0);
for (let i = 0; i < geo.attributes.position.count; i++) counts[rig.boneIndex[i * 2]]++;
console.log('\nprimary-bone vertex counts:');
BONES.forEach((b, i) => console.log(`  ${b.name.padEnd(11)} ${counts[i]}`));

// ── orthographic rasteriser ─────────────────────────────────────────────────
/**
 * Region map: each costume region rendered as a flat grey, so the segmentation
 * can be checked independently of the shading.
 * skirt = darkest, kebaya = mid, skin = light, hair = near black.
 */
function renderRegions(name, regions, yaw, W = 300, H = 470) {
  const TONE = { [REGION.SKIRT]: 90, [REGION.KEBAYA]: 150, [REGION.SKIN]: 215, [REGION.HAIR]: 40 };
  const pos = geo.attributes.position;
  const idx = geo.index;
  const g = Buffer.alloc(W * H, 250);
  const zb = new Float32Array(W * H).fill(Infinity);
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const span = 1.2, ctrY = 0.92;
  const proj = (x, y, z) => {
    const rx = x * cy + z * sy, rz = -x * sy + z * cy;
    return [W / 2 + (rx / span) * (W / 2), H / 2 - ((y - ctrY) / span) * (W / 2), rz];
  };

  for (let t = 0; t < idx.count / 3; t++) {
    const ia = idx.getX(t * 3), ib = idx.getX(t * 3 + 1), ic = idx.getX(t * 3 + 2);
    const A = proj(pos.getX(ia), pos.getY(ia), pos.getZ(ia));
    const B = proj(pos.getX(ib), pos.getY(ib), pos.getZ(ib));
    const C = proj(pos.getX(ic), pos.getY(ic), pos.getZ(ic));
    const tally = {};
    for (const v of [ia, ib, ic]) tally[regions[v]] = (tally[regions[v]] || 0) + 1;
    const r = +Object.keys(tally).reduce((a, b) => (tally[b] > tally[a] ? b : a));
    const shade = TONE[r];

    const minX = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0])));
    const maxX = Math.min(W - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
    const minY = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1])));
    const maxY = Math.min(H - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
    const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
    if (Math.abs(d) < 1e-9) continue;
    for (let py = minY; py <= maxY; py++) for (let px = minX; px <= maxX; px++) {
      const w0 = ((B[1] - C[1]) * (px + 0.5 - C[0]) + (C[0] - B[0]) * (py + 0.5 - C[1])) / d;
      const w1 = ((C[1] - A[1]) * (px + 0.5 - C[0]) + (A[0] - C[0]) * (py + 0.5 - C[1])) / d;
      if (w0 < 0 || w1 < 0 || 1 - w0 - w1 < 0) continue;
      const z = w0 * A[2] + w1 * B[2] + (1 - w0 - w1) * C[2];
      const o = py * W + px;
      if (z < zb[o]) { zb[o] = z; g[o] = shade; }
    }
  }
  writePNG(`${OUT}/${name}.png`, W, H, g);
  console.log('wrote', `${OUT}/${name}.png`);
}

function render(name, yaw, W = 300, H = 470) {
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const idx = geo.index;
  const g = Buffer.alloc(W * H, 245);
  const zb = new Float32Array(W * H).fill(Infinity);
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const L = new THREE.Vector3(-0.5, 0.62, 0.6).normalize();
  const span = 1.2;
  const ctrY = 0.92;

  const proj = (x, y, z) => {
    const rx = x * cy + z * sy;
    const rz = -x * sy + z * cy;
    return [W / 2 + (rx / span) * (W / 2), H / 2 - ((y - ctrY) / span) * (W / 2), rz];
  };

  for (let t = 0; t < idx.count / 3; t++) {
    const ia = idx.getX(t * 3), ib = idx.getX(t * 3 + 1), ic = idx.getX(t * 3 + 2);
    const A = proj(pos.getX(ia), pos.getY(ia), pos.getZ(ia));
    const B = proj(pos.getX(ib), pos.getY(ib), pos.getZ(ib));
    const C = proj(pos.getX(ic), pos.getY(ic), pos.getZ(ic));
    const nx = (nrm.getX(ia) + nrm.getX(ib) + nrm.getX(ic)) / 3;
    const ny = (nrm.getY(ia) + nrm.getY(ib) + nrm.getY(ic)) / 3;
    const nz = (nrm.getZ(ia) + nrm.getZ(ib) + nrm.getZ(ic)) / 3;
    const rnx = nx * cy + nz * sy;
    const rnz = -nx * sy + nz * cy;
    const m = Math.hypot(rnx, ny, rnz) || 1;
    const sh = Math.max(0, (rnx * L.x + ny * L.y + rnz * L.z) / m);
    const shade = Math.round(28 + Math.pow(sh, 0.75) * 185);

    const minX = Math.max(0, Math.floor(Math.min(A[0], B[0], C[0])));
    const maxX = Math.min(W - 1, Math.ceil(Math.max(A[0], B[0], C[0])));
    const minY = Math.max(0, Math.floor(Math.min(A[1], B[1], C[1])));
    const maxY = Math.min(H - 1, Math.ceil(Math.max(A[1], B[1], C[1])));
    const d = (B[1] - C[1]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[1] - C[1]);
    if (Math.abs(d) < 1e-9) continue;

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const w0 = ((B[1] - C[1]) * (px + 0.5 - C[0]) + (C[0] - B[0]) * (py + 0.5 - C[1])) / d;
        const w1 = ((C[1] - A[1]) * (px + 0.5 - C[0]) + (A[0] - C[0]) * (py + 0.5 - C[1])) / d;
        if (w0 < 0 || w1 < 0 || 1 - w0 - w1 < 0) continue;
        const z = w0 * A[2] + w1 * B[2] + (1 - w0 - w1) * C[2];
        const o = py * W + px;
        if (z < zb[o]) { zb[o] = z; g[o] = shade; }
      }
    }
  }
  writePNG(`${OUT}/${name}.png`, W, H, g);
  console.log('wrote', `${OUT}/${name}.png`);
}

const D = Math.PI / 180;
const zero = Object.fromEntries(BONES.map((b) => [b.name, [0, 0, 0]]));

rig.apply(zero);
render('rig-rest', 0);

const regions = computeRegions(rig);
const tally = {};
for (const r of regions) tally[r] = (tally[r] || 0) + 1;
console.log('\nregion vertex counts:', JSON.stringify(tally),
  '(0=skirt 1=kebaya 2=skin 3=hair)');
renderRegions('rig-regions', regions, 0);
renderRegions('rig-regions-3q', regions, -Math.PI / 5);

rig.apply({
  ...zero,
  hips: [0, 8 * D, 0],
  chest: [0, 16 * D, 0],
  head: [0, -12 * D, 0],
  upperArmL: [0, 0, -38 * D],
  forearmL: [0, 0, -22 * D],
  upperArmR: [0, 0, 30 * D],
  forearmR: [-25 * D, 0, 0],
});
render('rig-swung', 0);
render('rig-swung-3q', -Math.PI / 5);
