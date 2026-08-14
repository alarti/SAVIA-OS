/**
 * Savia OS - Device Responsiveness & Touch Utilities
 * 
 * Provides touch detection and responsive window bounds computation
 * to ensure apps fit perfectly on touch screens, phones, tablets, and desktop monitors.
 */

/**
 * Detects if the current device has touch capabilities.
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0) ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

/**
 * Detects if the current device is a mobile phone or tablet (based on touch or screen width).
 */
export function isMobileOrTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return isTouchDevice() || window.innerWidth <= 1024;
}

export interface ResponsiveBounds {
  x: number;
  y: number;
  w: number;
  h: number;
  maximized?: boolean;
}

/**
 * Calculates optimal responsive window size & centered position
 * so windows fit comfortably inside mobile, tablet, or desktop displays.
 */
export function calculateResponsiveWindowBounds(
  requestedW: number,
  requestedH: number,
  windowIndex: number = 0
): ResponsiveBounds {
  if (typeof window === 'undefined') {
    return { x: 20, y: 20, w: requestedW, h: requestedH };
  }

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const taskbarHeight = 48; // Taskbar / dock height
  const usableH = Math.max(200, screenH - taskbarHeight);

  const isMobileScreen = screenW < 640;
  const isTabletScreen = screenW >= 640 && screenW <= 1024;
  const isMobileTablet = isMobileScreen || isTabletScreen || isTouchDevice();

  let finalW = requestedW;
  let finalH = requestedH;

  if (isMobileScreen) {
    // Mobile phones: Occupy full available width with a 8px margin and full usable height
    finalW = Math.max(280, screenW - 16);
    finalH = Math.max(300, usableH - 16);
  } else if (isTabletScreen) {
    // Tablets: Scale to 92% screen width & 88% usable height max
    finalW = Math.min(requestedW, Math.floor(screenW * 0.92));
    finalH = Math.min(requestedH, Math.floor(usableH * 0.88));
  } else {
    // Desktop: Bound by 90% screen limits
    finalW = Math.min(requestedW, Math.floor(screenW * 0.90));
    finalH = Math.min(requestedH, Math.floor(usableH * 0.90));
  }

  // Ensure strict bounding box limits
  finalW = Math.max(280, Math.min(finalW, screenW - 8));
  finalH = Math.max(220, Math.min(finalH, usableH - 8));

  // Calculate centered position
  const offset = isMobileTablet ? 0 : (windowIndex % 5) * 20;
  const posX = Math.max(4, Math.floor((screenW - finalW) / 2) + offset);
  const posY = Math.max(4, Math.floor((usableH - finalH) / 2) + offset);

  return {
    x: posX,
    y: posY,
    w: finalW,
    h: finalH,
    maximized: isMobileScreen
  };
}
