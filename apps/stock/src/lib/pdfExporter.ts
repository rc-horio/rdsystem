import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { parseCSV } from "./parseCsv";
import { PDF_TEMPLATE } from "./pdfTemplate";
import { ASSETS_BASE } from "./assetsBase";

async function fetchMotifMap(signal?: AbortSignal): Promise<Map<string, { planeNum: string; width: string; height: string; depth: string; length: string }>> {
  const res = await fetch(`${ASSETS_BASE}/csv/motifs.csv`, { signal });
  const text = await res.text();
  const rows = parseCSV(text).slice(1);
  const map = new Map();
  rows.forEach(
    ([id, , name, , , h, w, d, len, truncate]: string[]) => {
      const file = `${String(id).padStart(4, "0")}_${name}`;
      map.set(file, {
        planeNum: truncate || "-",
        width: w || "-",
        height: h || "-",
        depth: d || "-",
        length: len || "-",
      });
    }
  );
  return map;
}

async function imgToDataURL(img: HTMLImageElement, signal?: AbortSignal): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  try {
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.9);
  } catch {
    // クロスオリジンで tainted の場合、fetch で再取得を試行
    try {
      const res = await fetch(img.src, { mode: "cors", signal });
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolv, rej) => {
        const r = new FileReader();
        r.onload = () => resolv(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
      return dataUrl;
    } catch {
      return "";
    }
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

export async function exportToPdf(container: HTMLElement, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  await document.fonts.ready;
  throwIfAborted(signal);
  const motifMap = await fetchMotifMap(signal);

  const imgs = [...container.querySelectorAll<HTMLImageElement>("img")];
  if (!imgs.length) {
    alert("フッターに画像がありません。");
    return;
  }

  const tlElems = container.querySelectorAll(
    '[data-type="takeoff"], [data-type="landing"]'
  );
  let takeoffTitle = "";
  let landingTitle = "";
  tlElems.forEach((el) => {
    const type = el.getAttribute("data-type");
    const fname = el.getAttribute("data-filename");
    const label = fname ? "レインボー" : "無点灯";
    if (type === "takeoff") takeoffTitle = label;
    if (type === "landing") landingTitle = label;
  });

  const takeoffLabel = "離陸" + (takeoffTitle ? `　${takeoffTitle}` : "");
  const landingLabelHTML = `<div class="landing-label">着陸${landingTitle ? `　${landingTitle}` : ""}</div>`;

  const entries: string[] = [];
  let motifIndex = 0;

  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    if (img.dataset.type === "takeoff" || img.dataset.type === "landing") continue;

    throwIfAborted(signal);
    motifIndex++;
    const dataURL = await imgToDataURL(img, signal);
    if (!dataURL) {
      console.warn(`PDF: 画像の変換に失敗しました: ${img.dataset.filename || img.src}`);
    }
    const fileName = img.dataset.filename || "";
    const meta = motifMap.get(fileName) ?? {
      planeNum: "-",
      width: "-",
      height: "-",
      depth: "-",
      length: "-",
    };
    const planes = meta.planeNum;
    const width = meta.width;
    const height = meta.height;
    const depth = meta.depth;
    const timeSec = meta.length;

    let tlHTML = "";
    if (
      i + 1 < imgs.length &&
      imgs[i + 1].dataset.type === "transition"
    ) {
      tlHTML = `<div class="tl-label">${imgs[i + 1].dataset.name || ""}</div>`;
      i++;
    }

    entries.push(`
      <div class="entry">
        <div class="entry-number">${motifIndex}</div>
        <div class="entry-content">
          <img src="${dataURL}" class="motif-img" data-filename="${fileName}" data-type="motif">
          <div class="caption caption-side">
            <div class="caption-line title">${fileName}</div>
            <div class="caption-line">機体数　${planes} 機</div>
            <div class="caption-line">サイズ　横幅 ${width}m　縦幅 ${height}m　奥行き ${depth}m</div>
            <div class="caption-line">時間　　${timeSec}秒</div>
          </div>
        </div>
      </div>
      ${tlHTML}
    `);

    const motifCount = imgs.filter(
      (x) => x.dataset.type === "motif"
    ).length;
    if (motifIndex === motifCount) {
      entries.push(landingLabelHTML);
    }
  }

  const MAX_PER_COLUMN = 6;
  const leftCount =
    motifIndex < MAX_PER_COLUMN ? motifIndex + 1 : MAX_PER_COLUMN;
  const leftBlocks = entries.slice(0, leftCount).join("");
  const rightBlocks = entries.slice(leftCount).join("");

  const htmlString = PDF_TEMPLATE
    .replace("{{takeoffLabel}}", takeoffLabel)
    .replace("{{leftBlocks}}", leftBlocks)
    .replace("{{rightBlocks}}", rightBlocks);

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;
  Object.assign(tempDiv.style, {
    position: "fixed",
    left: "-9999px",
    top: "0",
    visibility: "visible",
    width: "210mm",
    background: "#fff",
    minHeight: "297mm",
    overflow: "hidden",
  });
  document.body.appendChild(tempDiv);

  try {
    throwIfAborted(signal);

    const adjustBaseline = (column: Element) => {
      const base = column.querySelector(".baseline");
      if (!base) return;
      const children = Array.from(column.children).filter(
        (el) => !el.classList.contains("baseline")
      );
      if (!children.length) return;
      const target = children[children.length - 1];
      const colRect = column.getBoundingClientRect();
      const tgtRect = target.getBoundingClientRect();
      const heightPx = tgtRect.bottom - colRect.top;
      (base as HTMLElement).style.height = `${heightPx}px`;
    };
  tempDiv.querySelectorAll(".column").forEach(adjustBaseline);

  throwIfAborted(signal);

  await Promise.all(
    [...tempDiv.querySelectorAll<HTMLImageElement>("img")].map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else img.onload = () => resolve();
        })
    )
  );

    throwIfAborted(signal);

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#fff",
    });
    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let drawW = imgW;
    let drawH = imgH;
    if (imgH > pageH) {
      const scale = pageH / imgH;
      drawW = imgW * scale;
      drawH = imgH * scale;
    }
    const x = (pageW - drawW) / 2;
    pdf.addImage(imgData, "JPEG", x, 0, drawW, drawH);
    pdf.save("stockcontents.pdf");
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return;
    }
    console.error("PDF export error", err);
    alert("PDF 生成に失敗しました（詳細はコンソール参照）");
  } finally {
    if (document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv);
    }
  }
}
