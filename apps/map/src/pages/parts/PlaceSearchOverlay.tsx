import { useEffect, useRef, useState } from "react";
import {
  ADD_AREA_EMPTY_MESSAGE,
  ADD_AREA_ERROR_MESSAGE,
  CLS_DETAILBAR_OPEN,
  EV_ADD_AREA_RESULT_COORDS,
  EV_ADD_AREA_SELECT_RESULT,
  EV_DETAILBAR_SELECTED,
  EV_PLACE_SEARCH_ADD,
  EV_PLACE_SEARCH_CLEAR,
  EV_PLACE_SEARCH_PREVIEW,
  EV_SIDEBAR_SET_ACTIVE,
} from "./constants/events";
import { closeDetailBar } from "./SideDetailBar";

type PlaceSearchStatus = "idle" | "ok" | "empty" | "error";
type PlaceSearchResult = {
  placeId: string;
  label: string;
  name: string;
  postalCode: string;
  address: string;
};

type PlaceSearchEventDetail = {
  status?: PlaceSearchStatus;
  results?: PlaceSearchResult[];
  message?: string | null;
};

const requestPlaceCoords = (
  placeId: string
): Promise<{ lat: number; lng: number } | null> =>
  new Promise((resolve, reject) => {
    let timer: number | null = null;

    const onResp = (e: Event) => {
      const d =
        (
          e as CustomEvent<{
            placeId?: string;
            lat?: number;
            lng?: number;
          }>
        ).detail || {};
      if (d.placeId !== placeId) return;

      window.removeEventListener(
        EV_ADD_AREA_RESULT_COORDS,
        onResp as EventListener
      );
      if (timer != null) window.clearTimeout(timer);

      if (typeof d.lat === "number" && typeof d.lng === "number") {
        resolve({ lat: d.lat, lng: d.lng });
      } else {
        resolve(null);
      }
    };

    window.addEventListener(EV_ADD_AREA_RESULT_COORDS, onResp as EventListener);
    window.dispatchEvent(
      new CustomEvent(EV_ADD_AREA_SELECT_RESULT, { detail: { placeId } })
    );

    timer = window.setTimeout(() => {
      window.removeEventListener(
        EV_ADD_AREA_RESULT_COORDS,
        onResp as EventListener
      );
      reject(new Error("map からの座標応答がありません"));
    }, 1500);
  });

export default function PlaceSearchOverlay() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<PlaceSearchStatus>("idle");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const submitSearch = () => {
    const q = query.trim();
    if (!q) return;
    closeDetailBar();
    setOpen(true);
    setSelectedId(null);
    setResults([]);
    setStatus("idle");
    setMessage(null);
    window.dispatchEvent(
      new CustomEvent("map:search-add-area", {
        detail: { query: q },
      })
    );
  };

  const clearQuery = () => {
    setQuery("");
    setOpen(false);
    setSelectedId(null);
    setResults([]);
    setStatus("idle");
    setMessage(null);
    window.dispatchEvent(new Event(EV_PLACE_SEARCH_CLEAR));
    inputRef.current?.focus();
  };

  const pickPlace = async (place: PlaceSearchResult) => {
    try {
      const coords = await requestPlaceCoords(place.placeId);
      if (!coords) return;
      setSelectedId(place.placeId);
      window.dispatchEvent(
        new CustomEvent(EV_PLACE_SEARCH_PREVIEW, {
          detail: {
            lat: coords.lat,
            lng: coords.lng,
            label: place.label,
            name: place.name,
            postalCode: place.postalCode,
            address: place.address,
            placeId: place.placeId,
          },
        })
      );
    } catch (e) {
      console.warn("[place-search] failed to resolve coords:", place, e);
    }
  };

  useEffect(() => {
    const onResult = (e: Event) => {
      const d = (e as CustomEvent<PlaceSearchEventDetail>).detail || {};
      const next = Array.isArray(d.results) ? d.results : [];
      const nextStatus = d.status ?? (next.length > 0 ? "ok" : "empty");
      setResults(next);
      setOpen(true);
      if (nextStatus === "error") {
        setStatus("error");
        setMessage(d.message ?? ADD_AREA_ERROR_MESSAGE);
        return;
      }
      if (nextStatus === "empty" || next.length === 0) {
        setStatus("empty");
        setMessage(d.message ?? ADD_AREA_EMPTY_MESSAGE);
        return;
      }
      setStatus("ok");
      setMessage(null);
    };

    window.addEventListener(
      "map:add-area-search-result",
      onResult as EventListener
    );
    return () =>
      window.removeEventListener(
        "map:add-area-search-result",
        onResult as EventListener
      );
  }, []);

  useEffect(() => {
    const onAdded = () => {
      setOpen(false);
      setSelectedId(null);
    };
    window.addEventListener(EV_PLACE_SEARCH_ADD, onAdded);
    return () => window.removeEventListener(EV_PLACE_SEARCH_ADD, onAdded);
  }, []);

  useEffect(() => {
    const closeList = () => setOpen(false);
    let detailbarWasOpen = document.body.classList.contains(CLS_DETAILBAR_OPEN);

    const onPointerDown = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      if (rootRef.current?.contains(el)) return;
      if (el.closest("#sidebar, #detailbar, #sidebarToggle")) closeList();
    };

    const onDetailSelected = (e: Event) => {
      if ((e as CustomEvent<{ isSelected?: boolean }>).detail?.isSelected) {
        closeList();
      }
    };

    const onSidebarSetActive = (e: Event) => {
      const d = (e as CustomEvent<{ clear?: boolean }>).detail;
      if (d?.clear) return;
      closeList();
    };

    const onBodyClass = () => {
      const nowOpen = document.body.classList.contains(CLS_DETAILBAR_OPEN);
      if (nowOpen && !detailbarWasOpen) closeList();
      detailbarWasOpen = nowOpen;
    };

    const mo = new MutationObserver(onBodyClass);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener(EV_DETAILBAR_SELECTED, onDetailSelected as EventListener);
    window.addEventListener(EV_SIDEBAR_SET_ACTIVE, onSidebarSetActive as EventListener);
    return () => {
      mo.disconnect();
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener(
        EV_DETAILBAR_SELECTED,
        onDetailSelected as EventListener
      );
      window.removeEventListener(
        EV_SIDEBAR_SET_ACTIVE,
        onSidebarSetActive as EventListener
      );
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="place-search-overlay"
      role="search"
      aria-label="場所検索"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="place-search-overlay__bar">
        <div className="place-search-overlay__field">
          <input
            ref={inputRef}
            type="text"
            placeholder="地名・施設名・住所で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitSearch();
              }
            }}
          />
          {query.length > 0 && (
            <button
              type="button"
              className="place-search-overlay__clear"
              aria-label="検索ワードをクリア"
              onClick={clearQuery}
            >
              ×
            </button>
          )}
        </div>
        <button
          type="button"
          className="place-search-overlay__submit"
          onClick={submitSearch}
        >
          検索
        </button>
      </div>
      {open && (
        <div className="place-search-overlay__dropdown" role="listbox">
          {status === "idle" && (
            <div className="place-search-overlay__message" aria-live="polite">
              検索すると候補が表示されます。
            </div>
          )}
          {status === "error" && (
            <div className="place-search-overlay__message" aria-live="polite">
              {message}
            </div>
          )}
          {status === "empty" && (
            <div className="place-search-overlay__message" aria-live="polite">
              {message}
            </div>
          )}
          {status === "ok" && results.length > 0 && (
            <ul className="no-caret">
              {results.map((r) => (
                <li
                  key={r.placeId}
                  className={
                    selectedId === r.placeId
                      ? "place-search-overlay__item is-selected"
                      : "place-search-overlay__item"
                  }
                  tabIndex={0}
                  role="option"
                  aria-selected={selectedId === r.placeId}
                  onClick={() => {
                    void pickPlace(r);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      void pickPlace(r);
                    }
                  }}
                >
                  <span className="place-search-overlay__item-label">
                    {r.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
