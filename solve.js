// Fast reimplementation of makefun-diff 1.0.0's patch, written from the RULES spec.
// Lines are interned to small ids; Myers's greedy search runs on the ids with
// typed V arrays (one snapshot per depth, for traceback), and the patch is
// rendered from the traced edit script.
const KEEP = 0;
const DELETE = 1;
const INSERT = 2;

/** A line as the patch writes it: its op, the line, a newline, and "%" on a line of its own when it had none. */
function written(op, line) {
  return line.endsWith('\n') ? op + line : op + line + '\n%\n';
}

function tokenize(text) {
  const lines = [];
  let start = 0;
  for (;;) {
    const idx = text.indexOf('\n', start);
    if (idx === -1) {
      if (start < text.length) lines.push(text.slice(start));
      break;
    }
    lines.push(text.slice(start, idx + 1));
    start = idx + 1;
  }
  return lines;
}

export function run(input) {
  const a = tokenize(input.old);
  const b = tokenize(input.new);
  const n = a.length;
  const m = b.length;
  const map = new Map();
  const ai = new Int32Array(n);
  const bi = new Int32Array(m);
  for (let i = 0; i < n; i++) {
    let id = map.get(a[i]);
    if (id === undefined) {
      id = map.size;
      map.set(a[i], id);
    }
    ai[i] = id;
  }
  for (let i = 0; i < m; i++) {
    let id = map.get(b[i]);
    if (id === undefined) {
      id = map.size;
      map.set(b[i], id);
    }
    bi[i] = id;
  }
  let prefix = 0;
  while (prefix < n && prefix < m && ai[prefix] === bi[prefix]) prefix++;
  let suffix = 0;
  while (suffix < n - prefix && suffix < m - prefix && ai[n - 1 - suffix] === bi[m - 1 - suffix]) suffix++;
  const N = n - prefix - suffix;
  const M = m - prefix - suffix;
  const ao = prefix;
  const bo = prefix;
  // One V snapshot per depth; each stores x+1 (0 = no path). x never exceeds
  // the old middle length, so 16-bit storage fits while N stays below 65534.
  const VArray = N <= 65534 ? Uint16Array : Int32Array;
  const vs = [];
  let x0 = 0;
  let y0 = 0;
  while (x0 < N && y0 < M && ai[ao + x0] === bi[bo + y0]) {
    x0++;
    y0++;
  }
  vs.push(new VArray([x0 + 1]));
  let D = 0;
  const targetK = N - M;
  if (x0 !== N || y0 !== M) {
    outer: for (let d = 1; d <= N + M; d++) {
      const v = new VArray(2 * d + 1);
      const prev = vs[d - 1];
      // k = -d: insertion only, from the (d-1, -d+1) path.
      {
        const xInsPrevS = prev[0];
        if (xInsPrevS !== 0 && xInsPrevS - 1 - (-d + 1) < M) {
          let x = xInsPrevS - 1;
          let y = x + d;
          while (x < N && y < M && ai[ao + x] === bi[bo + y]) {
            x++;
            y++;
          }
          v[0] = x + 1;
          if (-d === targetK && x === N) {
            D = d;
            vs.push(v);
            break outer;
          }
        }
      }
      let pi = 0;
      let vi = 2;
      let k = -d + 2;
      const kEnd = d - 2;
      // Left region (k < targetK): a deletion is never blocked by the old
      // text's end when its path exists, so only the insertion needs a bound.
      for (; k + 2 < targetK && k + 2 <= kEnd; k += 4, pi += 4, vi += 4) {
        {
          const xDelPrevS = prev[pi];
          const xInsPrevS = prev[pi + 2];
          const canRemove = xDelPrevS !== 0;
          const canAdd = xInsPrevS !== 0 && xInsPrevS - k < M + 2;
          if (canRemove || canAdd) {
            let x;
            if (canRemove && (!canAdd || xDelPrevS >= xInsPrevS - 1)) x = xDelPrevS;
            else x = xInsPrevS - 1;
            let y = x - k;
            while (x < N && y < M && ai[ao + x] === bi[bo + y]) {
              x++;
              y++;
            }
            v[vi] = x + 1;
          }
        }
        {
          const k2 = k + 2;
          const xDelPrevS = prev[pi + 2];
          const xInsPrevS = prev[pi + 4];
          const canRemove = xDelPrevS !== 0;
          const canAdd = xInsPrevS !== 0 && xInsPrevS - k2 < M + 2;
          if (canRemove || canAdd) {
            let x;
            if (canRemove && (!canAdd || xDelPrevS >= xInsPrevS - 1)) x = xDelPrevS;
            else x = xInsPrevS - 1;
            let y = x - k2;
            while (x < N && y < M && ai[ao + x] === bi[bo + y]) {
              x++;
              y++;
            }
            v[vi + 2] = x + 1;
          }
        }
      }
      for (; k < targetK && k <= kEnd; k += 2, pi += 2, vi += 2) {
        const xDelPrevS = prev[pi];
        const xInsPrevS = prev[pi + 2];
        const canRemove = xDelPrevS !== 0;
        const canAdd = xInsPrevS !== 0 && xInsPrevS - k < M + 2;
        if (!canRemove && !canAdd) continue;
        let x;
        if (canRemove && (!canAdd || xDelPrevS >= xInsPrevS - 1)) x = xDelPrevS;
        else x = xInsPrevS - 1;
        let y = x - k;
        while (x < N && y < M && ai[ao + x] === bi[bo + y]) {
          x++;
          y++;
        }
        v[vi] = x + 1;
      }
      // k == targetK: both moves are available when their paths exist.
      if (k === targetK && k <= kEnd) {
        const xDelPrevS = prev[pi];
        const xInsPrevS = prev[pi + 2];
        const canRemove = xDelPrevS !== 0;
        const canAdd = xInsPrevS !== 0;
        if (canRemove || canAdd) {
          let x;
          if (canRemove && (!canAdd || xDelPrevS >= xInsPrevS - 1)) x = xDelPrevS;
          else x = xInsPrevS - 1;
          let y = x - k;
          while (x < N && y < M && ai[ao + x] === bi[bo + y]) {
            x++;
            y++;
          }
          v[vi] = x + 1;
          if (x === N) {
            D = d;
            vs.push(v);
            break outer;
          }
        }
        k += 2;
        pi += 2;
        vi += 2;
      }
      // Right region (k > targetK): an insertion is never blocked by the new
      // text's end when its path exists, so only the deletion needs a bound.
      for (; k + 2 <= kEnd; k += 4, pi += 4, vi += 4) {
        {
          const xDelPrevS = prev[pi];
          const xInsPrevS = prev[pi + 2];
          const canRemove = xDelPrevS !== 0 && xDelPrevS <= N;
          const canAdd = xInsPrevS !== 0;
          if (canRemove || canAdd) {
            let x;
            if (canRemove && (!canAdd || xDelPrevS >= xInsPrevS - 1)) x = xDelPrevS;
            else x = xInsPrevS - 1;
            let y = x - k;
            while (x < N && y < M && ai[ao + x] === bi[bo + y]) {
              x++;
              y++;
            }
            v[vi] = x + 1;
          }
        }
        {
          const k2 = k + 2;
          const xDelPrevS = prev[pi + 2];
          const xInsPrevS = prev[pi + 4];
          const canRemove = xDelPrevS !== 0 && xDelPrevS <= N;
          const canAdd = xInsPrevS !== 0;
          if (canRemove || canAdd) {
            let x;
            if (canRemove && (!canAdd || xDelPrevS >= xInsPrevS - 1)) x = xDelPrevS;
            else x = xInsPrevS - 1;
            let y = x - k2;
            while (x < N && y < M && ai[ao + x] === bi[bo + y]) {
              x++;
              y++;
            }
            v[vi + 2] = x + 1;
          }
        }
      }
      for (; k <= kEnd; k += 2, pi += 2, vi += 2) {
        const xDelPrevS = prev[pi];
        const xInsPrevS = prev[pi + 2];
        const canRemove = xDelPrevS !== 0 && xDelPrevS <= N;
        const canAdd = xInsPrevS !== 0;
        if (!canRemove && !canAdd) continue;
        let x;
        if (canRemove && (!canAdd || xDelPrevS >= xInsPrevS - 1)) x = xDelPrevS;
        else x = xInsPrevS - 1;
        let y = x - k;
        while (x < N && y < M && ai[ao + x] === bi[bo + y]) {
          x++;
          y++;
        }
        v[vi] = x + 1;
      }
      // k = d: deletion only, from the (d-1, d-1) path.
      {
        const xDelPrevS = prev[2 * d - 2];
        if (xDelPrevS !== 0 && xDelPrevS <= N) {
          let x = xDelPrevS;
          let y = x - d;
          while (x < N && y < M && ai[ao + x] === bi[bo + y]) {
            x++;
            y++;
          }
          v[2 * d] = x + 1;
          if (d === targetK && x === N) {
            D = d;
            vs.push(v);
            break outer;
          }
        }
      }
      vs.push(v);
    }
  }

  // Traceback: walk the snapshots back from (N, M), re-applying the same
  // move choice the forward pass made at each depth.
  const ops = [];
  const pushOp = (kind, count) => {
    if (count <= 0) return;
    const last = ops[ops.length - 1];
    if (last !== undefined && last.kind === kind) last.count += count;
    else ops.push({ kind, count });
  };
  let x = N;
  let y = M;
  for (let d = D; d >= 1; d--) {
    const k = x - y;
    const prev = vs[d - 1];
    const off = d - 1;
    const xDelPrevS = prev[k - 1 + off] | 0;
    const xInsPrevS = prev[k + 1 + off] | 0;
    const canRemove = xDelPrevS !== 0 && xDelPrevS - 1 < N;
    const canAdd = xInsPrevS !== 0 && xInsPrevS - 1 - (k + 1) < M;
    if (canRemove && (!canAdd || xDelPrevS >= xInsPrevS - 1)) {
      const xp = xDelPrevS - 1;
      pushOp(KEEP, x - (xp + 1));
      pushOp(DELETE, 1);
      x = xp;
      y = xp - (k - 1);
    } else if (canAdd) {
      const xp = xInsPrevS - 1;
      pushOp(KEEP, x - xp);
      pushOp(INSERT, 1);
      x = xp;
      y = xp - (k + 1);
    } else {
      throw new Error('traceback: no predecessor');
    }
  }
  pushOp(KEEP, x);
  ops.reverse();

  const runs = [];
  if (prefix > 0) runs.push({ kind: KEEP, count: prefix });
  for (const r of ops) runs.push(r);
  if (suffix > 0) runs.push({ kind: KEEP, count: suffix });

  const changes = [];
  let o = 0;
  let p = 0;
  let deleted = 0;
  let inserted = 0;
  for (const r of runs) {
    if (r.kind === KEEP) {
      o += r.count;
      p += r.count;
      continue;
    }
    let c = changes[changes.length - 1];
    if (c === undefined || c.o + c.dels !== o || c.p + c.ins !== p) {
      c = { o, p, dels: 0, ins: 0 };
      changes.push(c);
    }
    if (r.kind === DELETE) {
      c.dels += r.count;
      o += r.count;
      deleted += r.count;
    } else {
      c.ins += r.count;
      p += r.count;
      inserted += r.count;
    }
  }
  const hunks = [];
  for (const c of changes) {
    const h = hunks[hunks.length - 1];
    const prev = h !== undefined ? h[h.length - 1] : undefined;
    if (prev !== undefined && c.o - (prev.o + prev.dels) <= 6) h.push(c);
    else hunks.push([c]);
  }
  const out = [`makefun-diff/1 old=${n} new=${m} hunks=${hunks.length} deleted=${deleted} inserted=${inserted}\n`];
  for (const h of hunks) {
    const first = h[0];
    const last = h[h.length - 1];
    const oldStart = Math.max(0, first.o - 3);
    const newStart = first.p - (first.o - oldStart);
    const after = Math.min(3, n - (last.o + last.dels));
    const oldEnd = last.o + last.dels + after;
    const newEnd = last.p + last.ins + after;
    out.push(`@ ${oldStart + 1} ${oldEnd - oldStart} ${newStart + 1} ${newEnd - newStart}\n`);
    let at = oldStart;
    for (const c of h) {
      for (; at < c.o; at++) out.push(written('=', a[at]));
      for (let i = 0; i < c.dels; i++) out.push(written('-', a[c.o + i]));
      for (let i = 0; i < c.ins; i++) out.push(written('+', b[c.p + i]));
      at = c.o + c.dels;
    }
    for (; at < oldEnd; at++) out.push(written('=', a[at]));
  }
  return out.join('');
}
