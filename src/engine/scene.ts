/* ------------------------------------------------------------------
   scene.js  -  the home-office: room, desk, chair, keyboard, mouse.
   World units are stage pixels (1600 x 900). Floor is y = 790.
------------------------------------------------------------------- */
export const Scene = (() => {
  const G = {
    floor: 790, deskTop: 545, deskEdge: 785,
    kb: { x0: 822, x1: 918, top: 533 },
    mouse: { cx: 964, top: 523 },
    mon: { x: 1070, y: 178, w: 510, h: 340 },
    seat: { x: 690, y: 628 },
  };
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

  function drawRoom(ctx, env) {
    // wall
    let g = ctx.createLinearGradient(0, -400, 0, 790);
    g.addColorStop(0, '#dfe6ea'); g.addColorStop(1, '#c3cfd6');
    ctx.fillStyle = g; ctx.fillRect(-1400, -900, 4600, 1700);
    // lower wall panel
    ctx.fillStyle = '#b6c4cc'; ctx.fillRect(-1400, 640, 4600, 150);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-1400, 638, 4600, 3);
    for (let x = -1400; x < 3200; x += 120) { ctx.fillStyle = 'rgba(40,60,80,.06)'; ctx.fillRect(x, 641, 3, 149); }
    // baseboard + floor
    ctx.fillStyle = '#f2f5f7'; ctx.fillRect(-1400, 764, 4600, 26);
    ctx.fillStyle = 'rgba(20,30,50,.18)'; ctx.fillRect(-1400, 788, 4600, 2);
    g = ctx.createLinearGradient(0, 790, 0, 1100);
    g.addColorStop(0, '#b88a5c'); g.addColorStop(1, '#8f6540');
    ctx.fillStyle = g; ctx.fillRect(-1400, 790, 4600, 400);
    ctx.strokeStyle = 'rgba(60,30,10,.22)'; ctx.lineWidth = 1.5;
    for (let y = 812, k = 0; y < 1000; y += 22 + k * 4, k++) { ctx.beginPath(); ctx.moveTo(-1400, y); ctx.lineTo(3200, y); ctx.stroke(); }
    for (let x = -1400; x < 3200; x += 260) { for (let y = 790, r = 0; y < 1000; y += 22 + r * 4, r++) { const o = ((r * 97) % 260); ctx.beginPath(); ctx.moveTo(x + o, y); ctx.lineTo(x + o, y + 22 + r * 4); ctx.stroke(); } }

    // window
    const wx = 230, wy = 140, ww = 330, wh = 330;
    ctx.fillStyle = '#f7f9fa'; rr(ctx, wx - 14, wy - 14, ww + 28, wh + 28, 6); ctx.fill();
    g = ctx.createLinearGradient(0, wy, 0, wy + wh);
    g.addColorStop(0, '#7db4e2'); g.addColorStop(0.65, '#f4cf9d'); g.addColorStop(1, '#f7b987');
    ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh);
    ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
    ctx.fillStyle = '#6d7fa8'; [[0, 70, 36], [38, 40, 30], [70, 96, 28], [102, 58, 34], [140, 82, 30], [172, 50, 38], [212, 90, 32], [246, 62, 30], [278, 74, 40]].forEach(([x, h, w]) => ctx.fillRect(wx + x, wy + wh - h, w, h));
    ctx.fillStyle = '#566a97'; [[18, 50, 30], [60, 34, 34], [120, 56, 30], [190, 40, 34], [238, 52, 36]].forEach(([x, h, w]) => ctx.fillRect(wx + x, wy + wh - h, w, h));
    ctx.fillStyle = 'rgba(255,238,200,.9)'; ctx.beginPath(); ctx.arc(wx + 238, wy + 200, 26, 0, 6.283); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#f7f9fa'; ctx.fillRect(wx + ww / 2 - 4, wy, 8, wh); ctx.fillRect(wx, wy + wh / 2 - 4, ww, 8);
    ctx.fillStyle = '#e6ebee'; ctx.fillRect(wx - 22, wy + wh + 12, ww + 44, 12);
    // curtains
    ctx.fillStyle = '#7a9ea3';
    ctx.beginPath(); ctx.moveTo(wx - 50, wy - 30); ctx.lineTo(wx + 26, wy - 30); ctx.quadraticCurveTo(wx + 40, wy + 200, wx + 16, wy + wh + 40); ctx.lineTo(wx - 50, wy + wh + 40); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(wx + ww + 50, wy - 30); ctx.lineTo(wx + ww - 26, wy - 30); ctx.quadraticCurveTo(wx + ww - 40, wy + 200, wx + ww - 16, wy + wh + 40); ctx.lineTo(wx + ww + 50, wy + wh + 40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,50,60,.25)'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(wx - 40 + i * 16, wy - 20); ctx.lineTo(wx - 40 + i * 16 + 4, wy + wh + 30); ctx.stroke(); ctx.beginPath(); ctx.moveTo(wx + ww + 40 - i * 16, wy - 20); ctx.lineTo(wx + ww + 40 - i * 16 - 4, wy + wh + 30); ctx.stroke(); }
    // warm light on the floor
    g = ctx.createLinearGradient(300, 790, 520, 960); g.addColorStop(0, 'rgba(255,214,150,.45)'); g.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(230, 790); ctx.lineTo(580, 790); ctx.lineTo(760, 1010); ctx.lineTo(330, 1010); ctx.closePath(); ctx.fill();

    // floor lamp
    ctx.fillStyle = '#2a2d38'; ctx.beginPath(); ctx.ellipse(468, 786, 40, 7, 0, 0, 6.283); ctx.fill();
    ctx.fillRect(465, 340, 6, 446);
    g = ctx.createRadialGradient(468, 320, 10, 468, 320, 260); g.addColorStop(0, 'rgba(255,214,140,.38)'); g.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = g; ctx.fillRect(208, 60, 520, 520);
    ctx.fillStyle = '#f6dca8'; ctx.beginPath(); ctx.moveTo(430, 340); ctx.lineTo(506, 340); ctx.lineTo(526, 262); ctx.lineTo(410, 262); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(80,50,10,.35)'; ctx.lineWidth = 2; ctx.stroke();

    // wall art
    ctx.fillStyle = '#fbfcfd'; rr(ctx, 560, 214, 118, 150, 4); ctx.fill();
    ctx.strokeStyle = '#8b97a1'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#f3c88f'; ctx.fillRect(574, 228, 90, 122);
    ctx.fillStyle = '#e46a4e'; ctx.beginPath(); ctx.arc(619, 280, 24, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#2f6f73'; ctx.beginPath(); ctx.moveTo(574, 350); ctx.lineTo(604, 306); ctx.lineTo(630, 336); ctx.lineTo(650, 316); ctx.lineTo(664, 350); ctx.closePath(); ctx.fill();

    // shelf with books + plant
    ctx.fillStyle = '#9a6b42'; ctx.fillRect(1090, 128, 470, 10);
    const bk = ['#e46a4e', '#2f6f73', '#f0b94a', '#4338ca', '#7aa6a0', '#d64b73'];
    let bx = 1110; bk.forEach((c, i) => { const h = 52 + (i * 13) % 22, w = 16 + (i * 5) % 8; ctx.fillStyle = c; ctx.fillRect(bx, 128 - h, w, h); bx += w + 2; });
    ctx.fillStyle = '#c9794f'; ctx.beginPath(); ctx.moveTo(1420, 128); ctx.lineTo(1500, 128); ctx.lineTo(1490, 92); ctx.lineTo(1430, 92); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3f8a5e'; [[-26, -30], [0, -46], [24, -28], [-12, -22], [12, -36]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(1460 + dx, 90 + dy, 12, 26, dx * 0.03, 0, 6.283); ctx.fill(); });

    // desk
    ctx.fillStyle = 'rgba(30,40,60,.22)'; ctx.fillRect(1012, 567, 548, 223);
    ctx.fillStyle = '#d9dde2'; rr(ctx, 1330, 580, 230, 210, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(30,40,60,.3)'; ctx.lineWidth = 2; ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(30,40,60,.3)'; ctx.strokeRect(1342, 592 + i * 62, 206, 54); ctx.fillStyle = '#8b97a1'; ctx.fillRect(1430, 612 + i * 62, 50, 6); }
    ctx.fillStyle = '#b07b49'; ctx.fillRect(1000, 567, 12, 223); ctx.fillRect(1560, 567, 14, 223);
    g = ctx.createLinearGradient(0, 545, 0, 567); g.addColorStop(0, '#d29a62'); g.addColorStop(1, '#a8743f');
    ctx.fillStyle = g; ctx.fillRect(G.deskEdge, 545, 860, 22);
    ctx.fillStyle = '#e4b784'; ctx.fillRect(G.deskEdge, 545, 860, 3);
    ctx.fillStyle = 'rgba(20,30,50,.25)'; ctx.fillRect(G.deskEdge, 567, 860, 5);

    // monitor glow on wall/desk
    const c = env.glow;
    g = ctx.createRadialGradient(1325, 340, 40, 1325, 340, 560);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},.20)`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = g; ctx.fillRect(700, -100, 1000, 900);
    // monitor stand
    ctx.fillStyle = '#2b2e38'; ctx.fillRect(1296, 500, 58, 40);
    ctx.fillStyle = '#3a3e4b'; ctx.fillRect(1296, 500, 14, 40);
    rr(ctx, 1262, 536, 126, 9, 4); ctx.fillStyle = '#2b2e38'; ctx.fill();
    // mug
    ctx.fillStyle = '#e46a4e'; rr(ctx, 1030, 518, 26, 27, 4); ctx.fill();
    ctx.strokeStyle = '#e46a4e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(1058, 531, 7, -1.2, 1.2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; const st = env.t * 1.4;
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(1038 + i * 10, 514); ctx.bezierCurveTo(1034 + i * 10 + Math.sin(st + i) * 4, 504, 1044 + i * 10 - Math.sin(st + i) * 4, 498, 1040 + i * 10, 488); ctx.stroke(); }
  }

  function drawRug(ctx) {
    ctx.fillStyle = '#2f3b5e'; ctx.beginPath(); ctx.ellipse(720, 804, 330, 15, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#e8c27a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(720, 804, 312, 11, 0, 0, 6.283); ctx.stroke();
  }

  function drawShadow(ctx, x, w, a) {
    ctx.fillStyle = `rgba(15,20,35,${a})`; ctx.beginPath(); ctx.ellipse(x, 800, w, 11, 0, 0, 6.283); ctx.fill();
  }

  function drawChair(ctx) {
    const hx = G.seat.x, sy = G.seat.y + 20;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = '#1d212c'; ctx.lineWidth = 3;
    // base + wheels
    ctx.fillStyle = '#272b37';
    ctx.beginPath(); ctx.moveTo(hx - 8, 742); ctx.lineTo(hx + 8, 742); ctx.lineTo(hx + 82, 778); ctx.lineTo(hx + 74, 783); ctx.lineTo(hx, 760); ctx.lineTo(hx - 74, 783); ctx.lineTo(hx - 82, 778); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1b1e28';[-76, -34, 34, 76].forEach(dx => { ctx.beginPath(); ctx.arc(hx + dx, 782, 8, 0, 6.283); ctx.fill(); });
    // gas column
    ctx.fillStyle = '#3c4152'; ctx.fillRect(hx - 6, sy + 20, 12, 724 - sy - 2); ctx.strokeRect(hx - 6, sy + 20, 12, 724 - sy - 2);
    // backrest
    const g = ctx.createLinearGradient(hx - 80, 0, hx - 30, 0); g.addColorStop(0, '#2a2f3c'); g.addColorStop(1, '#3d4456');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(hx - 40, sy - 2); ctx.quadraticCurveTo(hx - 52, sy - 90, hx - 66, 470); ctx.quadraticCurveTo(hx - 56, 452, hx - 42, 460);
    ctx.quadraticCurveTo(hx - 24, sy - 100, hx - 12, sy - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#272b37'; ctx.fillRect(hx - 34, sy - 2, 12, 22);
    // seat
    ctx.fillStyle = '#3d4456'; rr(ctx, hx - 62, sy - 6, 148, 28, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.08)'; rr(ctx, hx - 54, sy - 4, 130, 7, 4); ctx.fill();
  }

  /* press: array of {x, amt} for keys currently down */
  function drawKeyboard(ctx, press) {
    const k = G.kb;
    ctx.save();
    ctx.fillStyle = '#2a2e3a'; ctx.strokeStyle = '#161922'; ctx.lineWidth = 2;
    rr(ctx, k.x0, k.top, k.x1 - k.x0, 12, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(k.x0 + 3, k.top + 1.5, k.x1 - k.x0 - 6, 1.5);
    for (let i = 0; i < 11; i++) {
      const x = k.x0 + 6 + i * 8.2; let amt = 0;
      for (const p of press) { if (Math.abs(p.x - (x + 3.3)) < 4.3) amt = Math.max(amt, p.amt); }
      ctx.fillStyle = amt > 0.1 ? '#8fd6ff' : '#e9edf4';
      ctx.fillRect(x, k.top - 5 + amt * 2.6, 6.6, 5 - amt * 1.2);
      if (amt > 0.1) { ctx.fillStyle = 'rgba(143,214,255,.28)'; ctx.fillRect(x - 3, k.top - 10, 13, 10); }
    }
    ctx.restore();
  }

  function drawMouse(ctx, dx, dz, down) {
    const m = G.mouse, cx = m.cx + dx, base = 545 - dz * 0.0;
    ctx.save();
    ctx.fillStyle = '#3a4150'; ctx.beginPath(); ctx.ellipse(m.cx + dx * 0.2 + 2, 545.5, 50, 3.4, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#e8ebf3'; ctx.strokeStyle = '#161922'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 24, base); ctx.bezierCurveTo(cx - 24, base - 17, cx - 12, base - 22, cx, base - 22);
    ctx.bezierCurveTo(cx + 16, base - 22, cx + 24, base - 12, cx + 24, base); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(22,25,34,.55)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx + 2, base - 22); ctx.lineTo(cx + 3, base - 10); ctx.stroke();
    if (down > 0.05) { ctx.fillStyle = `rgba(80,90,120,${0.35 * down})`; ctx.beginPath(); ctx.moveTo(cx + 3, base - 22); ctx.bezierCurveTo(cx + 16, base - 22, cx + 24, base - 12, cx + 24, base - 7); ctx.lineTo(cx + 3, base - 9); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#4338ca'; rr(ctx, cx - 6, base - 21, 5, 7, 2); ctx.fill();
    ctx.restore();
  }

  return { G, drawRoom, drawRug, drawShadow, drawChair, drawKeyboard, drawMouse };
})();
