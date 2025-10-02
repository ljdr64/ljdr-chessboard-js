/**
 * Moves a chess piece on the board, updating both board state maps.
 *
 * @param fromSquare - The origin square of the piece (e.g. "e2").
 * @param toSquare - The destination square of the piece (e.g. "e4").
 * @param options - Object containing additional board state references:
 *   @param boardMap - Current board state, mapping square positions to piece data.
 *   @param boardMapIndex - Map that tracks piece indices and their corresponding squares.
 *   @param freeIndexes - Set of reusable piece indexes.
 */
export const movePieceOnBoard = (
  fromSquare: string,
  toSquare: string,
  {
    boardMap,
    boardMapIndex,
    freeIndexes,
  }: {
    boardMap: Map<string, { color: string; role: string; index: number }>;
    boardMapIndex: Map<number, { color: string; role: string; square: string }>;
    freeIndexes: Set<number>;
  }
): void => {
  const movingPiece = boardMap.get(fromSquare);
  if (!movingPiece) return;

  const existingPieceAtTo = boardMap.get(toSquare);
  if (existingPieceAtTo) {
    boardMapIndex.delete(existingPieceAtTo.index);
    freeIndexes.add(existingPieceAtTo.index);
  }

  boardMapIndex.set(movingPiece.index, {
    color: movingPiece.color,
    role: movingPiece.role,
    square: toSquare,
  });
  boardMap.set(toSquare, movingPiece);
  boardMap.delete(fromSquare);
};
