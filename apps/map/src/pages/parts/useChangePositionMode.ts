import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { Point } from "@/features/types";
import { closeDetailBar } from "./SideDetailBar";
import { getGMaps } from "./getGMaps";

export function useChangePositionMode(args: {
  mapRef: MutableRefObject<google.maps.Map | null>;
  mapDivRef: MutableRefObject<HTMLDivElement | null>;
  infoRef: MutableRefObject<google.maps.InfoWindow | null>;
  selectedMarkerRef: MutableRefObject<google.maps.Marker | null>;
  currentPointRef: MutableRefObject<Point | null>;
  pointByMarkerRef: MutableRefObject<WeakMap<google.maps.Marker, Point>>;
  editable: boolean;
  notifyPositionUpdated: () => void;
}) {
  const {
    mapRef,
    mapDivRef,
    infoRef,
    selectedMarkerRef,
    currentPointRef,
    pointByMarkerRef,
    editable,
    notifyPositionUpdated,
  } = args;

  const changingPositionRef = useRef(false);
  const [isChangingPosition, setIsChangingPosition] = useState(false);
  const changePositionInfoRef = useRef<google.maps.InfoWindow | null>(null);
  const changePositionCandidateRef = useRef<{
    lat: number;
    lng: number;
  } | null>(null);

  const startChangePositionMode = () => {
    // 座標変更モード開始
    changingPositionRef.current = true;
    setIsChangingPosition(true);
    changePositionCandidateRef.current = null;

    // カーソル変更
    const map = mapRef.current;
    map?.setOptions({ draggableCursor: "copy" });

    // いったん既存のマーカー吹き出しは閉じる
    infoRef.current?.close();

    // 座標変更モードに入ったら詳細バーを閉じる（リストバーの選択はそのまま）
    closeDetailBar();
  };

  const cancelChangePosition = () => {
    // 座標変更モードを終了
    changingPositionRef.current = false;
    setIsChangingPosition(false);

    // 候補クリア & 吹き出しを閉じる
    changePositionCandidateRef.current = null;
    changePositionInfoRef.current?.close();
    infoRef.current?.close();

    // カーソルを元に戻す
    const map = mapRef.current;
    map?.setOptions({ draggableCursor: undefined });
  };

  /** 空港高さ制限照会モード開始時に座標変更モードを終了 */
  useEffect(() => {
    const onStart = () => {
      cancelChangePosition();
    };
    window.addEventListener("map:start-airport-height-restriction", onStart);
    return () => window.removeEventListener("map:start-airport-height-restriction", onStart);
  }, []);

  const openChangePositionConfirm = (
    latLng: google.maps.LatLng,
    lat: number,
    lng: number
  ) => {
    const map = mapRef.current;
    const gmaps = getGMaps();
    if (!map) return;

    if (!changePositionInfoRef.current) {
      changePositionInfoRef.current = new gmaps.InfoWindow();
    }

    changePositionCandidateRef.current = { lat, lng };

    const container = document.createElement("div");
    container.style.background = "white";
    container.style.padding = "8px 10px";
    container.style.borderRadius = "6px";
    container.style.fontSize = "13px";
    container.style.minWidth = "200px";
    container.style.color = "#222";

    const title = document.createElement("div");
    title.style.fontWeight = "600";
    title.style.marginBottom = "4px";
    title.textContent = "この地点にマーカーを移動しますか？";

    const coord = document.createElement("div");
    coord.style.fontFamily = "monospace";
    coord.style.fontSize = "12px";
    coord.style.color = "#444";
    coord.style.marginBottom = "6px";
    coord.textContent = `lat: ${lat.toFixed(6)}, lng: ${lng.toFixed(6)}`;

    const btnWrap = document.createElement("div");
    btnWrap.style.textAlign = "right";

    const yesBtn = document.createElement("button");
    yesBtn.textContent = "はい";
    yesBtn.style.padding = "2px 8px";
    yesBtn.style.marginRight = "4px";

    const noBtn = document.createElement("button");
    noBtn.textContent = "キャンセル";
    noBtn.style.padding = "2px 8px";

    btnWrap.appendChild(yesBtn);
    btnWrap.appendChild(noBtn);

    container.appendChild(title);
    container.appendChild(coord);
    container.appendChild(btnWrap);

    yesBtn.addEventListener("click", () => {
      const candidate = changePositionCandidateRef.current;
      const marker = selectedMarkerRef.current;
      const point = currentPointRef.current;

      if (candidate && marker && point) {
        const newLatLng = new gmaps.LatLng(candidate.lat, candidate.lng);
        marker.setPosition(newLatLng);

        const updatedPoint: Point = {
          ...point,
          lat: candidate.lat,
          lng: candidate.lng,
        };

        currentPointRef.current = updatedPoint;
        pointByMarkerRef.current.set(marker, updatedPoint);
      }

      // モード終了
      cancelChangePosition();

      // トースト表示
      notifyPositionUpdated();
    });

    noBtn.addEventListener("click", () => {
      // もう一度クリックさせたいので、ヒントだけ再表示
      setIsChangingPosition(true);
      changePositionCandidateRef.current = null;
      changePositionInfoRef.current?.close();
    });

    changePositionInfoRef.current.setContent(container);
    changePositionInfoRef.current.setPosition(latLng);
    changePositionInfoRef.current.open(map);
  };

  // 座標変更モード中に、マップ以外がクリックされたらモード解除
  useEffect(() => {
    if (!editable) return;

    const handleDocumentClick = (e: MouseEvent) => {
      // モード中でなければ何もしない
      if (!changingPositionRef.current) return;

      const target = e.target as Node | null;
      const mapEl = mapDivRef.current;
      const hintLayer = document.querySelector(".add-area-hint-layer");

      const clickedInsideMap = !!(mapEl && target && mapEl.contains(target));
      const clickedInsideHint = !!(
        hintLayer &&
        target &&
        hintLayer.contains(target)
      );

      // マップでもヒントレイヤーでもなければ、座標変更モードを終了
      if (!clickedInsideMap && !clickedInsideHint) {
        cancelChangePosition();
      }
    };

    // キャプチャフェーズで拾っておく（他のハンドラより前に動く）
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [editable]);

  return {
    changingPositionRef,
    isChangingPosition,
    setIsChangingPosition,
    startChangePositionMode,
    cancelChangePosition,
    openChangePositionConfirm,
  };
}
