// src/pages/parts/geometry/types.ts
export type LngLat = [number, number];

export type RectangleGeom = {
    type: "rectangle";
    coordinates: Array<LngLat>;
    referencePointIndex?: number;
};

export type EllipseGeom = {
    type: "ellipse";
    center: LngLat;
    radiusX_m: number;
    radiusY_m: number;
    rotation_deg?: number;
};

export type OrientedRect = {
    center: LngLat;
    w: number; // m
    h: number; // m
    rotation_deg: number; // 0=東, 90=北
};

export type SafetyGeom = { type: "ellipse"; buffer_m: number };

export type Geometry = {
    flightAltitude_m?: number;
    takeoffArea?: RectangleGeom;
    flightArea?: EllipseGeom;
    safetyArea?: SafetyGeom;
    audienceArea?: RectangleGeom;
};

export type Props = {
    onLoaded?: (pts: Point[]) => void;
};

export type Point = {
    name: string;
    lat: number;
    lng: number;
    areaName?: string;
    date?: string;
    areaUuid?: string;
};

export type TabKey = "overview" | "detail" | "history";

export type HistoryItem = {
    date: string;
    projectName: string;
    scheduleName: string;
    projectUuid?: string;
    scheduleUuid?: string;
};

export type GeometryMetrics = {
    flightWidth_m?: number; // 楕円：横幅(2*radiusX)
    flightDepth_m?: number; // 楕円：高さ(2*radiusY)
    rectWidth_m?: number; // 長方形：長辺
    rectDepth_m?: number; // 長方形：短辺
    spectatorWidth_m?: number; // 観客：幅
    spectatorDepth_m?: number; // 観客：奥行
    flightAltitude_m?: number; // 飛行高度
    safetyDistance_m?: number;  // 最大移動距離
    buffer_m?: number;          // 保安エリアの距離
};

// スケジュール情報
export type ScheduleLite = { label: string; date: string; areaName: string };
export type HistoryLite = { label: string; date: string };
export interface DetailMeta {
    overview: string;
    address: string;
    manager: string;
    prefecture: string;
    droneRecord: string;
    aircraftCount: string;
    altitudeLimit: string;
    availability: string;
    statusMemo: string;
    permitMemo: string;
    restrictionsMemo: string;
    remarks: string;
    candidate: Candidate[];
}

export interface Candidate {
    title: string;
    flightAltitude_m?: number;
    takeoffArea?: RectangleGeom;
    flightArea?: EllipseGeom;
    safetyArea?: SafetyGeom;
    audienceArea?: RectangleGeom;
}

export type GeometryPayload = {
    projectUuid?: string;
    scheduleUuid?: string;
    geometry?: any;
    deleted?: boolean;
};