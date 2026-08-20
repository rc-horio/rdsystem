/**
 * map の schedules[].area 飛行エリア図（新形 / 旧形）の読み取りヘルパー。
 * Hub では主に表示・エクスポート用。保存の正本更新は map 側。
 *
 * TODO(migrate): 一括変換完了・確認後に、旧 geometry 互換分岐を削除する
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
 * - 新形 flight_figures + confirmed_figure_id
 * - 旧形 area.geometry
 */
export function resolveConfirmedGeometry(area: unknown): Record<string, any> | null {
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
            (f) => isPlainObject(f) && (f as any).id === confirmedId
          )
        : null) ?? figures[0];
    return isPlainObject(confirmed)
      ? ((confirmed as any).geometry as Record<string, any>)
      : null;
  }

  // TODO(migrate): 一括変換完了・確認後に削除
  if (hasUsableGeometry(area.geometry)) {
    return area.geometry as Record<string, any>;
  }

  return null;
}
