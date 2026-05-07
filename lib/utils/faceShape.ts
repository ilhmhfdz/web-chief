/**
 * Face Shape Classification Engine
 * ================================
 * Calculates ratios between forehead, cheekbone, jaw widths and face length
 * using MediaPipe Face Mesh 468 landmark indices to categorize:
 * Oval, Square, Round, Heart, or Oblong.
 */

export type FaceShape = 'Oval' | 'Round' | 'Square' | 'Heart' | 'Oblong' | 'Diamond';

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface FaceShapeResult {
  shape: FaceShape;
  confidence: number;
  measurements: {
    faceLength: number;
    faceWidth: number;
    foreheadWidth: number;
    jawWidth: number;
    lengthToWidthRatio: number;
    foreheadToWidthRatio: number;
    jawToWidthRatio: number;
  };
  description: string;
  recommendedStyles: string[];
}

// Standard MediaPipe Face Mesh 468-point landmark indices
const LANDMARKS = {
  // Forehead width — lateral temporal points (better accuracy than 109/338)
  FOREHEAD_LEFT: 71,
  FOREHEAD_RIGHT: 301,

  // Cheekbone width — widest part of the face (zygomatic arch)
  CHEEK_LEFT: 454,
  CHEEK_RIGHT: 234,

  // Jaw width — angle of the mandible
  JAW_LEFT: 397,
  JAW_RIGHT: 172,

  // Chin — bottom-most point of the face
  CHIN: 152,

  // Forehead top — highest measurable point on the face outline
  FACE_TOP: 10,

  // Face bottom — same as chin
  FACE_BOTTOM: 152,
};

/**
 * Euclidean distance between two points, accounting for aspect ratio.
 */
function dist(p1: Point, p2: Point, width: number, height: number): number {
  return Math.sqrt(((p1.x - p2.x) * width) ** 2 + ((p1.y - p2.y) * height) ** 2);
}

/**
 * Shape description map (Bahasa Indonesia).
 */
const SHAPE_INFO: Record<FaceShape, { description: string; styles: string[] }> = {
  Oval: {
    description:
      'Wajah oval memiliki proporsi seimbang — dahi sedikit lebih lebar dari dagu dengan tulang pipi menonjol elegan. Bentuk ini sangat fleksibel untuk berbagai gaya rambut.',
    styles: [
      'Textured Crop',
      'Side Part Classic',
      'Quiff',
      'Medium Length Layered',
    ],
  },
  Round: {
    description:
      'Wajah round ditandai dengan panjang dan lebar yang hampir sama serta garis rahang yang lembut. Gaya rambut yang menambah tinggi akan memberikan ilusi wajah lebih panjang.',
    styles: [
      'Pompadour',
      'Faux Hawk',
      'Spiky Textured',
      'High Fade + Comb Over',
    ],
  },
  Square: {
    description:
      'Wajah square memiliki dahi lebar, tulang pipi tegas, dan garis rahang yang kuat. Bentuk ini terkesan maskulin dan cocok untuk gaya rambut yang menyeimbangkan sudut-sudut tegas.',
    styles: [
      'Buzz Cut',
      'Crew Cut',
      'Slick Back',
      'Short Textured Fringe',
    ],
  },
  Heart: {
    description:
      'Wajah heart memiliki dahi yang lebar dengan dagu yang meruncing. Gaya rambut yang menambah volume di samping akan menyeimbangkan proporsi wajah.',
    styles: [
      'Side Swept Fringe',
      'Medium Layered',
      'Textured Crop dengan Fringe',
      'Curtain Bangs',
    ],
  },
  Oblong: {
    description:
      'Wajah oblong memiliki panjang yang jauh lebih besar dari lebar, dengan dahi, tulang pipi, dan rahang yang relatif sama lebarnya. Gaya rambut dengan volume samping ideal.',
    styles: [
      'Fringe / Bangs',
      'Side Part dengan Volume',
      'Messy Textured Medium',
      'Angular Fringe',
    ],
  },
  Diamond: {
    description:
      'Wajah diamond ditandai dengan tulang pipi yang lebar dan menonjol, sementara dahi dan rahang lebih sempit. Proporsi ini memberikan kesan tegas dan berkarakter khas pria Asia.',
    styles: [
      'Textured Fringe',
      'Messy Pomp',
      'Side Sweep',
      'Faux Hawk',
    ],
  },
};

/**
 * Main classification function.
 * Accepts the 468+ landmark array from MediaPipe Face Mesh `onResults`.
 */
export function classifyFaceShape(
  landmarks: Point[],
  width: number = 640,
  height: number = 480
): FaceShapeResult {
  if (!landmarks || landmarks.length < 468) {
    throw new Error(
      'Invalid landmarks. Expected at least 468 points from MediaPipe Face Mesh.'
    );
  }

  // ── Measure absolute distances (in pixels) ────────────────────────
  const foreheadWidth = dist(
    landmarks[LANDMARKS.FOREHEAD_LEFT],
    landmarks[LANDMARKS.FOREHEAD_RIGHT],
    width,
    height
  );
  const cheekboneWidth = dist(
    landmarks[LANDMARKS.CHEEK_LEFT],
    landmarks[LANDMARKS.CHEEK_RIGHT],
    width,
    height
  );
  const jawWidth = dist(
    landmarks[LANDMARKS.JAW_LEFT],
    landmarks[LANDMARKS.JAW_RIGHT],
    width,
    height
  );
  const faceLength = dist(
    landmarks[LANDMARKS.FACE_TOP],
    landmarks[LANDMARKS.FACE_BOTTOM],
    width,
    height
  );

  // ── Compute ratios (normalised to cheekbone width) ────────────────
  const lengthRatio = faceLength / cheekboneWidth;
  const foreheadRatio = foreheadWidth / cheekboneWidth;
  const jawRatio = jawWidth / cheekboneWidth;

  // ── Classification logic ──────────────────────────────────────────
  let shape: FaceShape = 'Oval';
  let confidence = 0.80;

  // Oblong — face significantly longer than wide
  if (lengthRatio >= 1.40) {
    shape = 'Oblong';
    confidence = 0.88 + Math.min(0.10, (lengthRatio - 1.40) * 0.5);
  }
  // Diamond — cheekbones significantly wider than both forehead and jaw
  else if (foreheadRatio <= 0.82 && jawRatio <= 0.78) {
    shape = 'Diamond';
    confidence = 0.85 + Math.min(0.12, (0.82 - Math.max(foreheadRatio, jawRatio)) * 0.5);
  }
  // Square — strong, wide jawline and comparable forehead
  else if (jawRatio >= 0.82 && foreheadRatio >= 0.78 && lengthRatio < 1.35) {
    shape = 'Square';
    confidence = 0.84 + Math.min(0.10, (jawRatio - 0.80) * 0.5);
  }
  // Heart — forehead noticeably wider than jaw
  else if (foreheadRatio >= 0.82 && jawRatio <= 0.76) {
    shape = 'Heart';
    confidence = 0.86 + Math.min(0.10, (foreheadRatio - jawRatio) * 0.3);
  }
  // Round — face is relatively short with soft jawline (tighter threshold)
  else if (lengthRatio <= 1.25 && jawRatio < 0.85) {
    shape = 'Round';
    confidence = 0.85 + Math.min(0.10, (1.25 - lengthRatio) * 0.5);
  }
  // Oval — balanced proportions (default)
  else {
    shape = 'Oval';
    confidence = 0.88 + Math.min(0.10, (1.35 - Math.abs(1.33 - lengthRatio)) * 0.2);
  }

  // Cap confidence at 0.98
  confidence = Math.min(0.98, confidence);

  const info = SHAPE_INFO[shape];

  return {
    shape,
    confidence,
    measurements: {
      faceLength,
      faceWidth: cheekboneWidth,
      foreheadWidth,
      jawWidth,
      lengthToWidthRatio: lengthRatio,
      foreheadToWidthRatio: foreheadRatio,
      jawToWidthRatio: jawRatio,
    },
    description: info.description,
    recommendedStyles: info.styles,
  };
}

