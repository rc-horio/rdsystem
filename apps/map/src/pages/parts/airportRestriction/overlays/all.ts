/**
 * 全16空港の制限表面描画
 * 照会と同じ頂点・切り欠きを使う。円錐・外側水平に切り欠きデータが無い空港は真円の円環。
 */

import {
  mpA as hanedaA,
  mpB as hanedaB,
  mpC as hanedaC,
  mpD as hanedaD,
  HANEDA_REFERENCE_POINT,
  HORIZONTAL_SURFACE_RADIUS_M as HANEDA_HORIZ,
  landingKi as hanedaLandingKi,
  landingKi_s as hanedaLandingKiS,
} from "../data/haneda";
import {
  surfacePointsA as naritaA,
  surfacePointsC as naritaC,
  NARITA_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as NARITA_HORIZ,
  RADIUS_OF_CONICAL_SURFACE as NARITA_CONICAL,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NARITA_OUTER,
} from "../data/narita";
import {
  surfacePointsA as kansaiA,
  surfacePointsB as kansaiB,
  conicalCutPath as kansaiConicalCut,
  outerCutPath as kansaiOuterCut,
  KANSAI_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as KANSAI_HORIZ,
} from "../data/kansai";
import {
  mp as itamiMp,
  landingKi as itamiLandingKi,
  landingKi_s as itamiLandingKiS,
  s_surface_s as itamiHorizontalCut,
} from "../data/itami";
import {
  surfacePoints as centrairPts,
  conicalCutPath as centrairConicalCut,
  outerCutPath as centrairOuterCut,
  CENTRAIR_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as CENTRAIR_HORIZ,
} from "../data/centrair";
import {
  mpA as fukuokaA,
  mpB as fukuokaB,
  FUKUOKA_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as FUKUOKA_HORIZ,
  RADIUS_OF_CONICAL_SURFACE as FUKUOKA_CONICAL,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as FUKUOKA_OUTER,
} from "../data/fukuoka";
import {
  runwayA as sendaiA,
  runwayB as sendaiB,
  conicalCutPath as sendaiConicalCut,
  outerCutPath as sendaiOuterCut,
  SENDAI_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as SENDAI_HORIZ,
} from "../data/sendai";
import {
  runwayA as shinchitoseA,
  runwayB as shinchitoseB,
  SHINCHITOSE_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as SHINCHITOSE_HORIZ,
} from "../data/shinchitose";
import {
  surfacePoints as hakodatePts,
  conicalCutPath as hakodateConicalCut,
  outerCutPath as hakodateOuterCut,
  HAKODATE_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as HAKODATE_HORIZ,
} from "../data/hakodate";
import {
  runwayA as niigataA,
  runwayB as niigataB,
  NIIGATA_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as NIIGATA_HORIZ,
} from "../data/niigata";
import {
  surfacePoints as kumamotoPts,
  KUMAMOTO_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as KUMAMOTO_HORIZ,
  RADIUS_OF_CONICAL_SURFACE as KUMAMOTO_CONICAL,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as KUMAMOTO_OUTER,
} from "../data/kumamoto";
import {
  mp as nagasakiMp,
  NAGASAKI_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as NAGASAKI_HORIZ,
  RADIUS_OF_CONICAL_SURFACE as NAGASAKI_CONICAL,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAGASAKI_OUTER,
} from "../data/nagasaki";
import {
  surfacePointsA as nahaA,
  surfacePointsB as nahaB,
  NAHA_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as NAHA_HORIZ,
  RADIUS_OF_CONICAL_SURFACE as NAHA_CONICAL,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as NAHA_OUTER,
} from "../data/naha";
import {
  surfacePoints as matsuyamaPts,
  MATSUYAMA_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as MATSUYAMA_HORIZ,
  RADIUS_OF_CONICAL_SURFACE as MATSUYAMA_CONICAL,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MATSUYAMA_OUTER,
} from "../data/matsuyama";
import {
  surfacePoints as miyazakiPts,
  MIYAZAKI_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as MIYAZAKI_HORIZ,
  RADIUS_OF_CONICAL_SURFACE as MIYAZAKI_CONICAL,
  RADIUS_OF_OUTER_HORIZONTAL_SURFACE as MIYAZAKI_OUTER,
} from "../data/miyazaki";
import {
  runwayA as yaoA,
  runwayB as yaoB,
  YAO_REFERENCE_POINT,
  RADIUS_OF_HORIZONTAL_SURFACE as YAO_HORIZ,
} from "../data/yao";
import {
  createOverlaysFromSpec,
  type AirportOverlaySpec,
  type OverlayCoord,
  type RestrictionOverlay,
} from "./factory";

/** 新千歳公式: A滑走路 #0000FF / B滑走路 #FF0000 / 水平 #00FF00 */
const SHINCHITOSE_QUAD_BASE: google.maps.PolygonOptions = {
  strokeOpacity: 0.7,
  strokeWeight: 0.5,
  fillOpacity: 0.1,
  zIndex: 50,
  clickable: false,
};
const SHINCHITOSE_RUNWAY_A_STYLE: google.maps.PolygonOptions = {
  ...SHINCHITOSE_QUAD_BASE,
  strokeColor: "#0000FF",
  fillColor: "#0000FF",
};
const SHINCHITOSE_RUNWAY_B_STYLE: google.maps.PolygonOptions = {
  ...SHINCHITOSE_QUAD_BASE,
  strokeColor: "#FF0000",
  fillColor: "#FF0000",
};
const SHINCHITOSE_HORIZONTAL_STYLE: google.maps.CircleOptions = {
  strokeColor: "#00FF00",
  strokeOpacity: 0.7,
  strokeWeight: 0.5,
  fillColor: "#00FF00",
  fillOpacity: 0.05,
  zIndex: 100,
  clickable: false,
};

type KansaiLike = {
  cd04: OverlayCoord;
  cd06: OverlayCoord;
  cd07: OverlayCoord;
  cd08: OverlayCoord;
  cd11: OverlayCoord;
  cd12: OverlayCoord;
  cd14: OverlayCoord;
  cd15: OverlayCoord;
  cd17: OverlayCoord;
  cd18: OverlayCoord;
  cd20: OverlayCoord;
  cd21: OverlayCoord;
  cd24: OverlayCoord;
  cd25: OverlayCoord;
  cd26: OverlayCoord;
  cd28: OverlayCoord;
  cd01?: OverlayCoord;
  cd03?: OverlayCoord;
  cd29?: OverlayCoord;
  cd31?: OverlayCoord;
};

/** 関西系の進入・転移（延長進入は空港により片方または両方なし） */
function kansaiLikeShapes(
  p: KansaiLike,
  opts?: { ext1?: boolean; ext2?: boolean }
): OverlayCoord[][] {
  const shapes: OverlayCoord[][] = [
    [p.cd12, p.cd14, p.cd20, p.cd18],
    [p.cd12, p.cd04, p.cd06, p.cd14],
    [p.cd18, p.cd20, p.cd28, p.cd26],
  ];
  if (opts?.ext1 !== false && p.cd01 && p.cd03) {
    shapes.push([p.cd04, p.cd06, p.cd03, p.cd01]);
  }
  if (opts?.ext2 !== false && p.cd29 && p.cd31) {
    shapes.push([p.cd26, p.cd28, p.cd31, p.cd29]);
  }
  shapes.push(
    [p.cd11, p.cd12, p.cd18, p.cd17],
    [p.cd14, p.cd15, p.cd21, p.cd20],
    [p.cd07, p.cd12, p.cd11],
    [p.cd08, p.cd15, p.cd14],
    [p.cd17, p.cd18, p.cd24],
    [p.cd20, p.cd21, p.cd25]
  );
  return shapes;
}

function fullRings(
  center: OverlayCoord,
  horiz: number,
  conical: number,
  outer: number
): Pick<AirportOverlaySpec, "horizontalCircle" | "conicalRing" | "outerRing"> {
  return {
    horizontalCircle: { center, radius: horiz },
    conicalRing: { center, innerRadius: horiz, outerRadius: conical },
    outerRing: { center, innerRadius: conical, outerRadius: outer },
  };
}

type HanedaRunway = typeof hanedaA;

function hanedaRunwayShapes(p: HanedaRunway): OverlayCoord[][] {
  return [
    [p.cd07, p.cd09, p.cd14, p.cd12],
    [p.cd01, p.cd03, p.cd09, p.cd07],
    [p.cd12, p.cd14, p.cd20, p.cd18],
    [p.cd18, p.cd20, p.cd23, p.cd21],
    [p.cd06, p.cd07, p.cd12, p.cd11],
    [p.cd09, p.cd10, p.cd15, p.cd14],
    [p.cd04, p.cd06, p.cd07],
    [p.cd05, p.cd09, p.cd10],
    [p.cd11, p.cd12, p.cd16],
    [p.cd14, p.cd15, p.cd17],
  ];
}

function sendaiRunwayShapes(
  p: typeof sendaiA | typeof sendaiB,
  withExt: boolean
): OverlayCoord[][] {
  const shapes: OverlayCoord[][] = [
    [p.cd07, p.cd09, p.cd14, p.cd12],
    [p.cd07, p.cd01, p.cd03, p.cd09],
    [p.cd12, p.cd14, p.cd20, p.cd18],
    [p.cd06, p.cd07, p.cd12, p.cd11],
    [p.cd09, p.cd10, p.cd15, p.cd14],
    [p.cd04, p.cd07, p.cd06],
    [p.cd05, p.cd10, p.cd09],
    [p.cd11, p.cd12, p.cd16],
    [p.cd14, p.cd15, p.cd17],
  ];
  if (withExt && "cd21" in p && "cd23" in p) {
    const ext = p as typeof sendaiB;
    shapes.push([ext.cd18, ext.cd20, ext.cd23, ext.cd21]);
  }
  return shapes;
}

const itami = itamiMp;

const kansaiSpec: AirportOverlaySpec = {
  horizontalCircle: {
    center: KANSAI_REFERENCE_POINT,
    radius: KANSAI_HORIZ,
  },
  conicalPolygon: kansaiConicalCut,
  outerPolygon: kansaiOuterCut,
  quads: [...kansaiLikeShapes(kansaiA), ...kansaiLikeShapes(kansaiB)],
};

const SPECS: AirportOverlaySpec[] = [
  {
    horizontalCircle: {
      center: HANEDA_REFERENCE_POINT,
      radius: HANEDA_HORIZ,
    },
    conicalPolygon: hanedaLandingKi,
    outerPolygon: hanedaLandingKiS,
    quads: [
      ...hanedaRunwayShapes(hanedaA),
      ...hanedaRunwayShapes(hanedaB),
      ...hanedaRunwayShapes(hanedaC),
      ...hanedaRunwayShapes(hanedaD),
    ],
  },
  {
    ...fullRings(
      NARITA_REFERENCE_POINT,
      NARITA_HORIZ,
      NARITA_CONICAL,
      NARITA_OUTER
    ),
    quads: [
      ...kansaiLikeShapes(naritaA),
      ...kansaiLikeShapes(naritaC),
    ],
  },
  kansaiSpec,
  {
    horizontalPolygon: itamiHorizontalCut,
    conicalPolygon: itamiLandingKi,
    outerPolygon: itamiLandingKiS,
    quads: [
      [itami.cd3, itami.cd4, itami.cd6, itami.cd5],
      [itami.cd1, itami.cd2, itami.cd4, itami.cd3],
      [itami.cd5, itami.cd6, itami.cd8, itami.cd7],
      [itami.cd4, itami.cd22, itami.cd24, itami.cd6],
      [itami.cd21, itami.cd3, itami.cd5, itami.cd23],
      [itami.cd4, itami.cd22, itami.cd20],
      [itami.cd3, itami.cd19, itami.cd21],
      [itami.cd6, itami.cd24, itami.cd26],
      [itami.cd5, itami.cd23, itami.cd25],
      [itami.cd11, itami.cd12, itami.cd14, itami.cd13],
      [itami.cd9, itami.cd10, itami.cd12, itami.cd11],
      [itami.cd13, itami.cd14, itami.cd16, itami.cd15],
      [itami.cd15, itami.cd16, itami.cd18, itami.cd17],
      [itami.cd12, itami.cd30, itami.cd32, itami.cd14],
      [itami.cd29, itami.cd11, itami.cd13, itami.cd31],
      [itami.cd28, itami.cd12, itami.cd30],
      [itami.cd27, itami.cd11, itami.cd29],
      [itami.cd14, itami.cd32, itami.cd34],
      [itami.cd13, itami.cd31, itami.cd33],
    ],
  },
  {
    horizontalCircle: {
      center: CENTRAIR_REFERENCE_POINT,
      radius: CENTRAIR_HORIZ,
    },
    conicalPolygon: centrairConicalCut,
    outerPolygon: centrairOuterCut,
    quads: kansaiLikeShapes(centrairPts),
  },
  {
    ...fullRings(
      FUKUOKA_REFERENCE_POINT,
      FUKUOKA_HORIZ,
      FUKUOKA_CONICAL,
      FUKUOKA_OUTER
    ),
    quads: [
      [fukuokaA.cd21, fukuokaA.cd22, fukuokaA.cd24, fukuokaA.cd23],
      [fukuokaA.cd7, fukuokaA.cd8, fukuokaA.cd22, fukuokaA.cd21],
      [fukuokaA.cd9, fukuokaA.cd10, fukuokaA.cd24, fukuokaA.cd23],
      [fukuokaA.cd1, fukuokaA.cd2, fukuokaA.cd8, fukuokaA.cd7],
      [fukuokaA.cd3, fukuokaA.cd4, fukuokaA.cd10, fukuokaA.cd9],
      [fukuokaA.cd22, fukuokaA.cd18, fukuokaA.cd20, fukuokaA.cd24],
      [fukuokaA.cd21, fukuokaA.cd17, fukuokaA.cd19, fukuokaA.cd23],
      [fukuokaA.cd14, fukuokaA.cd18, fukuokaA.cd22],
      [fukuokaA.cd20, fukuokaA.cd24, fukuokaA.cd16],
      [fukuokaA.cd13, fukuokaA.cd21, fukuokaA.cd17],
      [fukuokaA.cd15, fukuokaA.cd19, fukuokaA.cd23],
      [fukuokaB.cd5, fukuokaB.cd6, fukuokaB.cd9, fukuokaB.cd8],
      [fukuokaB.cd1, fukuokaB.cd2, fukuokaB.cd6, fukuokaB.cd5],
      [fukuokaB.cd8, fukuokaB.cd9, fukuokaB.cd14, fukuokaB.cd13],
      [fukuokaB.cd5, fukuokaB.cd15, fukuokaB.cd16, fukuokaB.cd8],
      [fukuokaB.cd6, fukuokaB.cd7, fukuokaB.cd10, fukuokaB.cd9],
      [fukuokaB.cd3, fukuokaB.cd5, fukuokaB.cd15],
      [fukuokaB.cd16, fukuokaB.cd8, fukuokaB.cd11],
      [fukuokaB.cd4, fukuokaB.cd7, fukuokaB.cd6],
      [fukuokaB.cd10, fukuokaB.cd12, fukuokaB.cd9],
    ],
  },
  {
    horizontalCircle: {
      center: SENDAI_REFERENCE_POINT,
      radius: SENDAI_HORIZ,
    },
    conicalPolygon: sendaiConicalCut,
    outerPolygon: sendaiOuterCut,
    quads: [
      ...sendaiRunwayShapes(sendaiA, false),
      ...sendaiRunwayShapes(sendaiB, true),
    ],
  },
  {
    horizontalCircle: {
      center: SHINCHITOSE_REFERENCE_POINT,
      radius: SHINCHITOSE_HORIZ,
    },
    horizontalStyle: SHINCHITOSE_HORIZONTAL_STYLE,
    quads: kansaiLikeShapes(shinchitoseA, { ext1: false, ext2: false }),
    quadStyle: SHINCHITOSE_RUNWAY_A_STYLE,
  },
  {
    quads: kansaiLikeShapes(shinchitoseB, { ext1: false, ext2: false }),
    quadStyle: SHINCHITOSE_RUNWAY_B_STYLE,
  },
  {
    horizontalCircle: {
      center: HAKODATE_REFERENCE_POINT,
      radius: HAKODATE_HORIZ,
    },
    conicalPolygon: hakodateConicalCut,
    outerPolygon: hakodateOuterCut,
    quads: kansaiLikeShapes(hakodatePts, { ext2: false }),
  },
  {
    horizontalCircle: {
      center: NIIGATA_REFERENCE_POINT,
      radius: NIIGATA_HORIZ,
    },
    quads: [
      ...kansaiLikeShapes(niigataA, { ext1: false, ext2: false }),
      ...kansaiLikeShapes(niigataB, { ext1: false, ext2: false }),
    ],
  },
  {
    ...fullRings(
      KUMAMOTO_REFERENCE_POINT,
      KUMAMOTO_HORIZ,
      KUMAMOTO_CONICAL,
      KUMAMOTO_OUTER
    ),
    quads: kansaiLikeShapes(kumamotoPts),
  },
  {
    ...fullRings(
      NAGASAKI_REFERENCE_POINT,
      NAGASAKI_HORIZ,
      NAGASAKI_CONICAL,
      NAGASAKI_OUTER
    ),
    quads: [
      [nagasakiMp.cd21, nagasakiMp.cd22, nagasakiMp.cd24, nagasakiMp.cd23],
      [nagasakiMp.cd7, nagasakiMp.cd8, nagasakiMp.cd22, nagasakiMp.cd21],
      [nagasakiMp.cd9, nagasakiMp.cd10, nagasakiMp.cd24, nagasakiMp.cd23],
      [nagasakiMp.cd9, nagasakiMp.cd10, nagasakiMp.cd4, nagasakiMp.cd3],
      [nagasakiMp.cd22, nagasakiMp.cd18, nagasakiMp.cd20, nagasakiMp.cd24],
      [nagasakiMp.cd21, nagasakiMp.cd17, nagasakiMp.cd19, nagasakiMp.cd23],
      [nagasakiMp.cd14, nagasakiMp.cd18, nagasakiMp.cd22],
      [nagasakiMp.cd20, nagasakiMp.cd24, nagasakiMp.cd16],
      [nagasakiMp.cd13, nagasakiMp.cd17, nagasakiMp.cd21],
      [nagasakiMp.cd15, nagasakiMp.cd19, nagasakiMp.cd23],
    ],
  },
  {
    ...fullRings(
      NAHA_REFERENCE_POINT,
      NAHA_HORIZ,
      NAHA_CONICAL,
      NAHA_OUTER
    ),
    quads: [...kansaiLikeShapes(nahaA), ...kansaiLikeShapes(nahaB)],
  },
  {
    ...fullRings(
      MATSUYAMA_REFERENCE_POINT,
      MATSUYAMA_HORIZ,
      MATSUYAMA_CONICAL,
      MATSUYAMA_OUTER
    ),
    quads: kansaiLikeShapes(matsuyamaPts, { ext2: false }),
  },
  {
    ...fullRings(
      MIYAZAKI_REFERENCE_POINT,
      MIYAZAKI_HORIZ,
      MIYAZAKI_CONICAL,
      MIYAZAKI_OUTER
    ),
    quads: kansaiLikeShapes(miyazakiPts, { ext1: false }),
  },
  {
    horizontalCircle: {
      center: YAO_REFERENCE_POINT,
      radius: YAO_HORIZ,
    },
    quads: [
      ...kansaiLikeShapes(yaoA, { ext1: false, ext2: false }),
      ...kansaiLikeShapes(yaoB, { ext1: false, ext2: false }),
    ],
  },
];

export function createAllAirportRestrictionOverlays(
  gmaps: typeof google.maps
): RestrictionOverlay[] {
  return SPECS.flatMap((spec) => createOverlaysFromSpec(gmaps, spec));
}

export function createKansaiRestrictionOverlays(
  gmaps: typeof google.maps
): RestrictionOverlay[] {
  return createOverlaysFromSpec(gmaps, kansaiSpec);
}
