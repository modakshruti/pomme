'use client';

import { useMemo, useState } from 'react';

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Home() {
  const [water, setWater] = useState(5);
  const [protein, setProtein] = useState(72);
  const [checkedIn, setCheckedIn] = useState(false);
  const waterPct = useMemo(() => Math.min(100, (water / 8) * 100), [water]);
  const proteinPct = useMemo(() => Math.min(100, protein), [protein]);

  return (
    <main className="min-h-screen bg-[#f5f6f0] text-[#17352d]">
      <div className="mx-auto min-h-screen max-w-md bg-[#fbfcf8] pb-28 shadow-[0_0_60px_rgba(35,59,48,.08)]">
        <header className="flex items-center justify-between px-5 pb-4 pt-7">
          <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#769087]">Monday, Aug 24</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Good morning, Sam</h1></div>
          <button aria-label="Open profile" className="grid h-11 w-11 place-items-center rounded-full bg-[#d9eadf] text-sm font-bold text-[#285b49]">SM</button>
        </header>

        <section className="px-5">
          <div className="relative overflow-hidden rounded-[28px] bg-[#173f34] p-6 text-white shadow-[0_18px_40px_rgba(23,63,52,.18)]">
            <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#346b58]" /><div className="absolute -bottom-16 right-16 h-36 w-36 rounded-full border-[22px] border-[#265445]" />
            <div className="relative"><div className="flex items-center justify-between"><span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium">Weekly dose</span><span className="text-xs text-white/65">Day 4 of 7</span></div><p className="mt-7 text-sm text-white/70">Next dose</p><div className="mt-1 flex items-end justify-between gap-4"><div><p className="text-3xl font-semibold tracking-tight">Thursday</p><p className="mt-1 text-sm text-white/70">7:30 PM · 1.0 mg</p></div><button className="rounded-full bg-[#d9f28b] px-4 py-2.5 text-sm font-semibold text-[#17352d]">View plan</button></div></div>
          </div>
        </section>

        <section className="px-5 pt-7">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Today’s focus</h2><span className="text-sm font-medium text-[#54766b]">2 of 3</span></div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <article className="rounded-3xl border border-[#e1e8df] bg-white p-4"><div className="flex items-center justify-between"><span className="text-xl">💧</span><span className="text-xs text-[#789087]">{water}/8 cups</span></div><p className="mt-5 text-sm font-medium">Hydration</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9efeb]"><div className="h-full rounded-full bg-[#63a8b3]" style={{width: `${waterPct}%`}} /></div><button onClick={() => setWater((v) => Math.min(8, v + 1))} className="mt-4 w-full rounded-xl bg-[#edf6f5] py-2 text-sm font-semibold text-[#367681]">+ Add cup</button></article>
            <article className="rounded-3xl border border-[#e1e8df] bg-white p-4"><div className="flex items-center justify-between"><span className="text-xl">🥚</span><span className="text-xs text-[#789087]">{protein}/100g</span></div><p className="mt-5 text-sm font-medium">Protein</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9efeb]"><div className="h-full rounded-full bg-[#d99b60]" style={{width: `${proteinPct}%`}} /></div><button onClick={() => setProtein((v) => Math.min(100, v + 10))} className="mt-4 w-full rounded-xl bg-[#faf1e8] py-2 text-sm font-semibold text-[#9a6335]">+ Add 10g</button></article>
          </div>
        </section>

        <section className="px-5 pt-7"><h2 className="text-lg font-semibold">How are you feeling?</h2><button onClick={() => setCheckedIn(true)} className="mt-3 flex w-full items-center gap-4 rounded-3xl border border-[#e1e8df] bg-white p-4 text-left"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f1eadc] text-2xl">{checkedIn ? '✓' : '☀️'}</span><span className="flex-1"><strong className="block text-sm">{checkedIn ? 'Check-in complete' : 'Daily check-in'}</strong><span className="mt-1 block text-xs text-[#71847e]">{checkedIn ? 'You’re all set for today.' : 'Track appetite, energy, and side effects'}</span></span><span className="text-xl text-[#94a59f]">›</span></button></section>

        <section className="px-5 pt-7"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Your rhythm</h2><span className="text-xs text-[#71847e]">This week</span></div><div className="mt-3 flex justify-between rounded-3xl border border-[#e1e8df] bg-white px-4 py-5">{days.map((day, i) => <div key={`${day}-${i}`} className="text-center"><span className="text-xs text-[#71847e]">{day}</span><span className={`mt-2 grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${i < 4 ? 'bg-[#d9f28b] text-[#294638]' : 'bg-[#f0f2ed] text-[#8a9994]'}`}>{i < 4 ? '✓' : i + 24}</span></div>)}</div></section>

        <p className="px-8 pt-7 text-center text-[11px] leading-5 text-[#82918c]">This tool supports your routine and does not replace medical advice. Contact your clinician for questions about dosing or side effects.</p>
        <nav className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-md -translate-x-1/2 justify-around border-t border-[#e2e7df] bg-[#fbfcf8]/95 px-3 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">{[['⌂','Today'],['◴','Progress'],['＋','Log'],['♡','Support']].map(([icon,label], i) => <button key={label} className={`min-w-16 text-center ${i === 0 ? 'text-[#245846]' : 'text-[#899790]'}`}><span className="block text-xl leading-5">{icon}</span><span className="mt-1 block text-[11px] font-medium">{label}</span></button>)}</nav>
      </div>
    </main>
  );
}
