import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import api from '../services/api';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEDIAPIPE_WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm';
const FACE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const SMOOTHING_ALPHA = 0.4;

const LENS_OPTIONS = [
  { id: 'polarized',   label: 'POLARIZED HD' },
  { id: 'transitions', label: 'TRANSITIONS®' },
  { id: 'bluelight',   label: 'BLUE LIGHT BLOCK' },
];

const TINT_OPTIONS = [
  { name: 'Obsidian', hex: '#1a1a1a' },
  { name: 'Ocean',    hex: '#2c3e50' },
  { name: 'Steel',    hex: '#34495e' },
];

const DEFAULT_FRAME_METRICS = { widthMm: 140, lengthMm: 45 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip white/black/transparent pixels from a canvas and return a new canvas. */
function removeBackground(src) {
  const canvas = document.createElement('canvas');
  canvas.width  = src.width;
  canvas.height = src.height;
  const ctx       = canvas.getContext('2d');
  ctx.drawImage(src, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d         = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r  = d[i], g = d[i + 1], b = d[i + 2];
    const br = (r + g + b) / 3;
    if (
      d[i + 3] === 0 ||
      (br > 220 && Math.abs(r - g) < 20 && Math.abs(r - b) < 20) || // white
      br < 25                                                          // black
    ) {
      d[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/** Find the exact non-empty bounding box of the glasses. */
function getBoundingBox(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const alpha = d[idx + 3];
      if (alpha > 5) { // non-transparent pixel
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no bounding box found, return full canvas bounds
  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, w: canvas.width, h: canvas.height };
  }

  // Add a tiny padding to the bounding box to avoid clipping the edges
  const padding = 2;
  const x = Math.max(0, minX - padding);
  const y = Math.max(0, minY - padding);
  const w = Math.min(canvas.width - x, maxX - minX + 2 * padding);
  const h = Math.min(canvas.height - y, maxY - minY + 2 * padding);

  return { x, y, w, h };
}

/** Build a tinted overlay canvas from a product image URL. */
async function buildGlassesOverlay(imageUrl, tint) {
  return new Promise((resolve, reject) => {
    const img         = new Image();
    img.crossOrigin   = 'anonymous';
    img.onload        = () => {
      // 1. Create original canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // 2. Remove background
      const cleaned = removeBackground(canvas);

      // 3. Find bounding box of actual glasses frame/lenses
      const box = getBoundingBox(cleaned);

      // 4. Crop to exact bounding box (retaining original proportions)
      const cropped = document.createElement('canvas');
      cropped.width = box.w;
      cropped.height = box.h;
      const croppedCtx = cropped.getContext('2d');
      croppedCtx.drawImage(cleaned, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);

      // 5. Apply tint over lenses only
      croppedCtx.save();
      croppedCtx.globalCompositeOperation = 'source-atop';
      croppedCtx.fillStyle   = tint;
      croppedCtx.globalAlpha = 0.28;
      croppedCtx.fillRect(0, 0, box.w, box.h);
      croppedCtx.restore();

      resolve({
        dataUrl: cropped.toDataURL('image/png'),
        aspectRatio: box.h / box.w
      });
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src     = imageUrl;
  });
}

/** Load MediaPipe FaceLandmarker, preferring GPU then falling back to CPU. */
async function loadFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
  const opts   = {
    baseOptions: {
      modelAssetPath: FACE_LANDMARKER_MODEL_URL,
    },
    outputFaceBlendshapes: true,
    runningMode: 'VIDEO',
    numFaces: 1,
  };

  for (const delegate of ['GPU', 'CPU']) {
    try {
      return await FaceLandmarker.createFromOptions(vision, {
        ...opts,
        baseOptions: { ...opts.baseOptions, delegate },
      });
    } catch {
      if (delegate === 'CPU') throw new Error('FaceLandmarker unavailable');
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const VirtualTryOn = () => {
  const { productId }  = useParams();
  const navigate       = useNavigate();
  const { settings }   = useSettings();
  const currency       = settings?.currency || 'USD';
  const { addToCart }  = useCart();

  // Product state
  const [products, setProducts]           = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [fetchError, setFetchError]       = useState(null);

  // Camera / AI state
  const [hasCamera, setHasCamera]           = useState(false);
  const [cameraError, setCameraError]       = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError]         = useState(null);
  const [faceDetected, setFaceDetected]     = useState(false);

  // UI state
  const [selectedLens, setSelectedLens]         = useState(LENS_OPTIONS[0].label);
  const [selectedTint, setSelectedTint]         = useState(TINT_OPTIONS[0].hex);
  const [selectedColor, setSelectedColor]       = useState('');
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [isMobileHudOpen, setIsMobileHudOpen]   = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCapturing, setIsCapturing]           = useState(false);
  const [captureSuccess, setCaptureSuccess]     = useState(false);

  // Computed / derived state
  const [overlayUrl, setOverlayUrl]             = useState(null);
  const [imageAspectRatio, setImageAspectRatio] = useState(0.45);
  const [glassesTransform, setGlassesTransform] = useState(null);
  const [biometrics, setBiometrics]             = useState({ pd: '—', width: '—', length: '—' });
  const [frameMetrics, setFrameMetrics]         = useState(DEFAULT_FRAME_METRICS);

  const handleBack = () => {
    const productTarget = currentProduct?.id || productId;
    const targetUrl = productTarget ? `/product/${productTarget}` : '/shop';
    window.location.assign(targetUrl);
  };

  // Refs
  const videoRef          = useRef(null);
  const containerRef      = useRef(null);
  const cameraStreamRef   = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const rafRef            = useRef(null);
  const prevTransformRef  = useRef(null);

  // ── Utilities ──────────────────────────────────────────────────────────────

  const BACKEND_URL = api.defaults.baseURL.replace('/api', '');

  const getImageUrl = useCallback(
    (url) => (!url ? '' : url.startsWith('/') ? `${BACKEND_URL}${url}` : url),
    [BACKEND_URL],
  );

  const getProductImageUrl = useCallback(
    (product) => {
      if (!product) return '';
      const url = product.images?.length > 0 ? product.images[0] : product.image_url;
      return getImageUrl(url);
    },
    [getImageUrl],
  );

  const productColors = useMemo(() => {
    if (!currentProduct || !Array.isArray(currentProduct.colors)) return [];
    return currentProduct.colors.map((color) => {
      if (typeof color === 'string') {
        return { name: color, hex: '#1A1A1A', image_url: '' };
      }
      return {
        name: color.name || color.hex || 'Standard',
        hex: color.hex || '#1A1A1A',
        image_url: color.image_url || '',
      };
    });
  }, [currentProduct]);

  const productSizes = useMemo(() => {
    if (!currentProduct || !Array.isArray(currentProduct.sizes)) return [];
    return currentProduct.sizes.map((size) => {
      if (typeof size === 'string') {
        return {
          label: size,
          frame_width_mm: currentProduct.frame_width_mm,
          frame_length_mm: currentProduct.frame_length_mm,
        };
      }
      return {
        label: size.label || size.name || 'Standard',
        frame_width_mm: size.frame_width_mm ?? size.width ?? currentProduct.frame_width_mm,
        frame_length_mm: size.frame_length_mm ?? size.length ?? currentProduct.frame_length_mm,
      };
    });
  }, [currentProduct]);

  const selectedSize = productSizes[selectedSizeIndex] || {
    label: 'Standard',
    frame_width_mm: currentProduct?.frame_width_mm,
    frame_length_mm: currentProduct?.frame_length_mm,
  };

  const selectedColorImage = useMemo(() => {
    const color = productColors.find((c) => c.name === selectedColor);
    return color?.image_url ? getImageUrl(color.image_url) : getProductImageUrl(currentProduct);
  }, [currentProduct, productColors, selectedColor, getImageUrl, getProductImageUrl]);

  useEffect(() => {
    if (!currentProduct) return;
    setSelectedSizeIndex(0);
    setSelectedColor(productColors[0]?.name || '');
  }, [currentProduct, productColors]);

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products?limit=50');
        const list      = data.products || [];
        if (cancelled) return;

        let selected = productId ? list.find((p) => p.id == productId) : null;

        if (!selected && productId) {
          try {
            const { data: single } = await api.get(`/products/${productId}`);
            selected = single;
            if (selected && !list.some((p) => p.id === selected.id)) list.push(selected);
          } catch { /* product not found — fall through */ }
        }

        if (!cancelled) {
          setProducts(list);
          setCurrentProduct(selected ?? list[0] ?? null);
        }
      } catch (err) {
        if (!cancelled) setFetchError('Failed to load products.');
        console.error('VTO product fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, [productId]);

  // Sync selected product when URL param changes after initial load
  useEffect(() => {
    if (!productId || products.length === 0) return;
    const found = products.find((p) => p.id == productId);
    if (found) setCurrentProduct(found);
  }, [productId, products]);

  // Derive frame metrics from selected size or current product
  useEffect(() => {
    setFrameMetrics({
      widthMm:  Number(selectedSize?.frame_width_mm) || Number(currentProduct?.frame_width_mm) || DEFAULT_FRAME_METRICS.widthMm,
      lengthMm: Number(selectedSize?.frame_length_mm) || Number(currentProduct?.frame_length_mm) || DEFAULT_FRAME_METRICS.lengthMm,
    });
  }, [currentProduct, selectedSize]);

  // ── Overlay generation ─────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setOverlayUrl(null);

    const url = selectedColorImage || getProductImageUrl(currentProduct);
    if (!url) return;

    buildGlassesOverlay(url, selectedTint)
      .then(({ dataUrl, aspectRatio }) => {
        if (!cancelled) {
          setOverlayUrl(dataUrl);
          setImageAspectRatio(aspectRatio);
        }
      })
      .catch(() => { if (!cancelled) setOverlayUrl(null); });

    return () => { cancelled = true; };
  }, [currentProduct, selectedTint, getProductImageUrl]);

  // ── Camera initialisation ──────────────────────────────────────────────────

  useEffect(() => {
    let stream;
    let cancelled = false;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        cameraStreamRef.current = stream;
        setHasCamera(true);
      } catch (err) {
        if (!cancelled) {
          setCameraError('Camera access denied. Grant permission and reload.');
          console.warn('getUserMedia error:', err);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Assign stream to <video> ───────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    const stream = cameraStreamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.play().catch((err) => console.warn('Video autoplay blocked:', err));
  }, [hasCamera]);

  // ── MediaPipe loading ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    loadFaceLandmarker()
      .then((lm) => {
        if (cancelled) { lm.close(); return; }
        faceLandmarkerRef.current = lm;
        setIsModelLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setModelError('Face-tracking model failed to load.');
          setIsModelLoading(false);
        }
        console.error('FaceLandmarker load error:', err);
      });

    return () => {
      cancelled = true;
      faceLandmarkerRef.current?.close();
    };
  }, []);

  // ── Face-tracking render loop ──────────────────────────────────────────────

  useEffect(() => {
    if (!hasCamera || isModelLoading) return;

    const tick = () => {
      const video = videoRef.current;
      const lm    = faceLandmarkerRef.current;
      const cont  = containerRef.current;

      if (!video || !lm || !cont || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      try {
        const results = lm.detectForVideo(video, performance.now());

        if (results.faceLandmarks?.length > 0) {
          setFaceDetected(true);
          const pts = results.faceLandmarks[0];

          // MediaPipe landmark indices:
          // 33  = user's right eye outer corner (left in mirrored view)
          // 263 = user's left  eye outer corner (right in mirrored view)
          // 168 = inter-eye bridge centre
          const rEye  = pts[33];
          const lEye  = pts[263];
          const ctr   = pts[168];

          const vRatio  = video.videoWidth / video.videoHeight;
          const cRatio  = cont.clientWidth  / cont.clientHeight;
          let rW, rH, xOff, yOff;

          if (cRatio > vRatio) {
            rW   = cont.clientWidth;
            rH   = cont.clientWidth / vRatio;
            xOff = 0;
            yOff = (cont.clientHeight - rH) / 2;
          } else {
            rH   = cont.clientHeight;
            rW   = cont.clientHeight * vRatio;
            yOff = 0;
            xOff = (cont.clientWidth - rW) / 2;
          }

          // Mirror x-coordinates to match the CSS `scale(-1,1)` on the video
          const toScreen = (lm) => ({
            x: xOff + (1 - lm.x) * rW,
            y: yOff + lm.y * rH,
          });

          const sL  = toScreen(lEye);
          const sR  = toScreen(rEye);
          const sCt = toScreen(ctr);

          const dx       = sR.x - sL.x;
          const dy       = sR.y - sL.y;
          const angle    = Math.atan2(dy, dx) * (180 / Math.PI);
          const eyeDist  = Math.hypot(dx, dy);

          const wScale       = frameMetrics.widthMm / 140;
          const glassesWidth = eyeDist * 2.1 * wScale;
          const glassesHeight = glassesWidth * imageAspectRatio;

          const target = {
            centerX: sCt.x,
            centerY: sCt.y + glassesHeight * 0.08,
            width: glassesWidth,
            height: glassesHeight,
            angle,
          };

          const prev = prevTransformRef.current;
          const smoothed = prev
            ? {
                centerX: prev.centerX + (target.centerX - prev.centerX) * SMOOTHING_ALPHA,
                centerY: prev.centerY + (target.centerY - prev.centerY) * SMOOTHING_ALPHA,
                width:   prev.width   + (target.width   - prev.width)   * SMOOTHING_ALPHA,
                height:  prev.height  + (target.height  - prev.height)  * SMOOTHING_ALPHA,
                angle:   prev.angle   + (target.angle   - prev.angle)   * SMOOTHING_ALPHA,
              }
            : target;

          prevTransformRef.current = smoothed;
          setGlassesTransform(smoothed);
          setBiometrics({
            pd:     (eyeDist * 0.4).toFixed(1),
            width:  frameMetrics.widthMm.toFixed(0),
            length: frameMetrics.lengthMm.toFixed(0),
          });
        } else {
          setFaceDetected(false);
          setGlassesTransform(null);
          prevTransformRef.current = null;
        }
      } catch (err) {
        console.error('FaceLandmarker error:', err);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hasCamera, isModelLoading, frameMetrics]);

  // ── Capture ────────────────────────────────────────────────────────────────

  const handleCapture = useCallback(async () => {
    const video     = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    setIsCapturing(true);

    try {
      const W = container.clientWidth;
      const H = container.clientHeight;

      const canvas = document.createElement('canvas');
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Fill background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Compute video render area (same logic as tracking loop)
      const vRatio = video.videoWidth / video.videoHeight;
      const cRatio = W / H;
      let rW, rH, xOff, yOff;
      if (cRatio > vRatio) {
        rW = W; rH = W / vRatio; xOff = 0; yOff = (H - rH) / 2;
      } else {
        rH = H; rW = H * vRatio; yOff = 0; xOff = (W - rW) / 2;
      }

      // Draw mirrored video frame
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.filter = 'grayscale(10%)';
      ctx.drawImage(video, -(xOff + rW) + W - xOff, yOff, rW, rH);
      // Simplify: mirror about W
      ctx.restore();

      // Re-draw cleanly
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.filter = 'grayscale(10%)';
      ctx.drawImage(video, xOff - W, yOff, rW, rH);
      ctx.restore();

      // Overlay glasses if tracked and overlay is ready
      if (glassesTransform && currentProduct && overlayUrl) {
        const overlayCanvas = await new Promise((res) => {
          const img       = new Image();
          img.crossOrigin = 'anonymous';
          img.onload      = () => res(img);
          img.onerror     = () => res(null);
          img.src         = overlayUrl;
        });

        if (overlayCanvas) {
          // Scale UI coordinates to the canvas
          const scaleX  = W / (container.clientWidth  || W);
          const scaleY  = H / (container.clientHeight || H);
          const nCX     = glassesTransform.centerX * scaleX;
          const nCY     = glassesTransform.centerY * scaleY;
          const nW      = glassesTransform.width   * scaleX;
          const nH      = glassesTransform.height  * scaleY;

          ctx.save();
          ctx.translate(nCX, nCY);
          ctx.rotate((glassesTransform.angle * Math.PI) / 180);
          ctx.scale(-1, 1);  // mirror to match selfie view

          ctx.drawImage(overlayCanvas, -nW / 2, -nH / 2, nW, nH);
          ctx.restore();
        }
      }

      const filename = currentProduct
        ? `visionix-${currentProduct.name.replace(/\s+/g, '-').toLowerCase()}.png`
        : 'visionix-capture.png';

      const link      = document.createElement('a');
      link.download   = filename;
      link.href       = canvas.toDataURL('image/png');
      link.click();

      setCaptureSuccess(true);
      setTimeout(() => setCaptureSuccess(false), 2000);
    } catch (err) {
      console.error('Capture failed:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [glassesTransform, currentProduct, selectedTint, getProductImageUrl]);

  // ── Product navigation ─────────────────────────────────────────────────────

  const handleSelectProduct = useCallback(
    (product) => {
      if (!product) return;
      setCurrentProduct(product);
      navigate(`/try-on/${product.id}`, { replace: true });
    },
    [navigate],
  );

  const handlePrevProduct = () => {
    const idx = products.findIndex((p) => p.id === currentProduct?.id);
    handleSelectProduct(products[idx > 0 ? idx - 1 : products.length - 1]);
  };

  const handleNextProduct = () => {
    const idx = products.findIndex((p) => p.id === currentProduct?.id);
    handleSelectProduct(products[idx < products.length - 1 ? idx + 1 : 0]);
  };

  // ── Render helpers ─────────────────────────────────────────────────────────

  const statusMessage = (() => {
    if (isModelLoading)  return 'Loading face-tracking AI…';
    if (modelError)      return modelError;
    if (!faceDetected)   return 'Position your face in the frame';
    return null;
  })();

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-background text-on-surface font-body-md selection:bg-primary selection:text-on-primary min-h-screen overflow-x-hidden">

      {/* ── Top Navigation ── */}
      <nav
        aria-label="Try-on navigation"
        className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-3xl border-b border-white/10 transition-colors duration-500"
      >
        <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-20">
          <div className="flex items-center gap-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-on-surface/60 hover:text-on-surface transition-colors duration-300 cursor-pointer"
              aria-label="Back to Optical"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
              <span className="font-label-caps text-label-caps uppercase tracking-widest hidden sm:inline">Back to Optical</span>
            </button>
          </div>

          <span className="font-display-lg text-headline-sm tracking-tighter text-on-surface uppercase select-none">
            VISIONIX
          </span>

          <div className="flex items-center gap-6">
            <button aria-label="Search" className="material-symbols-outlined cursor-pointer hover:opacity-80 transition-opacity">
              search
            </button>
            <Link to="/profile" aria-label="Profile">
              <span className="material-symbols-outlined cursor-pointer hover:opacity-80 transition-opacity">person</span>
            </Link>
            <Link to="/cart" aria-label="Cart" className="relative">
              <span className="material-symbols-outlined cursor-pointer hover:opacity-80 transition-opacity">shopping_bag</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" aria-hidden="true"></span>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-surface/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <nav className="flex flex-col divide-y divide-white/10 px-gutter py-4">
              <Link
                to="/shop"
                className="font-label-caps text-label-caps text-on-surface py-3 hover:text-primary transition-colors uppercase tracking-wider"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Collections
              </Link>
              <Link
                to="/shop?category=optical"
                className="font-label-caps text-label-caps text-on-surface py-3 hover:text-primary transition-colors uppercase tracking-wider"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Optical
              </Link>
              <Link
                to="/shop?category=sunglasses"
                className="font-label-caps text-label-caps text-on-surface py-3 hover:text-primary transition-colors uppercase tracking-wider"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sunglasses
              </Link>
              <Link
                to="/shop?category=accessoires"
                className="font-label-caps text-label-caps text-on-surface py-3 hover:text-primary transition-colors uppercase tracking-wider"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Accessoires
              </Link>
              <Link
                to="/about"
                className="font-label-caps text-label-caps text-on-surface py-3 hover:text-primary transition-colors uppercase tracking-wider"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
            </nav>
          </div>
        )}
      </nav>

      {/* ── Main VTO Canvas ── */}
      <main className="relative w-screen min-h-screen pt-20 flex flex-col items-center justify-center">

        {/* ── Video / Fallback background ── */}
        <div
          ref={containerRef}
          className="absolute inset-0 z-0 flex items-center justify-center bg-black overflow-hidden"
          aria-label="Try-on camera view"
        >
          {loading ? (
            /* Skeleton loader */
            <div className="w-full h-full flex items-center justify-center animate-pulse">
              <div className="w-64 h-64 rounded-full bg-white/5"></div>
            </div>
          ) : !hasCamera ? (
            /* No-camera fallback */
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-surface/5"></div>

              {currentProduct && (
                <div className="relative z-10 w-full max-w-[500px] px-gutter mb-24 animate-in fade-in zoom-in duration-1000 mix-blend-screen">
                  <img
                    key={`${currentProduct.id}-${selectedColor}`}
                    src={selectedColorImage || getProductImageUrl(currentProduct)}
                    alt={`${currentProduct.name} frame preview`}
                    className="w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
                    style={{
                      filter: `drop-shadow(0 0 30px ${selectedTint}40) contrast(2) brightness(1.5)`,
                      transform: 'scaleX(-1)',
                      WebkitMaskImage: `linear-gradient(to right, transparent 15%, black 15%, black 40%, transparent 40%, transparent 60%, black 60%, black 85%, transparent 85%)`,
                      maskImage: `linear-gradient(to right, transparent 15%, black 15%, black 40%, transparent 40%, transparent 60%, black 60%, black 85%, transparent 85%)`,
                    }}
                  />
                  <div
                    className="absolute inset-x-[15%] top-[45%] bottom-[25%] rounded-full opacity-30 blur-2xl pointer-events-none transition-colors duration-500"
                    style={{ backgroundColor: selectedTint }}
                    aria-hidden="true"
                  ></div>
                </div>
              )}

              <div className="absolute bottom-40 text-center space-y-3 z-20">
                <span className="material-symbols-outlined text-2xl text-on-surface/20" aria-hidden="true">videocam_off</span>
                <p className="font-label-caps text-[9px] text-on-surface/40 uppercase tracking-[0.3em]">
                  {cameraError ?? 'Camera Disabled — Product View'}
                </p>
              </div>
            </div>
          ) : (
            /* Live camera */
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                aria-label="Live camera feed for virtual try-on"
                className="w-full h-full object-cover grayscale-[10%] -scale-x-100"
              />
              <div className="absolute inset-0 camera-overlay-gradient pointer-events-none" aria-hidden="true"></div>
            </div>
          )}

          {/* ── Glasses overlay (Inside containerRef for perfect pixel alignment) ── */}
          {hasCamera && currentProduct && glassesTransform && overlayUrl && (
            <div
              aria-hidden="true"
              className="absolute z-10 pointer-events-none"
              style={{
                left:            `${glassesTransform.centerX}px`,
                top:             `${glassesTransform.centerY}px`,
                width:           `${glassesTransform.width}px`,
                height:          `${glassesTransform.height}px`,
                transform:       `translate(-50%, -50%) rotate(${glassesTransform.angle}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <img
                key={currentProduct.id}
                src={overlayUrl}
                alt=""
                className="w-full h-full block"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
          )}
        </div>

        {/* ── Status badge (face not detected / loading) ── */}
        {hasCamera && statusMessage && (
          <div
            role="status"
            aria-live="polite"
            className="absolute top-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <span className="font-label-caps text-[10px] text-white/60 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md uppercase tracking-widest flex items-center gap-2">
              {isModelLoading && (
                <span className="inline-block w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true"></span>
              )}
              {statusMessage}
            </span>
          </div>
        )}

        {/* ── Left HUD: Biometrics (desktop) ── */}
        <aside
          aria-label="Scanned biometrics"
          className={`absolute left-gutter top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-4 transition-all duration-500 ${
            showMeasurements ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0 pointer-events-none'
          }`}
        >
          <div className="glass-panel p-6 rounded-lg w-64 border border-white/10 shadow-2xl">
            <div className="mb-6">
              <span className="font-label-caps text-label-caps text-primary block mb-2 uppercase tracking-widest text-[10px]">
                Scanned Biometrics
              </span>
              <div className="flex justify-between items-end">
                <span className="font-display-lg text-headline-sm leading-none tracking-tight">{biometrics.pd}</span>
                <span className="font-label-caps text-label-caps text-on-surface/60">mm PD</span>
              </div>
              <div className="mt-4 h-[1px] bg-white/10 w-full relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, (parseFloat(biometrics.pd) / 75) * 100) || 0}%` }}
                  role="progressbar"
                  aria-valuenow={parseFloat(biometrics.pd) || 0}
                  aria-valuemin={0}
                  aria-valuemax={75}
                ></div>
              </div>
            </div>

            <dl className="space-y-4">
              {[
                { label: 'Frame Width',  value: biometrics.width  !== '—' ? `${biometrics.width}mm`  : '—' },
                { label: 'Frame Length', value: biometrics.length !== '—' ? `${biometrics.length}mm` : '—' },
                { label: 'Face Shape',   value: 'Oval-Angular' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <dt className="font-label-caps text-[10px] text-on-surface/60 uppercase tracking-tighter">{label}</dt>
                  <dd className="font-body-md text-on-surface uppercase tracking-wider">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>

        {/* ── Right HUD: Configuration (desktop) ── */}
        <aside
          aria-label="Frame configuration"
          className="absolute right-gutter top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-4"
        >
          {/* Toggle HUD visibility */}
          <button
            onClick={() => setShowMeasurements((v) => !v)}
            aria-pressed={showMeasurements}
            className="glass-panel p-4 rounded-full flex items-center justify-center gap-3 hover:bg-white/10 transition-colors border border-white/10 self-end mb-4"
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-transform duration-500 ${showMeasurements ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              {showMeasurements ? 'visibility_off' : 'visibility'}
            </span>
            <span className="font-label-caps text-label-caps uppercase tracking-widest">
              {showMeasurements ? 'Hide HUD' : 'Show HUD'}
            </span>
          </button>

          {currentProduct && (
            <div className="glass-panel p-6 rounded-lg w-80 border border-white/10 shadow-2xl">
              <h2 className="font-display-lg text-headline-sm mb-2 uppercase tracking-tight">{currentProduct.name}</h2>
              <p className="text-on-surface/60 mb-6 text-sm leading-relaxed">
                {currentProduct.category_name || currentProduct.frame_style || currentProduct.material || 'Precision eyewear crafted for your look.'}
              </p>

              {productColors.length > 0 && (
                <fieldset className="mb-6">
                  <legend className="font-label-caps text-[10px] text-on-surface/40 uppercase tracking-widest mb-4">Frame Color</legend>
                  <div className="flex flex-wrap gap-3">
                    {productColors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.name)}
                        aria-pressed={selectedColor === color.name}
                        className={`w-10 h-10 rounded-full transition-all duration-300 ring-offset-4 ring-offset-background ${selectedColor === color.name ? 'ring-2 ring-primary scale-110' : 'border border-white/10 hover:scale-105'}`}
                        style={{ backgroundColor: color.hex }}
                        aria-label={color.name}
                      />
                    ))}
                  </div>
                </fieldset>
              )}

              {/* Lens technology */}
              <fieldset className="mb-8">
                <legend className="font-label-caps text-label-caps text-on-surface/40 block mb-4 uppercase tracking-widest text-[10px]">
                  Lens Technology
                </legend>
                <div className="grid grid-cols-1 gap-2">
                  {LENS_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedLens(opt.label)}
                      aria-pressed={selectedLens === opt.label}
                      className={`flex items-center justify-between p-3 border transition-all duration-300 ${
                        selectedLens === opt.label
                          ? 'border-on-surface bg-on-surface text-background'
                          : 'border-white/10 hover:border-white/30 text-on-surface'
                      }`}
                    >
                      <span className="font-label-caps text-label-caps uppercase text-[10px] tracking-widest">{opt.label}</span>
                      <span
                        className={`material-symbols-outlined text-[18px] transition-opacity ${selectedLens === opt.label ? 'opacity-100' : 'opacity-0'}`}
                        aria-hidden="true"
                      >
                        check_circle
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Lens tint */}
              <fieldset className="mb-8">
                <legend className="font-label-caps text-label-caps text-on-surface/40 block mb-4 uppercase tracking-widest text-[10px]">
                  Lens Tint
                </legend>
                <div className="flex gap-4">
                  {TINT_OPTIONS.map((tint) => (
                    <button
                      key={tint.hex}
                      onClick={() => setSelectedTint(tint.hex)}
                      aria-label={`${tint.name} tint${selectedTint === tint.hex ? ' (selected)' : ''}`}
                      aria-pressed={selectedTint === tint.hex}
                      className={`w-10 h-10 rounded-full transition-all duration-300 ring-offset-4 ring-offset-background ${
                        selectedTint === tint.hex ? 'ring-2 ring-primary scale-110' : 'border border-white/10 hover:scale-105'
                      }`}
                      style={{ backgroundColor: tint.hex }}
                    />
                  ))}
                </div>
              </fieldset>

              {productSizes.length > 0 && (
                <fieldset className="mb-8">
                  <legend className="font-label-caps text-label-caps text-on-surface/40 block mb-4 uppercase tracking-widest text-[10px]">
                    Frame Size
                  </legend>
                  <div className="grid grid-cols-1 gap-2">
                    {productSizes.map((size, index) => (
                      <button
                        key={`${size.label}-${index}`}
                        type="button"
                        onClick={() => setSelectedSizeIndex(index)}
                        aria-pressed={selectedSizeIndex === index}
                        className={`w-full text-left px-4 py-3 border transition-all duration-300 ${selectedSizeIndex === index ? 'border-on-surface bg-on-surface text-background' : 'border-white/10 hover:border-white/30 text-on-surface'}`}
                      >
                        <span className="font-label-caps text-[10px] uppercase tracking-[0.2em]">{size.label}</span>
                        <p className="text-sm text-on-surface/70 mt-1">{size.frame_width_mm} x {size.frame_length_mm} mm</p>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => addToCart({
                    ...currentProduct,
                    selectedColor,
                    selectedSize: selectedSize.label,
                  })}
                  className="w-full bg-on-surface text-background py-5 font-label-caps text-label-caps tracking-[0.2em] hover:opacity-80 transition-all uppercase"
                >
                  Add to Bag — {formatCurrency(currentProduct.price, currency)}
                </button>
                <button className="w-full border border-white/10 py-4 font-label-caps text-label-caps tracking-[0.2em] hover:bg-white/5 transition-colors flex items-center justify-center gap-2 uppercase text-[10px]">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">share</span>
                  Share My Look
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* ── Mobile HUD drawer ── */}
        <div className={`md:hidden absolute bottom-48 left-0 right-0 z-30 px-gutter transition-all duration-500 ${isMobileHudOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
          {currentProduct && (
            <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-2xl max-h-[60vh] overflow-y-auto">
              <h2 className="font-display-lg text-headline-sm mb-4 uppercase tracking-tight">{currentProduct.name}</h2>

              <div className="mb-6 rounded-3xl border border-white/10 bg-surface p-4">
                <span className="font-label-caps text-[10px] uppercase tracking-[0.3em] text-on-surface/60 block mb-3">Scanned Biometrics</span>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-surface-variant/70 p-3">
                    <p className="font-display-lg text-headline-sm leading-none">{biometrics.pd}</p>
                    <p className="text-on-surface/60 uppercase tracking-[0.2em] mt-2">mm PD</p>
                  </div>
                  <div className="rounded-2xl bg-surface-variant/70 p-3">
                    <p className="font-display-lg text-headline-sm leading-none">{biometrics.width}</p>
                    <p className="text-on-surface/60 uppercase tracking-[0.2em] mt-2">Frame Width</p>
                  </div>
                  <div className="rounded-2xl bg-surface-variant/70 p-3">
                    <p className="font-display-lg text-headline-sm leading-none">{biometrics.length}</p>
                    <p className="text-on-surface/60 uppercase tracking-[0.2em] mt-2">Frame Length</p>
                  </div>
                  <div className="rounded-2xl bg-surface-variant/70 p-3">
                    <p className="font-display-lg text-headline-sm leading-none">{currentProduct.frame_style || 'Oval-Angular'}</p>
                    <p className="text-on-surface/60 uppercase tracking-[0.2em] mt-2">Face Shape</p>
                  </div>
                </div>
              </div>

              {productColors.length > 0 && (
                <fieldset className="mb-4">
                  <legend className="font-label-caps text-[10px] text-on-surface/40 uppercase tracking-widest mb-2">Frame Color</legend>
                  <div className="flex gap-3">
                    {productColors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.name)}
                        aria-label={color.name}
                        aria-pressed={selectedColor === color.name}
                        className={`w-9 h-9 rounded-full ring-offset-2 ring-offset-background transition-all ${selectedColor === color.name ? 'ring-2 ring-primary scale-110' : 'border border-white/10'}`}
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                </fieldset>
              )}

              <fieldset className="mb-4">
                <legend className="font-label-caps text-[10px] text-on-surface/40 uppercase tracking-widest mb-2">Lens Tint</legend>
                <div className="flex gap-3">
                  {TINT_OPTIONS.map((tint) => (
                    <button
                      key={tint.hex}
                      onClick={() => setSelectedTint(tint.hex)}
                      aria-label={tint.name}
                      aria-pressed={selectedTint === tint.hex}
                      className={`w-9 h-9 rounded-full ring-offset-2 ring-offset-background transition-all ${selectedTint === tint.hex ? 'ring-2 ring-primary scale-110' : 'border border-white/10'}`}
                      style={{ backgroundColor: tint.hex }}
                    />
                  ))}
                </div>
              </fieldset>

              {productSizes.length > 0 && (
                <fieldset className="mb-6">
                  <legend className="font-label-caps text-[10px] text-on-surface/40 uppercase tracking-widest mb-2">Frame Size</legend>
                  <div className="grid grid-cols-1 gap-2">
                    {productSizes.map((size, index) => (
                      <button
                        key={`${size.label}-${index}`}
                        onClick={() => setSelectedSizeIndex(index)}
                        aria-pressed={selectedSizeIndex === index}
                        className={`w-full text-left px-4 py-3 border transition-all duration-300 ${selectedSizeIndex === index ? 'border-on-surface bg-on-surface text-background' : 'border-white/10 hover:border-white/30 text-on-surface'}`}
                      >
                        <span className="font-label-caps text-[10px] uppercase tracking-[0.2em]">{size.label}</span>
                        <p className="text-sm text-on-surface/70 mt-1">{size.frame_width_mm} x {size.frame_length_mm} mm</p>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <button
                onClick={() => addToCart({
                  ...currentProduct,
                  selectedColor,
                  selectedSize: selectedSize.label,
                })}
                className="w-full bg-on-surface text-background py-4 font-label-caps text-label-caps tracking-[0.2em] hover:opacity-80 transition-all uppercase mt-2"
              >
                Add to Bag — {formatCurrency(currentProduct.price, currency)}
              </button>
            </div>
          )}
        </div>

        {/* ── Bottom product switcher ── */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-gutter">
          <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between gap-6 border border-white/10 shadow-2xl">
            <button
              onClick={handlePrevProduct}
              aria-label="Previous product"
              className="text-on-surface/40 hover:text-on-surface transition-colors p-2"
            >
              <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
            </button>

            <div
              role="listbox"
              aria-label="Select eyewear frame"
              className="flex-1 flex justify-center items-center gap-8 overflow-x-auto hide-scrollbar py-2"
            >
              {products.map((p) => (
                <button
                  key={p.id}
                  role="option"
                  aria-selected={currentProduct?.id === p.id}
                  onClick={() => handleSelectProduct(p)}
                  className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-500 min-w-fit ${
                    currentProduct?.id === p.id ? 'scale-110 opacity-100' : 'opacity-30 hover:opacity-80'
                  }`}
                >
                  <span className="font-label-caps text-[9px] uppercase tracking-[0.2em]">{p.name.split(' ')[0]}</span>
                  <div
                    className={`transition-all duration-500 h-[2px] ${
                      currentProduct?.id === p.id ? 'w-10 bg-primary' : 'w-0 bg-white/20'
                    }`}
                    aria-hidden="true"
                  ></div>
                </button>
              ))}
            </div>

            <button
              onClick={handleNextProduct}
              aria-label="Next product"
              className="text-on-surface/40 hover:text-on-surface transition-colors p-2"
            >
              <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </button>
          </div>
        </div>

        {/* ── Capture button ── */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
          {/* Mobile HUD toggle (shown left of capture on mobile) */}
          <button
            onClick={() => setIsMobileHudOpen((v) => !v)}
            aria-label="Toggle options"
            aria-expanded={isMobileHudOpen}
            className="md:hidden absolute -left-16 top-1/2 -translate-y-1/2 glass-panel w-10 h-10 rounded-full flex items-center justify-center border border-white/10"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">tune</span>
          </button>

          <button
            onClick={handleCapture}
            disabled={isCapturing}
            aria-label={captureSuccess ? 'Captured!' : 'Capture look'}
            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center group active:scale-95 transition-all duration-300 ${
              captureSuccess ? 'border-primary' : 'border-white'
            } ${isCapturing ? 'opacity-60 cursor-wait' : ''}`}
          >
            <div
              className={`w-12 h-12 rounded-full transition-all duration-300 ${
                captureSuccess ? 'bg-primary scale-75' : 'bg-white group-hover:scale-90'
              } ${isCapturing ? 'animate-pulse' : ''}`}
              aria-hidden="true"
            ></div>
          </button>

          <span className="font-label-caps text-[9px] text-center text-on-surface/60 uppercase tracking-widest transition-all duration-300">
            {captureSuccess ? 'Saved!' : isCapturing ? 'Processing…' : 'Capture Look'}
          </span>
        </div>

        {/* ── Fetch / model error toast ── */}
        {(fetchError || modelError) && (
          <div
            role="alert"
            className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-red-900/80 text-red-200 text-[11px] font-label-caps uppercase tracking-widest px-5 py-3 rounded-full backdrop-blur-md border border-red-500/30 max-w-sm text-center"
          >
            {fetchError ?? modelError}
          </div>
        )}
      </main>
    </div>
  );
};

export default VirtualTryOn;