import clsx from "clsx";

/* =========================
   黒背景カード
   ========================= */
export function BlackCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative rounded bg-black p-4 cursor-default select-none",
        className
      )}
    >
      {children}
    </div>
  );
}
