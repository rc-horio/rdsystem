/**
 * map の schedules[].area 飛行エリア図（新形 / 旧形）の読み取りヘルパー。
 * Hub では主に表示・エクスポート用。保存の正本更新は map 側。
 */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasUsableGeometry(g: unknown): boolean {
  if (!isPlainObject(g)) return false;
  return (
    g.flightArea != null ||
    g.takeoffArea != null ||
    g.safetyArea != null ||
    g.audienceArea != null
  );
}

/**
 * schedules[].area から確定飛行エリア図の geometry を返す。
 * 図が1件以上あれば confirmed_figure_id（無効時は先頭）を使う。
 * 旧形 area.geometry も読む。
 */
export function resolveConfirmedGeometry(
  area: unknown
): Record<string, any> | null {
  if (!isPlainObject(area)) return null;

  const figures = Array.isArray(area.flight_figures)
    ? area.flight_figures.filter(
        (f) => isPlainObject(f) && hasUsableGeometry(f.geometry)
      )
    : [];

  if (figures.length > 0) {
    const confirmedId =
      typeof area.confirmed_figure_id === "string" &&
      area.confirmed_figure_id.trim()
        ? area.confirmed_figure_id.trim()
        : null;
    const confirmed =
      (confirmedId
        ? figures.find(
            (f) => isPlainObject(f) && (f as { id?: string }).id === confirmedId
          )
        : null) ?? figures[0];
    return isPlainObject(confirmed)
      ? ((confirmed as { geometry?: unknown }).geometry as Record<string, any>)
      : null;
  }

  if (hasUsableGeometry(area.geometry)) {
    return area.geometry as Record<string, any>;
  }

  return null;
}

/** 表示・エクスポート用。area.geometry を確定図で上書きしたコピー。 */
export function withConfirmedGeometryView<T>(area: T): T {
  const src = isPlainObject(area) ? { ...area } : {};
  const geometry = resolveConfirmedGeometry(src);
  return { ...src, geometry: geometry ?? {} } as T;
}
