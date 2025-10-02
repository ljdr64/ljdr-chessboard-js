/**
 * Checks if a value is a valid integer index.
 * Accepts negative numbers, rejects NaN and non-integers.
 */
export const validateIndex = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && !isNaN(value);
};

/**
 * Filters valid chess moves like "e2e4" from a list.
 */
export const validateMoves = (moves: string[]): string[] => {
  return moves.filter((move) => /^[a-h][1-8][a-h][1-8]$/.test(move));
};

/**
 * Returns the square if it's valid (e.g., "e2"), or an empty string.
 */
export const validateSquare = (square: unknown): string => {
  return typeof square === 'string' && /^[a-h][1-8]$/.test(square)
    ? square
    : '';
};
