// SPDX-FileCopyrightText: 2026 Wonmor and Muhr contributors
// SPDX-License-Identifier: Apache-2.0

/* RFC 9162 Merkle tree (Certificate Transparency v2 style) for the concept demo: leaf and node hashes,
   tree heads, inclusion and consistency proofs, and their verification. Real SHA-256 (the pure-JS digest
   of site/assets/core.js, synchronous, so a 1 000+ entry log builds instantly). Hashes are lowercase hex. */
const sha = (bytes) => globalThis.MuhrCore.shaJs(bytes);

export function toBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function cat(prefix, ...parts) {
  const len = 1 + parts.reduce((n, p) => n + p.length, 0);
  const m = new Uint8Array(len);
  m[0] = prefix;
  let o = 1;
  for (const p of parts) { m.set(p, o); o += p.length; }
  return m;
}
/* leaf hash = SHA-256(0x00 || data), node hash = SHA-256(0x01 || left || right) */
export const leafHash = (dataHex) => sha(cat(0, toBytes(dataHex)));
export const nodeHash = (l, r) => sha(cat(1, toBytes(l), toBytes(r)));
const split = (n) => { let k = 1; while (k * 2 < n) k *= 2; return k; };
const isPow2 = (n) => n > 0 && (n & (n - 1)) === 0;

/* An append-only log. Complete (power-of-two) subtrees are cached, so any tree head is cheap. */
export class Log {
  constructor() { this.leaves = []; this.cache = new Map(); }
  get size() { return this.leaves.length; }
  append(dataHex) { this.leaves.push(leafHash(dataHex)); return this.leaves.length - 1; }
  mth(lo, hi) {
    const n = hi - lo;
    if (n === 0) return sha(new Uint8Array(0));
    if (n === 1) return this.leaves[lo];
    const key = lo + ':' + hi;
    if (isPow2(n) && this.cache.has(key)) return this.cache.get(key);
    const k = split(n);
    const h = nodeHash(this.mth(lo, lo + k), this.mth(lo + k, hi));
    if (isPow2(n)) this.cache.set(key, h);
    return h;
  }
  root(size = this.size) { return this.mth(0, size); }
  /* PATH(m, D[lo:hi]) from RFC 9162 §2.1.3 */
  inclusion(index, size = this.size) {
    const path = [];
    const rec = (m, lo, hi) => {
      const n = hi - lo;
      if (n <= 1) return;
      const k = split(n);
      if (m < k) { rec(m, lo, lo + k); path.push(this.mth(lo + k, hi)); } else { rec(m - k, lo + k, hi); path.push(this.mth(lo, lo + k)); }
    };
    rec(index, 0, size);
    return path;
  }
  /* PROOF(m, D[n]) = SUBPROOF(m, D[n], true), RFC 9162 §2.1.4 */
  consistency(m, n = this.size) {
    const out = [];
    const sub = (mm, lo, hi, b) => {
      const nn = hi - lo;
      if (mm === nn) { if (!b) out.push(this.mth(lo, hi)); return; }
      const k = split(nn);
      if (mm <= k) { sub(mm, lo, lo + k, b); out.push(this.mth(lo + k, hi)); } else { sub(mm - k, lo + k, hi, false); out.push(this.mth(lo, lo + k)); }
    };
    if (m > 0 && m < n) sub(m, 0, n, true);
    return out;
  }
}

/* RFC 9162 §2.1.3 (verify). Returns the recomputed root (or null when the path has the wrong shape). */
export function rootFromInclusion(index, size, leaf, path) {
  if (!(index >= 0 && index < size)) return null;
  let fn = index, sn = size - 1, r = leaf;
  for (const p of path) {
    if (sn === 0) return null;
    if ((fn & 1) === 1 || fn === sn) {
      r = nodeHash(p, r);
      if ((fn & 1) === 0) while ((fn & 1) === 0 && fn !== 0) { fn >>= 1; sn >>= 1; }
    } else r = nodeHash(r, p);
    fn >>= 1; sn >>= 1;
  }
  return sn === 0 ? r : null;
}
export const verifyInclusion = (index, size, leaf, path, root) => rootFromInclusion(index, size, leaf, path) === root;

/* RFC 9162 §2.1.4 (verify) */
export function verifyConsistency(m, n, firstRoot, secondRoot, proof) {
  if (m === n) return proof.length === 0 && firstRoot === secondRoot;
  if (m === 0 || m > n || proof.length === 0) return false;
  const path = isPow2(m) ? [firstRoot, ...proof] : proof.slice();
  let fn = m - 1, sn = n - 1;
  while ((fn & 1) === 1) { fn >>= 1; sn >>= 1; }
  let fr = path[0], sr = path[0];
  for (const c of path.slice(1)) {
    if (sn === 0) return false;
    if ((fn & 1) === 1 || fn === sn) {
      fr = nodeHash(c, fr); sr = nodeHash(c, sr);
      if ((fn & 1) === 0) while ((fn & 1) === 0 && fn !== 0) { fn >>= 1; sn >>= 1; }
    } else sr = nodeHash(sr, c);
    fn >>= 1; sn >>= 1;
  }
  return fr === firstRoot && sr === secondRoot && sn === 0;
}
