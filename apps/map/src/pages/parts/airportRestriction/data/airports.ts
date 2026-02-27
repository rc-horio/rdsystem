/**
 * 空港メタ情報
 * 16空港の id, name, displayName, officialUrl を定義
 * データソース: 各空港の公式高さ制限回答システム
 */

import type { AirportMeta } from "../types";

export const AIRPORTS: readonly AirportMeta[] = [
  {
    id: "haneda",
    name: "羽田空港",
    displayName: "東京国際空港（羽田空港）",
    officialUrl: "https://secure.kix-ap.ne.jp/haneda-airport/",
  },
  {
    id: "narita",
    name: "成田空港",
    displayName: "成田国際空港",
    officialUrl:
      "https://secure.kix-ap.ne.jp/narita-airport/Temporary/index.html",
  },
  {
    id: "itami",
    name: "伊丹空港",
    displayName: "大阪国際空港（伊丹空港）",
    officialUrl: "https://secure.kix-ap.ne.jp/itm/",
  },
  {
    id: "kansai",
    name: "関西空港",
    displayName: "関西国際空港",
    officialUrl: "https://secure.kix-ap.ne.jp/kix/",
  },
  {
    id: "centrair",
    name: "中部空港",
    displayName: "中部国際空港（セントレア）",
    officialUrl:
      "https://secure.kix-ap.ne.jp/centrair/Temporary/index.html",
  },
  {
    id: "fukuoka",
    name: "福岡空港",
    displayName: "福岡空港",
    officialUrl: "https://secure.kix-ap.ne.jp/fukuoka-airport/",
  },
  {
    id: "sendai",
    name: "仙台空港",
    displayName: "仙台空港",
    officialUrl: "https://secure.kix-ap.ne.jp/sendai-airport/",
  },
  {
    id: "shinchitose",
    name: "新千歳空港",
    displayName: "新千歳空港",
    officialUrl: "https://secure.kix-ap.ne.jp/shinchitose-airport/",
  },
  {
    id: "hakodate",
    name: "函館空港",
    displayName: "函館空港",
    officialUrl: "https://secure.kix-ap.ne.jp/hakodate-airport/",
  },
  {
    id: "niigata",
    name: "新潟空港",
    displayName: "新潟空港",
    officialUrl: "https://secure.kix-ap.ne.jp/niigata-airport/",
  },
  {
    id: "kumamoto",
    name: "熊本空港",
    displayName: "熊本空港",
    officialUrl: "https://secure.kix-ap.ne.jp/kumamoto-airport/",
  },
  {
    id: "nagasaki",
    name: "長崎空港",
    displayName: "長崎空港",
    officialUrl: "https://secure.kix-ap.ne.jp/nagasaki-airport/",
  },
  {
    id: "naha",
    name: "那覇空港",
    displayName: "那覇空港",
    officialUrl: "https://secure.kix-ap.ne.jp/naha-airport/",
  },
  {
    id: "matsuyama",
    name: "松山空港",
    displayName: "松山空港",
    officialUrl: "https://secure.kix-ap.ne.jp/matsuyama-airport/",
  },
  {
    id: "miyazaki",
    name: "宮崎空港",
    displayName: "宮崎空港",
    officialUrl: "https://secure.kix-ap.ne.jp/miyazaki-airport/",
  },
  {
    id: "yao",
    name: "八尾空港",
    displayName: "八尾空港",
    officialUrl: "https://secure.kix-ap.ne.jp/yao-airport/",
  },
] as const;

/** 空港IDの型 */
export type AirportId = (typeof AIRPORTS)[number]["id"];

/** IDから空港メタ情報を取得 */
export function getAirportById(id: string): AirportMeta | undefined {
  return AIRPORTS.find((a) => a.id === id);
}
