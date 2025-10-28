import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import './diwali-fireworks.css';

const vendorScripts = [
  'https://s3-us-west-2.amazonaws.com/s.cdpn.io/329180/fscreen%401.0.1.js',
  'https://s3-us-west-2.amazonaws.com/s.cdpn.io/329180/Stage%400.1.4.js',
  'https://s3-us-west-2.amazonaws.com/s.cdpn.io/329180/MyMath.js'
];

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      // already loaded (or loading)
      (existing as HTMLScriptElement).addEventListener('load', () => resolve());
      return;
    }

    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.body.appendChild(s);
  });
}

interface FireworksConfig {
  shellSize?: number;
  shellCount?: number;
  quality?: number;
  autoLaunch?: boolean;
  finale?: boolean;
  gravity?: number;
}

interface DiwaliFireworksProps {
  onComplete: () => void;
  config?: FireworksConfig;
}

const DiwaliFireworks = ({ onComplete }: DiwaliFireworksProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const [showBirthday, setShowBirthday] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [reveal, setReveal] = useState(true);
  const [revealHidden, setRevealHidden] = useState(false);
  
  // Create a stable reference to onComplete
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Add keyboard handler for navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showBirthday && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
        console.log('Key pressed:', e.key);
        // Cleanup and navigate
        try {
          clearTimeout((window as any).__diwali_birthday_timer);
          clearTimeout((window as any).__diwali_complete_timer);
          const finaleTimers: number[] = (window as any).__diwali_finale_timers || [];
          finaleTimers.forEach(clearTimeout);
          
          const canvas = document.getElementById('main-canvas');
          if (canvas) canvas.style.pointerEvents = 'none';
          
          console.log('Calling onComplete from keyboard handler');
          onComplete();
        } catch (e) {
          console.error('Error in keyboard handler:', e);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showBirthday, onComplete]);

  // Function to disable canvas click handling
  const disableCanvasClicks = () => {
    try {
      const canvas = document.getElementById('main-canvas');
      if (canvas) {
        canvas.style.pointerEvents = 'none';
      }
    } catch (e) {
      console.error('Error disabling canvas clicks:', e);
    }
  };

  useEffect(() => {
    let destroyed = false;
    let _prevBodyOverflow: string | null = null;
    let _prevBodyMargin: string | null = null;
    let _prevBodyPadding: string | null = null;

    // Load vendor scripts in sequence, then the local copied script in /diwali/script.js
    (async () => {
      try {
        for (const src of vendorScripts) {
          // eslint-disable-next-line no-await-in-loop
          // load sequentially to preserve dependency order
          await loadScript(src);
          // log each vendor availability
          // eslint-disable-next-line no-console
          console.info('[Diwali POC] loaded vendor script:', src);
        }

        // Now load the fireworks script we copied into public/diwali/script.js
        await loadScript('/diwali/script.js');
        // eslint-disable-next-line no-console
        console.info('[Diwali POC] loaded /diwali/script.js');

        // Reveal the loading node only after the external script has been fetched.
        // This prevents a short flash of the loading UI when navigating from Auth.
        try {
          if (loadingRef.current) {
            // allow the script to manage/remove the node later as intended
            loadingRef.current.style.display = '';
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[Diwali POC] failed to reveal loading node', e);
        }

        // Try to resume audio via the script's exposed helper (if available).
        try {
          const resumed = (window as any).__diwali_resume_audio && (window as any).__diwali_resume_audio();
          // eslint-disable-next-line no-console
          console.info('[Diwali POC] attempted audio resume:', !!resumed);
          // If the original script exposes a toggleSound function, enable sound in its store so
          // playback functions won't be gated by soundEnabled === false.
          try {
            if (typeof (window as any).toggleSound === 'function') {
              (window as any).toggleSound(true);
              // Try resume again after enabling the sound flag
              const resumed2 = (window as any).__diwali_resume_audio && (window as any).__diwali_resume_audio();
              // eslint-disable-next-line no-console
              console.info('[Diwali POC] toggled sound on and re-attempted resume:', !!resumed2);
            }
          } catch (e) {
            // ignore
          }
        } catch (e) {
          // ignore
        }

        // After the fireworks script has loaded and started, show the birthday overlay after 5s
        // and then transition to next scene after another 5s
        try {
          // Show birthday overlay after 5 seconds
          const t1 = window.setTimeout(() => {
            setShowBirthday(true);
          }, 5000);

          // Show continue button after 15 seconds
          const t2 = window.setTimeout(() => {
            setShowButton(true);
          }, 15000);
          (window as any).__diwali_birthday_timer = t1;
        } catch (e) {
          // ignore
        }

        // Trigger a short "finale" barrage 1s before the birthday overlay appears.
        // This launches many fast shells for a dramatic effect and ensures audio is resumed.
        try {
          // ensure audio is enabled
          try {
            const sm = (window as any).soundManager;
            if (sm && typeof sm.resumeAll === 'function') {
              sm.resumeAll();
            } else if (sm && sm.ctx && typeof sm.ctx.resume === 'function') {
              sm.ctx.resume().catch(() => {});
            }
          } catch (e) {
            // ignore
          }

          const finaleTimers: number[] = [];
          // Reduce aggressive firing: fewer bursts and more spacing to preserve smoothness
          const FINAL_BURSTS = 3; // previously 20
          const FINAL_SPACING_MS = 250; // previously 120

          // Helper: reduce heavy settings in the original script UI so playback is lighter
          const reduceShellsForSmoothness = () => {
            try {
              // remember and lower quality
              const qualitySel = document.querySelector('.quality-ui') as HTMLSelectElement | null;
              if (qualitySel) {
                // set to lowest quality option
                qualitySel.value = qualitySel.options[0]?.value || qualitySel.value;
                qualitySel.dispatchEvent(new Event('input', { bubbles: true }));
              }

              // reduce shell size
              const shellSize = document.querySelector('.shell-size') as HTMLSelectElement | null;
              if (shellSize) {
                shellSize.value = shellSize.options[0]?.value || shellSize.value;
                shellSize.dispatchEvent(new Event('input', { bubbles: true }));
              }

              // disable autoLaunch if enabled
              const autoLaunch = document.querySelector('.auto-launch') as HTMLInputElement | null;
              if (autoLaunch && autoLaunch.checked) {
                // the original script listens for 'click' on this checkbox to update config
                autoLaunch.click();
              }

              // disable finale mode
              const finaleMode = document.querySelector('.finale-mode') as HTMLInputElement | null;
              if (finaleMode && finaleMode.checked) {
                finaleMode.click();
              }

              // hide controls to avoid extra rendering
              const controls = document.querySelector('.controls') as HTMLElement | null;
              if (controls) controls.classList.add('hide');

              // log
              // eslint-disable-next-line no-console
              console.info('[Diwali POC] applied smoothness reductions (quality/shell/auto/finale)');
            } catch (e) {
              // ignore
            }
          };

          // Schedule reductions slightly before the overlay appears to avoid mid-frame spikes
          const smoothTimer = window.setTimeout(reduceShellsForSmoothness, 3600);
          finaleTimers.push(smoothTimer);

          // Launch a moderated series of sequences
          for (let i = 0; i < FINAL_BURSTS; i++) {
            const tm = window.setTimeout(() => {
              try {
                const fn = (window as any).startSequence || (window as any).seqRandomFastShell || (window as any).seqRandomShell;
                if (typeof fn === 'function') fn();
              } catch (e) {
                // ignore
              }
            }, 4000 + i * FINAL_SPACING_MS);
            finaleTimers.push(tm);
          }
          (window as any).__diwali_finale_timers = finaleTimers;
        } catch (e) {
          // ignore
        }

        // Temporarily remove body margins and disable scrolling so the fixed overlay
        // truly covers the viewport. Save previous values to restore on unmount.
        try {
          _prevBodyOverflow = document.body.style.overflow || null;
          _prevBodyMargin = document.body.style.margin || null;
          _prevBodyPadding = document.body.style.padding || null;
          document.body.style.overflow = 'hidden';
          document.body.style.margin = '0';
          document.body.style.padding = '0';
        } catch (e) {
          // ignore
        }

        // Mobile devices sometimes report layout quirks (safe-area, 100vw rounding) that
        // cause a thin blank strip at the left. Force the canvas elements to match the
        // viewport and the devicePixelRatio so the drawing surface fully covers the screen.
        const adjustCanvases = () => {
          try {
            const dpr = window.devicePixelRatio || 1;
            const main = document.getElementById('main-canvas') as HTMLCanvasElement | null;
            const trails = document.getElementById('trails-canvas') as HTMLCanvasElement | null;
            const rect = rootRef.current?.getBoundingClientRect();
            const baseW = rect && rect.width ? rect.width : window.innerWidth;
            const baseH = rect && rect.height ? rect.height : window.innerHeight;

            [main, trails].forEach((c) => {
              if (!c) return;
              // ensure CSS covers the viewport completely
              c.style.position = 'fixed';
              c.style.left = '0';
              c.style.top = '0';
              c.style.right = '0';
              c.style.bottom = '0';
              c.style.width = '100vw';
              c.style.height = '100vh';
              c.style.margin = '0';
              c.style.padding = '0';
              c.style.border = 'none';
              c.style.outline = 'none';

              // use the root element size (not window) to avoid scrollbar/safe-area rounding
              const w = Math.max(1, Math.floor(baseW * dpr));
              const h = Math.max(1, Math.floor(baseH * dpr));
              if (c.width !== w || c.height !== h) {
                c.width = w;
                c.height = h;
                // force a reflow so the script's drawing uses the new buffer
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                c.offsetWidth;
                // eslint-disable-next-line no-console
                console.info('[Diwali POC] resized canvas to', w, h);
              }
            });
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[Diwali POC] adjustCanvases failed', e);
          }
        };

        // Run immediately and shortly after to catch race conditions
        adjustCanvases();
        // run a couple more times in case the original script resizes canvases after init
        setTimeout(adjustCanvases, 150);
        setTimeout(adjustCanvases, 300);
        setTimeout(adjustCanvases, 600);

        // start the reveal fade shortly after the script settles so the fireworks
        // crossfade from black instead of popping in abruptly.
        try {
          setTimeout(() => {
            setReveal(false);
          }, 120);
        } catch (e) {
          // ignore
        }
        // expose the function reference briefly so we can remove the listener on unmount
        try {
          (window as any).__diwali_adjust_canvases = adjustCanvases;
          window.addEventListener('resize', adjustCanvases);
        } catch (e) {
          // ignore
        }

        // Ensure the fireworks root is appended directly to document.body so the fixed
        // positioning fills the true viewport and is not affected by parent containers
        // that may add padding/margins on mobile.
        try {
          if (rootRef.current && rootRef.current.parentElement !== document.body) {
            document.body.appendChild(rootRef.current);
            // force full-viewport inset styling
            rootRef.current.style.position = 'fixed';
            rootRef.current.style.top = '0';
            rootRef.current.style.left = '0';
            rootRef.current.style.right = '0';
            rootRef.current.style.bottom = '0';
            rootRef.current.style.width = '100%';
            rootRef.current.style.height = '100%';
            // safe area insets for some iOS/Android builds
            rootRef.current.style.paddingLeft = 'env(safe-area-inset-left, 0px)';
            rootRef.current.style.paddingRight = 'env(safe-area-inset-right, 0px)';
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[Diwali POC] failed to attach root to body', e);
        }

        // quick runtime checks for expected globals
        // eslint-disable-next-line no-console
        console.info('[Diwali POC] globals:', {
          fscreen: typeof (window as any).fscreen !== 'undefined',
          Stage: typeof (window as any).Stage !== 'undefined',
          MyMath: typeof (window as any).MyMath !== 'undefined',
          init: typeof (window as any).init === 'function'
        });

        // Watchdog: if the script hasn't removed the loading state after a short timeout,
        // attempt to call the original `init()` as a fallback and print helpful diagnostics.
        setTimeout(() => {
          try {
            const loadingNode = document.querySelector('.loading-init');
            const stageContainer = document.querySelector('.stage-container');
            if (loadingNode && stageContainer && stageContainer.classList.contains('remove')) {
              // eslint-disable-next-line no-console
              console.warn('[Diwali POC] Loading still present after 5s — attempting fallback init()');
              const maybeInit = (window as any).init;
              if (typeof maybeInit === 'function') {
                try {
                  maybeInit();
                  // eslint-disable-next-line no-console
                  console.info('[Diwali POC] Called fallback init()');
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.error('[Diwali POC] fallback init() threw:', e);
                }
              } else {
                // eslint-disable-next-line no-console
                console.error('[Diwali POC] init() not available as fallback. Check console for earlier errors.');
              }
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[Diwali POC] watchdog error', e);
          }
        }, 5000);

        // The original script expects the DOM nodes to exist. Ensure root is mounted.
        // `script.js` runs init when ready, so nothing more to do here for POC.
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading Diwali vendor scripts', err);
      }
    })();

    return () => {
      destroyed = true;
      // It's tricky to fully teardown the original script since it registers global listeners and state.
      // For a POC we simply remove the main node so it won't be visible; a full port will add proper cleanup.
      if (rootRef.current) {
        rootRef.current.innerHTML = '';
        try {
          if (rootRef.current.parentElement === document.body) {
            document.body.removeChild(rootRef.current);
          }
        } catch (e) {
          // ignore
        }
      }
      try {
        const fn = (window as any).__diwali_adjust_canvases;
        if (fn) {
          window.removeEventListener('resize', fn);
          // tidy up
          delete (window as any).__diwali_adjust_canvases;
        }
      } catch (e) {
        // ignore
      }

      // clear birthday and complete timers if running
      try {
        const t1 = (window as any).__diwali_birthday_timer;
        if (t1) {
          clearTimeout(t1);
          delete (window as any).__diwali_birthday_timer;
        }
        const t2 = (window as any).__diwali_complete_timer;
        if (t2) {
          clearTimeout(t2);
          delete (window as any).__diwali_complete_timer;
        }
      } catch (e) {
        // ignore
      }

      // clear finale timers if any
      try {
        const arr: number[] = (window as any).__diwali_finale_timers || [];
        arr.forEach((tm) => clearTimeout(tm));
        delete (window as any).__diwali_finale_timers;
      } catch (e) {
        // ignore
      }

      // restore body styles if we changed them
      try {
        if (_prevBodyOverflow !== null) document.body.style.overflow = _prevBodyOverflow;
        else document.body.style.removeProperty('overflow');
        if (_prevBodyMargin !== null) document.body.style.margin = _prevBodyMargin;
        else document.body.style.removeProperty('margin');
        if (_prevBodyPadding !== null) document.body.style.padding = _prevBodyPadding;
        else document.body.style.removeProperty('padding');
      } catch (e) {
        // ignore
      }

      // reset reveal state
      try {
        setReveal(true);
        setRevealHidden(false);
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return (
    <div 
      ref={rootRef} 
      className="diwali-root"
      style={{ pointerEvents: showBirthday ? 'none' : 'auto' }}
    >
      {/* Inline the SVG spritesheet (hidden) */}
      <div style={{ height: 0, width: 0, position: 'absolute', visibility: 'hidden' }} dangerouslySetInnerHTML={{ __html: `
        <svg xmlns="http://www.w3.org/2000/svg">
          <symbol id="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></symbol>
          <symbol id="icon-pause" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></symbol>
          <symbol id="icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></symbol>
          <symbol id="icon-settings" viewBox="0 0 24 24"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></symbol>
          <symbol id="icon-sound-on" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></symbol>
          <symbol id="icon-sound-off" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></symbol>
        </svg>
      ` }} />

  {/* App structure from original index.html (trimmed to essentials) */}
      <div className="container">
        {/* hide the original script's loading node until the external script is loaded
            This prevents a brief flash of "Loading" when navigating from the Auth screen */}
        <div className="loading-init" ref={loadingRef} style={{ display: 'none' }}>
          <div className="loading-init__header">Loading</div>
          <div className="loading-init__status">Assembling Shells</div>
        </div>
        <div className="stage-container remove">
          <div className="canvas-container">
            <canvas id="trails-canvas"></canvas>
            <canvas id="main-canvas"></canvas>
          </div>
          <div className="controls">
            <div className="btn pause-btn"><svg fill="white" width="24" height="24"><use href="#icon-pause"></use></svg></div>
            <div className="btn sound-btn"><svg fill="white" width="24" height="24"><use href="#icon-sound-off"></use></svg></div>
            <div className="btn settings-btn"><svg fill="white" width="24" height="24"><use href="#icon-settings"></use></svg></div>
          </div>
          {/* menu and help modal are present in CSS; we keep structure for the script to find elements */}
          <div className="menu hide">
            <div className="menu__inner-wrap">
              <div className="btn btn--bright close-menu-btn">
                <svg fill="white" width="24" height="24"><use href="#icon-close"></use></svg>
              </div>
              <div className="menu__header">Settings</div>
              <div className="menu__subheader">For more info, click any label.</div>
              <form>
                <div className="form-option form-option--select">
                  <label className="shell-type-label">Shell Type</label>
                  <select className="shell-type"></select>
                </div>
                <div className="form-option form-option--select">
                  <label className="shell-size-label">Shell Size</label>
                  <select className="shell-size"></select>
                </div>
                <div className="form-option form-option--select">
                  <label className="quality-ui-label">Quality</label>
                  <select className="quality-ui"></select>
                </div>
                <div className="form-option form-option--select">
                  <label className="sky-lighting-label">Sky Lighting</label>
                  <select className="sky-lighting"></select>
                </div>
                <div className="form-option form-option--select">
                  <label className="scaleFactor-label">Scale</label>
                  <select className="scaleFactor"></select>
                </div>
                <div className="form-option form-option--checkbox">
                  <label className="auto-launch-label">Auto Fire</label>
                  <input className="auto-launch" type="checkbox" />
                </div>
                <div className="form-option form-option--checkbox form-option--finale-mode">
                  <label className="finale-mode-label">Finale Mode</label>
                  <input className="finale-mode" type="checkbox" />
                </div>
                <div className="form-option form-option--checkbox">
                  <label className="hide-controls-label">Hide Controls</label>
                  <input className="hide-controls" type="checkbox" />
                </div>
                <div className="form-option form-option--checkbox form-option--fullscreen">
                  <label className="fullscreen-label">Fullscreen</label>
                  <input className="fullscreen" type="checkbox" />
                </div>
                <div className="form-option form-option--checkbox">
                  <label className="long-exposure-label">Open Shutter</label>
                  <input className="long-exposure" type="checkbox" />
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="help-modal">
          <div className="help-modal__overlay"></div>
          <div className="help-modal__dialog">
            <div className="help-modal__header" />
            <div className="help-modal__body" />
            <button type="button" className="help-modal__close-btn">Close</button>
          </div>
        </div>
        {/* Birthday text overlay - appears after fireworks run for a few seconds */}
        {/* Birthday message overlay */}
        {showBirthday && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 backdrop-blur-sm"
            role="dialog" 
            aria-label="Birthday message"
          >
            <div className="text-center transform-gpu animate-fade-in-up">
              <h1 className="text-7xl mb-6 font-dancing text-rose-400 animate-glow drop-shadow-lg">Happy Birthday 🎂</h1>
              <h2 className="text-5xl mb-6 font-dancing text-rose-300 animate-fade-in-up delay-300 drop-shadow-md">My Dear Ruqayya 💖</h2>
              <p className="text-3xl text-rose-100 animate-fade-in-up delay-500 drop-shadow-sm">May your day sparkle brighter than these fireworks ✨</p>
            </div>
          </div>
        )}

        {/* Separate continue button that appears after delay */}
        {showButton && (
          <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center mb-16 z-[10000]">
            <div className="bg-black/20 backdrop-blur-sm px-6 py-4 rounded-full transform-gpu animate-fade-in-up">
              <button
                type="button"
                onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Continue button clicked');
                
                // Immediate disable of the button to prevent double-clicks
                const button = e.currentTarget;
                button.disabled = true;
                button.style.opacity = '0.7';
                
                try {
                  // 1. Stop all timers
                  console.log('Cleaning up timers...');
                  clearTimeout((window as any).__diwali_birthday_timer);
                  clearTimeout((window as any).__diwali_complete_timer);
                  const finaleTimers: number[] = (window as any).__diwali_finale_timers || [];
                  finaleTimers.forEach(clearTimeout);
                  
                  // 2. Stop animation frame
                  console.log('Stopping animation frames...');
                  if ((window as any).mainLoop) {
                    cancelAnimationFrame((window as any).mainLoop);
                  }
                  
                  // 3. Clean up canvases
                  console.log('Cleaning up canvases...');
                  ['main-canvas', 'trails-canvas'].forEach(id => {
                    const canvas = document.getElementById(id);
                    if (canvas) {
                      canvas.style.display = 'none';
                      canvas.style.pointerEvents = 'none';
                      try {
                        const canvasElement = canvas as HTMLCanvasElement;
                        const ctx = canvasElement.getContext('2d');
                        if (ctx) ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                      } catch (err) {
                        console.warn(`Failed to clear canvas ${id}:`, err);
                      }
                    }
                  });
                  
                  // 4. Stop any running animations and audio
                  console.log('Stopping animations and audio...');
                  (window as any).isRunning = false;
                  try {
                    const sm = (window as any).soundManager;
                    if (sm && typeof sm.stopAll === 'function') {
                      sm.stopAll();
                    }
                  } catch (err) {
                    console.warn('Failed to stop audio:', err);
                  }
                  
                  // 5. Navigate after a short delay to ensure cleanup completes
                  console.log('Preparing to navigate...');
                  setTimeout(() => {
                    if (typeof onCompleteRef.current === 'function') {
                      console.log('Executing navigation...');
                      onCompleteRef.current();
                    } else {
                      console.error('Navigation function not available!');
                      // Re-enable button if navigation fails
                      button.disabled = false;
                      button.style.opacity = '1';
                    }
                  }, 100);
                  
                } catch (e) {
                  console.error('Error during cleanup/navigation:', e);
                  // Re-enable button on error
                  button.disabled = false;
                  button.style.opacity = '1';
                }
              }}
              className="relative px-10 py-5 text-2xl font-medium text-white bg-rose-500 hover:bg-rose-600 rounded-full shadow-xl hover:shadow-2xl transform-gpu hover:scale-105 transition-all duration-300 animate-slow-bounce focus:outline-none focus:ring-4 focus:ring-rose-400/50 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              Continue to Your Special Day 💝
            </button>
          </div>
        </div>
        )}

        {/* Reveal overlay that crossfades the fireworks in */}
        {!revealHidden && (
          <div
          className={`reveal-overlay ${reveal ? 'visible' : 'hidden'}`}
          onTransitionEnd={() => {
            if (!reveal) setRevealHidden(true);
          }}
        />
      )}
    </div>
  );
};

export default DiwaliFireworks;
