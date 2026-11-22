import { U } from './util'
import { Rig } from './rig'
import { Scene } from './scene'
/* ------------------------------------------------------------------
   story.js - the master timeline.
   Everything (body, arms, fingers, keys, cursor, page, camera, captions) is a
   pure function of time t. One clock => perfect sync, pause/seek/replay.
------------------------------------------------------------------- */
export const Story = (() => {
  const { clamp, lerp, sm, ease, seg, hash, frac } = U;
  const G = Scene.G, K = G.kb, M = G.mouse, L = Rig.L;
  const groundY = Rig.groundAnkleY;
  const TWO_PI = Math.PI * 2;

  /* ============ keyboard model ============ */
  const KX = (col) => K.x0 + 9.3 + col * 8.2;
  const KEY_Y = K.top - 5;                       // key-cap top
  const ROWS = ['qwertyuiop', 'asdfghjkl;', 'zxcvbnm,./'];
  const FING_L = [4, 3, 2, 1, 1], FING_R = [1, 1, 2, 3, 4, 4];
  function keyInfo(ch) {
    const c = ch.toLowerCase(); let col = 5;
    if (ch === ' ') return { arm: 0, finger: 0, col: 6 };
    if (ch === 'Enter') return { arm: 0, finger: 4, col: 10 };
    if (ch === 'Tab') return { arm: 1, finger: 4, col: 0 };
    const sp = { ':': 9, '/': 9, '.': 8, '@': 1, '+': 10, '-': 10, ',': 7 };
    if (sp[c] !== undefined) col = sp[c];
    else if ('1234567890'.includes(c)) col = '1234567890'.indexOf(c);
    else for (const r of ROWS) { const i = r.indexOf(c); if (i >= 0) { col = i; break; } }
    return col <= 4 ? { arm: 1, finger: FING_L[col], col } : { arm: 0, finger: FING_R[col - 5], col };
  }
  function typeSeq(text, t0, avg) {
    const ev: any[] = []; let t = t0;
    [...text].forEach((ch, i) => {
      ev.push({ t, ch, ...keyInfo(ch) });
      let dt = avg * (0.72 + 0.65 * hash(i * 3.1 + text.length));
      if (ch === ' ' || ch === '.' || ch === '@' || ch === '/') dt += 0.05;
      t += dt;
    });
    return { ev, end: ev[ev.length - 1].t, next: t };
  }

  /* ============ schedule ============ */
  const URLTXT = 'https://penyzen.com', NAME = 'Hana Bekele', MAIL = 'hana.bekele@example.com', PHONE = '+251 91 234 5678';
  const T: any = { walk0: 0.5, walk1: 5.1, close1: 5.9, chair0: 6.2, chair1: 8.5, stepB0: 6.75, stepB1: 7.35, stepA0: 7.25, stepA1: 7.85, sit0: 7.75, sit1: 9.45, keys0: 9.3 };
  const sUrl = typeSeq(URLTXT, 10.7, 0.13);
  T.enter = sUrl.end + 0.38;
  const evEnter = { t: T.enter, ch: 'Enter', ...keyInfo('Enter') };
  T.mouse0 = T.enter + 0.36; T.mouseOn = T.mouse0 + 0.9;
  T.homeShow = T.enter + 1.0;

  const rects: any = {};    // filled by init()
  const sc: any = { home: [], detail: [] };
  const moves: any[] = [];    // cursor moves
  const clicks: any[] = [];   // {t,id,x,y}
  let sName: any, sMail: any, sPhone: any, evTab1: any, evTab2: any, DUR = 50, ALL_EV: any[][] = [[], []] as any[][];

  function init(r) {
    Object.assign(rects, r);
    const cx = (id) => r[id].x + r[id].w / 2;
    const cyAt = (id, s) => r[id].y + r[id].h / 2 - s;
    const homeS = Math.max(0, r['card-edu'].y - 118);
    const detS = 150;

    let t = T.homeShow;
    // --- home: hover water, health, scroll, edu, click
    const m1 = [t + 0.45, t + 1.35]; moves.push({ t0: m1[0], t1: m1[1], x: cx('card-water'), y: cyAt('card-water', 0) - 10 });
    const m2 = [m1[1] + 0.55, m1[1] + 1.4]; moves.push({ t0: m2[0], t1: m2[1], x: cx('card-health') - 10, y: cyAt('card-health', 0) + 6 });
    const scr = [m2[1] + 0.5, m2[1] + 1.7]; sc.home.push({ t0: scr[0], t1: scr[1], to: homeS });
    T.scrollHome = scr;
    moves.push({ t0: scr[0] + 0.1, t1: scr[1] - 0.1, x: 470, y: 330 });
    const m3 = [scr[1] + 0.3, scr[1] + 1.35]; moves.push({ t0: m3[0], t1: m3[1], x: cx('card-edu') + 14, y: cyAt('card-edu', homeS) + 6 });
    T.tcEdu = m3[1] + 0.5; clicks.push({ t: T.tcEdu, id: 'edu' });
    T.detailShow = T.tcEdu + 0.95;
    // --- detail: read
    const rd = [T.detailShow + 0.55, T.detailShow + 1.5]; moves.push({ t0: rd[0], t1: rd[1], x: 210, y: r['p-read1'].y + 36 });
    const ds = [T.detailShow + 1.9, T.detailShow + 3.0]; sc.detail.push({ t0: ds[0], t1: ds[1], to: detS });
    T.scrollDetail = ds;
    moves.push({ t0: ds[0] + 0.2, t1: ds[1] + 0.3, x: 300, y: r['p-read2'].y + 30 - detS });
    const m5 = [ds[1] + 0.6, ds[1] + 1.7]; moves.push({ t0: m5[0], t1: m5[1], x: cx('btn-donate') + 8, y: cyAt('btn-donate', 0) });
    T.tcDon = m5[1] + 0.45; clicks.push({ t: T.tcDon, id: 'donate' });
    T.formShow = T.tcDon + 0.14;
    T.formKeys0 = T.tcDon + 0.6;
    // --- form typing
    sName = typeSeq(NAME, T.formKeys0 + 1.15, 0.14);
    evTab1 = { t: sName.end + 0.42, ch: 'Tab', ...keyInfo('Tab') };
    sMail = typeSeq(MAIL, evTab1.t + 0.38, 0.115);
    evTab2 = { t: sMail.end + 0.42, ch: 'Tab', ...keyInfo('Tab') };
    sPhone = typeSeq(PHONE, evTab2.t + 0.38, 0.13);
    T.mouse1 = sPhone.end + 0.45;
    const m6 = [T.mouse1 + 0.5, T.mouse1 + 1.55]; moves.push({ t0: m6[0], t1: m6[1], x: cx('btn-confirm') - 12, y: cyAt('btn-confirm', 0) });
    T.tcConf = m6[1] + 0.5; clicks.push({ t: T.tcConf, id: 'confirm' });
    T.success = T.tcConf + 1.3;
    T.cheer0 = T.success + 0.4; T.cheer1 = T.success + 3.3;
    DUR = T.success + 6.4;

    ALL_EV = [[], []] as any[][];
    [...sUrl.ev, evEnter, ...sName.ev, evTab1, ...sMail.ev, evTab2, ...sPhone.ev].forEach(e => ALL_EV[e.arm].push(e));
    ALL_EV.forEach(a => a.sort((p, q) => p.t - q.t));
    moves.sort((a, b) => a.t0 - b.t0);
    return T;
  }

  /* ============ gait ============ */
  const STEP = 165, DUTY = 0.62, R = DUTY * STEP, LIFT = 36;
  const X0 = -190, XE = 615;
  const XOFF = XE - 2 * STEP * 0.53;
  const STAND = { x: 705, y: 512 }, SEAT = { x: G.seat.x, y: G.seat.y };
  const FA = 790, FB = 808;                       // seated foot x (near, far)
  const uOf = (px) => (px - XOFF) / (2 * STEP);
  const stanceAng = (s) => s < 0.3 ? lerp(-0.25, 0, sm(s / 0.3)) : s < 0.6 ? 0 : lerp(0, 0.62, sm((s - 0.6) / 0.4));
  function gaitLeg(i, px) {
    const ph = frac(uOf(px) + 0.5 * i);
    if (ph < DUTY) {
      const s = ph / DUTY, ang = stanceAng(s);
      return { x: px + R - 2 * R * s, y: groundY(ang), ang, ph, st: true };
    }
    const s = (ph - DUTY) / (1 - DUTY), e = s * 0.55 + sm(s) * 0.45, ang = lerp(0.62, -0.25, sm(s));
    return { x: px - R + 2 * R * e, y: groundY(ang) - LIFT * Math.pow(Math.sin(Math.PI * s), 0.9), ang, ph, st: false };
  }
  const walkHipY = (px) => 520 - 6 * Math.cos(4 * Math.PI * (uOf(px) - 0.31));
  function walkX(t) { const tau = seg(t, T.walk0, T.walk1); return lerp(X0, XE, Math.sin(tau * Math.PI / 2)); }
  function walkV(t) { if (t < T.walk0 || t > T.walk1) return 0; const tau = seg(t, T.walk0, T.walk1); return (XE - X0) * (Math.PI / 2) * Math.cos(tau * Math.PI / 2) / (T.walk1 - T.walk0); }
  function swingFoot(from, to, s, lift) {
    const e = sm(s);
    return { x: lerp(from.x, to.x, e), y: lerp(groundY(from.ang), groundY(to.ang), e) - lift * Math.sin(Math.PI * s), ang: lerp(from.ang, to.ang, e) };
  }

  function bodyAt(t) {
    const B: any = { arm: { amp: 0, phase: 0 }, nod: 0.02 };
    if (t < T.walk1) {
      const px = walkX(t), A = gaitLeg(0, px), Bf = gaitLeg(1, px);
      const v = walkV(t);
      B.hip = { x: px, y: walkHipY(px) };
      B.lean = 0.05 + 0.012 * Math.sin(4 * Math.PI * uOf(px));
      B.legs = [A, Bf];
      B.arm = { amp: 0.44 * Math.pow(clamp(v / 170, 0, 1), 0.8), phase: frac(uOf(px)) };
      B.nod = 0.02 + 0.012 * Math.sin(4 * Math.PI * uOf(px) + 1);
      return B;
    }
    const gA = gaitLeg(0, XE), gB = gaitLeg(1, XE);
    // closing step: pelvis glides over the front foot, rear foot swings up beside it
    const cA = seg(t, T.walk1, T.close1 - 0.05);
    const cp = sm(seg(t, T.walk1, T.close1));
    const footA0 = { x: gA.x, y: gA.y, ang: gA.ang };
    const standA = { x: 690, ang: 0 };
    let A = cA < 1 ? swingFoot(footA0, standA, cA, 26) : { x: 690, y: groundY(0), ang: 0 };
    let Bf = { x: gB.x, y: groundY(lerp(gB.ang, 0, cp)), ang: lerp(gB.ang, 0, cp) };
    const hip0 = { x: XE, y: walkHipY(XE) };
    let hip = { x: lerp(hip0.x, STAND.x, cp), y: lerp(hip0.y, STAND.y, cp) };
    let lean = lerp(0.05, 0.03, cp);
    // pre-sit foot steps
    const standB = { x: Bf.x, ang: 0 };
    if (t >= T.stepB0) {
      const s = seg(t, T.stepB0, T.stepB1);
      Bf = swingFoot({ x: standB.x, ang: 0 }, { x: FB, ang: 0 }, s, 24);
    }
    if (t >= T.stepA0) {
      const s = seg(t, T.stepA0, T.stepA1);
      A = swingFoot({ x: 690, ang: 0 }, { x: FA, ang: 0 }, s, 24);
    }
    // sit
    if (t >= T.sit0) {
      const p = ease(seg(t, T.sit0, T.sit1));
      hip = { x: lerp(STAND.x, SEAT.x, p) - 18 * Math.sin(Math.PI * p), y: lerp(STAND.y, SEAT.y, p) };
      lean = lerp(0.03, 0.15, p) + 0.36 * Math.sin(Math.PI * clamp(p * 1.15, 0, 1));
    }
    if (t < T.sit0) { lean += 0.006 * Math.sin(t * 1.7); hip.y += 1.2 * Math.sin(t * 1.7); }
    B.hip = hip; B.lean = lean; B.legs = [A, Bf];
    B.nod = 0.02 + 0.07 * sm(seg(t, T.close1, T.close1 + 0.6)) + 0.04 * sm(seg(t, T.sit1, T.sit1 + 0.8));
    return B;
  }

  /* ============ hand modes ============ */
  const A5 = (...v) => v;
  const C_TYPE = { c1: A5(0.35, 0.30, 0.32, 0.34, 0.38), c2: A5(0.30, 0.45, 0.48, 0.50, 0.52) };
  const C_HANG = { c1: A5(0.25, 0.25, 0.30, 0.34, 0.40), c2: A5(0.20, 0.35, 0.40, 0.45, 0.50) };
  const C_MOUSE = { c1: A5(0.22, 0.34, 0.50, 0.56, 0.62), c2: A5(0.20, 0.45, 0.58, 0.62, 0.72) };
  const C_FIST = { c1: A5(0.55, 1.25, 1.30, 1.35, 1.40), c2: A5(0.50, 1.40, 1.45, 1.50, 1.50) };
  const C_GRIP = { c1: A5(0.40, 0.85, 0.90, 0.95, 1.00), c2: A5(0.40, 1.00, 1.00, 1.00, 1.00) };
  const TYPE_ANG = 0.30, MOUSE_ANG = 0.20;

  const pulse = (dt, pre = 0.07, post = 0.13) => dt < -pre || dt > post ? 0 : dt < 0 ? ease(1 + dt / pre) : 1 - ease(dt / post);
  const keyDown = (dt) => dt >= -0.02 && dt < 0.09 ? 1 : dt >= 0.09 && dt < 0.14 ? 1 - (dt - 0.09) / 0.05 : 0;

  function modeBlend(list, t) {
    let i = list.length - 1; while (i > 0 && t < list[i].t) i--;
    const s = list[i], u = seg(t, s.t, s.t + (s.dur || 0.001));
    if (i === 0 || u >= 1) return [{ mode: s.mode, w: 1 }];
    const w = sm(u); return [{ mode: list[i - 1].mode, w: 1 - w }, { mode: s.mode, w }];
  }
  const NEAR = () => [
    { t: 0, mode: 'walk' }, { t: T.chair0, mode: 'chair', dur: 0.6 }, { t: T.chair1, mode: 'lap', dur: 0.5 },
    { t: T.keys0 + 0.2, mode: 'keys', dur: 0.9 }, { t: T.mouse0, mode: 'mouse', dur: 0.9 },
    { t: T.formKeys0, mode: 'keys', dur: 0.85 }, { t: T.mouse1, mode: 'mouse', dur: 0.85 },
    { t: T.cheer0, mode: 'cheer', dur: 0.55 }, { t: T.cheer1, mode: 'mouse', dur: 0.9 },
  ];
  const FAR = () => [{ t: 0, mode: 'walk' }, { t: T.chair1 - 0.2, mode: 'lap', dur: 0.6 }, { t: T.keys0 + 0.2, mode: 'keys', dur: 0.9 }];
  let NEAR_L: any = null, FAR_L: any = null;

  function cursorAt(t) {
    let x = 450, y = 330;
    for (const m of moves) {
      if (t >= m.t1) { x = m.x; y = m.y; continue; }
      if (t > m.t0) {
        const u = ease(seg(t, m.t0, m.t1)), dx = m.x - x, dy = m.y - y, d = Math.hypot(dx, dy) || 1;
        const arc = Math.sin(Math.PI * u) * Math.min(26, d * 0.07);
        return { x: lerp(x, m.x, u) - dy / d * arc, y: lerp(y, m.y, u) + dx / d * arc };
      }
      break;
    }
    return { x: x + 0.9 * Math.sin(t * 2.1), y: y + 0.7 * Math.sin(t * 1.7 + 1) };
  }
  const mouseDx = (c) => (c.x - 450) * 0.03;

  function clickPulse(t) { let p = 0; for (const c of clicks) p = Math.max(p, pulse(t - c.t, 0.07, 0.14)); return p; }
  function wheelPulse(t) {
    let p = 0;
    for (const s of [T.scrollHome, T.scrollDetail]) {
      if (!s || t < s[0] || t > s[1]) continue;
      const n = 5, ph = seg(t, s[0], s[1]) * n; p = Math.max(p, Math.pow(Math.sin(Math.PI * frac(ph)), 2));
    }
    return p;
  }

  function keysPose(arm, t, S) {
    const evs = ALL_EV[arm];
    const c1 = C_TYPE.c1.slice(), c2 = C_TYPE.c2.slice();
    let e0: any = null, e1: any = null;
    for (let i = 0; i < evs.length; i++) { if (evs[i].t <= t) e0 = evs[i]; else { e1 = evs[i]; break; } }
    let maxP = 0;
    for (const e of evs) {
      const p = pulse(t - e.t, 0.07, 0.13);
      if (p > 0) { c1[e.finger] += 0.30 * p; c2[e.finger] += 0.22 * p; maxP = Math.max(maxP, p); }
    }
    const anchor = (e) => {
      const tr = Rig.tipRel(e.finger, C_TYPE.c1[e.finger] + 0.30, C_TYPE.c2[e.finger] + 0.22, TYPE_ANG);
      return { x: KX(e.col) - tr.x, y: KEY_Y - tr.y };
    };
    const home = anchor({ col: arm ? 2 : 7, finger: arm ? 2 : 2 });
    let w = home;
    if (e0 && e1) {
      const u = ease(seg(t, e0.t + 0.05, e1.t - 0.10)), a = anchor(e0), b = anchor(e1);
      w = { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) };
      if (e1.t - e0.t > 1.1) { const back = sm(seg(t, e0.t + 0.3, e0.t + 0.8)) * (1 - sm(seg(t, e1.t - 0.6, e1.t - 0.1))); w = { x: lerp(w.x, home.x, back), y: lerp(w.y, home.y, back) }; }
    } else if (e0) { const a = anchor(e0), back = sm(seg(t, e0.t + 0.3, e0.t + 0.9)); w = { x: lerp(a.x, home.x, back), y: lerp(a.y, home.y, back) }; }
    else if (e1) { const b = anchor(e1), u = sm(seg(t, e1.t - 0.55, e1.t - 0.1)); w = { x: lerp(home.x, b.x, u), y: lerp(home.y, b.y, u) }; }
    w = { x: w.x, y: w.y - 3.5 * (1 - sm(maxP)) };
    // never let any other fingertip sink into the keys
    let maxY = -1e9;
    for (let f = 1; f <= 4; f++) { const tp = Rig.tipRel(f, c1[f], c2[f], TYPE_ANG); maxY = Math.max(maxY, w.y + tp.y); }
    if (maxY > KEY_Y + 1.5) w.y -= (maxY - KEY_Y - 1.5);
    return { x: w.x, y: w.y, ang: TYPE_ANG, roll: 1, c1, c2 };
  }

  function mousePose(t) {
    const c = cursorAt(t), dx = mouseDx(c);
    const c1 = C_MOUSE.c1.slice(), c2 = C_MOUSE.c2.slice();
    const cp = clickPulse(t), wp = wheelPulse(t);
    c1[1] += 0.20 * cp; c2[1] += 0.14 * cp; c1[2] -= 0.10 * wp; c2[2] -= 0.08 * wp;
    return { x: M.cx + dx - 45, y: 505 + 1.2 * cp, ang: MOUSE_ANG, roll: 1, c1, c2 };
  }

  function modePose(mode, arm, t, ctx): any {
    const S = ctx.S[arm];
    switch (mode) {
      case 'walk': {
        const th = (arm === 0 ? -1 : 1) * ctx.swing.amp * Math.cos(TWO_PI * ctx.swing.phase);
        const reach = 0.90 * (L.upper + L.fore) - 22 * Math.max(0, Math.sin(th));
        return { x: S.x + Math.sin(th) * reach + 2, y: S.y + Math.cos(th) * reach, ang: 1.45 + th * 0.55, roll: -1, c1: C_HANG.c1, c2: C_HANG.c2 };
      }
      case 'chair': return { x: G.seat.x - 48, y: 492, ang: 2.35, roll: -1, c1: C_GRIP.c1, c2: C_GRIP.c2 };
      case 'lap': return { x: ctx.hip.x + 58 + arm * 14, y: ctx.hip.y - 38 + arm * 2, ang: 0.45, roll: 1, c1: C_HANG.c1, c2: C_HANG.c2 };
      case 'keys': return keysPose(arm, t, S);
      case 'mouse': return mousePose(t);
      case 'cheer': {
        const k = seg(t, T.cheer0, T.cheer1), pump = Math.pow(Math.sin(k * Math.PI * 3.5 + 0.2), 2) * (k < 0.9 ? 1 : 0);
        return { x: S.x + 98 + 8 * pump, y: S.y - 70 - 34 * pump, ang: -1.35, roll: -1, c1: C_FIST.c1, c2: C_FIST.c2 };
      }
    }
  }
  function blendPoses(list, arm, t, ctx) {
    let out: any = null;
    for (const { mode, w } of list) {
      const p: any = modePose(mode, arm, t, ctx);
      if (!out) out = { x: 0, y: 0, ang: 0, roll: 0, c1: [0, 0, 0, 0, 0], c2: [0, 0, 0, 0, 0] };
      out.x += p.x * w; out.y += p.y * w; out.ang += p.ang * w; out.roll += p.roll * w;
      for (let i = 0; i < 5; i++) { out.c1[i] += p.c1[i] * w; out.c2[i] += p.c2[i] * w; }
    }
    return out;
  }
  const weightOf = (list, m) => list.reduce((a, b) => a + (b.mode === m ? b.w : 0), 0);

  /* ============ face ============ */
  function blinkAt(t) {
    const k = Math.floor((t - 1.2) / 3.2); let b = 0;
    for (let j = k - 1; j <= k + 1; j++) { const tb = 1.2 + j * 3.2 + hash(j + 2) * 1.4; b = Math.max(b, pulse(t - tb, 0.06, 0.1)); }
    return b;
  }

  /* ============ public pose ============ */
  const SW = { dbg: {} };
  function poseAt(t) {
    if (!NEAR_L) { NEAR_L = NEAR(); FAR_L = FAR(); }
    const B = bodyAt(t);
    const nearBl = modeBlend(NEAR_L, t), farBl = modeBlend(FAR_L, t);
    const sitK = sm(seg(t, T.sit1 - 0.2, T.sit1 + 0.3));
    let lean = B.lean + sitK * (0.17 * weightOf(nearBl, 'mouse')) - 0.09 * weightOf(nearBl, 'cheer') * sitK;
    // lean a bit further while the typing hands are in the air
    const shoulders = [Rig.shoulderPos(B.hip, lean, 0), Rig.shoulderPos(B.hip, lean, 1)];
    const ctx = { S: shoulders, hip: B.hip, swing: B.arm };
    const pN = blendPoses(nearBl, 0, t, ctx), pF = blendPoses(farBl, 1, t, ctx);
    const cur = cursorAt(t);
    const succ = seg(t, T.success + 0.1, T.success + 0.7);
    const smile = 0.18 + 0.82 * sm(succ) * (t < T.success + 5.8 ? 1 : 0.6);
    const nod = B.nod - 0.16 * sm(succ);
    const lookX = clamp((cur.x - 450) / 450, -1, 1), lookY = clamp((cur.y - 280) / 280, -1, 1);
    const pose = {
      hip: B.hip, lean, headRot: lean * 0.45 + nod + (weightOf(nearBl, 'cheer') > 0.2 ? -0.05 : 0),
      legs: B.legs.map(l => ({ ankle: { x: l.x, y: l.y }, ang: l.ang })),
      arms: [pN, pF].map(p => ({ wrist: { x: p.x, y: p.y }, ang: p.ang, roll: p.roll, c1: p.c1, c2: p.c2 })),
    };
    const seated = t > T.sit1;
    const face = { smile, blink: blinkAt(t), brow: 0.8 * sm(succ), gx: seated ? lookX * 1.4 + 0.8 : 0.8, gy: seated ? lookY * 1.2 - 0.2 : 0, tilt: 0.05 * sm(succ) };
    return { pose, face, seated, shadow: { x: B.hip.x, w: 70 } };
  }

  /* ============ screen / cursor / keys ============ */
  const countTyped = (seq, t) => { let n = 0; for (const e of seq.ev) if (e.t <= t) n++; return n; };
  function screenAt(t) {
    const s: any = { t };
    const n1 = countTyped(sUrl, t);
    s.page = t < T.homeShow ? 'newtab' : t < T.detailShow ? 'home' : 'detail';
    s.prev = s.page === 'home' ? 'newtab' : s.page === 'detail' ? 'home' : null;
    s.pageT = t < T.homeShow ? 99 : t < T.detailShow ? t - T.homeShow : t - T.detailShow;
    const L1 = (a, b) => t >= a && t <= b ? ease(seg(t, a, b)) * 0.92 : (t > b ? 1 : -1);
    s.loading = t < T.enter ? -1 : t < T.homeShow ? ease(seg(t, T.enter, T.homeShow)) * 0.95
      : (t >= T.tcEdu + 0.14 && t < T.detailShow) ? ease(seg(t, T.tcEdu + 0.14, T.detailShow)) * 0.95 : -1;
    s.tabTitle = t < T.enter ? 'New Tab' : t < T.homeShow ? 'penyzen.com' : t < T.detailShow ? 'Penyzen – Fund what matters' : 'Books & Desks for Hope Primary…';
    s.url = t < T.enter ? URLTXT.slice(0, n1) : t < T.detailShow ? 'https://penyzen.com' : 'https://penyzen.com/c/books-desks-hope-primary';
    s.urlFocus = t < T.enter + 0.05;
    const lastKey = (() => { let l = -9; for (const e of ALL_EV[0].concat(ALL_EV[1])) if (e.t <= t) l = Math.max(l, e.t); return l; })();
    s.caretOn = (t - lastKey < 0.5) || (Math.floor(t * 2.2) % 2 === 0);
    s.scroll = { home: 0, detail: 0 };
    for (const k of ['home', 'detail']) { let v = 0; for (const m of sc[k]) { if (t >= m.t1) v = m.to; else if (t > m.t0) v = lerp(v, m.to, ease(seg(t, m.t0, m.t1))); } s.scroll[k] = v; }
    s.count = seg(t, T.detailShow + 0.3, T.detailShow + 1.9);
    // cursor
    const c = cursorAt(t);
    const cl = clicks.find(k => t >= k.t - 0.01 && t < k.t + 0.6);
    s.cursor = { x: c.x, y: c.y, vis: t >= T.mouseOn - 0.1, down: clicks.some(k => t >= k.t && t < k.t + 0.14), ripple: cl ? t - cl.t : -1, rx: c.x, ry: c.y };
    if (cl) { const m = clickPos(cl); s.cursor.rx = m.x; s.cursor.ry = m.y; }
    // hover + pressed
    s.hover = null; s.pressed = null;
    const inR = (id, sy) => { const r = rects[id]; return r && c.x >= r.x && c.x <= r.x + r.w && c.y >= r.y - sy && c.y <= r.y + r.h - sy; };
    const modalOn = t >= T.formShow;
    if (s.cursor.vis && !modalOn) {
      if (s.page === 'home') for (const id of ['water', 'health', 'flood', 'women', 'edu', 'trees']) if (inR('card-' + id, s.scroll.home)) s.hover = id;
      if (s.page === 'detail' && inR('btn-donate', 0)) s.hover = 'donate';
    }
    if (s.cursor.vis && t >= T.formShow && t < T.success && inR('btn-confirm', 0) && t > T.mouse1) s.hover = 'confirm';
    for (const k of clicks) if (t >= k.t && t < k.t + 0.17) s.pressed = k.id;
    // modal
    s.modal = t < T.formShow ? 'none' : t < T.success ? 'form' : 'success';
    s.modalT = t < T.success ? t - T.formShow : 9;
    s.submit = t >= T.tcConf + 0.05 && t < T.success;
    s.successT = t >= T.success ? t - T.success : -1;
    const f = { name: NAME.slice(0, countTyped(sName, t)), email: MAIL.slice(0, countTyped(sMail, t)), phone: PHONE.slice(0, countTyped(sPhone, t)), focus: null as any };
    if (t >= T.formShow + 0.2 && t < sPhone.end + 0.5) f.focus = t < evTab1.t ? 'name' : t < evTab2.t ? 'email' : 'phone';
    s.form = f;
    return s;
  }
  function clickPos(cl) {
    // cursor position at click time = last move target before t
    let x = 450, y = 330; for (const m of moves) if (m.t1 <= cl.t + 0.001) { x = m.x; y = m.y; } return { x, y };
  }

  function keyPress(t) {
    const out: any[] = [];
    for (const arm of [0, 1]) for (const e of ALL_EV[arm]) { const a = keyDown(t - e.t); if (a > 0) out.push({ x: KX(e.col), amt: a }); }
    return out;
  }
  function mouseVis(t) {
    const c = cursorAt(t); return { dx: mouseDx(c), down: clickPulse(t) > 0.5 ? 1 : 0 };
  }
  function glow(t) {
    const s = t < T.homeShow ? [200, 205, 235] : t < T.detailShow ? [235, 238, 255] : t < T.success ? [225, 228, 255] : [190, 255, 225];
    return s;
  }

  /* ============ camera + captions ============ */
  const SHOT = { wide: { cx: 800, cy: 450, vw: 1600 }, sit: { cx: 960, cy: 468, vw: 1300 }, desk: { cx: 1120, cy: 445, vw: 1080 }, cheer: { cx: 1090, cy: 440, vw: 1180 } };
  function cameraAt(t) {
    const K = [[0, 'wide'], [T.chair0 - 0.4, 'wide'], [T.sit0 + 0.9, 'sit'], [T.keys0 + 1.3, 'desk'], [T.success - 0.2, 'desk'], [T.success + 1.5, 'cheer'], [DUR, 'cheer']];
    let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++;
    const a = SHOT[K[i][1]], b = SHOT[K[i + 1][1]], u = sm(seg(t, K[i][0], K[i + 1][0]));
    const drift = { x: 6 * Math.sin(t * 0.31), y: 4 * Math.sin(t * 0.23 + 1) };
    return { cx: lerp(a.cx, b.cx, u) + drift.x, cy: lerp(a.cy, b.cy, u) + drift.y, vw: lerp(a.vw, b.vw, u) };
  }
  function chapters() {
    return [
      [0, 'Enter the scene'], [T.walk1 - 1.2, 'Approach the desk'], [T.close1 + 0.2, 'Sit down'], [T.keys0 + 0.8, 'Open the browser'],
      [T.homeShow, 'Explore the homepage'], [T.scrollHome[1] + 0.1, 'Choose a campaign'], [T.detailShow, 'Read the campaign'],
      [T.scrollDetail[1] + 0.5, 'Start donating'], [T.formKeys0, 'Fill in the form'], [T.mouse1, 'Submit'], [T.success, 'Celebrate'],
    ];
  }
  const dur = () => DUR;

  return { init, T, poseAt, screenAt, keyPress, mouseVis, glow, cameraAt, chapters, dur, KX, KEY_Y, moves, clicks };
})();
