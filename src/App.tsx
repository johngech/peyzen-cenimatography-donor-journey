import { useCallback, useEffect, useRef, useState } from 'react'
import { Rig } from './engine/rig'
import { Scene } from './engine/scene'
import { Story } from './engine/story'
import SiteScreen, { measureSite } from './components/SiteScreen'

const MON = Scene.G.mon
const MON_W = 944, MON_H = 629, MK = MON.w / MON_W, ANGLE = -8

const BLANK = {
  t: 0, page: 'newtab', prev: null, pageT: 99, loading: -1, tabTitle: 'New Tab', url: '', urlFocus: true, caretOn: true,
  scroll: { home: 0, detail: 0 }, count: 0, cursor: { x: 450, y: 330, vis: false, down: false, ripple: -1, rx: 0, ry: 0 },
  hover: null, pressed: null, modal: 'none', modalT: 0, submit: false, successT: -1, form: { name: '', email: '', phone: '', focus: null },
}

export default function App() {
  const stage = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const mon = useRef<HTMLDivElement>(null)
  const screenEl = useRef<HTMLDivElement>(null)
  const st = useRef({ t: 0, playing: false, ready: false, last: 0, W: 0, H: 0, dpr: 1 })
  const [screen, setScreen] = useState<any>(BLANK)
  const [ui, setUi] = useState({ t: 0, playing: false, started: false, caption: '', dur: 47 })

  const resize = useCallback(() => {
    const r = stage.current!.getBoundingClientRect(), c = cv.current!, s = st.current
    s.W = r.width; s.H = r.height; s.dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = Math.round(s.W * s.dpr); c.height = Math.round(s.H * s.dpr)
  }, [])

  const draw = useCallback((t: number) => {
    const s = st.current, ctx = cv.current!.getContext('2d')!
    const cam = Story.cameraAt(t), k = Math.min(s.W / cam.vw, s.H / ((cam.vw * 9) / 16))
    const tx = s.W / 2 - k * cam.cx, ty = s.H / 2 - k * cam.cy
    ctx.setTransform(s.dpr * k, 0, 0, s.dpr * k, s.dpr * tx, s.dpr * ty)
    const P = Story.poseAt(t), sk = Rig.solve(P.pose), mv = Story.mouseVis(t)
    Scene.drawRoom(ctx, { glow: Story.glow(t), t })
    Scene.drawRug(ctx); Scene.drawChair(ctx); Scene.drawShadow(ctx, P.shadow.x, 90, 0.28)
    Scene.drawKeyboard(ctx, Story.keyPress(t)); Scene.drawMouse(ctx, mv.dx, 0, mv.down)
    Rig.drawLeg(ctx, sk.legs[1], true); Rig.drawArm(ctx, sk.arms[1], true)
    Rig.drawLeg(ctx, sk.legs[0], false); Rig.drawTorso(ctx, sk); Rig.drawHead(ctx, sk, P.face); Rig.drawArm(ctx, sk.arms[0], false)
    mon.current!.style.transform =
      `translate(${MON.x * k + tx}px,${MON.y * k + ty}px) scale(${k * MK}) translate(${MON_W / 2}px,${MON_H / 2}px) perspective(1500px) rotateY(${ANGLE}deg) translate(${-MON_W / 2}px,${-MON_H / 2}px)`
    setScreen(Story.screenAt(t))
    let caption = ''
    for (const [ct, text] of Story.chapters()) if (t >= ct) caption = text as string
    setUi(u => ({ ...u, t, caption: t > 0.3 ? caption : '', dur: Story.dur() }))
  }, [])

  useEffect(() => {
    let raf = 0
    const loop = (now: number) => {
      const s = st.current
      if (s.playing) { s.t += (now - s.last) / 1000; if (s.t >= Story.dur()) { s.t = Story.dur(); s.playing = false; setUi(u => ({ ...u, playing: false })) } }
      s.last = now
      if (s.ready && (s.playing || (loop as any).dirty)) { draw(s.t); (loop as any).dirty = s.playing }
      raf = requestAnimationFrame(loop)
    }
    const boot = () => {
      resize(); Story.init(measureSite(screenEl.current!)); st.current.ready = true; (loop as any).dirty = true
      raf = requestAnimationFrame(loop)
    }
    ;(document.fonts ? document.fonts.ready : Promise.resolve()).then(boot)
    const onResize = () => { resize(); (loop as any).dirty = true }
    window.addEventListener('resize', onResize)
    ;(window as any).__seek = (t: number) => { st.current.t = t; st.current.playing = false; draw(t) }
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [draw, resize])

  const play = () => { const s = st.current; if (s.t >= Story.dur()) s.t = 0; s.playing = true; setUi(u => ({ ...u, playing: true, started: true })) }
  const toggle = () => { if (!ui.started || st.current.t >= Story.dur()) return play(); st.current.playing = !st.current.playing; setUi(u => ({ ...u, playing: st.current.playing })) }
  const replay = () => { st.current.t = 0; play() }
  const seek = (v: number) => { st.current.t = (v / 1000) * Story.dur(); draw(st.current.t); setUi(u => ({ ...u, started: true })) }

  const ended = ui.t >= ui.dur
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div ref={stage} className="relative aspect-video w-full max-w-[min(1600px,calc((100vh-40px)*16/9))] overflow-hidden rounded-2xl bg-black shadow-2xl after:pointer-events-none after:absolute after:inset-0 after:shadow-[inset_0_0_140px_rgba(0,0,0,.45)] max-[700px]:aspect-[3/4]">
        <canvas ref={cv} className="absolute inset-0 h-full w-full" />
        <div ref={mon} className="pointer-events-none absolute left-0 top-0 h-[629px] w-[944px] origin-top-left rounded-2xl bg-gradient-to-br from-[#363a48] to-[#1a1c24] shadow-[inset_0_0_0_2px_#0d0f15] [backface-visibility:hidden]">
          <div ref={screenEl}><SiteScreen s={screen} /></div>
          <div className="absolute bottom-[17px] left-1/2 h-[5px] w-[46px] -translate-x-1/2 rounded-sm bg-[#0d0f15] opacity-70" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-10 text-center text-[clamp(13px,1.7vw,20px)] font-bold text-white [text-shadow:0_2px_10px_rgba(0,0,0,.7)]">{ui.caption}</div>
        {!ui.started && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3.5 bg-night/55 p-4 text-center">
            <h1 className="m-0 text-[clamp(20px,3.4vw,38px)] font-extrabold tracking-tight">A donation, start to finish</h1>
            <p className="m-0 text-[clamp(12px,1.4vw,16px)] opacity-80">A short film of a donor giving to a Penyzen campaign.</p>
            <button onClick={play} className="cursor-pointer rounded-full bg-coral px-8 py-3.5 text-base font-extrabold text-white shadow-[0_8px_24px_rgba(255,107,74,.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral">▶ Play</button>
          </div>
        )}
        <div className="absolute inset-x-3 bottom-2.5 z-20 flex items-center gap-2.5 rounded-xl bg-night/80 px-3 py-2 backdrop-blur">
          <button onClick={toggle} className="rounded-lg bg-slate-700 px-3.5 py-1.5 text-[13px] font-bold text-white hover:bg-slate-600">{ui.playing ? 'Pause' : ended ? 'Replay' : ui.started ? 'Resume' : 'Play'}</button>
          <button onClick={replay} className="rounded-lg bg-slate-700 px-3.5 py-1.5 text-[13px] font-bold text-white hover:bg-slate-600">Replay</button>
          <input type="range" min={0} max={1000} value={(ui.t / ui.dur) * 1000} onChange={e => seek(+e.target.value)} aria-label="Timeline" className="min-w-0 flex-1 accent-coral" />
          <span className="whitespace-nowrap text-xs tabular-nums opacity-80">{ui.t.toFixed(1)} / {ui.dur.toFixed(0)} s</span>
        </div>
      </div>
    </div>
  )
}
