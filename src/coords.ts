// Notation ↔ Logical Coords

/**
 * Converts notation like 'e4' to logical coordinates [4, 4].
 * @example notationToCoords('e4') // → [4, 4]
 */
export const notationToCoords = (square: string): [number, number] => {
  const col = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(square[1], 10);
  return [col, row];
};

/**
 * Converts logical coordinates like [3, 6] to notation 'd2'.
 * @example coordsToNotation([3, 6]) // → 'd2'
 */
export const coordsToNotation = ([col, row]: [number, number]): string => {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = (8 - row).toString();
  return `${file}${rank}`;
};

// Coords ↔ Pixels

/**
 * Converts logical coordinates to pixel coordinates depending on orientation.
 * @example coordsToPixels([0, 0], 48, 'white') // → [0, 0]
 * @example coordsToPixels([0, 0], 48, 'black') // → [336, 336]
 */
export const coordsToPixels = (
  [col, row]: [number, number],
  squareSize: number,
  orientation: string
): [number, number] => {
  if (orientation === 'black') {
    col = 7 - col;
    row = 7 - row;
  }
  return [col * squareSize, row * squareSize];
};

/**
 * Converts pixel coordinates to logical coordinates depending on orientation.
 * @example pixelsToCoords([192, 288], 48, 'white') // → [4, 6]
 */
export const pixelsToCoords = (
  [x, y]: [number, number],
  squareSize: number,
  orientation: string
): [number, number] => {
  let col = Math.floor(x / squareSize);
  let row = Math.floor(y / squareSize);
  if (orientation === 'black') {
    col = 7 - col;
    row = 7 - row;
  }
  return [col, row];
};

// Notation ↔ Pixels

/**
 * Converts algebraic notation to pixel coordinates.
 * @example notationToPixels('e2', 48, 'white') // → [192, 288]
 */
export const notationToPixels = (
  square: string,
  squareSize: number,
  orientation: string
): [number, number] =>
  coordsToPixels(notationToCoords(square), squareSize, orientation);

/**
 * Converts pixel coordinates to algebraic notation.
 * @example pixelsToNotation([192, 288], 48, 'white') // → 'e2'
 */
export const pixelsToNotation = (
  [x, y]: [number, number],
  squareSize: number,
  orientation: string
): string => coordsToNotation(pixelsToCoords([x, y], squareSize, orientation));

// Pixels ↔ Translate

/**
 * Converts pixel coordinates to CSS translate string.
 * @example pixelsToTranslate([192, 288]) // → 'translate(192px, 288px)'
 */
export const pixelsToTranslate = ([x, y]: [number, number]): string =>
  `translate(${x}px, ${y}px)`;

/**
 * Extracts pixel coordinates from a CSS translate string.
 * @example translateToPixels('translate(192px, 288px)') // → [192, 288]
 */
export const translateToPixels = (translate: string): [number, number] => {
  const match = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(translate);
  return match ? [parseFloat(match[1]), parseFloat(match[2])] : [0, 0];
};

// Notation ↔ Translate

/**
 * Converts notation like 'e2' to CSS translate string.
 * @example notationToTranslate('e2', 48, 'white') // → 'translate(192px, 288px)'
 */
export const notationToTranslate = (
  square: string,
  squareSize: number,
  orientation: string
): string =>
  pixelsToTranslate(notationToPixels(square, squareSize, orientation));

/**
 * Converts CSS translate string to algebraic notation.
 * @example translateToNotation('translate(192px, 288px)', 48, 'white') // → 'e2'
 */
export const translateToNotation = (
  translate: string,
  squareSize: number,
  orientation: string
): string =>
  pixelsToNotation(translateToPixels(translate), squareSize, orientation);

/**
 * Snaps pixel coordinates to the nearest top-left corner of a square.
 * @example normalizePixels(193, 290, 48) // → [192, 288]
 */
export const normalizePixels = (
  x: number,
  y: number,
  squareSize: number
): [number, number] => {
  const normalizedX = Math.floor(x / squareSize) * squareSize;
  const normalizedY = Math.floor(y / squareSize) * squareSize;
  return [normalizedX, normalizedY];
};
