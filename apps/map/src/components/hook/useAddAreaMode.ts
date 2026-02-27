// src/pages/parts/hook/useAddAreaMode.ts
import { useEffect, useRef, useState } from "react";
import { SELECT_ZOOM_DESKTOP, SELECT_ZOOM_MOBILE } from "../../pages/parts/constants/events";

type Draft = {
    lat: number;
    lng: number;
    prefecture: string | null;
    address: string | null;
    /** 高さ制限（m）。空港高さ制限照会結果から自動設定 */
    heightLimitM?: string | null;
    /** 詳細タブ「制限」欄用。DJI NFZ 該当時の文言 */
    djiNfzRestrictions?: string | null;
} | null;

const getGMaps = () =>
    (window as any).google.maps as typeof google.maps;

export type AddAreaConfirmExtraContent = {
    html: string;
    heightLimitM?: string;
    /** 詳細タブ「制限」欄用。DJI NFZ 該当時の文言 */
    djiNfzRestrictions?: string;
};

export type GetAddAreaConfirmExtraContent = (
    lat: number,
    lng: number
) => Promise<string | AddAreaConfirmExtraContent>;

export function useAddAreaMode(
    mapRef: React.MutableRefObject<google.maps.Map | null>,
    options?: { getAddAreaConfirmExtraContent?: GetAddAreaConfirmExtraContent }
) {
    const getAddAreaConfirmExtraContent = options?.getAddAreaConfirmExtraContent;
    const [addingAreaMode, setAddingAreaMode] = useState(false);
    const addingAreaModeRef = useRef(false);
    // クリックされた座標＋住所などのドラフト情報
    const [newAreaDraft, setNewAreaDraft] = useState<Draft>(null);
    const [areaNameInput, setAreaNameInput] = useState("");
    const addAreaConfirmInfoRef = useRef<google.maps.InfoWindow | null>(null);

    /** ドラフト情報をリセット */
    const resetDraft = () => {
        setNewAreaDraft(null);
        setAreaNameInput("");
    };

    /** 追加モードをキャンセル */
    const cancelAddMode = () => {
        addingAreaModeRef.current = false;
        setAddingAreaMode(false);
        resetDraft();
        addAreaConfirmInfoRef.current?.close();

        window.dispatchEvent(
            new CustomEvent("map:add-area-mode-changed", {
                detail: { active: false },
            })
        );
    };


    /** クリックした座標から住所＋都道府県を取得 */
    const reverseGeocodePrefecture = async (
        lat: number,
        lng: number
    ): Promise<{ prefecture: string | null; address: string | null }> => {
        const gmaps = getGMaps();
        const geocoder = new gmaps.Geocoder();

        return new Promise((resolve) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status !== "OK" || !results || results.length === 0) {
                    console.warn("[map] geocode failed:", status);
                    resolve({ prefecture: null, address: null });
                    return;
                }

                const components = results[0].address_components || [];
                const formatted = results[0].formatted_address ?? null;

                const prefComp = components.find((c) =>
                    c.types.includes("administrative_area_level_1")
                );

                let displayAddress: string | null = formatted;

                if (prefComp && formatted) {
                    const prefName = prefComp.long_name;
                    const idx = formatted.indexOf(prefName);

                    if (idx >= 0) {
                        displayAddress = formatted.slice(idx);
                    }
                }

                resolve({
                    prefecture: prefComp?.long_name ?? null,
                    address: displayAddress,
                });
            });
        });
    };

    /** 追加モード確認ダイアログを表示 */
    const openAddAreaConfirm = async (
        latLng: google.maps.LatLng,
        draft: NonNullable<Draft>
    ) => {
        const map = mapRef.current;
        const gmaps = getGMaps();
        if (!map) return;

        if (!addAreaConfirmInfoRef.current) {
            addAreaConfirmInfoRef.current = new gmaps.InfoWindow();
        }

        let extraHtml = "";
        let heightLimitM: string | null = null;
        let djiNfzRestrictions: string | null = null;
        if (getAddAreaConfirmExtraContent) {
            try {
                const extra = await getAddAreaConfirmExtraContent(
                    draft.lat,
                    draft.lng
                );
                if (typeof extra === "string") {
                    extraHtml = extra;
                } else {
                    extraHtml = extra.html;
                    heightLimitM = extra.heightLimitM ?? null;
                    djiNfzRestrictions = extra.djiNfzRestrictions ?? null;
                }
            } catch {
                extraHtml = "";
            }
        }

        const container = document.createElement("div");
        container.style.background = "white";
        container.style.padding = "8px 10px";
        container.style.borderRadius = "6px";
        container.style.fontSize = "13px";
        container.style.minWidth = "180px";
        container.style.color = "#222";

        container.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">
        このエリアを登録しますか？
      </div>
      <div style="font-family: monospace; font-size: 12px; color: #444; margin-bottom: 8px;">
        ${(draft.address ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")}
      </div>
      <div style="text-align: right; margin-bottom: 12px;">
        <button type="button" id="add-area-yes-btn" style="padding: 2px 8px; margin-right: 4px;">はい</button>
        <button type="button" id="add-area-no-btn" style="padding: 2px 8px;">いいえ</button>
      </div>
      ${extraHtml ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">${extraHtml}</div>` : ""}
    `;

        const yesBtn = container.querySelector("#add-area-yes-btn") as HTMLButtonElement;
        const noBtn = container.querySelector("#add-area-no-btn") as HTMLButtonElement;

        yesBtn?.addEventListener("click", () => {
            setNewAreaDraft({ ...draft, heightLimitM, djiNfzRestrictions });
            setAreaNameInput("");
            setAddingAreaMode(false);
            addingAreaModeRef.current = false;
            addAreaConfirmInfoRef.current?.close();
        });

        noBtn?.addEventListener("click", () => {
            addAreaConfirmInfoRef.current?.close();
        });

        addAreaConfirmInfoRef.current.setContent(container);
        addAreaConfirmInfoRef.current.setPosition(latLng);
        addAreaConfirmInfoRef.current.open(map);
    };

    /** 地図を寄せる */
    const zoomTo = (latLng: google.maps.LatLng) => {
        const map = mapRef.current;
        if (!map) return;

        map.panTo(latLng);

        const target = window.matchMedia?.("(max-width: 767px)").matches
            ? SELECT_ZOOM_MOBILE
            : SELECT_ZOOM_DESKTOP;

        // 少し遅らせると pan → zoom が自然になります
        window.setTimeout(() => {
            map.setZoom(target);
        }, 120);
    };

    /** 「エリア追加モード開始」イベント */
    useEffect(() => {
        const onStartAddArea = () => {
            console.log("[map] start add-area mode");
            setAddingAreaMode(true);
            addingAreaModeRef.current = true;
            setNewAreaDraft(null);
            addAreaConfirmInfoRef.current?.close();
        };

        window.addEventListener("map:start-add-area", onStartAddArea);
        return () => {
            window.removeEventListener("map:start-add-area", onStartAddArea);
        };
    }, []);

    /** 追加モード中のカーソル変更 */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (addingAreaMode) {
            map.setOptions({ draggableCursor: "copy" });
        } else {
            map.setOptions({ draggableCursor: undefined });
        }
    }, [addingAreaMode, mapRef]);

    /** Esc キーで追加モードをキャンセル */
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && addingAreaModeRef.current) {
                cancelAddMode();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, []);

    /** 地図クリック → 逆ジオコーディング → 確認ダイアログ */
    // 座標＋都道府県を取得
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const listener = map.addListener("click", async (e: google.maps.MapMouseEvent) => {
            const latLng = e.latLng;
            if (!latLng) return;
            if (!addingAreaModeRef.current) return;

            // ★追加：選択地点へズーム
            zoomTo(latLng);

            const lat = latLng.lat();
            const lng = latLng.lng();

            const { prefecture, address } = await reverseGeocodePrefecture(lat, lng);

            const draft = { lat, lng, prefecture, address };
            openAddAreaConfirm(latLng, draft);
        });


        return () => {
            listener.remove();
        };
    }, [mapRef, addingAreaMode, getAddAreaConfirmExtraContent]);

    /** エリア追加モードの状態を外部に通知 */
    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent("map:add-area-mode-changed", {
                detail: { active: addingAreaMode }
            })
        );
    }, [addingAreaMode]);

    /** 検索結果を選択した場合の座標を取得 */
    useEffect(() => {
        const onPicked = async (e: Event) => {
            const d = (e as CustomEvent<{ lat?: number; lng?: number; label?: string | null }>).detail || {};
            const lat = d.lat;
            const lng = d.lng;
            if (typeof lat !== "number" || typeof lng !== "number") return;

            const map = mapRef.current;
            if (!map) return;

            if (!addingAreaModeRef.current) return;

            const gmaps = getGMaps();
            const latLng = new gmaps.LatLng(lat, lng);

            // ★追加：選択地点へズーム
            zoomTo(latLng);

            const { prefecture, address } = await reverseGeocodePrefecture(lat, lng);
            const draft = {
                lat,
                lng,
                prefecture,
                address: (d.label?.trim() || address) ?? null,
            };

            openAddAreaConfirm(latLng, draft);
        };

        window.addEventListener("map:add-area-picked", onPicked as EventListener);
        return () =>
            window.removeEventListener("map:add-area-picked", onPicked as EventListener);
    }, [mapRef, getAddAreaConfirmExtraContent]);

    return {
        addingAreaMode,
        newAreaDraft,
        areaNameInput,
        setAreaNameInput,
        cancelAddMode,
        resetDraft,
    };
}
