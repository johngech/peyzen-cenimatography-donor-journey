/* ------------------------------------------------------------------
   rig.js  -  character skeleton, two-bone IK solver, character renderer
   Everything the character draws is derived from joint positions that the
   solver produces, so limbs can never detach from the body.
------------------------------------------------------------------- */
export const Rig = (() => {
  const L = { thigh: 137, shin: 138, upper: 104, fore: 88, torso: 168 };
  const FLOOR = 790;
  const COL = {
    skin: '#b97d56', skinD: '#9a6442', hair: '#1b1a22',
    sweater: '#1f8a84', sweaterD: '#16675f', sweaterL: '#2fa8a0',
    jeans: '#2c3b66', jeansD: '#222f52', shoe: '#f3efe6', shoeD: '#d9d3c4',
    sole: '#cfc7b5', lace: '#aaa391', line: '#141a2b',
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rot = (p, a) => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) });

  /* Two-bone IK. Returns the joint (elbow/knee) and the end effector. The end
     effector is clamped to the reachable annulus, so the chain stays connected
     even if a target is out of range. bend: +1 / -1 picks the joint side. */
  function ik2(S, T, a, b, bend) {
    const dx = T.x - S.x, dy = T.y - S.y;
    const d = Math.hypot(dx, dy) || 1e-6;
    const dc = clamp(d, Math.abs(a - b) + 0.5, a + b - 0.5);
    const base = Math.atan2(dy, dx);
    const A = Math.acos(clamp((a * a + dc * dc - b * b) / (2 * a * dc), -1, 1));
    const ang = base + bend * A;
    return {
      J: { x: S.x + Math.cos(ang) * a, y: S.y + Math.sin(ang) * a },
      E: { x: S.x + Math.cos(base) * dc, y: S.y + Math.sin(base) * dc },
      reach: d / (a + b),
    };
  }

  /* ankle height that puts the lowest point of the shoe on the floor */
  function groundAnkleY(th) {
    const c = Math.cos(th), s = Math.sin(th);
    return FLOOR - Math.max(-18 * s + 22 * c, 44 * s + 22 * c);
  }

  /* ---------------- hand model ---------------- */
  // 0 thumb, 1 index, 2 middle, 3 ring, 4 pinky.  y is down, hand points +x.
  const FD = [
    { bx: 12, by: 9, a0: 0.75, l: [21, 17], w: 7.4 },
    { bx: 36, by: -7.5, a0: -0.05, l: [25, 20], w: 6.6 },
    { bx: 37, by: -2.8, a0: 0.0, l: [28, 22], w: 6.8 },
    { bx: 36, by: 1.9, a0: 0.04, l: [25, 20], w: 6.4 },
    { bx: 34, by: 6.2, a0: 0.1, l: [19, 16], w: 5.8 },
  ];
  function fingerPts(i, c1, c2) {
    const f = FD[i], a1 = f.a0 + c1, a2 = a1 + c2;
    const p0 = { x: f.bx, y: f.by };
    const p1 = { x: p0.x + Math.cos(a1) * f.l[0], y: p0.y + Math.sin(a1) * f.l[0] };
    const p2 = { x: p1.x + Math.cos(a2) * f.l[1], y: p1.y + Math.sin(a2) * f.l[1] };
    return [p0, p1, p2];
  }
  const tipRel = (i, c1, c2, ang) => rot(fingerPts(i, c1, c2)[2], ang);

  /* ---------------- skeleton ---------------- */
  const shoulderPos = (hip, lean, side) => {
    const u = { x: Math.sin(lean), y: -Math.cos(lean) }, f = { x: Math.cos(lean), y: Math.sin(lean) };
    const fo = side ? -4 : 4;
    return { x: hip.x + u.x * (L.torso - 6) + f.x * fo, y: hip.y + u.y * (L.torso - 6) + f.y * fo - (side ? 2 : 0) };
  };

  /* pose: { hip, lean, headRot, legs:[{ankle,ang},{..}], arms:[{wrist,ang,c1[5],c2[5]},{..}] }
     index 0 = near side (viewer side), 1 = far side */
  function solve(p) {
    const up = { x: Math.sin(p.lean), y: -Math.cos(p.lean) };
    const NB = { x: p.hip.x + up.x * (L.torso + 4), y: p.hip.y + up.y * (L.torso + 4) };
    const hr = p.headRot;
    const hv = { x: 2 * Math.cos(hr) + 62 * Math.sin(hr), y: 2 * Math.sin(hr) - 62 * Math.cos(hr) };
    const head = { x: NB.x + hv.x, y: NB.y + hv.y };
    const sk: any = { hip: p.hip, lean: p.lean, NB, head, headRot: hr, legs: [], arms: [], minReach: 1, maxReach: 0 };
    for (let i = 0; i < 2; i++) {
      const hj = { x: p.hip.x + (i ? -3 : 3), y: p.hip.y };
      const r = ik2(hj, p.legs[i].ankle, L.thigh, L.shin, -1);
      sk.legs.push({ hip: hj, knee: r.J, ankle: r.E, ang: p.legs[i].ang, reach: r.reach });
      const S = shoulderPos(p.hip, p.lean, i);
      const a = p.arms[i];
      const q = ik2(S, a.wrist, L.upper, L.fore, 1);
      sk.arms.push({ S, elbow: q.J, wrist: q.E, ang: a.ang, roll: a.roll, c1: a.c1, c2: a.c2, reach: q.reach, wantReach: Math.hypot(a.wrist.x - S.x, a.wrist.y - S.y) / (L.upper + L.fore) });
    }
    return sk;
  }

  /* ---------------- drawing helpers ---------------- */
  function capPath(ctx: any, p1: any, r1: any, p2: any, r2: any) {
    const th = Math.atan2(p2.y - p1.y, p2.x - p1.x), h = Math.PI / 2;
    ctx.moveTo(p1.x + r1 * Math.cos(th + h), p1.y + r1 * Math.sin(th + h));
    ctx.lineTo(p2.x + r2 * Math.cos(th + h), p2.y + r2 * Math.sin(th + h));
    ctx.arc(p2.x, p2.y, r2, th + h, th - h, true);
    ctx.lineTo(p1.x + r1 * Math.cos(th - h), p1.y + r1 * Math.sin(th - h));
    ctx.arc(p1.x, p1.y, r1, th - h, th + h, true);
    ctx.closePath();
  }
  // outline pass then fill pass => one clean merged silhouette
  function chain(ctx, caps, fill, line = COL.line) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = line; ctx.lineWidth = 3.2;
    ctx.beginPath(); for (const c of caps) capPath(ctx, c[0], c[1], c[2], c[3]); ctx.stroke();
    ctx.fillStyle = fill;
    ctx.beginPath(); for (const c of caps) capPath(ctx, c[0], c[1], c[2], c[3]); ctx.fill();
  }

  function drawHand(ctx, wrist, ang, c1, c2, far, roll) {
    ctx.save(); ctx.translate(wrist.x, wrist.y); ctx.rotate(ang); ctx.scale(1, Math.abs(roll) < 0.05 ? 0.05 : roll);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const skin = far ? COL.skinD : COL.skin;
    const tone = far ? ['#9a6442', '#935d3d', '#9a6442', '#8d5a3b'] : ['#b97d56', '#c28660', '#b97d56', '#ae7350'];
    ctx.beginPath();
    ctx.moveTo(-5, -8); ctx.lineTo(30, -11); ctx.quadraticCurveTo(39, -11, 39, -4);
    ctx.lineTo(38, 9); ctx.quadraticCurveTo(37, 13, 31, 13); ctx.lineTo(6, 10); ctx.lineTo(-5, 7); ctx.closePath();
    ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = COL.line; ctx.lineWidth = 1.8; ctx.stroke();
    for (const i of [1, 2, 3, 4, 0]) {
      const pts = fingerPts(i, c1[i], c2[i]);
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.lineTo(pts[2].x, pts[2].y);
      ctx.strokeStyle = COL.line; ctx.lineWidth = FD[i].w + 2.8; ctx.stroke();
      ctx.strokeStyle = i === 0 ? skin : tone[i - 1]; ctx.lineWidth = FD[i].w; ctx.stroke();
    }
    // re-cover the finger roots so they read as part of the palm
    ctx.beginPath(); ctx.moveTo(24, -9); ctx.lineTo(37, -9); ctx.lineTo(36, 10); ctx.lineTo(24, 10); ctx.closePath();
    ctx.fillStyle = skin; ctx.fill();
    ctx.restore();
  }

  function drawArm(ctx, arm, far) {
    const sl = far ? COL.sweaterD : COL.sweater;
    ctx.save();
    chain(ctx, [[arm.S, 14, arm.elbow, 11.5], [arm.elbow, 11, arm.wrist, 8.6]], sl);
    // cuff
    const th = Math.atan2(arm.wrist.y - arm.elbow.y, arm.wrist.x - arm.elbow.x);
    ctx.save(); ctx.translate(arm.wrist.x, arm.wrist.y); ctx.rotate(th);
    ctx.fillStyle = far ? '#125650' : '#17736c'; ctx.strokeStyle = COL.line; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.roundRect(-9, -10, 12, 20, 4); ctx.fill(); ctx.stroke(); ctx.restore();
    drawHand(ctx, arm.wrist, arm.ang, arm.c1, arm.c2, far, arm.roll);
    ctx.restore();
  }

  function drawFoot(ctx, ankle, ang, far) {
    ctx.save(); ctx.translate(ankle.x, ankle.y); ctx.rotate(ang);
    const up = far ? COL.shoeD : COL.shoe;
    ctx.beginPath();
    ctx.moveTo(-18, 22); ctx.lineTo(44, 22); ctx.quadraticCurveTo(57, 22, 57, 12);
    ctx.quadraticCurveTo(55, 2, 40, 0); ctx.lineTo(16, -4); ctx.quadraticCurveTo(8, -11, -4, -11);
    ctx.lineTo(-15, -11); ctx.quadraticCurveTo(-23, 0, -21, 12); ctx.quadraticCurveTo(-22, 19, -18, 22); ctx.closePath();
    ctx.fillStyle = up; ctx.fill(); ctx.strokeStyle = COL.line; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = COL.sole; ctx.beginPath(); ctx.moveTo(-19, 16); ctx.lineTo(55, 16); ctx.quadraticCurveTo(57, 22, 44, 22);
    ctx.lineTo(-18, 22); ctx.quadraticCurveTo(-22, 19, -19, 16); ctx.fill();
    ctx.strokeStyle = COL.lace; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let i = 0; i < 3; i++) { ctx.moveTo(12 + i * 8, -3 + i * 1.2); ctx.lineTo(18 + i * 8, 3 + i * 1.2); }
    ctx.stroke();
    ctx.restore();
  }

  function drawLeg(ctx, leg, far) {
    const j = far ? COL.jeansD : COL.jeans;
    chain(ctx, [[leg.hip, 25, leg.knee, 19.5], [leg.knee, 18.5, leg.ankle, 12]], j);
    drawFoot(ctx, leg.ankle, leg.ang, far);
  }

  function drawTorso(ctx, sk) {
    ctx.save(); ctx.translate(sk.hip.x, sk.hip.y); ctx.rotate(sk.lean);
    // pelvis cover (jeans) so the hip joint is never exposed
    ctx.fillStyle = COL.jeans; ctx.strokeStyle = COL.line; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(0, 2, 27, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // neck
    ctx.save(); ctx.fillStyle = COL.skinD; ctx.beginPath(); ctx.roundRect(-3, -196, 20, 34, 8); ctx.fill(); ctx.stroke(); ctx.restore();
    const g = ctx.createLinearGradient(-30, 0, 34, 0);
    g.addColorStop(0, COL.sweaterD); g.addColorStop(0.35, COL.sweater); g.addColorStop(1, COL.sweaterL);
    ctx.beginPath();
    ctx.moveTo(-31, 16);
    ctx.bezierCurveTo(-37, -40, -34, -110, -24, -150);
    ctx.bezierCurveTo(-20, -164, -8, -170, 6, -170);
    ctx.bezierCurveTo(22, -170, 30, -160, 33, -140);
    ctx.bezierCurveTo(37, -110, 34, -60, 34, -20);
    ctx.bezierCurveTo(34, 0, 33, 12, 30, 16);
    ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.6; ctx.stroke();
    // hem
    ctx.fillStyle = '#17736c'; ctx.beginPath(); ctx.moveTo(-31, 5); ctx.lineTo(31, 5); ctx.lineTo(30, 16); ctx.lineTo(-31, 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,26,43,.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-31, 5); ctx.lineTo(31, 5); ctx.stroke();
    // crew collar
    ctx.strokeStyle = '#17736c'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-20, -164); ctx.quadraticCurveTo(6, -156, 28, -164); ctx.stroke();
    // soft fold shading
    ctx.strokeStyle = 'rgba(10,50,48,.28)'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(-14, -30); ctx.quadraticCurveTo(0, -42, 20, -34); ctx.stroke();
    ctx.restore();
  }

  function drawHead(ctx, sk, face) {
    ctx.save(); ctx.translate(sk.head.x, sk.head.y); ctx.rotate(sk.headRot + (face.tilt || 0));
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = COL.line; ctx.lineWidth = 2.4;
    // ear (behind face)
    ctx.fillStyle = COL.skinD; ctx.beginPath(); ctx.ellipse(-7, 3, 6.5, 9, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    // face / skull
    ctx.beginPath();
    ctx.moveTo(-30, -4);
    ctx.bezierCurveTo(-32, -38, -2, -42, 18, -36);
    ctx.bezierCurveTo(28, -32, 32, -20, 31, -8);
    ctx.bezierCurveTo(31, -2, 33, 4, 32, 10);
    ctx.bezierCurveTo(31, 22, 27, 28, 24, 30);
    ctx.bezierCurveTo(22, 38, 10, 40, 2, 38);
    ctx.bezierCurveTo(-14, 36, -28, 22, -30, -4);
    ctx.closePath(); ctx.fillStyle = COL.skin; ctx.fill(); ctx.stroke();
    // nose
    ctx.beginPath(); ctx.moveTo(30, -10); ctx.quadraticCurveTo(41, 2, 33, 8); ctx.quadraticCurveTo(31, 8, 30, 6);
    ctx.fillStyle = COL.skin; ctx.fill(); ctx.stroke();
    // blush
    ctx.fillStyle = `rgba(230,100,90,${0.10 + 0.22 * face.smile})`; ctx.beginPath(); ctx.arc(12, 13, 8, 0, 6.283); ctx.fill();
    // hair
    ctx.fillStyle = COL.hair; ctx.beginPath();
    ctx.moveTo(-34, 8); ctx.bezierCurveTo(-42, -34, -10, -52, 20, -42);
    ctx.bezierCurveTo(32, -38, 36, -28, 33, -19); ctx.lineTo(24, -24);
    ctx.bezierCurveTo(12, -31, -4, -26, -14, -12); ctx.lineTo(-20, 6); ctx.bezierCurveTo(-23, 20, -31, 15, -34, 8); ctx.closePath();
    ctx.fill(); ctx.stroke();
    for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + i * 0.13); ctx.beginPath(); ctx.arc(-4 + Math.cos(a) * 33, -8 + Math.sin(a) * 38, 9.5, 0, 6.283); ctx.fill(); }
    ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = Math.PI * (1.05 + i * 0.13); ctx.moveTo(-4 + Math.cos(a) * 33 + 9.5, -8 + Math.sin(a) * 38); ctx.arc(-4 + Math.cos(a) * 33, -8 + Math.sin(a) * 38, 9.5, 0, 6.283); }
    ctx.stroke(); ctx.fillStyle = COL.hair; ctx.beginPath(); ctx.moveTo(-30, -6); ctx.bezierCurveTo(-32, -34, -2, -41, 18, -36); ctx.lineTo(14, -22); ctx.lineTo(-22, -4); ctx.fill();
    // brow
    ctx.strokeStyle = COL.hair; ctx.lineWidth = 2.8;
    const bl = face.brow * -3;
    ctx.beginPath(); ctx.moveTo(11, -16 + bl); ctx.quadraticCurveTo(19, -19.5 + bl, 26, -15 + bl * 0.4); ctx.stroke();
    // eye
    const open = 1 - face.blink;
    ctx.fillStyle = '#16131c'; ctx.beginPath(); ctx.ellipse(19 + face.gx, -6 + face.gy, 3.1, Math.max(0.5, 3.7 * open), 0, 0, 6.283); ctx.fill();
    if (open > 0.4) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(20.2 + face.gx, -7.4 + face.gy, 1.1, 0, 6.283); ctx.fill(); }
    if (face.smile > 0.55) { // happy eye crease
      ctx.strokeStyle = 'rgba(20,26,43,.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(19, 1, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
    // mouth
    const s = face.smile;
    ctx.strokeStyle = '#4a1f1a'; ctx.lineWidth = 2.4;
    const mx = 20, my = 19;
    if (s > 0.7) {
      ctx.fillStyle = '#5a1f1c'; ctx.beginPath(); ctx.moveTo(mx - 7, my - 1.5);
      ctx.quadraticCurveTo(mx + 1, my + 3 + 8 * s, mx + 9, my - 3); ctx.quadraticCurveTo(mx + 1, my - 0.5, mx - 7, my - 1.5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(mx - 5, my - 1); ctx.quadraticCurveTo(mx + 1, my + 0.8, mx + 7, my - 2.5); ctx.lineTo(mx + 6, my - 0.5); ctx.quadraticCurveTo(mx + 1, my + 2, mx - 5, my + 0.5); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(mx - 7, my - 1); ctx.quadraticCurveTo(mx + 1, my + 1 + 7 * s, mx + 9, my - 2 - 2.5 * s); ctx.stroke();
    }
    ctx.restore();
  }

  return { L, FLOOR, COL, ik2, solve, groundAnkleY, shoulderPos, tipRel, fingerPts, drawLeg, drawArm, drawTorso, drawHead, clamp };
})();
