// src/pages/parts/hook/useAddAreaMode.ts
import { useEffect, useRef, useState } from "react";

type Draft = {
    lat: number;
    lng: number;
    prefecture: string | null;
    address: string | null;
} | null;

const getGMaps = () =>
    (window as any).google.maps as typeof google.maps;

export function useAddAreaMode(
    mapRef: React.MutableRefObject<google.maps.Map | null>
) {
    const [addingAreaMode, setAddingAreaMode] = useState(false);
    const addingAreaModeRef = useRef(false);
    // クリックされた座標＋住所などのドラフト情報
    const [newAreaDraft, setNewAreaDraft] = useState<Draft>(null);
    const [areaNameInput, setAreaNameInput] = useState("");
    const addAreaConfirmInfoRef = useRef<google.maps.InfoWindow | null>(null);

    const resetDraft = () => {
        setNewAreaDraft(null);
        setAreaNameInput("");
    };

    const cancelAddMode = () => {
        addingAreaModeRef.current = false;
        setAddingAreaMode(false);
        resetDraft();
        addAreaConfirmInfoRef.current?.close();
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

    const openAddAreaConfirm = (
        latLng: google.maps.LatLng,
        draft: NonNullable<Draft>
    ) => {
        const map = mapRef.current;
        const gmaps = getGMaps();
        if (!map) return;

        if (!addAreaConfirmInfoRef.current) {
            addAreaConfirmInfoRef.current = new gmaps.InfoWindow();
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
      <div style="font-family: monospace; font-size: 12px; color: #444; margin-bottom: 6px;">
        ${draft.address}
      </div>
    `;

        const yesBtn = document.createElement("button");
        yesBtn.textContent = "はい";
        yesBtn.style.padding = "2px 8px";
        yesBtn.style.marginRight = "4px";

        const noBtn = document.createElement("button");
        noBtn.textContent = "いいえ";
        noBtn.style.padding = "2px 8px";

        const btnWrap = document.createElement("div");
        btnWrap.style.textAlign = "right";
        btnWrap.appendChild(yesBtn);
        btnWrap.appendChild(noBtn);
        container.appendChild(btnWrap);

        yesBtn.addEventListener("click", () => {
            setNewAreaDraft(draft);
            setAreaNameInput("");
            setAddingAreaMode(false);
            addingAreaModeRef.current = false;
            addAreaConfirmInfoRef.current?.close();
        });

        noBtn.addEventListener("click", () => {
            addAreaConfirmInfoRef.current?.close();
        });

        addAreaConfirmInfoRef.current.setContent(container);
        addAreaConfirmInfoRef.current.setPosition(latLng);
        addAreaConfirmInfoRef.current.open(map);
    };

    // 「エリア追加モード開始」イベント
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

    // 追加モード中のカーソル変更
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (addingAreaMode) {
            map.setOptions({ draggableCursor: "copy" });
        } else {
            map.setOptions({ draggableCursor: undefined });
        }
    }, [addingAreaMode, mapRef]);

    // Esc キーで追加モードをキャンセル
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

    // 地図クリック → 逆ジオコーディング → 確認ダイアログ
    // 座標＋都道府県を取得
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const listener = map.addListener(
            "click",
            async (e: google.maps.MapMouseEvent) => {
                const latLng = e.latLng;
                if (!latLng) return;
                if (!addingAreaModeRef.current) return;

                const lat = latLng.lat();
                const lng = latLng.lng();

                const { prefecture, address } = await reverseGeocodePrefecture(
                    lat,
                    lng
                );

                console.log("[map] clicked point:", {
                    lat,
                    lng,
                    prefecture,
                    address,
                });

                const draft = { lat, lng, prefecture, address };
                openAddAreaConfirm(latLng, draft);
            }
        );

        return () => {
            listener.remove();
        };
    }, [mapRef, addingAreaMode]);

    return {
        addingAreaMode,
        newAreaDraft,
        areaNameInput,
        setAreaNameInput,
        cancelAddMode,
        resetDraft,
    };
}
