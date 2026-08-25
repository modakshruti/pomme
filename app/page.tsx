"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { BottomNav, type Tab } from "./components/BottomNav";
import { ProgressBar } from "./components/ProgressBar";
import type { DayState as Day, FoodResult, Settings } from "./lib/schemas";

const empty: Day = { water: 0, protein: 0, weight: "", vitamins: [] };
const defaults: Settings = {
  proteinGoal: 90,
  dose: "2",
  doseDay: "Thursday",
  doseTime: "19:30",
  supplements: [],
  lastDoseDate: "",
};
const codes: Record<string, string> = {
  Sunday: "SU",
  Monday: "MO",
  Tuesday: "TU",
  Wednesday: "WE",
  Thursday: "TH",
  Friday: "FR",
  Saturday: "SA",
};
const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
function nextDose(day: string, time: string) {
  const names = Object.keys(codes),
    now = new Date(),
    [h, m] = time.split(":").map(Number),
    d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  let add = (names.indexOf(day) - now.getDay() + 7) % 7;
  if (add === 0 && d <= now) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}

export default function Home() {
  const today = localDay(),
    [data, setData] = useState<Day>(empty),
    [settings, setSettings] = useState<Settings>(defaults),
    [tab, setTab] = useState<Tab>("today"),
    [sheet, setSheet] = useState<
      "protein" | "food" | "settings" | "vitamins" | null
    >(null),
    [amount, setAmount] = useState(""),
    [foodQuery, setFoodQuery] = useState(""),
    [foods, setFoods] = useState<FoodResult[]>([]),
    [searching, setSearching] = useState(false),
    [newVitamin, setNewVitamin] = useState(""),
    [sync, setSync] = useState("Saved"),
    [demo, setDemo] = useState(false),
    [error, setError] = useState("");
  const ready = useRef(false);
  useEffect(() => {
    const load = async () => {
      try {
        const [dayResponse, settingsResponse] = await Promise.all([
          fetch(`/api/state?day=${today}`),
          fetch("/api/state?day=settings"),
        ]);
        if (dayResponse.status === 401 || settingsResponse.status === 401) {
          setDemo(true);
          const saved = JSON.parse(localStorage.getItem("pomme-demo") || "{}");
          setData({ ...empty, ...saved.data });
          setSettings({ ...defaults, ...saved.settings });
          setSync("Demo mode");
          return;
        }
        if (!dayResponse.ok || !settingsResponse.ok)
          throw new Error("Could not load your data");
        const [d, s] = await Promise.all([
          dayResponse.json(),
          settingsResponse.json(),
        ]);
        setData({ ...empty, ...d });
        setSettings({ ...defaults, ...s });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load your data");
        setSync("Offline");
      } finally {
        ready.current = true;
      }
    };
    load();
  }, [today]);
  useEffect(() => {
    if (!ready.current) return;
    setError("");
    if (demo) {
      localStorage.setItem("pomme-demo", JSON.stringify({ data, settings }));
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSync("Saving…");
        const response = await fetch("/api/state", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ day: today, data }),
        });
        if (!response.ok) throw new Error();
        setSync("Saved");
      } catch {
        setSync("Offline");
        setError("Changes could not be saved.");
      }
    }, 450);
    return () => clearTimeout(t);
  }, [data, settings, demo, today]);
  const save = async (s = settings) => {
    setSettings(s);
    if (demo) return;
    const response = await fetch("/api/state", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ day: "settings", data: s }),
    });
    if (!response.ok) throw new Error("Settings could not be saved");
  };
  const pp = Math.min(
      100,
      Math.round((data.protein / settings.proteinGoal) * 100),
    ),
    wp = Math.min(100, Math.round((data.water / 8) * 100)),
    next = useMemo(
      () => nextDose(settings.doseDay, settings.doseTime),
      [settings.doseDay, settings.doseTime],
    ),
    taken =
      !!settings.lastDoseDate &&
      new Date(today + "T12:00:00").getTime() -
        new Date(settings.lastDoseDate + "T12:00:00").getTime() <
        604800000;
  const message =
    data.protein >= settings.proteinGoal
      ? "Protein goal complete — that is how strong weeks are built."
      : data.protein >= settings.proteinGoal * 0.6
        ? `You’re in rhythm. ${settings.proteinGoal - data.protein}g protein to go.`
        : data.water >= 4
          ? "Hydration is moving. Add a protein-rich choice next."
          : "Small actions count. Start with one glass and one protein choice.";
  const addProtein = (g: number) => {
    if (g > 0) setData((d) => ({ ...d, protein: d.protein + g }));
    setAmount("");
    setSheet(null);
  };
  const searchFood = async () => {
    if (!foodQuery.trim()) return;
    setSearching(true);
    setError("");
    try {
      const response = await fetch(
          `/api/foods/search?q=${encodeURIComponent(foodQuery)}`,
        ),
        json = await response.json();
      if (!response.ok) throw new Error(json.error || "Food search failed");
      setFoods(json.foods);
    } catch (e) {
      setFoods([]);
      setError(e instanceof Error ? e.message : "Food search failed");
    } finally {
      setSearching(false);
    }
  };
  const reminder = () => {
    const fmt = (d: Date) =>
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`,
      end = new Date(next.getTime() + 900000),
      ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Pomme//EN",
        "BEGIN:VEVENT",
        `UID:pomme-${today}@pomme`,
        `DTSTART:${fmt(next)}`,
        `DTEND:${fmt(end)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${codes[settings.doseDay]}`,
        "SUMMARY:Pomme: weekly medication",
        "DESCRIPTION:Take your prescribed medication and record it in Pomme.",
        "BEGIN:VALARM",
        "TRIGGER:-PT30M",
        "ACTION:DISPLAY",
        "DESCRIPTION:Weekly medication reminder",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
      url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })),
      a = document.createElement("a");
    a.href = url;
    a.download = "pomme-weekly-dose.ics";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="min-h-screen bg-[#eef1e9] text-[#18372f]">
      <div className="mx-auto min-h-screen max-w-md bg-[#fbfcf8] pb-28 shadow-2xl">
        <header className="flex items-center justify-between px-5 pb-4 pt-7">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#789087]">
              Pomme · {sync}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Your healthy rhythm</h1>
            {demo && (
              <p className="mt-1 text-xs font-semibold text-[#8b6531]">
                Portfolio demo · data stays on this device
              </p>
            )}
          </div>
          <button
            onClick={() => setSheet("settings")}
            aria-label="Settings"
            className="grid h-11 w-11 place-items-center rounded-full bg-[#deecdf] text-xl"
          >
            ⚙
          </button>
        </header>
        {error && (
          <p
            role="alert"
            className="mx-5 mb-4 rounded-xl bg-[#fff0eb] px-4 py-3 text-sm text-[#8b3d2f]"
          >
            {error}
          </p>
        )}
        {tab === "today" && (
          <>
            <section className="px-5">
              <div className="rounded-[28px] bg-[#173f34] p-5 text-white shadow-xl">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d9f28b]">
                  Today’s encouragement
                </p>
                <p className="mt-3 text-xl font-semibold leading-7">
                  {message}
                </p>
                <div className="mt-5 flex gap-2 text-xs text-white/70">
                  <span className="rounded-full bg-white/10 px-3 py-2">
                    Protein {data.protein}g
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-2">
                    Water {data.water}/8
                  </span>
                </div>
              </div>
            </section>
            <section className="px-5 pt-5">
              <div className="rounded-[28px] border border-[#e0e7de] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Protein</p>
                    <p className="mt-1 text-3xl font-semibold">
                      {data.protein}
                      <span className="text-base font-normal text-[#819089]">
                        {" "}
                        / {settings.proteinGoal}g
                      </span>
                    </p>
                  </div>
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-[#eef6da] text-sm font-bold text-[#456424]">
                    {pp}%
                  </div>
                </div>
                <ProgressBar label="Daily protein progress" value={pp} />
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[10, 20, 30].map((g) => (
                    <button
                      key={g}
                      onClick={() => addProtein(g)}
                      className="rounded-xl bg-[#edf4ef] py-3 text-sm font-bold text-[#285746]"
                    >
                      +{g}g
                    </button>
                  ))}
                  <button
                    onClick={() => setSheet("protein")}
                    className="rounded-xl bg-[#edf4ef] py-3 text-sm font-bold text-[#285746]"
                  >
                    Other
                  </button>
                </div>
                <button
                  onClick={() => setSheet("food")}
                  className="mt-2 w-full rounded-xl bg-[#173f34] py-3 text-sm font-bold text-white"
                >
                  Search packaged food
                </button>
              </div>
            </section>
            <section className="grid grid-cols-2 gap-3 px-5 pt-3">
              <article className="rounded-3xl border border-[#e0e7de] bg-white p-4">
                <div className="flex justify-between">
                  <span className="text-xl">💧</span>
                  <span className="text-xs text-[#778a83]">{wp}%</span>
                </div>
                <p className="mt-5 text-sm font-semibold">Hydration</p>
                <p className="mt-1 text-xs text-[#778a83]">
                  {data.water} of 8 glasses
                </p>
                <button
                  onClick={() =>
                    setData((d) => ({ ...d, water: Math.min(8, d.water + 1) }))
                  }
                  className="mt-3 w-full rounded-xl bg-[#edf7f7] py-2 text-sm font-bold text-[#377881]"
                >
                  + Glass
                </button>
              </article>
              <button
                onClick={() => setSheet("vitamins")}
                className="rounded-3xl border border-[#e0e7de] bg-white p-4 text-left"
              >
                <span className="text-xl">◉</span>
                <p className="mt-5 text-sm font-semibold">Vitamins</p>
                <p className="mt-1 text-xs text-[#778a83]">
                  {data.vitamins.length}/{settings.supplements.length} taken
                </p>
                <span className="mt-3 block rounded-xl bg-[#f3ecdd] py-2 text-center text-sm font-bold text-[#755f39]">
                  Check in
                </span>
              </button>
            </section>
            <section className="px-5 pt-3">
              <div className="flex items-center gap-4 rounded-3xl border border-[#e0e7de] bg-white p-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8edf4] text-xl">
                  ⚖
                </span>
                <label className="flex-1 text-sm font-semibold">
                  Weight
                  <span className="mt-1 block text-xs font-normal text-[#778a83]">
                    Focus on the trend
                  </span>
                </label>
                <input
                  value={data.weight}
                  onChange={(e) =>
                    setData((d) => ({ ...d, weight: e.target.value }))
                  }
                  inputMode="decimal"
                  placeholder="79"
                  className="w-16 rounded-xl bg-[#f3f5f1] px-2 py-2 text-right font-semibold outline-none"
                />
                <span className="text-xs">kg</span>
              </div>
            </section>
          </>
        )}
        {tab === "medication" && (
          <section className="px-5">
            <h2 className="text-xl font-semibold">Weekly medication</h2>
            <div className="mt-4 rounded-[28px] bg-[#173f34] p-5 text-white">
              <p className="text-sm text-white/65">Tirzepatide</p>
              <p className="mt-2 text-3xl font-semibold">{settings.dose} mg</p>
              <p className="mt-2 text-sm text-white/75">
                Every {settings.doseDay} at {settings.doseTime}
              </p>
              <p className="mt-5 rounded-2xl bg-white/10 p-3 text-sm">
                Next:{" "}
                {next.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <button
                onClick={() => save({ ...settings, lastDoseDate: today })}
                disabled={taken}
                className="mt-3 w-full rounded-xl bg-[#d9f28b] py-3 font-bold text-[#17352d] disabled:opacity-60"
              >
                {taken ? "✓ Dose recorded this week" : "Mark dose taken"}
              </button>
              <button
                onClick={reminder}
                className="mt-2 w-full rounded-xl border border-white/30 py-3 font-bold"
              >
                Add weekly phone reminder
              </button>
            </div>
            <button
              onClick={() => setSheet("settings")}
              className="mt-4 w-full rounded-2xl border border-[#dfe6dc] bg-white p-4 text-sm font-bold"
            >
              Edit medication schedule
            </button>
            <p className="mt-5 text-xs leading-5 text-[#778a83]">
              Record only the dose prescribed to you. Pomme does not calculate
              or recommend medication changes.
            </p>
          </section>
        )}
        {tab === "progress" && (
          <section className="px-5">
            <h2 className="text-xl font-semibold">Your progress</h2>
            <div className="mt-4 rounded-[28px] border border-[#e0e7de] bg-white p-5">
              <p className="text-sm text-[#778a83]">Today’s weight</p>
              <p className="mt-1 text-3xl font-semibold">
                {data.weight || "—"}{" "}
                <span className="text-base font-normal">kg</span>
              </p>
              <div className="mt-5 rounded-2xl bg-[#eef6da] p-4">
                <p className="font-semibold">Your goal: lose 12–15 kg</p>
                <p className="mt-2 text-sm leading-6 text-[#637653]">
                  Consistency wins: protect protein, hydrate, follow your
                  prescribed schedule, and judge progress over weeks—not days.
                </p>
              </div>
            </div>
          </section>
        )}
        <p className="px-8 pt-7 text-center text-[11px] leading-5 text-[#819089]">
          Pomme supports tracking and is not medical advice. Review supplements
          and medication changes with your clinician or pharmacist.
        </p>
        <BottomNav tab={tab} onChange={setTab} />
      </div>
      {sheet && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#0e211b]/45"
          onClick={() => setSheet(null)}
        >
          <section
            onClick={(e) => e.stopPropagation()}
            className="max-h-[86vh] w-full max-w-md overflow-y-auto rounded-t-[30px] bg-[#fbfcf8] p-5 pb-10 shadow-2xl"
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[#ced8d1]" />
            {sheet === "protein" && (
              <>
                <h2 className="text-xl font-semibold">Add protein</h2>
                <p className="mt-2 text-sm text-[#687c75]">
                  Enter your estimated protein for this meal or snack.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <input
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="25"
                    className="min-w-0 flex-1 rounded-xl border border-[#dbe3dc] bg-white px-4 py-3 text-lg outline-none"
                  />
                  <span className="font-semibold">grams</span>
                </div>
                <button
                  onClick={() => addProtein(Number(amount))}
                  className="mt-4 w-full rounded-xl bg-[#173f34] py-3.5 font-bold text-white"
                >
                  Add protein
                </button>
              </>
            )}
            {sheet === "food" && (
              <>
                <h2 className="text-xl font-semibold">Search packaged food</h2>
                <p className="mt-2 text-sm text-[#687c75]">
                  Nutrition data is provided by Open Food Facts. Check the
                  product label and serving size before logging.
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    autoFocus
                    value={foodQuery}
                    onChange={(e) => setFoodQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") searchFood();
                    }}
                    placeholder="Yogurt, protein bar…"
                    className="min-w-0 flex-1 rounded-xl border border-[#dbe3dc] bg-white px-4 py-3 outline-none"
                  />
                  <button
                    onClick={searchFood}
                    className="rounded-xl bg-[#173f34] px-4 font-bold text-white"
                  >
                    {searching ? "…" : "Find"}
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {foods.map((f, i) => (
                    <button
                      key={`${f.name}-${i}`}
                      onClick={() => addProtein(f.protein)}
                      className="flex w-full items-center justify-between rounded-2xl border border-[#e0e7de] bg-white p-4 text-left"
                    >
                      <span className="pr-3">
                        <strong className="block text-sm">{f.name}</strong>
                        <span className="text-xs text-[#778a83]">
                          {f.basis}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-sm font-bold">
                        +{f.protein}g
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {sheet === "settings" && (
              <>
                <h2 className="text-xl font-semibold">Your routine</h2>
                <div className="mt-5 space-y-4">
                  <label className="block text-sm font-semibold">
                    Tirzepatide dose (mg)
                    <input
                      value={settings.dose}
                      onChange={(e) =>
                        setSettings({ ...settings, dose: e.target.value })
                      }
                      inputMode="decimal"
                      className="mt-2 w-full rounded-xl border border-[#dbe3dc] bg-white px-4 py-3 font-normal outline-none"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Daily protein goal (g)
                    <input
                      value={settings.proteinGoal}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          proteinGoal: Number(e.target.value) || 90,
                        })
                      }
                      inputMode="numeric"
                      className="mt-2 w-full rounded-xl border border-[#dbe3dc] bg-white px-4 py-3 font-normal outline-none"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm font-semibold">
                      Dose day
                      <select
                        value={settings.doseDay}
                        onChange={(e) =>
                          setSettings({ ...settings, doseDay: e.target.value })
                        }
                        className="mt-2 w-full rounded-xl border border-[#dbe3dc] bg-white px-3 py-3 font-normal"
                      >
                        {Object.keys(codes).map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold">
                      Time
                      <input
                        type="time"
                        value={settings.doseTime}
                        onChange={(e) =>
                          setSettings({ ...settings, doseTime: e.target.value })
                        }
                        className="mt-2 w-full rounded-xl border border-[#dbe3dc] bg-white px-3 py-3 font-normal"
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => {
                      save();
                      setSheet(null);
                    }}
                    className="w-full rounded-xl bg-[#173f34] py-3.5 font-bold text-white"
                  >
                    Save routine
                  </button>
                </div>
              </>
            )}
            {sheet === "vitamins" && (
              <>
                <h2 className="text-xl font-semibold">
                  Vitamins & supplements
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#687c75]">
                  Add only items approved for you by your clinician or
                  pharmacist.
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    value={newVitamin}
                    onChange={(e) => setNewVitamin(e.target.value)}
                    placeholder="e.g. Vitamin D"
                    className="min-w-0 flex-1 rounded-xl border border-[#dbe3dc] bg-white px-4 py-3 outline-none"
                  />
                  <button
                    onClick={() => {
                      const v = newVitamin.trim();
                      if (v && !settings.supplements.includes(v)) {
                        save({
                          ...settings,
                          supplements: [...settings.supplements, v],
                        });
                        setNewVitamin("");
                      }
                    }}
                    className="rounded-xl bg-[#173f34] px-4 font-bold text-white"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {settings.supplements.length ? (
                    settings.supplements.map((v) => {
                      const on = data.vitamins.includes(v);
                      return (
                        <button
                          key={v}
                          onClick={() =>
                            setData((d) => ({
                              ...d,
                              vitamins: on
                                ? d.vitamins.filter((x) => x !== v)
                                : [...d.vitamins, v],
                            }))
                          }
                          className={`flex w-full items-center justify-between rounded-2xl border p-4 text-sm font-semibold ${on ? "border-[#9cbd58] bg-[#f1f7e4]" : "border-[#e0e7de] bg-white"}`}
                        >
                          <span>{v}</span>
                          <span>{on ? "✓" : "+"}</span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="rounded-2xl bg-white p-5 text-center text-sm text-[#778a83]">
                      No supplements added.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
