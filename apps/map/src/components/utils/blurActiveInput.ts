// src/utils/blurActiveInput.ts
export function blurActiveInput() {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return;
    const tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || el.getAttribute("contenteditable") === "true") {
        el.blur();
    }
}
