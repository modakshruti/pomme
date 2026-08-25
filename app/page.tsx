'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Food = { name: string; protein: number; calories: number };
type DayState = { water: number; protein: number; calories: number; weight: string; vitamins: string[]; foods: Food[] };

const initial: DayState = { water: 0, protein: 0, calories: 0, weight: '', vitamins: [], foods: [] };
const suggestedFoods: Food[] = [
  { name: 'Greek yogurt, 1 cup', protein: 20, calories: 150 },
  { name: 'Chicken breast, 4 oz', protein: 35, calories: 190 },
  { name: 'Protein shake', protein: 30, calories: 180 },
  { name: 'Eggs, 2 large', protein: 12, calories: 140 },
];

export default function Home() {
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState<DayState>(initial);
  const [proteinGoal, setProteinGoal] = useState(90);
  const [calorieGoal, setCalorieGoal] = useState(1600);
  const [dose, setDose] = useState('2');
  const [doseDay, setDoseDay] = useState('Thursday');
  const [doseTime, setDoseTime] = useState('19:30');
  const [tab, setTab] = useState<'today'|'log'|'plan'>('today');
  const [sheet, setSheet] = useState<'food'|'settings'|'vitamins'|null>(null);
  const [foodQuery, setFoodQuery] = useState('');
  const [results, setResults] = useState<Food[]>(suggestedFoods);
  const [sync, setSync] = useState('Saved');
  const hydrated = useRef(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/state?day=${today}`).then(r => r.json()),
      fetch('/api/state?day=settings').then(r => r.json()),
    ]).then(([day, settings]) => {
      if (day) setData({ ...initial, ...day });
      if (settings) {
        setProteinGoal(settings.proteinGoal ?? 90); setCalorieGoal(settings.calorieGoal ?? 1600);
        setDose(settings.dose ?? '2'); setDoseDay(settings.doseDay ?? 'Thursday'); setDoseTime(settings.doseTime ?? '19:30');
      }
      hydrated.current = true;
    }).catch(() => { hydrated.current = true; });
  }, [today]);

  useEffect(() => {
    if (!hydrated.current) return;
    setSync('Saving…');
    const timer = setTimeout(() => fetch('/api/state', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ day: today, data }) }).then(() => setSync('Saved')).catch(() => setSync('Offline')), 500);
    return () => clearTimeout(timer);
  }, [data, today]);

  const progress = useMemo(() => Math.min(100, Math.round((data.protein / proteinGoal) * 100)), [data.protein, proteinGoal]);
  const addFood = (food: Food) => { setData(d => ({...d, protein: d.protein + food.protein, calories: d.calories + food.calories, foods: [food, ...d.foods]})); setSheet(null); };
  const saveSettings = () => {
    fetch('/api/state', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({day:'settings',data:{proteinGoal,calorieGoal,dose,doseDay,doseTime}}) });
    setSheet(null);
  };
  const enableReminders = async () => {
    if ('Notification' in window) await Notification.requestPermission();
    alert('Reminder preferences saved. Keep browser notifications enabled on your phone.');
  };
  const lookup = async () => {
    if (!foodQuery.trim()) return;
    try {
      const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodQuery)}&search_simple=1&action=process&json=1&page_size=5`);
      const json = await r.json();
      setResults(json.products.map((p: {product_name?:string; nutriments?:Record<string,number>}) => ({ name: p.product_name || foodQuery, protein: Math.round(p.nutriments?.proteins_100g || 0), calories: Math.round(p.nutriments?.['energy-kcal_100g'] || 0) })).filter((f: Food) => f.protein || f.calories));
    } catch { setResults(suggestedFoods); }
  };
  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    const form = new FormData(); form.append('photo', file);
    await fetch('/api/photo', {method:'POST', body:form}).catch(() => null);
    setFoodQuery('Meal photo'); setResults(suggestedFoods); setSheet('food');
  };

  return (
    <main className="min-h-screen bg-[#eef1e9] text-[#18372f]">
      <div className="mx-auto min-h-screen max-w-md bg-[#fbfcf8] pb-28 shadow-2xl">
        <header className="flex items-center justify-between px-5 pb-4 pt-7">
          <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#789087]">Steady · {sync}</p><h1 className="mt-1 text-2xl font-semibold">Your GLP-1 day</h1></div>
          <button onClick={() => setSheet('settings')} aria-label="Open settings" className="grid h-11 w-11 place-items-center rounded-full bg-[#deecdf] text-xl">⚙</button>
        </header>

        {tab === 'today' && <>
          <section className="px-5">
            <div className="relative overflow-hidden rounded-[28px] bg-[#173f34] p-5 text-white shadow-xl">
              <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#326653]" />
              <div className="relative"><div className="flex justify-between text-xs text-white/65"><span>Weekly tirzepatide</span><span>Reminder on</span></div><div className="mt-5 flex items-end justify-between"><div><p className="text-3xl font-semibold">{dose} mg</p><p className="mt-1 text-sm text-white/70">{doseDay} · {doseTime}</p></div><button onClick={() => setSheet('settings')} className="rounded-full bg-[#d9f28b] px-4 py-2.5 text-sm font-bold text-[#17352d]">Edit dose</button></div></div>
            </div>
          </section>

          <section className="px-5 pt-6">
            <div className="rounded-[28px] border border-[#e0e7de] bg-white p-5">
              <div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Protein</p><p className="mt-1 text-3xl font-semibold">{data.protein}<span className="text-base font-normal text-[#819089]"> / {proteinGoal}g</span></p></div><div className="grid h-16 w-16 place-items-center rounded-full bg-[#eef6da] text-sm font-bold text-[#456424]">{progress}%</div></div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#edf0ea]"><div className="h-full rounded-full bg-[#a8cf58] transition-all" style={{width:`${progress}%`}} /></div>
              <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => setSheet('food')} className="rounded-xl bg-[#173f34] py-3 text-sm font-bold text-white">Search food</button><label className="cursor-pointer rounded-xl bg-[#edf4ef] py-3 text-center text-sm font-bold text-[#285746]">📷 Scan meal<input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => uploadPhoto(e.target.files?.[0])} /></label></div>
              <p className="mt-3 text-[11px] leading-4 text-[#7c8b85]">Photo entries are stored privately, then you confirm the food and portion before adding an estimate.</p>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 px-5 pt-3">
            <article className="rounded-3xl border border-[#e0e7de] bg-white p-4"><div className="flex justify-between"><span className="text-xl">💧</span><span className="text-xs text-[#778a83]">{data.water}/8 cups</span></div><p className="mt-5 text-sm font-semibold">Hydration</p><button onClick={() => setData(d => ({...d,water:Math.min(8,d.water+1)}))} className="mt-3 w-full rounded-xl bg-[#edf7f7] py-2 text-sm font-bold text-[#377881]">+ Add cup</button></article>
            <article className="rounded-3xl border border-[#e0e7de] bg-white p-4"><div className="flex justify-between"><span className="text-xl">🔥</span><span className="text-xs text-[#778a83]">Goal {calorieGoal}</span></div><p className="mt-5 text-2xl font-semibold">{data.calories}<span className="text-xs font-normal text-[#778a83]"> kcal</span></p><button onClick={() => setSheet('food')} className="mt-3 w-full rounded-xl bg-[#fbf1e6] py-2 text-sm font-bold text-[#9c6536]">Log food</button></article>
          </section>

          <section className="space-y-3 px-5 pt-6">
            <h2 className="text-lg font-semibold">Daily care</h2>
            <button onClick={() => setSheet('vitamins')} className="flex w-full items-center gap-4 rounded-3xl border border-[#e0e7de] bg-white p-4 text-left"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f3ecdd] text-xl">◉</span><span className="flex-1"><strong className="block text-sm">Vitamins & supplements</strong><span className="text-xs text-[#778a83]">{data.vitamins.length ? `${data.vitamins.length} taken today` : 'Add only those approved for you'}</span></span><span>›</span></button>
            <div className="flex items-center gap-4 rounded-3xl border border-[#e0e7de] bg-white p-4"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8edf4] text-xl">⚖</span><label className="flex-1 text-sm font-semibold">Weight today<span className="mt-1 block text-xs font-normal text-[#778a83]">Track trends, not single-day changes</span></label><input value={data.weight} onChange={e => setData(d=>({...d,weight:e.target.value}))} inputMode="decimal" placeholder="—" className="w-16 rounded-xl bg-[#f3f5f1] px-2 py-2 text-right font-semibold outline-none" /><span className="text-xs">lb</span></div>
          </section>
        </>}

        {tab === 'log' && <section className="px-5"><h2 className="text-xl font-semibold">Today’s food log</h2><div className="mt-4 space-y-3">{data.foods.length ? data.foods.map((f,i)=><div key={`${f.name}-${i}`} className="flex justify-between rounded-2xl border border-[#e0e7de] bg-white p-4"><div><strong className="text-sm">{f.name}</strong><p className="mt-1 text-xs text-[#778a83]">{f.protein}g protein</p></div><span className="text-sm font-semibold">{f.calories} kcal</span></div>) : <p className="rounded-3xl bg-white p-8 text-center text-sm text-[#778a83]">No foods logged yet.</p>}</div></section>}
        {tab === 'plan' && <section className="px-5"><h2 className="text-xl font-semibold">Your weekly plan</h2><div className="mt-4 rounded-3xl bg-[#173f34] p-5 text-white"><p className="text-sm text-white/65">Next dose</p><p className="mt-1 text-2xl font-semibold">{dose} mg · {doseDay}</p><button onClick={enableReminders} className="mt-5 rounded-xl bg-[#d9f28b] px-4 py-3 text-sm font-bold text-[#17352d]">Enable phone reminders</button></div><div className="mt-4 rounded-3xl border border-[#e0e7de] bg-white p-5"><h3 className="font-semibold">Safety note</h3><p className="mt-2 text-sm leading-6 text-[#657a72]">Record the dose exactly as prescribed. Do not use this app to change or calculate your dose. For severe or persistent symptoms, contact your clinician.</p></div></section>}

        <p className="px-8 pt-7 text-center text-[11px] leading-5 text-[#819089]">Steady supports tracking and is not medical advice. Vitamin needs and medication changes should be reviewed with your clinician or pharmacist.</p>
        <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 justify-around border-t border-[#dfe6dc] bg-[#fbfcf8]/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">{([['today','⌂','Today'],['log','≡','Food log'],['plan','♡','Plan']] as const).map(([id,icon,label])=><button key={id} onClick={()=>setTab(id)} className={`min-w-20 text-center ${tab===id?'text-[#215744]':'text-[#8c9994]'}`}><span className="block text-xl">{icon}</span><span className="text-[11px] font-semibold">{label}</span></button>)}</nav>
      </div>

      {sheet && <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#0e211b]/45" onClick={()=>setSheet(null)}><section onClick={e=>e.stopPropagation()} className="max-h-[86vh] w-full max-w-md overflow-y-auto rounded-t-[30px] bg-[#fbfcf8] p-5 pb-10 shadow-2xl"><div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[#ced8d1]" />
        {sheet==='food' && <><h2 className="text-xl font-semibold">Add food</h2><div className="mt-4 flex gap-2"><input value={foodQuery} onChange={e=>setFoodQuery(e.target.value)} placeholder="Search a food or product" className="min-w-0 flex-1 rounded-xl border border-[#dbe3dc] bg-white px-4 py-3 outline-none" /><button onClick={lookup} className="rounded-xl bg-[#173f34] px-4 font-bold text-white">Find</button></div><p className="mt-2 text-[11px] text-[#778a83]">Estimates are per listed serving or 100g. Confirm labels and portions.</p><div className="mt-4 space-y-2">{results.map((f,i)=><button key={`${f.name}-${i}`} onClick={()=>addFood(f)} className="flex w-full justify-between rounded-2xl border border-[#e0e7de] bg-white p-4 text-left"><span><strong className="block text-sm">{f.name}</strong><span className="text-xs text-[#778a83]">{f.protein}g protein</span></span><span className="text-sm font-semibold">{f.calories} kcal</span></button>)}</div></>}
        {sheet==='settings' && <><h2 className="text-xl font-semibold">Goals & medication</h2><div className="mt-5 space-y-4">{[['Tirzepatide dose (mg)',dose,setDose],['Protein goal (g)',String(proteinGoal),(v:string)=>setProteinGoal(Number(v)||90)],['Calorie goal',String(calorieGoal),(v:string)=>setCalorieGoal(Number(v)||1600) ]].map(([label,value,setter])=><label key={label as string} className="block text-sm font-semibold">{label as string}<input value={value as string} onChange={e=>(setter as (v:string)=>void)(e.target.value)} inputMode="decimal" className="mt-2 w-full rounded-xl border border-[#dbe3dc] bg-white px-4 py-3 font-normal outline-none" /></label>)}<div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold">Dose day<select value={doseDay} onChange={e=>setDoseDay(e.target.value)} className="mt-2 w-full rounded-xl border border-[#dbe3dc] bg-white px-3 py-3 font-normal">{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d=><option key={d}>{d}</option>)}</select></label><label className="text-sm font-semibold">Time<input type="time" value={doseTime} onChange={e=>setDoseTime(e.target.value)} className="mt-2 w-full rounded-xl border border-[#dbe3dc] bg-white px-3 py-3 font-normal" /></label></div><button onClick={saveSettings} className="w-full rounded-xl bg-[#173f34] py-3.5 font-bold text-white">Save settings</button></div></>}
        {sheet==='vitamins' && <><h2 className="text-xl font-semibold">Vitamins & supplements</h2><p className="mt-2 text-sm leading-6 text-[#687c75]">Tirzepatide does not create one universal vitamin list. Add only supplements your clinician or pharmacist recommends, especially if reduced intake or lab results suggest a need.</p><div className="mt-4 space-y-2">{['Multivitamin','Vitamin D','Vitamin B12','Calcium','Magnesium','Other prescribed supplement'].map(v=>{const on=data.vitamins.includes(v);return <button key={v} onClick={()=>setData(d=>({...d,vitamins:on?d.vitamins.filter(x=>x!==v):[...d.vitamins,v]}))} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-sm font-semibold ${on?'border-[#9cbd58] bg-[#f1f7e4]':'border-[#e0e7de] bg-white'}`}><span>{v}</span><span>{on?'✓':'+'}</span></button>})}</div></>}
      </section></div>}
    </main>
  );
}
