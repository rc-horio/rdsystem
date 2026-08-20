import type {
  FlightFigure,
  Geometry,
  NormalizedScheduleFlightArea,
} from "./types";

/** 飛行エリア図 ID（現行の generateUuid と同方式） */
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
  geometry: Geometry;
  id?: string;
}): FlightFigure {
  return {
    id: params.id ?? createFlightFigureId(),
    title: params.title.trim() || "飛行エリア図",
    geometry: params.geometry,
  };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasUsableGeometry(g: unknown): g is Geometry {
  if (!isPlainObject(g)) return false;
  return (
    g.flightArea != null ||
    g.takeoffArea != null ||
    g.safetyArea != null ||
    g.audienceArea != null
  );
}

function sanitizeFigure(raw: unknown, fallbackTitle: string): FlightFigure | null {
  if (!isPlainObject(raw)) return null;
  if (!hasUsableGeometry(raw.geometry)) return null;

  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id.trim()
      : createFlightFigureId();
  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : fallbackTitle;

  return {
    id,
    title,
    geometry: raw.geometry as Geometry,
  };
}

/**
 * schedules[].area（またはその断片）を正規化する。
 * - 新形 flight_figures があればそれを正とする
 * - 無ければ旧形 area.geometry を 1 件の飛行エリア図へ昇格
 * - 確定 ID が無効なら先頭を確定（0 件なら null）
 *
 * @param fallbackTitle 旧形変換時・title 欠落時の初期名（通常はスケジュール名）
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
    // TODO(migrate): 一括変換完了・確認後に、この旧 geometry 互換分岐を削除する
    // 旧形: area.geometry → flight_figures[0]
    figures = [
      createFlightFigure({
        title: titleFallback,
        geometry: src.geometry as Geometry,
      }),
    ];
  }

  // id 重複を排除（先勝ち）
  const seen = new Set<string>();
  figures = figures.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });

  let confirmedId: string | null =
    typeof src.confirmed_figure_id === "string" &&
    src.confirmed_figure_id.trim()
      ? src.confirmed_figure_id.trim()
      : null;

  if (figures.length === 0) {
    confirmedId = null;
  } else if (!confirmedId || !figures.some((f) => f.id === confirmedId)) {
    // 初回作成＝先頭をデフォルト確定
    confirmedId = figures[0].id;
  }

  return {
    flight_figures: figures,
    confirmed_figure_id: confirmedId,
  };
}

/**
 * 保存用に schedules[].area へマージする断片を作る（新形のみ正本）。
 * - flight_figures / confirmed_figure_id を書く
 * - 旧 geometry は書かない（呼び出し側で削除推奨）
 */
export function serializeScheduleFlightArea(
  normalized: NormalizedScheduleFlightArea
): {
  flight_figures: FlightFigure[];
  confirmed_figure_id: string | null;
} {
  const figures = normalized.flight_figures.filter((f) =>
    hasUsableGeometry(f.geometry)
  );

  let confirmedId = normalized.confirmed_figure_id;
  if (figures.length === 0) {
    confirmedId = null;
  } else if (!confirmedId || !figures.some((f) => f.id === confirmedId)) {
    confirmedId = figures[0].id;
  }

  return {
    flight_figures: figures,
    confirmed_figure_id: confirmedId,
  };
}

/** 確定図を返す。無ければ null */
export function getConfirmedFlightFigure(
  normalized: NormalizedScheduleFlightArea
): FlightFigure | null {
  const id = normalized.confirmed_figure_id;
  if (!id) return null;
  return normalized.flight_figures.find((f) => f.id === id) ?? null;
}

/**
 * schedules[].area から「地図に出す確定 geometry」を取り出す。
 * 旧形 / 新形どちらでも可（内部で normalize）。
 */
export function resolveConfirmedGeometry(
  area: unknown,
  fallbackTitle = "飛行エリア図"
): Geometry | null {
  const normalized = normalizeScheduleFlightArea(area, fallbackTitle);
  return getConfirmedFlightFigure(normalized)?.geometry ?? null;
}

/**
 * schedules[].area から、指定図 ID の geometry を取り出す。
 * 見つからない場合は null。
 */
export function resolveGeometryByFigureId(
  area: unknown,
  figureId: string,
  fallbackTitle = "飛行エリア図"
): Geometry | null {
  const id = figureId.trim();
  if (!id) return null;
  const normalized = normalizeScheduleFlightArea(area, fallbackTitle);
  const figure = normalized.flight_figures.find((f) => f.id === id);
  return figure?.geometry ?? null;
}

/**
 * 確定図の geometry を差し替える。図が無ければ 1 件作成して確定にする。
 * （地図エディタの保存＝確定図の更新、という現行 UX 向け）
 */
export function upsertConfirmedGeometry(
  area: unknown,
  geometry: Geometry,
  fallbackTitle = "飛行エリア図"
): NormalizedScheduleFlightArea {
  const title = fallbackTitle.trim() || "飛行エリア図";
  const normalized = normalizeScheduleFlightArea(area, title);

  if (normalized.flight_figures.length === 0) {
    const figure = createFlightFigure({ title, geometry });
    return {
      flight_figures: [figure],
      confirmed_figure_id: figure.id,
    };
  }

  const confirmedId =
    normalized.confirmed_figure_id ?? normalized.flight_figures[0].id;

  return {
    flight_figures: normalized.flight_figures.map((f) =>
      f.id === confirmedId ? { ...f, geometry } : f
    ),
    confirmed_figure_id: confirmedId,
  };
}

/**
 * 指定図IDの geometry を更新し、その図を confirmed にする。
 * 指定IDが存在しない場合は、既存の confirmed 更新へフォールバック。
 */
export function upsertGeometryForFigure(
  area: unknown,
  figureId: string | undefined,
  geometry: Geometry,
  fallbackTitle = "飛行エリア図"
): NormalizedScheduleFlightArea {
  const normalized = normalizeScheduleFlightArea(area, fallbackTitle);
  const id = typeof figureId === "string" ? figureId.trim() : "";
  if (!id || !normalized.flight_figures.some((f) => f.id === id)) {
    return upsertConfirmedGeometry(area, geometry, fallbackTitle);
  }

  return {
    flight_figures: normalized.flight_figures.map((f) =>
      f.id === id ? { ...f, geometry } : f
    ),
    confirmed_figure_id: id,
  };
}

/**
 * 確定を切り替える。指定 id が存在しない場合は変更しない。
 */
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

/**
 * 図を末尾追加。figures が空なら追加した図を確定にする。
 */
export function appendFlightFigure(
  normalized: NormalizedScheduleFlightArea,
  figure: FlightFigure
): NormalizedScheduleFlightArea {
  const nextFigures = [...normalized.flight_figures, figure];
  return {
    flight_figures: nextFigures,
    confirmed_figure_id:
      normalized.confirmed_figure_id ?? figure.id,
  };
}

/**
 * 図を削除。削除したのが確定なら先頭を新しい確定にする。
 */
export function removeFlightFigure(
  normalized: NormalizedScheduleFlightArea,
  figureId: string
): NormalizedScheduleFlightArea {
  const nextFigures = normalized.flight_figures.filter((f) => f.id !== figureId);
  if (nextFigures.length === 0) {
    return { flight_figures: [], confirmed_figure_id: null };
  }

  const confirmedStillExists = nextFigures.some(
    (f) => f.id === normalized.confirmed_figure_id
  );

  return {
    flight_figures: nextFigures,
    confirmed_figure_id: confirmedStillExists
      ? normalized.confirmed_figure_id
      : nextFigures[0].id,
  };
}

/**
 * area オブジェクトへ新形を書き込み、旧 geometry キーを取り除いた次の area を返す。
 * （他の area フィールドは維持）
 */
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
