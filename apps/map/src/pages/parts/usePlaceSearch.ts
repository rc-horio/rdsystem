import { useEffect, type MutableRefObject } from "react";
import {
  ADD_AREA_EMPTY_MESSAGE,
  ADD_AREA_ERROR_MESSAGE,
  EV_ADD_AREA_RESULT_COORDS,
  EV_ADD_AREA_SELECT_RESULT,
  EV_PLACE_SEARCH_ADD,
  EV_PLACE_SEARCH_CLEAR,
  EV_PLACE_SEARCH_PREVIEW,
  SELECT_ZOOM_DESKTOP,
  SELECT_ZOOM_MOBILE,
} from "./constants/events";
import { getGMaps } from "./getGMaps";
import type { AddAreaSearchResult } from "./placeSearch";
import {
  googleMapsUrlForPlace,
  placeDisplayName,
  placePreviewPanOffsetX,
  placesLocationBiasFromMapCenter,
  splitPlaceFormattedAddress,
} from "./placeSearch";

export function usePlaceSearch(args: {
  mapRef: MutableRefObject<google.maps.Map | null>;
  placePreviewInfoRef: MutableRefObject<google.maps.InfoWindow | null>;
  placePreviewPlaceRef: MutableRefObject<{
    lat: number;
    lng: number;
    label: string;
    name: string;
    postalCode: string;
    address: string;
    placeId: string;
  } | null>;
}) {
  const { mapRef, placePreviewInfoRef, placePreviewPlaceRef } = args;

  // エリア追加モード時の検索を送信
  useEffect(() => {
    const onSearch = async (e: Event) => {
      const q =
        (e as CustomEvent<{ query?: string }>).detail?.query?.trim() ?? "";
      if (!q) return;

      const map = mapRef.current;
      if (!map) {
        window.dispatchEvent(
          new CustomEvent("map:add-area-search-result", {
            detail: {
              status: "error" as const,
              results: [],
              message: ADD_AREA_ERROR_MESSAGE,
            },
          })
        );
        return;
      }

      try {
        const gmaps = getGMaps();
        const { Place, SearchByTextRankPreference } = (await gmaps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;

        const locationBias = placesLocationBiasFromMapCenter(map.getCenter());
        const req = {
          textQuery: q,
          region: "JP",
          language: "ja",
          maxResultCount: 10,
          rankPreference: SearchByTextRankPreference.RELEVANCE,
          ...(locationBias ? { locationBias } : {}),
          fields: ["id", "displayName", "formattedAddress"],
        };

        const { places } = await Place.searchByText(req);

        if (!places || places.length === 0) {
          window.dispatchEvent(
            new CustomEvent("map:add-area-search-result", {
              detail: {
                status: "empty" as const,
                results: [],
                message: ADD_AREA_EMPTY_MESSAGE,
              },
            })
          );
          return;
        }

        const formatted: AddAreaSearchResult[] = places
          .slice(0, 10)
          .flatMap((p) => {
            const placeId = p.id;
            if (!placeId) return [];

            const name = placeDisplayName(p.displayName);
            const formattedAddress =
              typeof p.formattedAddress === "string" ? p.formattedAddress : "";
            const { postalCode, address } =
              splitPlaceFormattedAddress(formattedAddress);
            const label = `${name}${address ? " / " + address : ""}`.trim();

            return [
              {
                placeId,
                label: label || "(名称不明)",
                name,
                postalCode,
                address,
              },
            ];
          });

        if (formatted.length === 0) {
          window.dispatchEvent(
            new CustomEvent("map:add-area-search-result", {
              detail: {
                status: "empty" as const,
                results: [],
                message: ADD_AREA_EMPTY_MESSAGE,
              },
            })
          );
          return;
        }

        window.dispatchEvent(
          new CustomEvent("map:add-area-search-result", {
            detail: {
              status: "ok" as const,
              results: formatted,
              message: null,
            },
          })
        );
      } catch (err) {
        console.warn("[add-area] Place.searchByText failed:", err);
        window.dispatchEvent(
          new CustomEvent("map:add-area-search-result", {
            detail: {
              status: "error" as const,
              results: [],
              message: ADD_AREA_ERROR_MESSAGE,
            },
          })
        );
      }
    };

    window.addEventListener("map:search-add-area", onSearch as EventListener);
    return () =>
      window.removeEventListener(
        "map:search-add-area",
        onSearch as EventListener
      );
  }, []);

  // 場所検索の候補選択：地図を寄せ、最初の吹き出しで追加するか聞く
  useEffect(() => {
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const closePreviewBalloon = () => {
      placePreviewInfoRef.current?.close();
    };

    const isInsidePreviewBalloon = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return false;
      const balloon = document.querySelector(".place-preview-balloon");
      if (!balloon) return false;
      if (balloon.contains(target)) return true;
      const frame = balloon.closest(
        ".gm-style-iw-a, .gm-style-iw-t, .gm-style-iw-c, .gm-style-iw"
      );
      return !!frame?.contains(target);
    };

    const onPointerDownOutside = (e: PointerEvent) => {
      if (!document.querySelector(".place-preview-balloon")) return;
      if (isInsidePreviewBalloon(e.target)) return;
      closePreviewBalloon();
    };

    const renderPreviewBalloon = () => {
      const place = placePreviewPlaceRef.current;
      const map = mapRef.current;
      const gmaps = (window as unknown as { google?: typeof google }).google?.maps;
      if (!place || !map || !gmaps) return;

      if (!placePreviewInfoRef.current) {
        placePreviewInfoRef.current = new gmaps.InfoWindow({
          disableAutoPan: true,
        });
      }

      const editOn = document.body.classList.contains("editing-on");

      const heading = [
        place.name,
        place.postalCode,
        place.address,
      ]
        .filter((line) => line.trim().length > 0)
        .map((line) => `<div>${escapeHtml(line)}</div>`)
        .join("");

      const mapsUrl = googleMapsUrlForPlace({
        placeId: place.placeId,
        name: place.name,
        lat: place.lat,
        lng: place.lng,
      });

      const registerBlock = editOn
        ? `
        <div class="place-preview-balloon__actions">
          <button type="button" data-place-preview="add">この場所で追加する</button>
        </div>
      `
        : "";

      const container = document.createElement("div");
      container.className = "place-preview-balloon";
      container.innerHTML = `
        <div class="place-preview-balloon__place">${heading || escapeHtml(place.label)}</div>
        <a
          class="place-preview-balloon__maps"
          href="${escapeHtml(mapsUrl)}"
          target="_blank"
          rel="noopener noreferrer"
        >Google マップで開く</a>
        ${registerBlock}
      `;
      container
        .querySelector('[data-place-preview="add"]')
        ?.addEventListener("click", () => {
          window.dispatchEvent(
            new CustomEvent(EV_PLACE_SEARCH_ADD, { detail: place })
          );
        });

      placePreviewInfoRef.current.setContent(container);
      placePreviewInfoRef.current.setPosition({
        lat: place.lat,
        lng: place.lng,
      });
      placePreviewInfoRef.current.open(map);
    };

    const onPreview = (e: Event) => {
      const d =
        (
          e as CustomEvent<{
            lat?: number;
            lng?: number;
            label?: string;
            name?: string;
            postalCode?: string;
            address?: string;
            placeId?: string;
          }>
        ).detail || {};
      if (typeof d.lat !== "number" || typeof d.lng !== "number") return;
      const map = mapRef.current;
      if (!map) return;

      placePreviewPlaceRef.current = {
        lat: d.lat,
        lng: d.lng,
        label: d.label?.trim() || "",
        name: d.name?.trim() || "",
        postalCode: d.postalCode?.trim() || "",
        address: d.address?.trim() || "",
        placeId: d.placeId?.trim() || "",
      };

      map.panTo({ lat: d.lat, lng: d.lng });
      const target = window.matchMedia?.("(max-width: 767px)").matches
        ? SELECT_ZOOM_MOBILE
        : SELECT_ZOOM_DESKTOP;
      window.setTimeout(() => {
        map.setZoom(target);
        const dx = placePreviewPanOffsetX(map);
        if (dx > 0) map.panBy(-dx, 0);
      }, 120);

      renderPreviewBalloon();
    };

    const onAdd = () => closePreviewBalloon();
    const onClear = () => closePreviewBalloon();

    let editWasOn = document.body.classList.contains("editing-on");
    const onEditModeClass = () => {
      const editOn = document.body.classList.contains("editing-on");
      if (editOn === editWasOn) return;
      editWasOn = editOn;
      if (!document.querySelector(".place-preview-balloon")) return;
      renderPreviewBalloon();
    };
    const editModeObserver = new MutationObserver(onEditModeClass);
    editModeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener(EV_PLACE_SEARCH_PREVIEW, onPreview as EventListener);
    window.addEventListener(EV_PLACE_SEARCH_ADD, onAdd);
    window.addEventListener(EV_PLACE_SEARCH_CLEAR, onClear);
    document.addEventListener("pointerdown", onPointerDownOutside, true);
    return () => {
      window.removeEventListener(
        EV_PLACE_SEARCH_PREVIEW,
        onPreview as EventListener
      );
      window.removeEventListener(EV_PLACE_SEARCH_ADD, onAdd);
      window.removeEventListener(EV_PLACE_SEARCH_CLEAR, onClear);
      document.removeEventListener("pointerdown", onPointerDownOutside, true);
      editModeObserver.disconnect();
      closePreviewBalloon();
    };
  }, []);

  // 検索結果を選択した場合の座標を取得
  useEffect(() => {
    const onSelectResult = async (e: Event) => {
      const placeId =
        (e as CustomEvent<{ placeId?: string }>).detail?.placeId ?? "";
      if (!placeId) return;

      const map = mapRef.current;
      if (!map) return;

      try {
        const gmaps = getGMaps();
        const { Place } = (await gmaps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;

        const place = new Place({ id: placeId });

        // geometry ではなく location を取る（Place の新API）
        await place.fetchFields({ fields: ["location"] });

        const loc = place.location;
        if (!loc) {
          console.warn("[add-area] location missing:", { placeId });
          window.dispatchEvent(
            new CustomEvent(EV_ADD_AREA_RESULT_COORDS, { detail: { placeId } })
          );
          return;
        }

        const lat = loc.lat();
        const lng = loc.lng();

        console.log("[add-area] resolved coords:", { placeId, lat, lng });

        window.dispatchEvent(
          new CustomEvent(EV_ADD_AREA_RESULT_COORDS, {
            detail: { placeId, lat, lng },
          })
        );
      } catch (err) {
        console.warn("[add-area] Place.fetchFields failed:", { placeId, err });
        window.dispatchEvent(
          new CustomEvent(EV_ADD_AREA_RESULT_COORDS, { detail: { placeId } })
        );
      }
    };

    window.addEventListener(
      EV_ADD_AREA_SELECT_RESULT,
      onSelectResult as EventListener
    );
    return () =>
      window.removeEventListener(
        EV_ADD_AREA_SELECT_RESULT,
        onSelectResult as EventListener
      );
  }, []);
}
