import { useEffect, useRef } from 'react'
import { U } from '../engine/util'
import { ART, CAMP, COVER, money } from './siteData'

export const SCREEN_W = 900
export const SCREEN_H = 562
const IDS = ['card-water', 'card-health', 'card-flood', 'card-women', 'card-edu', 'card-trees', 'btn-donate', 'btn-confirm', 'btn-explore', 'p-read1', 'p-read2', 'f-name', 'f-email', 'f-phone', 'd-side']

/** Layout rects (unscrolled, relative to the screen) used by the timeline to aim the cursor. */
export function measureSite(screen: HTMLElement) {
  const out: Record<string, any> = {}
  for (const id of IDS) {
    const el = document.getElementById(id)!
    let x = 0, y = 0, e: HTMLElement | null = el
    while (e && e !== screen) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent as HTMLElement | null }
    out[id] = { x, y, w: el.offsetWidth, h: el.offsetHeight }
  }
  return out
}

const btn = 'inline-flex items-center justify-center whitespace-nowrap font-bold rounded-full'
const Svg = ({ html, className = '' }: { html: string; className?: string }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
)
const uniq = (svg: string, k: string) => svg.replace(/id="(g[a-z])"/g, `id="$1${k}"`).replace(/url\(#(g[a-z])\)/g, `url(#$1${k})`)

function Card({ id, s }: { id: keyof typeof CAMP; s: any }) {
  const c = CAMP[id], pct = Math.round((100 * c.raised) / c.goal)
  const hover = s.hover === id, press = s.pressed === id
  return (
    <div id={`card-${id}`} className={`overflow-hidden rounded-2xl border-[1.5px] bg-white ${hover ? 'border-indigo-200 shadow-[0_14px_30px_rgba(40,40,100,.18)]' : 'border-slate-200'} ${press ? 'brightness-[.97]' : ''}`}>
      <Svg html={ART[id]} className="h-[118px] overflow-hidden [&_svg]:block [&_svg]:h-full [&_svg]:w-full" />
      <div className="px-[15px] pb-[15px] pt-[13px]">
        <span className="inline-block rounded-[10px] px-[9px] py-[3px] text-[11px] font-extrabold uppercase tracking-wider" style={{ color: c.c, background: c.bg }}>{c.cat}</span>
        <h3 className="mb-[3px] mt-2 h-10 overflow-hidden text-[15.5px] font-extrabold leading-[1.28] tracking-tight">{c.title}</h3>
        <div className="mb-[11px] text-[12.5px] text-mute">{c.org}</div>
        <div className="h-[7px] overflow-hidden rounded bg-slate-200/70"><i className="block h-full rounded bg-gradient-to-r from-brand to-indigo-400" style={{ width: pct + '%' }} /></div>
        <div className="mt-2 flex justify-between text-[12.5px] font-semibold text-mute"><span><b className="text-[13.5px] font-extrabold text-ink">{money(c.raised)}</b> raised</span><span>{pct}%</span></div>
      </div>
    </div>
  )
}

function Field({ id, label, value, ph, focus, caret }: any) {
  return (
    <>
      <div className="mb-[5px] text-xs font-bold text-slate-600">{label}</div>
      <div id={`f-${id}`} className={`mb-[11px] flex h-[42px] items-center overflow-hidden whitespace-nowrap rounded-xl border-[1.5px] px-3.5 text-[15.5px] ${focus ? 'border-brand bg-white shadow-[0_0_0_4px_rgba(67,56,202,.14)]' : 'border-slate-200 bg-slate-50'}`}>
        <span>{value}</span>
        <span className={`ml-px inline-block h-[1.1em] w-0.5 bg-brand ${focus && caret ? 'opacity-100' : 'opacity-0'}`} />
        {!value && <span className="text-slate-400">{ph}</span>}
      </div>
    </>
  )
}

const CONF = Array.from({ length: 110 }, (_, i) => ({
  a: -Math.PI / 2 + (U.hash(i + 1) - 0.5) * 2.5, v: 260 + U.hash(i + 9) * 380, s: 5 + U.hash(i + 3) * 6,
  c: ['#ff6b4a', '#4338ca', '#ffd166', '#10b981', '#8b83f7', '#ff8fb3'][i % 6], r: U.hash(i + 5) * 6, w: (U.hash(i + 7) - 0.5) * 12, x0: 450 + (U.hash(i + 11) - 0.5) * 120,
}))

export default function SiteScreen({ s }: { s: any }) {
  const confetti = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = confetti.current!.getContext('2d')!, t = s.successT
    c.clearRect(0, 0, SCREEN_W, SCREEN_H)
    if (t < 0 || t > 3.6) return
    for (const p of CONF) {
      const x = p.x0 + Math.cos(p.a) * p.v * t * 0.9 + Math.sin(t * 5 + p.r) * 10, y = 300 + Math.sin(p.a) * p.v * t * 0.9 + 520 * t * t
      if (y > 580) continue
      c.save(); c.translate(x, y); c.rotate(p.r + t * p.w); c.globalAlpha = Math.min(1, (3.6 - t) / 0.8)
      c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c.restore()
    }
  }, [s.successT])

  const u = U.sm(s.pageT / 0.4)
  const page = (name: string): React.CSSProperties =>
    name === s.page ? { visibility: 'visible', opacity: u, zIndex: 2 }
      : name === s.prev && u < 1 ? { visibility: 'visible', opacity: 1, zIndex: 1 } : { visibility: 'hidden', opacity: 0 }
  const k = U.ease(s.count)
  const mu = U.sm(s.modalT / 0.35), modal = s.modal !== 'none', success = s.modal === 'success'
  const cardStyle = { transform: `translateY(${(1 - mu) * 26}px) scale(${0.97 + 0.03 * mu})` }
  const f = s.form, cur = s.cursor
  const bHover = (id: string) => (s.hover === id ? 'brightness-95 -translate-y-px' : '') + (s.pressed === id ? ' scale-[.965] brightness-90' : '')
  const rp = cur.ripple >= 0 && cur.ripple < 0.55 ? cur.ripple / 0.55 : -1
  const sa = U.seg(s.successT, 0.1, 0.65), sb = U.seg(s.successT, 0.5, 0.95)

  return (
    <div className="absolute left-[22px] top-[22px] h-[562px] w-[900px] overflow-hidden rounded-[3px] bg-white text-[15px] font-medium leading-[1.4] text-ink antialiased [&_*]:box-border">
      {/* browser chrome */}
      <div className="absolute left-0 top-0 z-10 h-20 w-[900px] bg-[#dfe2ee]">
        <div className="flex h-[38px] items-end px-2.5">
          <div className="flex h-8 w-[230px] items-center gap-2 overflow-hidden whitespace-nowrap rounded-t-[9px] bg-[#f6f7fc] px-3 text-[12.5px] font-semibold text-slate-700">
            <span className={`size-[15px] flex-none rounded-[5px] ${s.loading >= 0 ? 'rounded-full border-[2.5px] border-indigo-200 border-t-brand' : 'bg-brand'}`} style={s.loading >= 0 ? { transform: `rotate(${s.t * 540}deg)` } : undefined} />
            <span className="truncate">{s.tabTitle}</span>
          </div>
        </div>
        <div className="flex h-[42px] items-center gap-2.5 border-b border-slate-200 bg-[#f6f7fc] px-3">
          {['←', '→', '⟳'].map(c => <span key={c} className="grid size-[22px] place-items-center text-[15px] text-mute">{c}</span>)}
          <div className={`flex h-[30px] flex-1 items-center gap-[7px] overflow-hidden whitespace-nowrap rounded-full border-2 px-3.5 text-[14.5px] ${s.urlFocus ? 'border-brand bg-white shadow-[0_0_0_3px_rgba(67,56,202,.16)]' : 'border-transparent bg-[#eaecf6]'}`}>
            <span className="size-3 flex-none rounded-[3px] bg-mute opacity-70" />
            <span>{s.url}</span>
            <span className={`inline-block h-[1.1em] w-0.5 bg-brand ${s.urlFocus && s.caretOn ? 'opacity-100' : 'opacity-0'}`} />
            {s.url.length === 0 && !s.urlFocus && <span className="text-slate-400">Search or type a URL</span>}
          </div>
        </div>
      </div>
      <div className="absolute left-0 top-[78px] z-[11] h-[3px] bg-gradient-to-r from-brand to-coral" style={{ width: s.loading >= 0 ? s.loading * 100 + '%' : 0, opacity: s.loading >= 0 && s.loading < 1 ? 1 : 0 }} />

      <div className="absolute left-0 top-20 h-[482px] w-[900px] overflow-hidden bg-white">
        {/* new tab */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[26px] bg-[#f2f3fb]" style={page('newtab')}>
          <div className="text-[44px] font-extrabold tracking-tighter text-[#c4c7e6]">Search</div>
          <div className="flex h-[46px] w-[420px] items-center rounded-full border-[1.5px] border-[#dfe2f2] bg-white px-5 text-[15px] text-slate-400">Search the web or type a URL</div>
          <div className="flex gap-[22px]">{['Mail', 'Maps', 'News', 'Notes'].map(n => <div key={n} className="w-[78px] text-center text-xs font-semibold text-mute"><i className="mx-auto mb-2 block size-[54px] rounded-full bg-[#e5e7f6]" />{n}</div>)}</div>
        </div>

        {/* home */}
        <div className="absolute inset-0 bg-white" style={page('home')}>
          <div className="absolute left-0 top-0 w-[900px]" style={{ transform: `translateY(${-s.scroll.home}px)` }}>
            <div className="flex h-[58px] items-center gap-[26px] border-b border-slate-100 px-7">
              <div className="flex items-center gap-[9px] text-[21px] font-extrabold tracking-tight"><b className="grid size-7 place-items-center rounded-[9px] bg-gradient-to-br from-brand to-indigo-500"><span className="size-[11px] -rotate-45 rounded-[50%_50%_50%_0] bg-coral" /></b>Penyzen</div>
              <div className="ml-3.5 flex gap-[22px] text-sm font-semibold text-slate-600"><span>Discover</span><span>How it works</span><span>For schools</span><span>Stories</span></div>
              <div className="flex-1" /><span className="text-sm font-bold text-slate-700">Sign in</span>
              <span className={`${btn} h-[38px] bg-brand px-[18px] text-sm text-white shadow-[0_4px_12px_rgba(67,56,202,.28)]`}>Start a campaign</span>
            </div>
            <div className="flex items-center justify-between gap-5 px-7 pb-5 pt-[26px]">
              <div>
                <span className="inline-block rounded-xl bg-indigo-50 px-[11px] py-1 text-xs font-bold uppercase tracking-widest text-brand">Community crowdfunding</span>
                <h1 className="mb-2.5 mt-3 text-[40px] font-extrabold leading-[1.06] tracking-[-1.4px]">Fund the change<br />you believe in.</h1>
                <p className="mb-[18px] max-w-[410px] text-[15.5px] text-slate-600">Back verified campaigns for schools, clinics and clean water. Every gift reaches the people it was meant for.</p>
                <div className="flex items-center gap-4 text-[13px] font-semibold text-mute"><span id="btn-explore" className={`${btn} h-12 bg-coral px-[26px] text-base text-white shadow-[0_6px_16px_rgba(255,107,74,.34)]`}>Explore campaigns</span><span>$4.2M raised · 18,000 donors</span></div>
              </div>
              <Svg html={uniq(ART.edu, 'h')} className="h-[200px] w-[330px] flex-none overflow-hidden rounded-[22px] [&_svg]:block [&_svg]:h-full [&_svg]:w-full" />
            </div>
            <div className="flex gap-2.5 px-7 pb-1 pt-1.5">{['All', 'Education', 'Health', 'Clean water', 'Emergency', 'Environment'].map((c, i) => <span key={c} className={`flex h-[34px] items-center rounded-full px-[15px] text-[13.5px] font-semibold ${i ? 'bg-slate-100 text-slate-600' : 'bg-ink text-white'}`}>{c}</span>)}</div>
            <div className="flex items-baseline justify-between px-7 pb-3 pt-[22px]"><h2 className="m-0 text-[23px] font-extrabold tracking-tight">Trending campaigns</h2><span className="text-[13.5px] font-bold text-brand">See all →</span></div>
            <div className="grid grid-cols-3 gap-[18px] px-7">{(['water', 'health', 'flood', 'women', 'edu', 'trees'] as const).map(id => <Card key={id} id={id} s={s} />)}</div>
            <div className="mt-7 bg-[#f6f7fc] px-7 pb-10 pt-[26px] text-[13px] text-mute">Penyzen · Verified community fundraising. Demo site for illustration only.</div>
          </div>
        </div>

        {/* detail */}
        <div className="absolute inset-0 bg-white" style={page('detail')}>
          <div className="absolute left-0 top-0 w-[900px]" style={{ transform: `translateY(${-s.scroll.detail}px)` }}>
            <div className="px-7 pt-4 text-[12.5px] font-semibold text-slate-400">Discover › Education › Hope Primary School</div>
            <div className="absolute left-7 top-10 w-[566px]">
              <Svg html={COVER} className="h-[188px] overflow-hidden rounded-[18px] [&_svg]:block [&_svg]:h-full [&_svg]:w-full" />
              <h1 className="mb-2 mt-4 text-[27px] font-extrabold leading-[1.14] tracking-[-0.9px]">Books &amp; Desks for Hope Primary School</h1>
              <div className="flex items-center gap-2.5 text-[13.5px] font-semibold text-slate-600"><span className="size-[34px] rounded-full bg-gradient-to-br from-coral to-orange-300" /><span>Organized by <b className="text-ink">Hope Primary PTA</b> · <span className="font-bold text-emerald-600">✓ Verified</span></span></div>
              <div className="mb-3.5 mt-4 flex gap-6 border-b-[1.5px] border-slate-100 text-sm font-bold text-slate-400"><span className="-mb-[1.5px] border-b-[2.5px] border-brand pb-[9px] text-ink">Story</span><span>Updates 3</span><span>Donors 412</span></div>
              <p id="p-read1" className="mb-[13px] text-[15.5px] leading-[1.6] text-slate-600">Hope Primary School teaches 380 children in nine classrooms. Most students share one worn textbook between three, and many sit on the floor because there are not enough desks.</p>
              <p id="p-read2" className="mb-[13px] text-[15.5px] leading-[1.6] text-slate-600">With your help we will buy 1,200 textbooks, 140 desks and a small reading corner, so every child can open a book of their own on the first day of term.</p>
              <h4 className="mb-2 mt-[18px] text-[17px] font-extrabold">Where your gift goes</h4>
              <ul className="mb-3.5 list-disc pl-5 text-[15.5px] leading-[1.6] text-slate-600"><li>$25 puts three new textbooks in a child's hands</li><li>$50 buys a desk and chair for one classroom seat</li><li>$100 stocks a reading shelf for a whole class</li></ul>
              <p className="mb-[13px] text-[15.5px] leading-[1.6] text-slate-600">Every purchase is documented, and the PTA posts receipts and photos on this page as the work is finished.</p>
            </div>
          </div>
          <div id="d-side" className="absolute right-7 top-10 w-[244px] rounded-[20px] border-[1.5px] border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(40,40,100,.10)]">
            <div className="text-[31px] font-extrabold leading-[1.1] tracking-[-1.2px]">{money(18420 * k)}</div>
            <div className="mb-[13px] mt-[3px] text-[13px] font-semibold text-mute">raised of $25,000 goal</div>
            <div className="mb-[13px] h-2.5 overflow-hidden rounded-full bg-slate-200/70"><i className="block h-full rounded-full bg-gradient-to-r from-brand to-indigo-400" style={{ width: 73.7 * k + '%' }} /></div>
            <div className="mb-4 flex justify-between text-[11.5px] font-bold uppercase tracking-wider text-slate-400">
              <div><b className="block text-[19px] normal-case tracking-tight text-ink">{Math.round(412 * k)}</b>Donors</div><div><b className="block text-[19px] normal-case tracking-tight text-ink">12</b>Days left</div><div><b className="block text-[19px] normal-case tracking-tight text-ink">{Math.round(73.7 * k)}%</b>Funded</div>
            </div>
            <span id="btn-donate" className={`${btn} h-12 w-full bg-coral text-base text-white shadow-[0_6px_16px_rgba(255,107,74,.34)] ${bHover('donate')}`}>Donate now</span>
            <div className="mt-2.5 flex gap-2"><span className={`${btn} h-9 flex-1 bg-slate-100 text-[13px] text-slate-700`}>Share</span><span className={`${btn} h-9 flex-1 bg-slate-100 text-[13px] text-slate-700`}>Save</span></div>
            <div className="mt-3 border-t-[1.5px] border-slate-100 pt-3 text-[12.5px] leading-[1.4] text-slate-600"><b className="text-ink">Mulu T.</b> gave $50 · 4 min ago<br /><b className="text-ink">Anonymous</b> gave $25 · 11 min ago</div>
            <div className="mt-3.5 text-xs leading-[1.45] text-mute">Verified by Penyzen. Funds go directly to the school's account.</div>
          </div>
        </div>

        {/* modal */}
        <div className="absolute inset-0 z-20 flex items-start justify-center pt-3.5" style={{ visibility: modal ? 'visible' : 'hidden', opacity: modal ? (success ? 1 : mu) : 0, background: success ? 'rgba(24,26,52,.40)' : 'rgba(24,26,52,.50)' }}>
          {!success ? (
            <div className="w-[452px] rounded-[22px] bg-white px-6 py-5 shadow-[0_30px_70px_rgba(10,10,40,.38)]" style={cardStyle}>
              <div className="mb-3.5 flex items-center gap-3"><Svg html={uniq(ART.edu, 'm')} className="size-12 flex-none overflow-hidden rounded-[13px] [&_svg]:block [&_svg]:h-full [&_svg]:w-full" /><div><h3 className="m-0 text-[21px] font-extrabold tracking-tight">Make a donation</h3><small className="block text-[12.5px] font-semibold text-mute">Books &amp; Desks for Hope Primary School</small></div></div>
              <div className="mb-3.5 flex gap-2">{['$10', '$25', '$50', '$100'].map(a => <span key={a} className={`grid h-[38px] flex-1 place-items-center rounded-xl border-[1.5px] text-[15px] font-extrabold ${a === '$25' ? 'border-brand bg-indigo-50 text-brand' : 'border-slate-200 text-slate-700'}`}>{a}</span>)}</div>
              <Field id="name" label="Full name" value={f.name} ph="Your name" focus={f.focus === 'name'} caret={s.caretOn} />
              <Field id="email" label="Email address" value={f.email} ph="you@example.com" focus={f.focus === 'email'} caret={s.caretOn} />
              <Field id="phone" label="Phone number" value={f.phone} ph="+251 ..." focus={f.focus === 'phone'} caret={s.caretOn} />
              <div className="mb-3 mt-0.5 flex gap-2 rounded-[11px] bg-[#f6f7fc] px-[11px] py-[9px] text-xs leading-[1.4] text-mute"><span>ⓘ</span><span><b className="text-ink">Demo checkout.</b> No payment is processed and no real data is stored.</span></div>
              <span id="btn-confirm" className={`${btn} h-[50px] w-full bg-coral text-base text-white shadow-[0_6px_16px_rgba(255,107,74,.34)] ${bHover('confirm')}`}>
                {s.submit && <span className="mr-2.5 size-[18px] rounded-full border-[3px] border-white/40 border-t-white" style={{ transform: `rotate(${s.t * 720}deg)` }} />}
                {s.submit ? 'Processing…' : 'Confirm donation · $25'}
              </span>
            </div>
          ) : (
            <div className="w-[430px] rounded-[22px] bg-white px-7 pb-[22px] pt-[26px] text-center shadow-[0_30px_70px_rgba(10,10,40,.38)]" style={cardStyle}>
              <svg className="mx-auto mb-3 size-[84px]" viewBox="0 0 84 84"><circle cx="42" cy="42" r="38" fill="#e6f8ef" stroke="#10b981" strokeWidth="5" strokeDasharray="240" strokeDashoffset={240 * (1 - U.ease(sa))} transform="rotate(-90 42 42)" /><path d="M25 43l12 12 23-26" fill="none" stroke="#10b981" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="64" strokeDashoffset={64 * (1 - U.ease(sb))} /></svg>
              <h3 className="mb-1.5 mt-0 text-[27px] font-extrabold tracking-tight">Thank you, {f.name.split(' ')[0] || 'friend'}!</h3>
              <p className="mx-auto mb-4 max-w-[340px] text-[14.5px] leading-normal text-slate-600">Your $25 gift to Books &amp; Desks for Hope Primary School was received. A receipt is on its way to <b className="text-ink">{f.email}</b>.</p>
              <div className="mb-4 rounded-[14px] border-[1.5px] border-dashed border-slate-300 px-4 py-3 text-left text-[13px]">
                {[['Reference', 'PZ-2026-04817'], ['Amount', '$25.00'], ['Campaign now at', '$18,445 of $25,000']].map(([a, b]) => <div key={a} className="flex justify-between py-[3.5px] font-semibold text-mute"><span>{a}</span><b className="font-extrabold text-ink">{b}</b></div>)}
              </div>
              <div className="flex gap-2.5"><span className={`${btn} h-11 flex-1 bg-slate-100 text-sm text-slate-700`}>Share this campaign</span><span className={`${btn} h-11 flex-1 bg-brand text-sm text-white`}>Back to Penyzen</span></div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={confetti} width={SCREEN_W} height={SCREEN_H} className="pointer-events-none absolute inset-0 z-30" />
      <div className="pointer-events-none absolute left-[-18px] top-[-18px] z-[49] size-9 rounded-full border-[3px] border-brand/75 bg-brand/20" style={{ opacity: rp >= 0 ? 0.9 * (1 - rp) : 0, transform: rp >= 0 ? `translate(${cur.rx}px,${cur.ry}px) scale(${0.3 + 1.4 * U.ease(rp)})` : undefined }} />
      <div className="pointer-events-none absolute left-0 top-0 z-50 size-[26px] drop-shadow-md" style={{ opacity: cur.vis ? 1 : 0, transform: `translate(${cur.x - 4}px,${cur.y - 2}px) scale(${cur.down ? 0.88 : 1})` }}>
        <svg viewBox="0 0 26 26" width="26" height="26"><path d="M4 2l0 18 5-5 4 9 4-2-4-9 7 0z" fill="#fff" stroke="#111" strokeWidth="1.8" strokeLinejoin="round" /></svg>
      </div>
      <div className="pointer-events-none absolute inset-0 z-[60] bg-[linear-gradient(115deg,rgba(255,255,255,.10)_0%,transparent_32%)]" />
    </div>
  )
}
