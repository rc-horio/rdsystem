/**
 * 空港高さ制限 モジュール
 * エントリポイント
 */

export * from "./types";
export { AIRPORTS, getAirportById } from "./data/airports";
export type { AirportId } from "./data/airports";
export {
  calculateHanedaRestriction,
  calculateNaritaRestriction,
  calculateKansaiRestriction,
  calculateNahaRestriction,
  calculateItamiRestriction,
  calculateCentrairRestriction,
  calculateFukuokaRestriction,
  calculateMatsuyamaRestriction,
  calculateSendaiRestriction,
  calculateYaoRestriction,
  calculateShinchitoseRestriction,
  calculateHakodateRestriction,
  calculateMiyazakiRestriction,
  calculateNiigataRestriction,
  calculateNagasakiRestriction,
  calculateKumamotoRestriction,
  calculateAirportRestriction,
} from "./calculator";
export {
  buildAirportHeightRestrictionPopupHtml,
  type PopupOptions,
  type DjiNfzEntry,
} from "./popupBuilder";
