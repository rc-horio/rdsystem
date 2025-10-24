// src/components/layout/BrandHeader.tsx
export function BrandHeader() {
  return (
    <div
      className="
          w-full flex justify-center items-end
          h-[240px] md:h-[350px]
          select-none pointer-events-none caret-transparent
        "
      style={{ contain: "layout paint" }}
      contentEditable={false}
      aria-hidden={false}
    >
      <img
        src="/apple-touch-icon.png"
        alt="REDCLIFF Logo"
        width={200}
        height={200}
        decoding="sync"
        loading="eager"
        draggable={false}
        className="block h-[200px] w-auto drop-shadow-lg"
      />
    </div>
  );
}
