type Props = { label: string; value: number };

export function ProgressBar({ label, value }: Props) {
  return (
    <div
      className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#edf0ea]"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-[#a8cf58]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
