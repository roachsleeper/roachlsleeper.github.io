import { WEB_IMAGE_ASSETS } from './web-assets.js?v=asset-sync-v2';

const optimizedAssetSources = new Set(WEB_IMAGE_ASSETS.map((src) => src.replace(/^\.\//, '')));

/* Browser adapter: the actual game is still js/main.js and its original modules. */
(function () {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const logicalWidth = 960;
  const logicalHeight = 540;
  // GitHub Pages serves project sites from a repository sub-path. Resolve
  // assets from this adapter's directory instead of relying on the current
  // document URL, and retry common folder-name variants used by uploads.
  // Keep this adapter compatible with classic-script parsers used by some
  // game-dev tools. The page URL already points at this adapter's directory.
  const assetBase = new URL('./', import.meta.url);
  const assetRoots = {
    images: ['images/', 'Images/', '图片/'],
    audio: ['audio/', 'Audio/', '音频/'],
  };

  function assetCandidates(value) {
    if (typeof value !== 'string') return [value];
    const match = value.match(/^(?:\.\/)?(images|audio)\/(.+)$/i);
    if (!match) return [value];
    const kind = match[1].toLowerCase();
    const relativeName = match[2];
    const originalCandidates = assetRoots[kind].map((root) => new URL(root + relativeName, assetBase).href);
    if (kind !== 'images' || !/\.(?:png|jpe?g)$/i.test(relativeName) || !optimizedAssetSources.has(`images/${relativeName}`)) {
      return originalCandidates;
    }
    const optimizedName = relativeName.replace(/\.(?:png|jpe?g)$/i, '.webp');
    return [new URL(`images-optimized/${optimizedName}`, assetBase).href, ...originalCandidates];
  }

  const loader = document.createElement('div');
  loader.className = 'asset-loader';
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-live', 'polite');
  document.body.appendChild(loader);
  loader.innerHTML = '<div class="asset-loader-glow" aria-hidden="true"></div><div class="asset-loader-content"><div class="asset-loader-emblem" aria-hidden="true"><span></span></div><div class="asset-loader-kicker">NIGHT RUNNER <b>·</b> RESOURCE LOAD</div><div class="asset-loader-title">正在准备夜行</div><div class="asset-loader-sub">场景、角色与技能资源载入中<span class="asset-loader-dots"><i></i><i></i><i></i></span></div><div class="asset-loader-progress" aria-hidden="true"><div class="asset-loader-progress-track"><div data-progress class="asset-loader-progress-fill"></div><i class="asset-loader-progress-spark"></i></div><div class="asset-loader-progress-ticks"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div data-label class="asset-loader-label">资源同步 0%</div></div>';
  const progressBar = loader.querySelector('[data-progress]');
  const progressSpark = loader.querySelector('.asset-loader-progress-spark');
  const progressLabel = loader.querySelector('[data-label]');

  function preloadImage(src) {
    const candidates = assetCandidates(src);
    return new Promise((resolve) => {
      const image = new Image();
      let index = 0;
      let retried = false;
      const next = () => {
        if (index >= candidates.length) return resolve(false);
        const candidate = candidates[index];
        image.onload = () => resolve(true);
        image.onerror = () => {
          if (!retried) {
            retried = true;
            const retryUrl = new URL(candidate);
            retryUrl.searchParams.set('_asset_retry', String(Date.now()));
            image.src = retryUrl.href;
            return;
          }
          retried = false;
          index += 1;
          next();
        };
        image.src = candidate;
      };
      next();
    });
  }

  function preloadGameImages() {
    let loaded = 0;
    let successful = 0;
    const failedAssets = [];
    const total = WEB_IMAGE_ASSETS.length;
    let nextAsset = 0;
    const workerCount = Math.min(6, total);
    const loadWorker = async () => {
      while (nextAsset < total) {
        const src = WEB_IMAGE_ASSETS[nextAsset++];
        const ok = await preloadImage(src);
        loaded += 1;
        if (ok) successful += 1;
        else failedAssets.push(src);
        const percent = Math.round((loaded / total) * 100);
        progressBar.style.width = `${percent}%`;
        progressSpark.style.left = `${percent}%`;
        progressLabel.textContent = `资源同步 ${percent}% · ${loaded}/${total}`;
      }
    };
    return Promise.all(Array.from({ length: workerCount }, loadWorker)).then(() => {
      if (!failedAssets.length) return;
      const error = new Error(`Asset load failed: ${failedAssets.length} failed; ${successful}/${total} loaded`);
      error.failedAssets = failedAssets;
      throw error;
    });
  }

  function hideLoader() {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 300);
  }

  function showAssetLoadError(error) {
    const failedAssets = error && error.failedAssets ? error.failedAssets : [];
    const title = loader.querySelector('.asset-loader-title');
    const subtitle = loader.querySelector('.asset-loader-sub');
    const failedCount = failedAssets.length;
    if (title) title.textContent = '素材加载失败';
    if (subtitle) {
      const names = failedAssets.slice(0, 3).join('、');
      subtitle.textContent = failedCount
        ? `${failedCount} 个文件无法读取：${names}${failedCount > 3 ? '……' : ''}`
        : '请检查发布目录中的图片文件和网络地址';
    }
    if (progressBar) progressBar.style.background = '#c95d5d';
    if (progressSpark) progressSpark.style.display = 'none';
    if (progressLabel) progressLabel.textContent = `加载失败 · ${failedCount || '未知'} 项`;
  }

  function createAssetImage() {
    const image = new Image();
    const nativeSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    let candidates = [];
    let candidateIndex = 0;

    image.addEventListener('error', () => {
      if (candidateIndex < candidates.length) {
        nativeSrc.set.call(image, candidates[candidateIndex++]);
      }
    });

    Object.defineProperty(image, 'src', {
      configurable: true,
      get: () => nativeSrc.get.call(image),
      set: (value) => {
        candidates = assetCandidates(value);
        candidateIndex = 0;
        if (candidates.length) nativeSrc.set.call(image, candidates[candidateIndex++]);
      },
    });
    return image;
  }
  const touchListeners = { start: [], move: [], end: [], cancel: [] };
  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  let nextGameFrameAt = 0;

  // The original mini-game advances state once per frame at 60 FPS. Browsers
  // on 90/120 Hz screens would otherwise run the same logic too quickly.
  window.requestAnimationFrame = (callback) => nativeRequestAnimationFrame((timestamp) => {
    if (timestamp < nextGameFrameAt) {
      window.requestAnimationFrame(callback);
      return;
    }
    nextGameFrameAt = timestamp + (1000 / 60);
    callback(timestamp);
  });
  const hint = document.querySelector('.site-hint');

  function showBootError(message) {
    if (hint) hint.textContent = `网页初始化失败：${message}`;
  }
  window.addEventListener('error', (event) => showBootError(event.error && event.error.message ? event.error.message : event.message));
  window.addEventListener('unhandledrejection', (event) => showBootError(event.reason && event.reason.message ? event.reason.message : event.reason));

  window.GameGlobal = window;
  window.canvas = canvas;

  function toLogicalPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      clientX: (clientX - rect.left) * logicalWidth / rect.width,
      clientY: (clientY - rect.top) * logicalHeight / rect.height,
    };
  }

  function notify(type, event) {
    const sourceTouches = event.touches && event.touches.length
      ? Array.from(event.touches)
      : [{ clientX: event.clientX, clientY: event.clientY }];
    const touches = sourceTouches.map((touch) => toLogicalPoint(touch.clientX, touch.clientY));
    touchListeners[type].slice().forEach((listener) => listener({ touches }));
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
    notify('start', event);
  }, { passive: false });
  canvas.addEventListener('pointermove', (event) => {
    if (event.buttons) { event.preventDefault(); notify('move', event); }
  }, { passive: false });
  canvas.addEventListener('pointerup', (event) => { event.preventDefault(); notify('end', event); }, { passive: false });
  canvas.addEventListener('pointercancel', (event) => { event.preventDefault(); notify('cancel', event); }, { passive: false });

  class BrowserAudioContext {
    constructor() { this.audio = new Audio(); }
    set src(value) { this.audio.src = assetCandidates(value)[0]; }
    get src() { return this.audio.src; }
    set loop(value) { this.audio.loop = value; }
    get loop() { return this.audio.loop; }
    set volume(value) { this.audio.volume = value; }
    get volume() { return this.audio.volume; }
    set currentTime(value) { this.audio.currentTime = value; }
    get currentTime() { return this.audio.currentTime; }
    play() { const promise = this.audio.play(); if (promise && promise.catch) promise.catch(() => {}); }
    pause() { this.audio.pause(); }
  }

  window.wx = {
    createCanvas: () => canvas,
    createImage: () => createAssetImage(),
    createInnerAudioContext: () => new BrowserAudioContext(),
    getWindowInfo: () => ({ screenWidth: logicalWidth, screenHeight: logicalHeight }),
    getSystemInfoSync: () => ({ screenWidth: logicalWidth, screenHeight: logicalHeight }),
    onTouchStart: (listener) => touchListeners.start.push(listener),
    onTouchMove: (listener) => touchListeners.move.push(listener),
    onTouchEnd: (listener) => touchListeners.end.push(listener),
    onTouchCancel: (listener) => touchListeners.cancel.push(listener),
    vibrateShort: () => {},
  };

  function sendKeyboardTouch(x, y, type) {
    const point = { touches: [{ clientX: x, clientY: y }] };
    touchListeners[type].slice().forEach((listener) => listener(point));
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (!['a', 'd', 'arrowleft', 'arrowright', 'q', 'e', 'p', 'escape'].includes(key)) return;
    event.preventDefault();
    if (key === 'a' || key === 'arrowleft') sendKeyboardTouch(logicalWidth * .2, logicalHeight * .5, 'start');
    if (key === 'd' || key === 'arrowright') sendKeyboardTouch(logicalWidth * .8, logicalHeight * .5, 'start');
    if (key === 'q') sendKeyboardTouch(75, logicalHeight - 28, 'start');
    if (key === 'e') sendKeyboardTouch(logicalWidth - 75, logicalHeight - 28, 'start');
    if (key === 'p' || key === 'escape') sendKeyboardTouch(logicalWidth - 35, 29, 'start');
  });
  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (['a', 'd', 'arrowleft', 'arrowright'].includes(key)) sendKeyboardTouch(logicalWidth / 2, logicalHeight / 2, 'end');
  });

  preloadGameImages().then(() => import('./game.js?v=asset-sync-v2')).then(() => {
    document.body.dataset.gameLoaded = 'true';
    hideLoader();
  }).catch((error) => {
    console.error('Unable to start the browser edition', error);
    showAssetLoadError(error);
    showBootError(error && error.message ? error.message : '请使用项目目录启动静态服务器后重试。');
  });
}());
