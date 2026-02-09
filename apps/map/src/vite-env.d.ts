/// <reference types="google.maps" />

interface ImportMetaEnv {
    readonly VITE_CATALOG_BASE_URL?: string;
    readonly VITE_GMAPS_API_KEY?: string;
    readonly VITE_HUB_BASE_URL?: string;
    readonly VITE_MAP_BASE_URL?: string;
    readonly VITE_STATIC_MAP_BASE_URL?: string;
    readonly VITE_TILE_API_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}