/**
 * Update the current board state to match a given next board map.
 *
 * Reuses or allocates piece indexes as needed to match the new board position.
 *
 * @param boardMapCurrent - Current board map (Ref to Map<square, piece data>)
 * @param freeIndexes - Free indexes available for new pieces (Ref to Set<number>)
 * @param currentLastIndex - Current last used index (Ref to number)
 * @param nextBoardMap - Target board map representing the new position
 * @returns New board map
 */
export const updateBoardToNextMap = (
  boardMapCurrent: React.MutableRefObject<
    Map<string, { color: string; role: string; index: number }>
  >,
  freeIndexes: React.MutableRefObject<Set<number>>,
  currentLastIndex: React.MutableRefObject<number>,
  nextBoardMap: Map<string, { color: string; role: string }>
) => {
  const boardMapPool = new Map(boardMapCurrent.current);
  const newBoardMap = new Map<
    string,
    { color: string; role: string; index: number }
  >();

  for (const [square, pieceNext] of nextBoardMap.entries()) {
    const pieceCurrent = boardMapPool.get(square);

    if (
      pieceCurrent &&
      pieceCurrent.color === pieceNext.color &&
      pieceCurrent.role === pieceNext.role
    ) {
      newBoardMap.set(square, pieceCurrent);
      boardMapPool.delete(square);
    }
  }

  for (const [square, pieceNext] of nextBoardMap.entries()) {
    if (newBoardMap.has(square)) continue;

    let reused: { color: string; role: string; index: number } | undefined;
    for (const [sq, piece] of boardMapPool.entries()) {
      if (piece.color === pieceNext.color && piece.role === pieceNext.role) {
        reused = piece;
        boardMapPool.delete(sq);
        break;
      }
    }

    if (reused) {
      newBoardMap.set(square, reused);
    } else {
      let index: number;
      if (freeIndexes.current.size > 0) {
        const [firstFree] = freeIndexes.current;
        index = firstFree;
        freeIndexes.current.delete(firstFree);
      } else {
        index = currentLastIndex.current;
        currentLastIndex.current++;
      }

      newBoardMap.set(square, { ...pieceNext, index });
    }
  }

  return newBoardMap;
};
