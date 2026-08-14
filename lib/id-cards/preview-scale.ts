// Px-per-mm scale used only for the on-screen preview so the card renders at a
// comfortable viewing size instead of its true (small) physical dimensions.
export const PREVIEW_PX_PER_MM = 4.5;

// Standard CSS/print px-per-mm: 96 CSS px = 1 inch = 25.4mm. This is what a
// browser's print engine actually uses to map a `mm` width to physical paper size.
export const PRINT_PX_PER_MM = 96 / 25.4;

// How much smaller the print output is than the on-screen preview design —
// used to scale a full preview-sized card down to its true physical footprint
// without re-flowing (and therefore without any of its content overflowing).
export const PRINT_SCALE = PRINT_PX_PER_MM / PREVIEW_PX_PER_MM;
