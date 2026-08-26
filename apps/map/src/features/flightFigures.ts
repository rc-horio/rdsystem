import type {
  FlightFigure,
  Geometry,
  NormalizedScheduleFlightArea,
} from "./types";

export function createFlightFigureId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return (
    "figure-" +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

export function createFlightFigure(params: {
  title: string;
  geometry?: Geometry;
  id?: string;
}): FlightFigure {
  return {
    id: params.id ?? createFlightFigureId(),
    title: params.title.trim() || "飛行エリア図",
    geometry: params.geometry ?? {},
  };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function hasUsableGeometry(g: unknown): g is Geometry {
  if (!isPlainObject(g)) return false;
  return (
    g.flightArea != null ||
    g.takeoffArea != null ||
    g.safetyArea != null ||
    g.audienceArea != null
  );
}

function sanitizeFigure(
  raw: unknown,
  fallbackTitle: string
): FlightFigure | null {
  if (!isPlainObject(raw)) return null;

  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id.trim()
      : createFlightFigureId();
  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : fallbackTitle;
  const geometry = isPlainObject(raw.geometry)
    ? (raw.geometry as Geometry)
    : {};

  return { id, title, geometry };
}

function ensureOneConfirmed(
  figures: FlightFigure[],
  confirmedId: string | null
): string | null {
  if (figures.length === 0) return null;
  if (confirmedId && figures.some((f) => f.id === confirmedId)) {
    return confirmedId;
  }
  return figures[0].id;
}

/**
 * schedules[].area を正規化する。
 * 新形 flight_figures があればそれを正とする。
 * 無ければ旧形 area.geometry を 1 件へ昇格し、自動確定する。
 * 図が1件以上あれば confirmed_figure_id は必ず1件。
 */
export function normalizeScheduleFlightArea(
  area: unknown,
  fallbackTitle = "飛行エリア図"
): NormalizedScheduleFlightArea {
  const src = isPlainObject(area) ? area : {};
  const titleFallback = fallbackTitle.trim() || "飛行エリア図";

  let figures: FlightFigure[] = [];

  if (Array.isArray(src.flight_figures) && src.flight_figures.length > 0) {
    figures = src.flight_figures
      .map((f) => sanitizeFigure(f, titleFallback))
      .filter((f): f is FlightFigure => f != null);
  } else if (hasUsableGeometry(src.geometry)) {
    figures = [
      createFlightFigure({
        title: titleFallback,
        geometry: src.geometry as Geometry,
      }),
    ];
  }

  const seen = new Set<string>();
  figures = figures.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });

  const requestedId =
    typeof src.confirmed_figure_id === "string" &&
    src.confirmed_figure_id.trim()
      ? src.confirmed_figure_id.trim()
      : null;

  return {
    flight_figures: figures,
    confirmed_figure_id: ensureOneConfirmed(figures, requestedId),
  };
}

export function serializeScheduleFlightArea(
  normalized: NormalizedScheduleFlightArea
): {
  flight_figures: FlightFigure[];
  confirmed_figure_id: string | null;
} {
  const figures = normalized.flight_figures.filter(
    (f) => typeof f.id === "string" && f.id.trim()
  );
  return {
    flight_figures: figures,
    confirmed_figure_id: ensureOneConfirmed(
      figures,
      normalized.confirmed_figure_id
    ),
  };
}

export function getConfirmedFlightFigure(
  normalized: NormalizedScheduleFlightArea
): FlightFigure | null {
  const id = normalized.confirmed_figure_id;
  if (!id) return null;
  return normalized.flight_figures.find((f) => f.id === id) ?? null;
}

export function resolveConfirmedGeometry(
  area: unknown,
  fallbackTitle = "飛行エリア図"
): Geometry | null {
  const normalized = normalizeScheduleFlightArea(area, fallbackTitle);
  const geom = getConfirmedFlightFigure(normalized)?.geometry;
  return hasUsableGeometry(geom) ? geom : null;
}

export function resolveGeometryByFigureId(
  area: unknown,
  figureId: string,
  fallbackTitle = "飛行エリア図"
): Geometry | null {
  const id = figureId.trim();
  if (!id) return null;
  const normalized = normalizeScheduleFlightArea(area, fallbackTitle);
  const figure = normalized.flight_figures.find((f) => f.id === id);
  const geom = figure?.geometry;
  return hasUsableGeometry(geom) ? geom : geom ?? null;
}

/** 指定図の geometry を更新する。確定は変えない。 */
export function upsertGeometryForFigure(
  normalized: NormalizedScheduleFlightArea,
  figureId: string | undefined,
  geometry: Geometry
): NormalizedScheduleFlightArea {
  const id = typeof figureId === "string" ? figureId.trim() : "";
  if (!id || !normalized.flight_figures.some((f) => f.id === id)) {
    return normalized;
  }
  return {
    flight_figures: normalized.flight_figures.map((f) =>
      f.id === id ? { ...f, geometry } : f
    ),
    confirmed_figure_id: ensureOneConfirmed(
      normalized.flight_figures,
      normalized.confirmed_figure_id
    ),
  };
}

export function withConfirmedFlightFigure(
  normalized: NormalizedScheduleFlightArea,
  figureId: string
): NormalizedScheduleFlightArea {
  if (!normalized.flight_figures.some((f) => f.id === figureId)) {
    return normalized;
  }
  return {
    ...normalized,
    confirmed_figure_id: figureId,
  };
}

export function appendFlightFigure(
  normalized: NormalizedScheduleFlightArea,
  figure: FlightFigure
): NormalizedScheduleFlightArea {
  const nextFigures = [...normalized.flight_figures, figure];
  return {
    flight_figures: nextFigures,
    confirmed_figure_id: ensureOneConfirmed(
      nextFigures,
      normalized.confirmed_figure_id
    ),
  };
}

export function removeFlightFigure(
  normalized: NormalizedScheduleFlightArea,
  figureId: string
): NormalizedScheduleFlightArea {
  const nextFigures = normalized.flight_figures.filter(
    (f) => f.id !== figureId
  );
  return {
    flight_figures: nextFigures,
    confirmed_figure_id: ensureOneConfirmed(
      nextFigures,
      normalized.confirmed_figure_id
    ),
  };
}

/** area へ新形を書き、旧 geometry キーを除く。 */
export function applyFlightAreaToScheduleArea(
  prevArea: unknown,
  normalized: NormalizedScheduleFlightArea
): Record<string, unknown> {
  const base = isPlainObject(prevArea) ? { ...prevArea } : {};
  const serialized = serializeScheduleFlightArea(normalized);
  delete base.geometry;
  return {
    ...base,
    flight_figures: serialized.flight_figures,
    confirmed_figure_id: serialized.confirmed_figure_id,
  };
}
