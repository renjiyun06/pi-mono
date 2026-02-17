/**
 * Douyin/TikTok Mobile Safe Zone Constants
 *
 * On mobile, platform UI elements overlay the video:
 * - Top: creator info, status bar (~160px on 1080x1920)
 * - Bottom: captions, description, like/comment/share buttons (~480px)
 * - Right: engagement button column (~120px)
 * - Left: minor overlap (~120px)
 *
 * Content must be placed within the safe zone to remain visible.
 *
 * References:
 * - TikTok safe zone: 840x1280px centered on 1080x1920 canvas
 * - Title-safe (80% center): ~864x1536px
 * - Action-safe (90% center): ~972x1728px
 *
 * We use the TikTok-specific values as they're more conservative
 * and Douyin shares the same UI layout.
 */

// Canvas dimensions
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

// Danger zones (pixels from edge that are covered by platform UI)
export const DANGER_TOP = 160;    // Creator info, status bar
export const DANGER_BOTTOM = 480; // Captions, description, buttons
export const DANGER_LEFT = 120;   // Minor overlap
export const DANGER_RIGHT = 120;  // Engagement buttons (like, comment, share)

// Safe content area
export const SAFE_LEFT = DANGER_LEFT;                          // 120
export const SAFE_TOP = DANGER_TOP;                            // 160
export const SAFE_RIGHT = CANVAS_WIDTH - DANGER_RIGHT;         // 960
export const SAFE_BOTTOM = CANVAS_HEIGHT - DANGER_BOTTOM;      // 1440
export const SAFE_WIDTH = SAFE_RIGHT - SAFE_LEFT;              // 840
export const SAFE_HEIGHT = SAFE_BOTTOM - SAFE_TOP;             // 1280

// Commonly used positions (CSS values)
// These are for `position: absolute` elements

/** Padding for content that should stay within safe zone */
export const SAFE_PADDING_HORIZONTAL = DANGER_LEFT;  // 120px each side
export const SAFE_PADDING_TOP = DANGER_TOP;           // 160px from top
export const SAFE_PADDING_BOTTOM = DANGER_BOTTOM;     // 480px from bottom

/**
 * Subtitle position: should be in the lower portion of the safe zone
 * but well above the bottom danger zone.
 * At bottom: 500px → y = 1420px (20px inside safe zone bottom edge)
 */
export const SUBTITLE_BOTTOM = 500;

/**
 * Watermark position: just inside the safe zone bottom-right corner
 */
export const WATERMARK_BOTTOM = 500;
export const WATERMARK_RIGHT = DANGER_RIGHT + 10; // 130px from right edge

/**
 * Section indicator (chapter/progress): just inside safe zone top-left
 */
export const INDICATOR_TOP = DANGER_TOP + 10;  // 170px from top
export const INDICATOR_LEFT = DANGER_LEFT + 10; // 130px from left

/**
 * Caption position for visual/image scenes: in lower-middle safe zone
 */
export const CAPTION_BOTTOM = 520;

/**
 * Content vertical center: center of the safe zone, not the canvas
 * Safe zone vertical center = SAFE_TOP + SAFE_HEIGHT/2 = 160 + 640 = 800
 * This is slightly above canvas center (960), which is correct —
 * it compensates for the larger bottom danger zone.
 */
export const SAFE_CENTER_Y = SAFE_TOP + Math.floor(SAFE_HEIGHT / 2); // 800
