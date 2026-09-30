import type { Point } from "@/features/types";
import { NAME_UNSET } from "./constants/events";

// 本番用のCatalogのベースURL
const CATALOG =
  String(import.meta.env.VITE_CATALOG_BASE_URL || "").replace(/\/+$/, "") + "/";

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

export async function loadAreasPoints(): Promise<Point[]> {
  try {
    const resp = await fetch(CATALOG + "areas.json", {
      mode: "cors",
      cache: "no-store",
    });
    if (!resp.ok) throw new Error(`areas.json ${resp.status}`);
    const areasJson: any[] = await resp.json();

    const points: Point[] = (areasJson ?? [])
      .map((a) => {
        const lat = a?.representative_coordinate?.lat;
        const lon =
          a?.representative_coordinate?.lon ??
          a?.representative_coordinate?.lng;
        if (!isFiniteNumber(lat) || !isFiniteNumber(lon)) return null;

        const areaName =
          typeof a?.areaName === "string" && a.areaName.trim()
            ? a.areaName
            : NAME_UNSET;
        if (import.meta.env.DEV && areaName === NAME_UNSET) {
          console.warn("[areas] areaName missing for areaUuid=", a?.areaUuid);
        }

        return {
          name: areaName,
          areaName,
          lat: Number(lat),
          lng: Number(lon),
          areaUuid:
            typeof a?.areaUuid === "string"
              ? a.areaUuid
              : typeof a?.uuid === "string"
                ? a.uuid
                : undefined,
        } as Point;
      })
      .filter((p): p is Point => !!p);

    if (import.meta.env.DEV)
      console.debug("[map] areas points=", points.length);
    return points;
  } catch (e) {
    console.warn("loadAreasPoints() fallback to local dev data.", e);
    return [
      {
        name: "エリアが登録されていません。",
        lat: 35.6861,
        lng: 139.4077,
        areaName: "エリアが登録されていません。",
      },
    ];
  }
}
