export type Tab = "today" | "medication" | "progress";

const items = [
  ["today", "⌂", "Today"],
  ["medication", "◉", "Medication"],
  ["progress", "↗", "Progress"],
] as const;

export function BottomNav({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 justify-around border-t border-[#dfe6dc] bg-[#fbfcf8]/95 px-3 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      {items.map(([id, icon, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`min-w-24 text-center ${tab === id ? "text-[#215744]" : "text-[#8c9994]"}`}
        >
          <span className="block text-xl">{icon}</span>
          <span className="text-[11px] font-semibold">{label}</span>
        </button>
      ))}
    </nav>
  );
}
