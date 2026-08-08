import { AvalShield } from "./AvalShield";

export function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-[11px]">
      <AvalShield size={size} className="shrink-0" />
      <span className="font-sans text-[23px] font-medium leading-none tracking-[0.12em] text-ivory">
        AVAL
      </span>
    </div>
  );
}
