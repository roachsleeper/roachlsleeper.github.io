import { WEB_IMAGE_ASSETS } from './web-assets.js';

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
  const assetBase = new URL('./', document.baseURI || window.location.href);
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
    return assetRoots[kind].map((root) => new URL(root + relativeName, assetBase).href);
  }

  const loader = document.createElement('div');
  loader.className = 'asset-loader';
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-live', 'polite');
  loader.innerHTML = '<div style="width:min(82vw,420px);text-align:center"><div style="font-size:22px;font-weight:700;margin-bottom:18px">正在加载游戏素材</div><div style="height:10px;border-radius:99px;background:#202a45;overflow:hidden"><div data-progress style="width:0%;height:100%;background:#edbd6b;transition:width .15s ease"></div></div><div data-label style="margin-top:12px;color:#a99e9d;font-size:13px">0%</div></div>';
  document.body.appendChild(loader);
  loader.innerHTML = '<style>.asset-loader-card{width:min(82vw,420px);padding:30px 28px;border:1px solid rgba(237,189,107,.45);border-radius:20px;background:linear-gradient(145deg,#202b4a,#11182e);box-shadow:0 18px 60px rgba(0,0,0,.5);text-align:center}.asset-loader-mark{width:58px;height:58px;margin:0 auto 18px;border-radius:50%;background:radial-gradient(circle,#ffe9a8 0 12%,#edbd6b 13% 28%,rgba(237,189,107,.18) 29% 58%,transparent 60%);animation:assetPulse 1.2s ease-in-out infinite}.asset-loader-title{font-size:21px;font-weight:700}.asset-loader-sub{margin:8px 0 20px;color:#a99e9d;font-size:13px}.asset-loader-dots{display:inline-flex;gap:5px;margin-left:4px}.asset-loader-dots i{width:5px;height:5px;border-radius:50%;background:#edbd6b;animation:assetDot 1s ease-in-out infinite}.asset-loader-dots i:nth-child(2){animation-delay:.15s}.asset-loader-dots i:nth-child(3){animation-delay:.3s}@keyframes assetPulse{50%{transform:scale(1.12);filter:brightness(1.3)}}@keyframes assetDot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}}</style><div class="asset-loader-card"><div class="asset-loader-mark"></div><div class="asset-loader-title">正在加载游戏素材<span class="asset-loader-dots"><i></i><i></i><i></i></span></div><div class="asset-loader-sub">场景、角色、技能准备中</div><div style="height:10px;border-radius:99px;background:#202a45;overflow:hidden"><div data-progress style="width:0%;height:100%;background:linear-gradient(90deg,#b87845,#edbd6b);transition:width .15s ease"></div></div><div data-label style="margin-top:12px;color:#a99e9d;font-size:13px">0%</div></div>';
  loader.innerHTML = '<div class="asset-loader-glow" aria-hidden="true"></div><div class="asset-loader-content"><div class="asset-loader-emblem" aria-hidden="true"><span></span></div><div class="asset-loader-kicker">NIGHT RUNNER <b>·</b> RESOURCE LOAD</div><div class="asset-loader-title">正在准备夜行</div><div class="asset-loader-sub">场景、角色与技能资源载入中<span class="asset-loader-dots"><i></i><i></i><i></i></span></div><div class="asset-loader-progress" aria-hidden="true"><div class="asset-loader-progress-track"><div data-progress class="asset-loader-progress-fill"></div><i class="asset-loader-progress-spark"></i></div><div class="asset-loader-progress-ticks"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div><div data-label class="asset-loader-label">资源同步 0%</div></div>';
  const progressBar = loader.querySelector('[data-progress]');
  const progressSpark = loader.querySelector('.asset-loader-progress-spark');
  const progressLabel = loader.querySelector('[data-label]');

  function preloadImage(src) {
    const candidates = assetCandidates(src);
    return new Promise((resolve) => {
      const image = new Image();
      let index = 0;
      const next = () => {
        if (index >= candidates.length) return resolve(false);
        image.src = candidates[index++];
      };
      image.onload = () => resolve(true);
      image.onerror = next;
      next();
    });
  }

  function preloadGameImages() {
    let loaded = 0;
    const total = WEB_IMAGE_ASSETS.length;
    return Promise.all(WEB_IMAGE_ASSETS.map((src) => preloadImage(src).then(() => {
      loaded += 1;
      const percent = Math.round((loaded / total) * 100);
      progressBar.style.width = `${percent}%`;
      progressSpark.style.left = `${percent}%`;
      progressLabel.textContent = `资源同步 ${percent}% · ${loaded}/${total}`;
    })));
  }

  function hideLoader() {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 300);
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

  preloadGameImages().then(() => import('./game.js?v=entrance-v4')).then(() => {
    document.body.dataset.gameLoaded = 'true';
    hideLoader();
  }).catch((error) => {
    console.error('Unable to start the browser edition', error);
    showBootError(error && error.message ? error.message : '请使用项目目录启动静态服务器后重试。');
  });
}());
