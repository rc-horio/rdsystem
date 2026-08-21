import { useRef, useState } from "react";
import clsx from "clsx";

function boxCountFromTarget(target: EventTarget | null): string | null {
  let n: Element | null = target instanceof Element ? target : null;
  while (n) {
    const v = n.getAttribute("data-box-count");
    if (v) return v;
    n = n.parentElement;
  }
  return null;
}

type Props = {
  html: string;
  className?: string;
};

/** innerHTML の配置図。端数枠はホバー瞬間に機数を出す */
export function LandingFigureHtml({ html, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(
    null
  );

  const move = (e: React.MouseEvent) => {
    const count = boxCountFromTarget(e.target);
    if (!count || !wrapRef.current) {
      setTip(null);
      return;
    }
    const box = wrapRef.current.getBoundingClientRect();
    const x = e.clientX - box.left + 14;
    const y = e.clientY - box.top - 36;
    setTip({ text: `${count}機`, x, y });
  };

  return (
    <div
      ref={wrapRef}
      className={clsx("relative", className)}
      onMouseMove={move}
      onMouseLeave={() => setTip(null)}
    >
      <div
        className="h-full w-full"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {tip ? (
        <div
          className="pointer-events-none absolute z-30 rounded-md border border-red-500 bg-[#0b1220] px-2.5 py-1 text-sm font-bold tabular-nums text-white shadow-[0_2px_10px_rgba(0,0,0,0.55)] whitespace-nowrap"
          style={{ left: tip.x, top: Math.max(4, tip.y) }}
        >
          {tip.text}
        </div>
      ) : null}
    </div>
  );
}
