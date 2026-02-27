/**
 * 空港高さ制限 吹き出しHTML生成
 * 要件定義: airport-height-restriction-requirements.md
 */

import type { AirportRestrictionResult } from "./types";
import { SURFACE_TYPE_LABELS } from "./types";
import { getAirportById } from "./data/airports";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 制限高の表示文字列（0, 57, 307 はそのまま、それ以外は「約」+ 切り捨て） */
function formatHeightM(heightM: number): string {
  if (heightM === 0 || heightM === 57 || heightM === 307) {
    return `${Math.round(heightM)}m`;
  }
  return `約${Math.floor(heightM)}m`;
}

/** 空港高さ制限セクションのHTMLを生成 */
function buildAirportSection(result: AirportRestrictionResult): string {
  if (result.error) {
    return [
      '<div class="airport-restriction-popup__section">',
      '<div class="airport-restriction-popup__title">■ 空港高さ制限</div>',
      '<div class="airport-restriction-popup__content">',
      '<div class="airport-restriction-popup__error">照会できませんでした</div>',
      "</div>",
      "</div>",
    ].join("");
  }

  if (result.items.length === 0) {
    return [
      '<div class="airport-restriction-popup__section">',
      '<div class="airport-restriction-popup__title">■ 空港高さ制限</div>',
      '<div class="airport-restriction-popup__content">',
      '<div class="airport-restriction-popup__outside">制限表面外</div>',
      "</div>",
      "</div>",
    ].join("");
  }

  const lines: string[] = [];
  for (const item of result.items) {
    const airport = getAirportById(item.airportId);
    const airportName = airport?.name ?? item.airportId;
    const surfaceLabel = SURFACE_TYPE_LABELS[item.surfaceType];
    const heightStr = formatHeightM(item.heightM);
    lines.push(`${escapeHtml(airportName)}　${escapeHtml(surfaceLabel)}　${heightStr}`);
  }

  const links: string[] = [];
  const seenIds = new Set<string>();
  for (const item of result.items) {
    if (seenIds.has(item.airportId)) continue;
    seenIds.add(item.airportId);
    const airport = getAirportById(item.airportId);
    if (airport?.officialUrl) {
      links.push(
        `<a href="${escapeHtml(airport.officialUrl)}" target="_blank" rel="noopener noreferrer" class="airport-restriction-popup__link">${escapeHtml(airport.name)} 高さ回答システム</a>`
      );
    }
  }

  return [
    '<div class="airport-restriction-popup__section">',
    '<div class="airport-restriction-popup__title">■ 空港高さ制限</div>',
    '<div class="airport-restriction-popup__content">',
    lines.map((l) => `<div>${l}</div>`).join(""),
    "</div>",
    links.length > 0
      ? '<div class="airport-restriction-popup__links">' +
        links.join("<br />") +
        "</div>"
      : "",
    "</div>",
  ].join("");
}

/** DJI NFZ エントリの型 */
export interface DjiNfzEntry {
  name: string;
  city?: string;
  level: number;
  label: string;
  color: string;
}

/** 吹き出し用のオプション */
export interface PopupOptions {
  /** 空港高さ制限の照会結果 */
  airportResult: AirportRestrictionResult;
  /** DJI NFZ が ON かつ該当する場合のエントリ。空の場合は非表示 */
  djiNfzEntries?: DjiNfzEntry[];
}

/**
 * 空港高さ制限 + DJI NFZ を統合した吹き出しHTMLを生成
 */
export function buildAirportHeightRestrictionPopupHtml(options: PopupOptions): string {
  const { airportResult, djiNfzEntries = [] } = options;

  const sections: string[] = [];

  // 空港高さ制限セクション（エラー時は公式リンク案内なし）
  sections.push(buildAirportSection(airportResult));

  // DJI NFZ セクション
  if (djiNfzEntries.length > 0) {
    const nfzHtml = [
      '<div class="airport-restriction-popup__section airport-restriction-popup__section--dji">',
      '<div class="airport-restriction-popup__title">■ DJI 飛行制限区域</div>',
      '<div class="airport-restriction-popup__content">',
      ...djiNfzEntries.map(
        (e) =>
          `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;font-size:12px;">` +
          `<span style="flex-shrink:0;width:12px;height:12px;border-radius:50%;background:${e.color};border:1px solid rgba(0,0,0,0.2);"></span>` +
          `<div>` +
          `<div>${escapeHtml(e.name)}</div>` +
          `<div>${escapeHtml(e.label)}</div>` +
          (e.city ? `<div>${escapeHtml(e.city)}</div>` : "") +
          `</div></div>`
      ),
      "</div>",
      "</div>",
    ].join("");
    sections.push(nfzHtml);
  }

  return [
    '<div class="airport-restriction-popup" style="position:relative;min-width:220px;padding:8px 12px;color:#000;font-size:13px;">',
    // 初期表示でリンクにフォーカスが当たるのを防ぐため、先頭にフォーカス受け取り用の不可視要素を配置
    '<div tabindex="0" class="airport-restriction-popup__focus-trap" aria-hidden="true"></div>',
    sections.join(""),
    "</div>",
  ].join("");
}
