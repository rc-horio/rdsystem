// src/features/hub/tabs/AreaInfo/exports/danceSpec/capture.ts

import html2canvas from "html2canvas";

function fitOneLine(el: HTMLElement, max = 72, min = 20, step = 1) {
  const prevOverflow = el.style.overflow;
  el.style.overflow = "visible";

  let size = max;
  el.style.setProperty("--title-size", `${size}px`);
  void el.offsetHeight;

  while (size > min && el.scrollWidth > el.clientWidth) {
    size -= step;
    el.style.setProperty("--title-size", `${size}px`);
    void el.offsetHeight;
  }

  el.style.overflow = prevOverflow || "hidden";
}

/** 指定ノードをオフスクリーンでレイアウト → html2canvas で撮る */
export async function captureElement(
  el: HTMLElement,
  bg: "#000" | "#fff",
  styles: (HTMLStyleElement | HTMLLinkElement)[],
  vars?: Record<string, string>
) {
  const host = document.createElement("div");
  Object.assign(host.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    background: bg,
  });

  // CSS link の読み込み完了を待つ
  const linkLoads: Promise<void>[] = [];
  styles.forEach((n) => {
    const cloned = n.cloneNode(true) as HTMLStyleElement | HTMLLinkElement;

    if (cloned.tagName === "LINK") {
      const link = cloned as HTMLLinkElement;
      linkLoads.push(
        new Promise<void>((resolve) => {
          link.onload = () => resolve();
          link.onerror = () => resolve(); // 失敗しても先へ
        })
      );
    }
    host.appendChild(cloned);
  });

  if (vars) {
    for (const [k, v] of Object.entries(vars)) host.style.setProperty(k, v);
  }

  host.appendChild(el);
  document.body.appendChild(host);

  await Promise.all(linkLoads);

  // 画像・フォントを待つ（CSS適用後が前提）
  await Promise.all(
    Array.from(el.querySelectorAll("img")).map((img) =>
      (img as HTMLImageElement).decode?.().catch(() => {}) ?? Promise.resolve()
    )
  );
  const anyDoc = document as any;
  if (anyDoc.fonts?.ready) {
    try {
      await anyDoc.fonts.ready;
    } catch {}
  }

  await new Promise((r) => requestAnimationFrame(() => r(null)));

  const title = el.querySelector("#title") as HTMLElement | null;
  if (title) fitOneLine(title, 50, 18, 1);

  await new Promise((r) => requestAnimationFrame(() => r(null)));

  const canvas = await html2canvas(el, {
    backgroundColor: bg,
    useCORS: true,
    scale: 2,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight + 8,
    logging: false,
  });

  document.body.removeChild(host);
  return canvas;
}

/** canvas → dataURI */
export function canvasToDataUri(canvas: HTMLCanvasElement, preferPng = false) {
  return preferPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.95);
}
