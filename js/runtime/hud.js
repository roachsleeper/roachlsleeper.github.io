import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render.js';

const TOP_BAR = '#202a45';
const BUTTON_TOP = '#465b88';
const BUTTON_BOTTOM = '#1b2745';
const BUTTON_EDGE = '#7488b5';
const TEXT = '#e5ebff';
const GOLD = '#f2c85f';

const HUD_FRAME_HEIGHT = 58;
const PAUSE_BUTTON = {
  // Keep the icon inside the status bar's right content area instead of
  // pinning it against the decorative frame edge.
  x: SCREEN_WIDTH - 110,
  y: 10,
  width: 42,
  height: 38,
};
const hudFrame = wx.createImage();
let hudFrameLoaded = false;
hudFrame.onload = () => { hudFrameLoaded = true; };
hudFrame.src = 'images/hud-status-frame.png';

function drawStatusBar(ctx, player, databus) {
  const smoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;

  if (hudFrameLoaded && hudFrame.width > 0) {
    ctx.drawImage(hudFrame, 0, 0, hudFrame.width, hudFrame.height, 0, 0, SCREEN_WIDTH, HUD_FRAME_HEIGHT);
  } else {
    ctx.fillStyle = TOP_BAR;
    ctx.fillRect(0, 0, SCREEN_WIDTH, HUD_FRAME_HEIGHT);
    ctx.fillStyle = 'rgba(10, 14, 28, 0.45)';
    ctx.fillRect(0, HUD_FRAME_HEIGHT - 4, SCREEN_WIDTH, 4);
  }

  ctx.imageSmoothingEnabled = smoothing;
  ctx.save();
  ctx.fillStyle = TEXT;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const statY = HUD_FRAME_HEIGHT * 0.57;
  // Lay the five values out as equal status slots and reserve the final slot
  // for the pause icon so the whole row reads as one compact status bar.
  const statLeft = 40;
  const statRight = PAUSE_BUTTON.x - 24;
  const statSlotWidth = (statRight - statLeft) / 5;
  const stats = [
    `TIME: ${databus.timeLeft}s`,
    `HP: ${Math.floor(player.hp)}`,
    `LV: ${player.level}`,
    `ATK: ${player.atk}`,
    `KILLS: ${player.kills}`,
  ];

  stats.forEach((label, i) => {
    const statX = statLeft + statSlotWidth * (i + 0.5);
    ctx.fillStyle = i === 1 ? '#ffdfbd' : TEXT;
    ctx.fillText(label, statX, statY);

    if (i < stats.length - 1) {
      ctx.fillStyle = 'rgba(216, 177, 111, 0.35)';
      ctx.fillRect(statLeft + statSlotWidth * (i + 1) - 1, 17, 1, 23);
    }
  });
  ctx.restore();

  drawPauseButton(ctx);
}

function drawPauseButton(ctx) {
  const { x, y, width, height } = PAUSE_BUTTON;
  ctx.save();
  // The status-bar artwork already provides the background. Keep only the
  // pause glyph visible; the transparent rectangle remains the hit area.
  ctx.fillStyle = '#f6e8c4';
  const iconX = x + (width - 14) / 2;
  const iconY = y + (height - 18) / 2;
  ctx.fillRect(iconX, iconY, 5, 18);
  ctx.fillRect(iconX + 9, iconY, 5, 18);
  ctx.restore();
}

function drawButton(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(5, 10, 24, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y + 2, w, h, 10);
  ctx.fill();

  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, BUTTON_TOP);
  gradient.addColorStop(1, BUTTON_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();

  ctx.strokeStyle = BUTTON_EDGE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export default class HUD {
  render(ctx, player, databus, skill1Cd, skill2Cd) {
    drawStatusBar(ctx, player, databus);

    const skillW = 150;
    const skillH = 42;
    const skillY = SCREEN_HEIGHT - skillH - 12;
    this.drawSkillBtn(ctx, 0, skillY, skillW, skillH, 'SHIELD', skill1Cd);
    this.drawSkillBtn(ctx, SCREEN_WIDTH - skillW - 10, skillY, skillW, skillH, 'BLAST', skill2Cd);

    ctx.save();
    ctx.fillStyle = '#9aa8c9';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#10172a';
    ctx.shadowBlur = 3;
    const hint = player.attackMode === 'ranged'
      ? 'Tap or hold left/right to fire'
      : player.attackMode === 'charge'
        ? 'Hold left/right to charge, release to attack'
        : 'Tap or hold left/right to attack';
    ctx.fillText(hint, SCREEN_WIDTH / 2, SCREEN_HEIGHT - 47);
    ctx.restore();

    if (player.attackMode === 'charge' && player.isCharging) {
      const barWidth = 170;
      const barHeight = 9;
      const barX = SCREEN_WIDTH / 2 - barWidth / 2;
      const barY = SCREEN_HEIGHT - 29;
      const progress = player.getChargeProgress
        ? player.getChargeProgress()
        : Math.min(1, player.chargeFrames / 60);
      const range = player.getChargeRange ? Math.round(player.getChargeRange()) : 190;

      ctx.fillStyle = 'rgba(20, 16, 30, 0.8)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = '#f3bd55';
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);
      ctx.strokeStyle = '#ffe8a2';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = '#fff1bd';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`CHARGE ${Math.round(progress * 100)}% - RANGE ${range}px`, SCREEN_WIDTH / 2, barY - 4);
    }
  }

  drawSkillBtn(ctx, x, y, w, h, name, cooldown) {
    const onCd = cooldown > 0;
    ctx.save();
    ctx.globalAlpha = onCd ? 0.58 : 1;
    drawButton(ctx, x, y, w, h);

    ctx.fillStyle = TEXT;
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + w / 2, y + 16);

    ctx.fillStyle = GOLD;
    ctx.font = '11px Arial';
    ctx.fillText(onCd ? `CD ${Math.ceil(cooldown / 60)}s` : 'READY', x + w / 2, y + 33);
    ctx.restore();
  }

  handleSkillTouch(x, y, player, monsters, skillEffects) {
    const skillW = 150;
    const skillH = 42;
    const skillY = SCREEN_HEIGHT - skillH - 12;
    const skill1X = 0;
    const skill2X = SCREEN_WIDTH - skillW - 10;

    if (y >= skillY && y <= skillY + skillH) {
      if (x >= skill1X && x <= skill1X + skillW) {
        return player.useSkill1(monsters, skillEffects) ? 'skill1' : false;
      }
      if (x >= skill2X && x <= skill2X + skillW) {
        return player.useSkill2(monsters, skillEffects) ? 'skill2' : false;
      }
    }
    return null;
  }

  handlePauseTouch(x, y) {
    return x >= PAUSE_BUTTON.x
      && x <= PAUSE_BUTTON.x + PAUSE_BUTTON.width
      && y >= PAUSE_BUTTON.y
      && y <= PAUSE_BUTTON.y + PAUSE_BUTTON.height;
  }
}
