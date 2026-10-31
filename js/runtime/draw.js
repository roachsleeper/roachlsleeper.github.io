import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';

const MASK_IMAGE_SRCS = {
  redGold: 'images/mask-red-gold.png',
  whiteTeal: 'images/mask-white-teal.png',
  goldArmor: 'images/mask-gold-armor.png',
};
const MASK_IMAGE_SIZE = 38;
const maskImages = {};
const maskImageLoaded = {};

Object.entries(MASK_IMAGE_SRCS).forEach(([id, src]) => {
  const img = wx.createImage();
  img.onload = () => { maskImageLoaded[id] = true; };
  img.src = src;
  maskImages[id] = img;
});

const MASK_CHARACTER_SRCS = {
  redGold: {
    front: 'images/mask-red-gold-character-front.png',
    side: 'images/mask-red-gold-character-side.png',
  },
  whiteTeal: {
    front: 'images/mask-white-teal-character-front.png',
    side: 'images/mask-white-teal-character-side.png',
  },
  goldArmor: {
    front: 'images/mask-gold-armor-character-front.png',
    side: 'images/mask-gold-armor-character-side.png',
  },
};
const MASK_CHARACTER_CHARGE_SRCS = {
  goldArmor: [
    'images/mask-gold-armor-character-charge-1.png',
    'images/mask-gold-armor-character-charge-2.png',
    'images/mask-gold-armor-character-charge-3.png',
    'images/mask-gold-armor-character-charge-4.png',
    'images/mask-gold-armor-character-charge-5.png',
  ],
};
const MASK_CHARACTER_RELEASE_SRCS = {
  goldArmor: 'images/mask-gold-armor-character-charge-release.png',
};
const MASK_CHARACTER_ATTACK_MIDDLE_SRCS = {
  redGold: 'images/mask-red-gold-character-attack-middle.png',
};

// The supplied character PNGs also contain the weapon/prop for each mask.
// Use the character-only bounds as the sizing reference so the props do not
// make one character look smaller or larger than another.
const MASK_CHARACTER_BODY_BOUNDS = {
  redGold: {
    front: { left: 207, top: 24, right: 622, bottom: 583 },
    // Exclude the axe from the size reference for the new side-attack pose.
    side: { left: 407, top: 148, right: 930, bottom: 769 },
    attackMiddle: { left: 530, top: 313, right: 1052, bottom: 929 },
  },
  whiteTeal: {
    front: { left: 273, top: 272, right: 650, bottom: 732 },
    // This side-attack asset is wider than the standing pose. These bounds
    // cover the hero's hair, face, hands, body, and feet while excluding the
    // umbrella and its handle as sizing references.
    side: { left: 266, top: 378, right: 735, bottom: 1033 },
  },
  goldArmor: {
    front: { left: 218, top: 64, right: 610, bottom: 734 },
    // Exclude the large ceremonial flag from the size reference.
    side: { left: 136, top: 270, right: 720, bottom: 1013 },
    release: { left: 276, top: 284, right: 720, bottom: 1025 },
  },
};
const maskCharacterImages = {};
const maskCharacterLoaded = {};
const maskCharacterChargeImages = {};
const maskCharacterChargeLoaded = {};
const maskCharacterReleaseImages = {};
const maskCharacterReleaseLoaded = {};
const maskCharacterAttackMiddleImages = {};
const maskCharacterAttackMiddleLoaded = {};

Object.entries(MASK_CHARACTER_SRCS).forEach(([id, views]) => {
  maskCharacterImages[id] = {};
  maskCharacterLoaded[id] = {};
  Object.entries(views).forEach(([view, src]) => {
    const img = wx.createImage();
    img.onload = () => { maskCharacterLoaded[id][view] = true; };
    img.src = src;
    maskCharacterImages[id][view] = img;
  });
});

Object.entries(MASK_CHARACTER_CHARGE_SRCS).forEach(([id, sources]) => {
  maskCharacterChargeImages[id] = [];
  maskCharacterChargeLoaded[id] = [];
  sources.forEach((src, frame) => {
    const img = wx.createImage();
    img.onload = () => { maskCharacterChargeLoaded[id][frame] = true; };
    img.src = src;
    maskCharacterChargeImages[id][frame] = img;
  });
});

Object.entries(MASK_CHARACTER_RELEASE_SRCS).forEach(([id, src]) => {
  const img = wx.createImage();
  img.onload = () => { maskCharacterReleaseLoaded[id] = true; };
  img.src = src;
  maskCharacterReleaseImages[id] = img;
});

Object.entries(MASK_CHARACTER_ATTACK_MIDDLE_SRCS).forEach(([id, src]) => {
  const img = wx.createImage();
  img.onload = () => { maskCharacterAttackMiddleLoaded[id] = true; };
  img.src = src;
  maskCharacterAttackMiddleImages[id] = img;
});


const STAGE_LAYERS = [
  { key: 'background', src: 'images/stage-background.png' },
  { key: 'building', src: 'images/stage-building.png' },
  { key: 'gate', src: 'images/stage-gate.png', yOffsetRatio: 0.1 },
  // The PNG has a large transparent upper area. The visible platform is
  // roughly 36% of the image height, so move it by half of that height.
  { key: 'platform', src: 'images/stage-platform-new.png', yOffsetRatio: 0.072 },
];

const stageImages = {};
const stageLoaded = {};

function getStageImage(layer) {
  if (!stageImages[layer.key]) {
    const img = wx.createImage();
    img.onload = () => { stageLoaded[layer.key] = true; };
    img.src = layer.src;
    stageImages[layer.key] = img;
  }
  return stageImages[layer.key];
}

STAGE_LAYERS.forEach(getStageImage);

export function drawBackground(ctx) {
  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;

  const fallback = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
  fallback.addColorStop(0, '#101a42');
  fallback.addColorStop(1, '#17203a');
  ctx.fillStyle = fallback;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  // The four supplied images share the same canvas, so drawing them at the
  // same destination rectangle preserves the intended transparent layering.
  STAGE_LAYERS.forEach((layer) => {
    const img = getStageImage(layer);
    if (stageLoaded[layer.key] && img.width > 0) {
      const yOffset = SCREEN_HEIGHT * (layer.yOffsetRatio || 0);
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, yOffset, SCREEN_WIDTH, SCREEN_HEIGHT);
    }
  });

  ctx.imageSmoothingEnabled = smoothing;
}

const HERO_IMG_SRC = 'images/hero-stand.png';
export const HERO_FACE_RATIO = 0.364;

let heroImg = null;
let heroLoaded = false;

function loadHeroImage() {
  if (!heroImg) {
    heroImg = wx.createImage();
    heroImg.onload = () => { heroLoaded = true; };
    heroImg.src = HERO_IMG_SRC;
  }
  return heroImg;
}

export function drawHero(ctx, centerX, bottomY, height) {
  const img = loadHeroImage();
  if (!heroLoaded || !img.width) return false;

  const w = height * img.width / img.height;
  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, centerX - w / 2, bottomY - height, w, height);
  ctx.imageSmoothingEnabled = smoothing;
  return true;
}

function drawMaskedCharacterImage(ctx, centerX, bottomY, height, img, body, flip) {
  if (!img || !img.width || !img.height) return false;

  const bodyHeight = body ? (body.scaleHeight || body.bottom - body.top) : img.height;
  const scale = height / bodyHeight;
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const bodyCenterX = body ? (body.left + body.right) / 2 : img.width / 2;
  const bodyBottom = body ? body.bottom : img.height;
  const smoothing = ctx.imageSmoothingEnabled;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Anchor on the character body, not on the full image which may be shifted
  // by a weapon, umbrella, or flag.
  ctx.translate(centerX, bottomY);
  ctx.scale(flip ? -1 : 1, 1);
  ctx.drawImage(img, 0, 0, img.width, img.height, -bodyCenterX * scale, -bodyBottom * scale, drawWidth, drawHeight);
  ctx.restore();
  ctx.imageSmoothingEnabled = smoothing;
  return true;
}

function drawMaskedCharacter(ctx, centerX, bottomY, height, id, view, flip) {
  const img = maskCharacterImages[id] && maskCharacterImages[id][view];
  if (!img || !maskCharacterLoaded[id] || !maskCharacterLoaded[id][view]) return false;

  const bounds = MASK_CHARACTER_BODY_BOUNDS[id];
  const body = bounds && (bounds[view] || bounds.side);
  return drawMaskedCharacterImage(ctx, centerX, bottomY, height, img, body, flip);
}

export function drawMaskedHero(ctx, centerX, bottomY, height, id) {
  return drawMaskedCharacter(ctx, centerX, bottomY, height, id, 'front', false);
}

export function drawMaskedHeroAttack(ctx, centerX, bottomY, height, id, direction, frame = 0) {
  const middleImg = maskCharacterAttackMiddleImages[id];
  if (frame === 2 && middleImg && maskCharacterAttackMiddleLoaded[id]) {
    const bounds = MASK_CHARACTER_BODY_BOUNDS[id];
    const body = bounds && (bounds.attackMiddle || bounds.side);
    const drawn = drawMaskedCharacterImage(ctx, centerX, bottomY, height, middleImg, body, direction === 'left');
    return drawn ? { faceDx: 0 } : null;
  }

  const drawn = drawMaskedCharacter(ctx, centerX, bottomY, height, id, 'side', direction === 'left');
  return drawn ? { faceDx: 0 } : null;
}

export function drawMaskedHeroCharge(ctx, centerX, bottomY, height, id, frame, direction) {
  const images = maskCharacterChargeImages[id];
  const loaded = maskCharacterChargeLoaded[id];
  const index = Math.max(0, Math.min((images ? images.length : 1) - 1, frame || 0));
  const img = images && images[index];
  if (!img || !loaded || !loaded[index]) return false;

  const bounds = MASK_CHARACTER_BODY_BOUNDS[id];
  const body = bounds && (bounds.charge || bounds.side);
  return drawMaskedCharacterImage(ctx, centerX, bottomY, height, img, body, direction === 'left');
}

export function drawMaskedHeroChargeRelease(ctx, centerX, bottomY, height, id, direction) {
  const img = maskCharacterReleaseImages[id];
  if (!img || !maskCharacterReleaseLoaded[id]) return false;

  const bounds = MASK_CHARACTER_BODY_BOUNDS[id];
  const body = bounds && (bounds.release || bounds.side);
  return drawMaskedCharacterImage(ctx, centerX, bottomY, height, img, body, direction === 'left');
}
loadHeroImage();

const ATK_IMG_SRC = { left: 'images/hero-atk-left.png', right: 'images/hero-atk-right.png' };
const ATK_FRAME_BOUNDS = [0, 272, 543, 815, 1086];
export const HERO_ATK_FACE_DX = {
  left: [-0.1529, -0.2376, -0.1572, -0.1538],
  right: [0.1636, 0.1613, 0.161, 0.166]
};
export const HERO_ATK_FIST = {
  left: { dx: -0.474, dy: 0.594 },
  right: { dx: 0.373, dy: 0.594 }
};

const atkImg = { left: null, right: null };
const atkLoaded = { left: false, right: false };

function loadAtkImage(dir) {
  if (!atkImg[dir]) {
    const img = wx.createImage();
    img.onload = () => { atkLoaded[dir] = true; };
    img.src = ATK_IMG_SRC[dir];
    atkImg[dir] = img;
  }
  return atkImg[dir];
}

export function drawHeroAttack(ctx, centerX, bottomY, height, dir, frameIndex) {
  const key = dir === 'left' ? 'left' : 'right';
  const img = loadAtkImage(key);
  if (!atkLoaded[key] || !img.width) return null;

  const i = Math.max(0, Math.min(3, Math.floor(frameIndex)));
  const x0 = ATK_FRAME_BOUNDS[i];
  const x1 = ATK_FRAME_BOUNDS[i + 1];
  const h = img.height;
  const s = height / h;
  const cellCenter = (x1 - x0) / 2;

  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x0, 0, x1 - x0, h, centerX - cellCenter * s, bottomY - height, (x1 - x0) * s, height);
  ctx.imageSmoothingEnabled = smoothing;
  return { faceDx: HERO_ATK_FACE_DX[key][i] * height };
}

loadAtkImage('left');
loadAtkImage('right');

const SHIELD_IMPACT_SRCS = [
  'images/hero-shield-impact-1.png',
  'images/hero-shield-impact-2.png',
  'images/hero-shield-impact-3.png',
  'images/hero-shield-impact-4.png',
];
const WHITE_TEAL_DEFENSE_SRCS = [
  'images/mask-white-teal-defense-explosion-1.png',
  'images/mask-white-teal-defense-explosion-2.png',
  'images/mask-white-teal-defense-explosion-3.png',
  'images/mask-white-teal-defense-explosion-4.png',
  'images/mask-white-teal-defense-explosion-5.png',
  'images/mask-white-teal-defense-explosion-6.png',
  'images/mask-white-teal-defense-explosion-7.png',
  'images/mask-white-teal-defense-explosion-8.png',
];
const WHITE_TEAL_DEFENSE_BODY_BOUNDS = [
  { left: 112, top: 270, right: 232, bottom: 565 },
  { left: 73, top: 270, right: 193, bottom: 565 },
  { left: 70, top: 270, right: 190, bottom: 565 },
  { left: 70, top: 270, right: 190, bottom: 565 },
  { left: 71, top: 270, right: 191, bottom: 565 },
  { left: 72, top: 270, right: 192, bottom: 565 },
  { left: 70, top: 270, right: 190, bottom: 565 },
  { left: 72, top: 270, right: 192, bottom: 565 },
];
const WHITE_TEAL_DEFENSE_FRAME_COUNT = WHITE_TEAL_DEFENSE_SRCS.length;
const WHITE_TEAL_DEFENSE_FRAME_TICKS = 8;
const WHITE_TEAL_DEFENSE_RENDER_HEIGHT = 96;
const WHITE_TEAL_DEFENSE_BOTTOM_OFFSET = 12;
// This box tracks the character itself. The umbrella is intentionally not
// used for sizing, so the eight frames keep the same in-game character scale.
const whiteTealDefenseImgs = WHITE_TEAL_DEFENSE_SRCS.map(() => null);
const whiteTealDefenseLoaded = WHITE_TEAL_DEFENSE_SRCS.map(() => false);
WHITE_TEAL_DEFENSE_SRCS.forEach((src, index) => {
  const img = wx.createImage();
  img.onload = () => { whiteTealDefenseLoaded[index] = true; };
  img.src = src;
  whiteTealDefenseImgs[index] = img;
});

// These two older frames belong to the white-teal mask's blast skill.
const WHITE_TEAL_BLAST_SRCS = [
  'images/mask-white-teal-character-defense-1.png',
  'images/mask-white-teal-character-defense-2.png',
];
const WHITE_TEAL_BLAST_BODY_BOUNDS = [
  { left: 420, top: 390, right: 900, bottom: 1080 },
  { left: 430, top: 390, right: 890, bottom: 1072 },
];
const WHITE_TEAL_BLAST_FRAME_TICKS = 10;
const whiteTealBlastImgs = WHITE_TEAL_BLAST_SRCS.map(() => null);
const whiteTealBlastLoaded = WHITE_TEAL_BLAST_SRCS.map(() => false);
WHITE_TEAL_BLAST_SRCS.forEach((src, index) => {
  const img = wx.createImage();
  img.onload = () => { whiteTealBlastLoaded[index] = true; };
  img.src = src;
  whiteTealBlastImgs[index] = img;
});

const RED_GOLD_BLAST_SRCS = [
  'images/mask-red-gold-blast-1.png',
  'images/mask-red-gold-blast-2.png',
  'images/mask-red-gold-blast-3.png',
];
// The axe is excluded from these bounds so it does not change the character
// scale or make the character jump as the weapon changes pose.
const RED_GOLD_BLAST_BODY_BOUNDS = [
  { left: 330, top: 225, right: 960, bottom: 1045, scaleHeight: 820 },
  { left: 335, top: 175, right: 960, bottom: 995, scaleHeight: 820 },
  { left: 280, top: 100, right: 975, bottom: 920, scaleHeight: 820 },
];
const RED_GOLD_BLAST_FRAME_TICKS = 5;
const redGoldBlastImgs = RED_GOLD_BLAST_SRCS.map(() => null);
const redGoldBlastLoaded = RED_GOLD_BLAST_SRCS.map(() => false);
RED_GOLD_BLAST_SRCS.forEach((src, index) => {
  const img = wx.createImage();
  img.onload = () => { redGoldBlastLoaded[index] = true; };
  img.src = src;
  redGoldBlastImgs[index] = img;
});

const GOLD_ARMOR_BLAST_SRCS = [
  'images/mask-gold-armor-blast-1.png',
  'images/mask-gold-armor-blast-2.png',
  'images/mask-gold-armor-blast-3.png',
];
// The supplied frames have transparent padding and a large flag. Keep the
// body anchor centered on the character so the prop does not change scale or
// make the character jump during the skill.
const GOLD_ARMOR_BLAST_BODY = {
  left: 480,
  top: 220,
  right: 920,
  bottom: 982,
  scaleHeight: 758,
};
const GOLD_ARMOR_BLAST_FRAME_TICKS = 5;
const goldArmorBlastImgs = GOLD_ARMOR_BLAST_SRCS.map(() => null);
const goldArmorBlastLoaded = GOLD_ARMOR_BLAST_SRCS.map(() => false);
GOLD_ARMOR_BLAST_SRCS.forEach((src, index) => {
  const img = wx.createImage();
  img.onload = () => { goldArmorBlastLoaded[index] = true; };
  img.src = src;
  goldArmorBlastImgs[index] = img;
});

const GOLD_ARMOR_DEFENSE_SRCS = [
  'images/mask-gold-armor-defense-1.png',
  'images/mask-gold-armor-defense-2.png',
  'images/mask-gold-armor-defense-3.png',
  'images/mask-gold-armor-defense-4.png',
];
// Keep the character body anchored at the same scale as the gold-armor
// attack frames; the flag is intentionally excluded from the body bounds.
const GOLD_ARMOR_DEFENSE_BODY = {
  left: 480,
  top: 220,
  right: 920,
  bottom: 982,
  scaleHeight: 758,
};
const GOLD_ARMOR_DEFENSE_FRAME_TICKS = 8;
const goldArmorDefenseImgs = GOLD_ARMOR_DEFENSE_SRCS.map(() => null);
const goldArmorDefenseLoaded = GOLD_ARMOR_DEFENSE_SRCS.map(() => false);
GOLD_ARMOR_DEFENSE_SRCS.forEach((src, index) => {
  const img = wx.createImage();
  img.onload = () => { goldArmorDefenseLoaded[index] = true; };
  img.src = src;
  goldArmorDefenseImgs[index] = img;
});

const RED_GOLD_DEFENSE_SRCS = [
  'images/mask-red-gold-axe-spin-1.png',
  'images/mask-red-gold-axe-spin-2.png',
  'images/mask-red-gold-axe-spin-3.png',
  'images/mask-red-gold-axe-spin-4.png',
  'images/mask-red-gold-axe-spin-5.png',
  'images/mask-red-gold-axe-spin-6.png',
];
// These frames use a wider 1774x887 canvas. Anchor on the character body so
// the rotating axe does not change the hero scale or screen position.
const RED_GOLD_DEFENSE_BODY = {
  left: 665,
  top: 114,
  right: 1090,
  bottom: 768,
  scaleHeight: 654,
};
const RED_GOLD_DEFENSE_FRAME_TICKS = 4;
const redGoldDefenseImgs = RED_GOLD_DEFENSE_SRCS.map(() => null);
const redGoldDefenseLoaded = RED_GOLD_DEFENSE_SRCS.map(() => false);
RED_GOLD_DEFENSE_SRCS.forEach((src, index) => {
  const img = wx.createImage();
  img.onload = () => { redGoldDefenseLoaded[index] = true; };
  img.src = src;
  redGoldDefenseImgs[index] = img;
});

// The first three frames use a 1254x1254 canvas. The last source has a
// slightly different canvas, so keep its visible bottom aligned explicitly.
const SHIELD_IMPACT_META = [
  { canvasHeight: 1254, visibleTop: 212, visibleBottom: 1096 },
  { canvasHeight: 1254, visibleTop: 212, visibleBottom: 1096 },
  { canvasHeight: 1254, visibleTop: 212, visibleBottom: 1096 },
  { canvasHeight: 1222, visibleTop: 124, visibleBottom: 1020 },
];
// Hold each action frame for about 0.13 seconds at 60 FPS so the impact
// reads clearly instead of switching almost immediately.
const SHIELD_IMPACT_FRAME_TICKS = 8;
const SHIELD_IMPACT_ACTIVE_TICKS = SHIELD_IMPACT_FRAME_TICKS * 4;
const SHIELD_IMPACT_HOLD_TICKS = 90; // 1.5 seconds at 60 FPS
export const SHIELD_IMPACT_TOTAL_TICKS = SHIELD_IMPACT_ACTIVE_TICKS + SHIELD_IMPACT_HOLD_TICKS;
const shieldImpactImgs = SHIELD_IMPACT_SRCS.map(() => null);
const shieldImpactLoaded = SHIELD_IMPACT_SRCS.map(() => false);

function loadShieldImpactImages() {
  SHIELD_IMPACT_SRCS.forEach((src, index) => {
    const img = wx.createImage();
    img.onload = () => { shieldImpactLoaded[index] = true; };
    img.src = src;
    shieldImpactImgs[index] = img;
  });
}

function drawShieldImpact(ctx, player, effect) {
  const elapsed = Math.max(0, (effect.life || SHIELD_IMPACT_TOTAL_TICKS) - effect.timer);
  const frameIndex = Math.min(3, Math.floor(elapsed / SHIELD_IMPACT_FRAME_TICKS));
  const img = shieldImpactImgs[frameIndex];
  if (!shieldImpactLoaded[frameIndex] || !img || !img.width) return;

  const meta = SHIELD_IMPACT_META[frameIndex];
  const baseMeta = SHIELD_IMPACT_META[0];
  const targetVisibleHeight = 120 * (baseMeta.visibleBottom - baseMeta.visibleTop) / baseMeta.canvasHeight;
  const visibleHeight = meta.visibleBottom - meta.visibleTop;
  const drawHeight = targetVisibleHeight * meta.canvasHeight / visibleHeight;
  const drawWidth = drawHeight * img.width / img.height;
  const bottomY = player.y + player.height + 2;
  const visibleBottom = meta.visibleBottom / meta.canvasHeight * drawHeight;
  const smoothing = ctx.imageSmoothingEnabled;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    player.x - drawWidth / 2,
    bottomY - visibleBottom,
    drawWidth,
    drawHeight
  );
  ctx.imageSmoothingEnabled = smoothing;
}

function drawWhiteTealDefense(ctx, player, effect) {
  const elapsed = Math.max(0, (effect.life || SHIELD_IMPACT_TOTAL_TICKS) - effect.timer);
  const frameIndex = Math.min(WHITE_TEAL_DEFENSE_FRAME_COUNT - 1, Math.floor(elapsed / WHITE_TEAL_DEFENSE_FRAME_TICKS));
  const img = whiteTealDefenseImgs[frameIndex];
  const body = WHITE_TEAL_DEFENSE_BODY_BOUNDS[frameIndex];
  if (!whiteTealDefenseLoaded[frameIndex] || !img || !img.width || !body) return false;

  return drawMaskedCharacterImage(
    ctx,
    player.x,
    player.y + player.height + WHITE_TEAL_DEFENSE_BOTTOM_OFFSET,
    WHITE_TEAL_DEFENSE_RENDER_HEIGHT,
    img,
    body,
    false
  );
}

function drawWhiteTealBlast(ctx, player, effect) {
  const elapsed = Math.max(0, (effect.life || BLAST_IMPACT_TOTAL_TICKS) - effect.timer);
  const frameIndex = Math.min(1, Math.floor(elapsed / WHITE_TEAL_BLAST_FRAME_TICKS));
  const img = whiteTealBlastImgs[frameIndex];
  const body = WHITE_TEAL_BLAST_BODY_BOUNDS[frameIndex];
  if (!whiteTealBlastLoaded[frameIndex] || !img || !img.width || !body) return false;

  return drawMaskedCharacterImage(
    ctx,
    player.x,
    player.y + player.height + 2,
    84,
    img,
    body,
    false
  );
}

function drawRedGoldBlast(ctx, player, effect) {
  const elapsed = Math.max(0, (effect.life || BLAST_IMPACT_TOTAL_TICKS) - effect.timer);
  const frameIndex = Math.min(RED_GOLD_BLAST_SRCS.length - 1, Math.floor(elapsed / RED_GOLD_BLAST_FRAME_TICKS));
  const img = redGoldBlastImgs[frameIndex];
  const body = RED_GOLD_BLAST_BODY_BOUNDS[frameIndex];
  if (!redGoldBlastLoaded[frameIndex] || !img || !img.width || !body) return false;

  return drawMaskedCharacterImage(
    ctx,
    player.x,
    player.y + player.height + 2,
    84,
    img,
    body,
    false
  );
}

function drawGoldArmorBlast(ctx, player, effect) {
  const elapsed = Math.max(0, (effect.life || BLAST_IMPACT_TOTAL_TICKS) - effect.timer);
  const frameIndex = Math.min(GOLD_ARMOR_BLAST_SRCS.length - 1, Math.floor(elapsed / GOLD_ARMOR_BLAST_FRAME_TICKS));
  const img = goldArmorBlastImgs[frameIndex];
  if (!goldArmorBlastLoaded[frameIndex] || !img || !img.width) return false;

  return drawMaskedCharacterImage(
    ctx,
    player.x,
    player.y + player.height + 2,
    84,
    img,
    GOLD_ARMOR_BLAST_BODY,
    false
  );
}

function drawGoldArmorDefense(ctx, player, effect) {
  const elapsed = Math.max(0, (effect.life || SHIELD_IMPACT_TOTAL_TICKS) - effect.timer);
  const frameIndex = Math.min(GOLD_ARMOR_DEFENSE_SRCS.length - 1, Math.floor(elapsed / GOLD_ARMOR_DEFENSE_FRAME_TICKS));
  const img = goldArmorDefenseImgs[frameIndex];
  if (!goldArmorDefenseLoaded[frameIndex] || !img || !img.width) return false;

  return drawMaskedCharacterImage(
    ctx,
    player.x,
    player.y + player.height + 2,
    84,
    img,
    GOLD_ARMOR_DEFENSE_BODY,
    false
  );
}

function drawRedGoldDefense(ctx, player, effect) {
  const elapsed = Math.max(0, (effect.life || SHIELD_IMPACT_TOTAL_TICKS) - effect.timer);
  const frameIndex = Math.min(RED_GOLD_DEFENSE_SRCS.length - 1, Math.floor(elapsed / RED_GOLD_DEFENSE_FRAME_TICKS));
  const img = redGoldDefenseImgs[frameIndex];
  if (!redGoldDefenseLoaded[frameIndex] || !img || !img.width) return false;

  return drawMaskedCharacterImage(
    ctx,
    player.x,
    player.y + player.height + 2,
    84,
    img,
    RED_GOLD_DEFENSE_BODY,
    false
  );
}

loadShieldImpactImages();

const BLAST_IMPACT_SRCS = [
  'images/hero-blast-impact-1.png',
  'images/hero-blast-impact-2.png',
  'images/hero-blast-impact-3.png',
];
const BLAST_IMPACT_META = [
  { canvasHeight: 1254, visibleTop: 212, visibleBottom: 1096 },
  { canvasHeight: 1254, visibleTop: 212, visibleBottom: 1084 },
  { canvasHeight: 1241, visibleTop: 172, visibleBottom: 1036 },
];
// A short wind-up creates a sharper impact feeling; the last frame still
// remains visible during the separate 1.5-second hold.
const BLAST_IMPACT_FRAME_TICKS = 2;
const BLAST_IMPACT_ACTIVE_TICKS = BLAST_IMPACT_FRAME_TICKS * 3;
const BLAST_IMPACT_HOLD_TICKS = 90; // 1.5 seconds at 60 FPS
export const BLAST_IMPACT_TOTAL_TICKS = BLAST_IMPACT_ACTIVE_TICKS + BLAST_IMPACT_HOLD_TICKS;
const blastImpactImgs = BLAST_IMPACT_SRCS.map(() => null);
const blastImpactLoaded = BLAST_IMPACT_SRCS.map(() => false);

function loadBlastImpactImages() {
  BLAST_IMPACT_SRCS.forEach((src, index) => {
    const img = wx.createImage();
    img.onload = () => { blastImpactLoaded[index] = true; };
    img.src = src;
    blastImpactImgs[index] = img;
  });
}

function drawBlastImpact(ctx, player, effect) {
  const elapsed = Math.max(0, (effect.life || BLAST_IMPACT_TOTAL_TICKS) - effect.timer);
  const frameIndex = Math.min(2, Math.floor(elapsed / BLAST_IMPACT_FRAME_TICKS));
  const img = blastImpactImgs[frameIndex];
  if (!blastImpactLoaded[frameIndex] || !img || !img.width) return;

  const meta = BLAST_IMPACT_META[frameIndex];
  const baseMeta = BLAST_IMPACT_META[0];
  const targetVisibleHeight = 120 * (baseMeta.visibleBottom - baseMeta.visibleTop) / baseMeta.canvasHeight;
  const visibleHeight = meta.visibleBottom - meta.visibleTop;
  const drawHeight = targetVisibleHeight * meta.canvasHeight / visibleHeight;
  const drawWidth = drawHeight * img.width / img.height;
  const bottomY = player.y + player.height + 2;
  const visibleBottom = meta.visibleBottom / meta.canvasHeight * drawHeight;
  const smoothing = ctx.imageSmoothingEnabled;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    player.x - drawWidth / 2,
    bottomY - visibleBottom,
    drawWidth,
    drawHeight
  );
  ctx.imageSmoothingEnabled = smoothing;
}

loadBlastImpactImages();


function drawHitBurst(ctx, x, y, sign, progress, alpha) {
  const radius = 10 + progress * 13;
  const burstAlpha = Math.min(1, alpha * 1.35) * (1 - progress * 0.25);
  ctx.save();
  ctx.globalAlpha = burstAlpha;
  ctx.strokeStyle = '#fff7cf';
  ctx.shadowColor = '#8de7ff';
  ctx.shadowBlur = 14;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (let i = 0; i < 6; i++) {
    const angle = (i - 2.5) * 0.42 + (sign < 0 ? Math.PI : 0);
    const inner = radius * 0.55;
    const outer = radius + (i % 2) * 5;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 3.5 + (1 - progress) * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawProjectiles(ctx, projectiles) {
  projectiles.forEach(projectile => {
    const sign = projectile.direction === 'left' ? -1 : 1;
    const radius = projectile.radius || 6;
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.globalAlpha = Math.min(1, Math.max(0.25, projectile.life / 18));
    ctx.strokeStyle = '#7ef5e8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#35d7d0';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(-sign * 16, 0);
    ctx.lineTo(-sign * 3, 0);
    ctx.stroke();
    ctx.fillStyle = '#f7fff3';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export function drawAttackEffects(ctx, effects, player) {
  effects.forEach(eff => {
    const life = eff.life || 8;
    const delay = eff.delay || 0;
    const age = life + delay - eff.timer;
    if (age < delay) return;

    const progress = Math.max(0, Math.min(1, (age - delay) / life));
    const fade = Math.max(0, 1 - progress);
    const alpha = Math.min(1, progress * 5) * fade;
    if (alpha <= 0) return;

    const sign = eff.type === 'left' ? -1 : 1;

    if (eff.charged) {
      const chargeAlpha = Math.min(1, alpha * 1.4);
      const range = eff.range || 190;
      const endX = player.x + sign * range;
      const bandTop = player.y + 8;
      const bandBottom = player.y + player.height + 34;
      ctx.save();
      ctx.globalAlpha = chargeAlpha;
      ctx.fillStyle = 'rgba(255, 170, 45, 0.22)';
      ctx.strokeStyle = '#ffd86b';
      ctx.shadowColor = '#ff9d38';
      ctx.shadowBlur = 18;
      ctx.fillRect(Math.min(player.x, endX), bandTop, Math.abs(endX - player.x), bandBottom - bandTop);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(player.x, player.y + 30);
      ctx.lineTo(endX, player.y + 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(endX, player.y + 30, 10 + (eff.chargeRatio || 0) * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (eff.hits) {
      eff.hits.forEach(hit => drawHitBurst(ctx, hit.x, hit.y, sign, progress, alpha));
    }
  });
  ctx.shadowBlur = 0;
}

export function drawChargeRange(ctx, player) {
  if (!player || player.attackMode !== 'charge' || !player.isCharging) return;

  const progress = player.getChargeProgress ? player.getChargeProgress() : 0;
  const range = player.getChargeRange ? player.getChargeRange() : 190;
  const sign = player.chargeDirection === 'left' ? -1 : 1;
  const endX = player.x + sign * range;
  const top = player.y + 8;
  const height = player.height + 34;
  const pulse = 0.72 + Math.sin(Date.now() / 90) * 0.12;

  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = 'rgba(255, 170, 45, 0.18)';
  ctx.fillRect(Math.min(player.x, endX), top, Math.abs(endX - player.x), height);
  ctx.strokeStyle = '#ffd86b';
  ctx.shadowColor = '#ff9d38';
  ctx.shadowBlur = 14;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + 30);
  ctx.lineTo(endX, player.y + 30);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(endX, player.y + 30, 9 + progress * 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fff1bd';
  ctx.font = '11px Arial';
  ctx.textAlign = sign < 0 ? 'right' : 'left';
  ctx.fillText(`${Math.round(range)} px`, endX - sign * 5, player.y + 18);
  ctx.restore();
}

export function drawSkillEffects(ctx, effects, player, selectedMask) {
  const PUSH_RANGE = 160;
  effects.forEach(eff => {
    if (eff.type === 'shield') {
      const customDefenseDrawn = selectedMask === 'whiteTeal'
        ? drawWhiteTealDefense(ctx, player, eff)
        : selectedMask === 'goldArmor'
          ? drawGoldArmorDefense(ctx, player, eff)
          : selectedMask === 'redGold'
            ? drawRedGoldDefense(ctx, player, eff)
            : false;
      if (!customDefenseDrawn) drawShieldImpact(ctx, player, eff);
      const elapsed = Math.max(0, (eff.life || SHIELD_IMPACT_TOTAL_TICKS) - eff.timer);
      const pulseProgress = Math.min(1, elapsed / SHIELD_IMPACT_ACTIVE_TICKS);
      const t = pulseProgress;
      ctx.strokeStyle = `rgba(120, 220, 255, ${1 - t})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(player.x, player.y + 30, 40 + pulseProgress * PUSH_RANGE, 0, Math.PI * 2);
      ctx.stroke();
    } else if (eff.type === 'blast') {
      const customBlastDrawn = selectedMask === 'redGold'
        ? drawRedGoldBlast(ctx, player, eff)
        : selectedMask === 'whiteTeal'
          ? drawWhiteTealBlast(ctx, player, eff)
          : selectedMask === 'goldArmor'
            ? drawGoldArmorBlast(ctx, player, eff)
            : false;
      if (!customBlastDrawn) drawBlastImpact(ctx, player, eff);
      const elapsed = Math.max(0, (eff.life || BLAST_IMPACT_TOTAL_TICKS) - eff.timer);
      const pulseProgress = Math.min(1, elapsed / BLAST_IMPACT_ACTIVE_TICKS);
      const t = pulseProgress;
      const radius = 60 + t * 500;
      const alpha = 1 - t;
      ctx.fillStyle = `rgba(255, 120, 40, ${alpha * 0.25})`;
      ctx.beginPath();
      ctx.arc(player.x, player.y + 20, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 200, 80, ${alpha})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(player.x, player.y + 20, radius * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  ctx.shadowBlur = 0;
}

export function drawMask(ctx, cx, cy, s, id) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  if (MASK_IMAGE_SRCS[id]) {
    const img = maskImages[id];
    if (maskImageLoaded[id] && img.width > 0) {
      const smoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, -MASK_IMAGE_SIZE / 2, -MASK_IMAGE_SIZE / 2, MASK_IMAGE_SIZE, MASK_IMAGE_SIZE);
      ctx.imageSmoothingEnabled = smoothing;
    }
  } else if (id === 'fox') {
    ctx.fillStyle = '#ff9a3c';
    ctx.beginPath(); ctx.moveTo(-13, -9); ctx.lineTo(-18, -26); ctx.lineTo(-5, -15); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(13, -9); ctx.lineTo(18, -26); ctx.lineTo(5, -15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a3b12';
    ctx.beginPath(); ctx.moveTo(-12.5, -12); ctx.lineTo(-15.5, -22); ctx.lineTo(-8, -14.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12.5, -12); ctx.lineTo(15.5, -22); ctx.lineTo(8, -14.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff9a3c';
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff2df';
    ctx.beginPath(); ctx.ellipse(0, 6, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a1d05'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-10, -2); ctx.quadraticCurveTo(-6, -5, -2, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(6, -5, 10, -2); ctx.stroke();
    ctx.fillStyle = '#2a1200';
    ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(3, 4); ctx.lineTo(0, 8); ctx.closePath(); ctx.fill();
  } else if (id === 'rabbit') {
    ctx.fillStyle = '#f5f0ff';
    ctx.beginPath(); ctx.ellipse(-7, -22, 5, 13, -0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(7, -22, 5, 13, 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffb3c8';
    ctx.beginPath(); ctx.ellipse(-7, -21, 2.5, 8, -0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(7, -21, 2.5, 8, 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5f0ff';
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a2a3a';
    ctx.beginPath(); ctx.arc(-5.5, -2, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5.5, -2, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-4.7, -3, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6.3, -3, 1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8fab';
    ctx.beginPath(); ctx.ellipse(0, 4, 2, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d96a8c'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, 5.5); ctx.quadraticCurveTo(-2, 8, -3.5, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 5.5); ctx.quadraticCurveTo(2, 8, 3.5, 7); ctx.stroke();
  } else if (id === 'cat') {
    ctx.fillStyle = '#4b3a75';
    ctx.beginPath(); ctx.moveTo(-13, -8); ctx.lineTo(-16, -22); ctx.lineTo(-4, -13); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(13, -8); ctx.lineTo(16, -22); ctx.lineTo(4, -13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff9ecb';
    ctx.beginPath(); ctx.moveTo(-12, -11); ctx.lineTo(-13.5, -18); ctx.lineTo(-7, -13); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -11); ctx.lineTo(13.5, -18); ctx.lineTo(7, -13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4b3a75';
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8dff6e';
    ctx.beginPath(); ctx.ellipse(-5.5, -2, 2.8, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5.5, -2, 2.8, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0c0c14';
    ctx.beginPath(); ctx.ellipse(-5.5, -2, 0.9, 3.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5.5, -2, 0.9, 3.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff9ecb';
    ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(2, 4); ctx.lineTo(0, 6.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8e2ff'; ctx.lineWidth = 1;
    const whiskers = [[-1, 5, -14, 3], [-1, 6.5, -14, 7], [1, 5, 14, 3], [1, 6.5, 14, 7]];
    for (const w of whiskers) {
      ctx.beginPath(); ctx.moveTo(w[0], w[1]); ctx.lineTo(w[2], w[3]); ctx.stroke();
    }
  } else if (id === 'skull') {
    ctx.fillStyle = '#efe9dc';
    ctx.beginPath(); ctx.ellipse(0, -1, 15, 13.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e3dccb';
    ctx.beginPath(); ctx.roundRect(-8, 6, 16, 8, 3); ctx.fill();
    ctx.fillStyle = '#171310';
    ctx.beginPath(); ctx.ellipse(-5.5, -3, 3.6, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5.5, -3, 3.6, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, 3); ctx.lineTo(2, 3); ctx.lineTo(0, 6.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8f8672'; ctx.lineWidth = 1.2;
    for (let i = -6; i <= 6; i += 3) {
      ctx.beginPath(); ctx.moveTo(i, 8); ctx.lineTo(i, 13.5); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-8, 10.5); ctx.lineTo(8, 10.5); ctx.stroke();
  } else if (id === 'demon') {
    ctx.fillStyle = '#6e1423';
    ctx.beginPath(); ctx.moveTo(-11, -8); ctx.quadraticCurveTo(-21, -16, -16, -28); ctx.quadraticCurveTo(-14, -17, -4, -12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(11, -8); ctx.quadraticCurveTo(21, -16, 16, -28); ctx.quadraticCurveTo(14, -17, 4, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c2273a';
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.ellipse(-5.5, -2, 3, 2.4, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5.5, -2, 3, 2.4, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#20060a';
    ctx.beginPath(); ctx.ellipse(-5.5, -2, 1.1, 2, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5.5, -2, 1.1, 2, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a060c';
    ctx.beginPath(); ctx.moveTo(-8, 5); ctx.quadraticCurveTo(0, 12, 8, 5); ctx.quadraticCurveTo(0, 8.5, -8, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(-3.5, 6); ctx.lineTo(-4.25, 8.5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, 6); ctx.lineTo(3.5, 6); ctx.lineTo(4.25, 8.5); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function drawMaskPreview(ctx, cx, cy, selectedMask) {
  const MASK_PREVIEW_SCALE = 1.7 * 1.3;
  const PREVIEW_HEIGHT = 148 * 1.3;
  const bottom = cy + 104 + 148 * 0.3;
  const heroDrawn = drawHero(ctx, cx, bottom, PREVIEW_HEIGHT);

  if (!heroDrawn) {
    ctx.fillStyle = '#5b8cff';
    ctx.shadowColor = '#6ec8ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(cx - 54, cy + 34, 108, 70, 24);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#3a5fbb';
    ctx.fillRect(cx - 26, cy + 48, 52, 10);
    ctx.fillStyle = '#b0c4ff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 50, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dbe6ff';
    ctx.beginPath();
    ctx.ellipse(cx - 15, cy - 17, 15, 9, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (selectedMask === 'none') {
    if (heroDrawn) return;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 17, cy - 1, 10, 0, Math.PI * 2);
    ctx.arc(cx + 17, cy - 1, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a5fbb';
    ctx.beginPath();
    ctx.arc(cx - 17, cy - 1, 5, 0, Math.PI * 2);
    ctx.arc(cx + 17, cy - 1, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const faceY = heroDrawn ? bottom - PREVIEW_HEIGHT * (1 - HERO_FACE_RATIO) : cy;
    drawMask(ctx, cx, faceY, (heroDrawn ? 1.7 : 3.1) * MASK_PREVIEW_SCALE, selectedMask);
  }
}
