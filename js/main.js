import './render.js';
import Player from './player/player.js';
import Monster from './npc/monster.js';
import BrowseScreen from './browse/browseScreen.js';
import StartScreen from './runtime/startscreen.js';
import PauseScreen from './runtime/pausescreen.js';
import GameOverScreen from './runtime/gameoverscreen.js';
import HUD from './runtime/hud.js';
import ComicIntro from './runtime/comicintro.js';
import CoverScreen from './runtime/coverscreen.js';
import CurtainTransition from './runtime/curtaintransition.js';
import DataBus from './databus.js';
import Music from './runtime/music.js';
import { MASKS } from './runtime/mask.js';
import { drawBackground, drawAttackEffects, drawChargeRange, drawSkillEffects, drawProjectiles, drawMask } from './runtime/draw.js';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './render.js';

const SPAWN_INTERVAL = 50;
const GAME_DURATION = 90;
const ARMORED_SLOW_SPAWN_CHANCE = 0.3;
const FLAME_FAST_SPAWN_CHANCE = 0.3;

export default class Main {
  constructor() {
    this.databus = new DataBus();
    this.music = new Music();
    this.player = new Player();
    this.browseScreen = new BrowseScreen();
    this.startScreen = new StartScreen();
    this.startScreen.visible = false;
    this.coverScreen = new CoverScreen(
      () => {
        this.startScreen.visible = false;
        this.comicIntro.visible = true;
      },
      (ctx) => { this.comicIntro.render(ctx); },
    );
    this.comicIntro = new ComicIntro(() => {
      this.startScreen.visible = true;
    });
    this.comicIntro.visible = false;
    this.pauseScreen = new PauseScreen();
    this.gameOverScreen = new GameOverScreen();
    this.hud = new HUD();
    this.transition = new CurtainTransition();

    this.ctx = canvas.getContext('2d');
    this.aniId = 0;
    this.leftPressed = false;
    this.rightPressed = false;
    this.selectedMask = 'none';
    this.maskWorn = false;
    this.isRunning = false;
    this.spawnTimer = 0;
    this.wasRunningBeforeBrowse = false;

    this.initMaskBonus();
    this.initTouchEvents();
    this.loop();
  }

  initMaskBonus() {
    this.player.attackCdMult = 1;
    this.player.rangeBonus = 0;
    this.player.skillCdMult = 1;
    this.player.maskBonusHp = 0;
    this.player.maskBonusAtk = 0;
  }

  initTouchEvents() {
    wx.onTouchStart((e) => {
      const { clientX: x, clientY: y } = e.touches[0];

      if (this.coverScreen.visible) {
        this.coverScreen.handleTouch(x, y);
        return;
      }

      if (this.comicIntro.visible) {
        this.comicIntro.handleTouch(x, y);
        return;
      }

      if (this.transition.active) return;

      if (this.browseScreen.visible) {
        const result = this.browseScreen.handleTouchStart(x, y);
        if (result === 'start') {
          this.beginTransition(() => {
            this.browseScreen.visible = false;
            this.startScreen.visible = true;
          });
        } else if (result === 'back') {
          this.beginTransition(() => {
            this.browseScreen.visible = false;
            this.startScreen.visible = true;
            this.isRunning = false;
            this.leftPressed = false;
            this.rightPressed = false;
            this.player.cancelCharge();
            this.music.playStartBgm();
            this.wasRunningBeforeBrowse = false;
          });
        }
        return;
      }

      if (this.startScreen.visible) {
        this.music.playStartBgm();
        const result = this.startScreen.handleTouch(x, y);
        if (result === 'start') {
          this.beginTransition(() => this.startGame());
        } else if (result === 'browse') {
          this.beginTransition(() => {
            this.startScreen.visible = false;
            this.browseScreen.visible = true;
          });
        }
        return;
      }

      if (this.gameOverScreen.visible) {
        const result = this.gameOverScreen.handleTouch(x, y);
        if (result === 'restart') {
          this.beginTransition(() => {
            this.gameOverScreen.hide();
            this.startGame();
          });
        }
        return;
      }

      if (this.pauseScreen.visible) {
        if (this.hud.handlePauseTouch(x, y)) {
          this.beginTransition(() => {
            this.pauseScreen.visible = false;
            this.music.resumeGameBgm();
          });
          return;
        }
        const result = this.pauseScreen.handleTouch(x, y);
        if (result === 'resume') {
          this.beginTransition(() => {
            this.pauseScreen.visible = false;
            this.music.resumeGameBgm();
          });
        } else if (result === 'restart') {
          this.beginTransition(() => {
            this.pauseScreen.visible = false;
            this.startScreen.visible = true;
            this.isRunning = false;
            this.music.playStartBgm();
          });
        }
        return;
      }

      if (!this.isRunning) return;

      if (this.hud.handlePauseTouch(x, y)) {
        this.pauseScreen.visible = true;
        this.leftPressed = false;
        this.rightPressed = false;
        this.player.cancelCharge();
        this.music.pauseGameBgm();
        return;
      }

      const skillResult = this.hud.handleSkillTouch(
        x, y, this.player, this.databus.monsters, this.databus.skillEffects
      );
      if (skillResult === 'browse') {
        this.wasRunningBeforeBrowse = true;
        this.beginTransition(() => {
          this.browseScreen.visible = true;
        });
        return;
      }
      if (skillResult === 'skill1') {
        this.music.playSkill1();
        this.wearMask();
      } else if (skillResult === 'skill2') {
        this.music.playSkill2();
      }
      if (skillResult !== null) return;

      const direction = x < SCREEN_WIDTH / 2 ? 'left' : 'right';
      if (this.player.attackMode === 'charge') {
        this.player.beginCharge(direction);
      } else if (direction === 'left') {
        this.leftPressed = true;
        this.tryAttack('left');
      } else {
        this.rightPressed = true;
        this.tryAttack('right');
      }
    });

    wx.onTouchMove((e) => {
      if (this.browseScreen.visible) {
        const { clientX: x, clientY: y } = e.touches[0];
        this.browseScreen.handleTouchMove(x, y);
      }
    });

    wx.onTouchEnd(() => {
      if (this.player.isCharging) {
        if (this.player.releaseCharge(this.databus.monsters, this.databus.attackEffects)) {
          this.music.playAttack();
        }
      }
      this.leftPressed = false;
      this.rightPressed = false;
      if (this.browseScreen.visible) {
        this.browseScreen.handleTouchEnd();
      }
    });

    wx.onTouchCancel(() => {
      this.player.cancelCharge();
      this.leftPressed = false;
      this.rightPressed = false;
      if (this.browseScreen.visible) {
        this.browseScreen.handleTouchEnd();
      }
    });
  }

  startGame() {
    this.startScreen.visible = false;
    this.selectedMask = this.startScreen.selectedMask;
    this.maskWorn = this.selectedMask !== 'none';
    this.initMaskBonus();
    this.configureSelectedMask();

    this.player.reset();
    this.databus.reset();
    this.databus.timeLeft = GAME_DURATION;
    this.spawnTimer = 0;
    this.isRunning = true;
    this.music.playGameBgm();

    this.initMonsters();
  }

  beginTransition(action) {
    return this.transition.start(action);
  }

  wearMask() {
    if (this.maskWorn) return;
    this.maskWorn = true;

    const maskObj = MASKS.find(m => m.id === this.selectedMask);
    if (!maskObj || !maskObj.bonus) return;

    const b = maskObj.bonus;
    this.player.attackCdMult = b.cdMult || 1;
    this.player.rangeBonus = b.range || 0;
    this.player.skillCdMult = b.skillCdMult || 1;
    if (b.hp) {
      this.player.maskBonusHp = b.hp;
      this.player.maxHp += b.hp;
      this.player.hp += b.hp;
    }
    if (b.atk) {
      this.player.maskBonusAtk = b.atk;
      this.player.atk += b.atk;
    }
  }

  configureSelectedMask() {
    const maskObj = MASKS.find(m => m.id === this.selectedMask);
    this.player.setAttackMode(maskObj ? maskObj.attackMode : 'melee');
    this.player.setAttackAnimationProfile(this.selectedMask);
    if (!maskObj || !maskObj.bonus) return;

    const b = maskObj.bonus;
    this.player.attackCdMult = b.cdMult || 1;
    this.player.rangeBonus = b.range || 0;
    this.player.skillCdMult = b.skillCdMult || 1;
    this.player.maskBonusHp = b.hp || 0;
    this.player.maskBonusAtk = b.atk || 0;
  }

  tryAttack(direction) {
    if (this.player.attackCooldown > 0) return false;
    const didAttack = this.player.attack(
      direction,
      this.databus.monsters,
      this.databus.attackEffects,
      this.databus.projectiles
    );
    if (didAttack) this.music.playAttack();
    return didAttack;
  }

  initMonsters() {
    this.databus.monsters = [];
    for (let i = 0; i < 4; i++) {
      const side = i % 2 === 0 ? 'left' : 'right';
      // Put one fast flame monster in the opening wave so the new type is
      // always visible, then let later spawns use the normal mix.
      this.spawnMonster(side, i === 0 ? 'flameFast' : null);
    }
  }

  spawnMonster(side, forcedType = null) {
    const type = forcedType || (
      Math.random() < FLAME_FAST_SPAWN_CHANCE
        ? 'flameFast'
        : Math.random() < ARMORED_SLOW_SPAWN_CHANCE ? 'armoredSlow' : 'coral'
    );
    const m = new Monster(type);
    m.init(this.player.level, side);
    if (side === 'left') {
      m.x = -m.width - Math.random() * 60;
    } else {
      m.x = SCREEN_WIDTH + Math.random() * 60;
    }
    this.databus.monsters.push(m);
  }

  maintainMonsters() {
    if (this.databus.monsters.length < 6 && this.spawnTimer <= 0) {
      const side = Math.random() < 0.5 ? 'left' : 'right';
      this.spawnMonster(side);
      this.spawnTimer = SPAWN_INTERVAL;
    } else if (this.spawnTimer > 0) {
      this.spawnTimer--;
    }

    if (this.databus.monsters.length > 8) {
      this.databus.monsters.sort((a, b) => {
        const distA = Math.abs(a.x - this.player.x);
        const distB = Math.abs(b.x - this.player.x);
        return distA - distB;
      });
      this.databus.monsters = this.databus.monsters.slice(0, 6);
    }
  }

  update() {
    if (!this.isRunning) return;

    this.databus.frame++;

    if (this.databus.frame % 60 === 0) {
      this.databus.timeLeft--;
      if (this.databus.timeLeft <= 0) {
        this.databus.timeLeft = 0;
        this.gameOver();
        return;
      }
    }

    if (this.player.attackMode !== 'charge') {
      if (this.leftPressed) this.tryAttack('left');
      if (this.rightPressed) this.tryAttack('right');
    }

    this.player.update();

    this.updateProjectiles();

    for (let i = this.databus.attackEffects.length - 1; i >= 0; i--) {
      this.databus.attackEffects[i].timer--;
      if (this.databus.attackEffects[i].timer <= 0) {
        this.databus.attackEffects.splice(i, 1);
      }
    }

    for (let i = this.databus.skillEffects.length - 1; i >= 0; i--) {
      this.databus.skillEffects[i].timer--;
      if (this.databus.skillEffects[i].timer <= 0) {
        this.databus.skillEffects.splice(i, 1);
      }
    }

    for (let i = this.databus.monsters.length - 1; i >= 0; i--) {
      const result = this.databus.monsters[i].update(this.player, this.databus);
      if (result === 'dead') {
        this.gameOver();
        return;
      }
    }

    this.maintainMonsters();
  }

  updateProjectiles() {
    for (let i = this.databus.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.databus.projectiles[i];
      const sign = projectile.direction === 'left' ? -1 : 1;
      projectile.x += sign * projectile.speed;
      projectile.life--;

      let hit = false;
      for (let j = this.databus.monsters.length - 1; j >= 0; j--) {
        const monster = this.databus.monsters[j];
        const withinX = projectile.x + projectile.radius > monster.x
          && projectile.x - projectile.radius < monster.x + monster.width;
        const withinY = Math.abs(projectile.y - (monster.y + monster.height / 2)) < monster.height * 0.6;
        if (!withinX || !withinY) continue;

        monster.hitFlashTimer = 8;
        monster.hitVelocity = sign * 5.5;
        monster.hp -= projectile.damage;
        this.databus.attackEffects.push({
          type: projectile.direction,
          timer: 8,
          life: 8,
          delay: 0,
          hits: [{ x: monster.x + monster.width / 2, y: monster.y + monster.height / 2 }],
        });
        if (monster.hp <= 0) {
          this.databus.monsters.splice(j, 1);
          this.player.kills++;
          if (this.player.kills % 2 === 0) this.player.levelUp();
        }
        hit = true;
        break;
      }

      if (hit || projectile.life <= 0 || projectile.x < -40 || projectile.x > SCREEN_WIDTH + 40) {
        this.databus.projectiles.splice(i, 1);
      }
    }
  }

  gameOver() {
    this.isRunning = false;
    this.databus.gameOver();
    this.gameOverScreen.show(this.player.kills, this.player.level, this.player.kills);
  }

  render() {
    this.ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    if (!this.isRunning) {
      this.startScreen.render(this.ctx);
      return;
    }

    drawBackground(this.ctx);

    this.databus.monsters.forEach(m => m.render(this.ctx));
    drawProjectiles(this.ctx, this.databus.projectiles);
    drawChargeRange(this.ctx, this.player);
    const skillAnimationActive = this.databus.skillEffects.some(
      effect => effect.type === 'shield' || effect.type === 'blast'
    );
    this.player.render(
      this.ctx,
      this.maskWorn ? this.selectedMask : null,
      drawMask,
      skillAnimationActive
    );
    drawAttackEffects(this.ctx, this.databus.attackEffects, this.player);
    drawSkillEffects(this.ctx, this.databus.skillEffects, this.player, this.selectedMask);

    this.hud.render(
      this.ctx,
      this.player,
      this.databus,
      this.player.skill1Cooldown,
      this.player.skill2Cooldown,
      (p) => p.getSkill1Cooldown(),
      (p) => p.getSkill2Cooldown()
    );

    this.pauseScreen.render(this.ctx);
    this.gameOverScreen.render(this.ctx);
  }

  loop() {
    if (this.coverScreen.visible) {
      this.coverScreen.update();
      this.coverScreen.render(this.ctx);
    } else if (this.comicIntro.visible) {
      this.comicIntro.update();
      this.comicIntro.render(this.ctx);
    } else if (this.browseScreen.visible) {
      this.browseScreen.update();
      this.browseScreen.render(this.ctx);
    } else if (this.startScreen.visible) {
      this.startScreen.render(this.ctx);
    } else if (this.pauseScreen.visible) {
      this.render();
      this.pauseScreen.render(this.ctx);
    } else if (this.gameOverScreen.visible) {
      this.render();
      this.gameOverScreen.render(this.ctx);
    } else {
      this.update();
      this.render();
    }

    if (!this.coverScreen.visible) {
      this.transition.update();
      this.transition.render(this.ctx);
    }

    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
