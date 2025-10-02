export const tryAutoCastle = (
  from: string,
  to: string,
  board: Map<string, { color: string; role: string; index: number }>
): {
  move: { from: string; to: string };
  rookMove: { from: string; to: string };
  castle: boolean;
} => {
  const king = board.get(from);
  if (!king || king.role !== 'king') {
    return {
      move: { from, to },
      rookMove: { from: '', to: '' },
      castle: false,
    };
  }

  const color = king.color;
  const rank = from[1]; // '1' or '8'
  const fromFile = from[0];
  const toFile = to[0];

  const isLong = toFile === 'c'; // queenside
  const isShort = toFile === 'g'; // kingside

  // CASE 1: King moves two squares (gesture castling)
  if (isLong || isShort) {
    const emptyFiles = isLong ? ['d', 'c'] : ['f', 'g'];
    const rookStart = isLong ? 'a' + rank : 'h' + rank;
    const kingTarget = toFile + rank;
    const rookTarget = (isLong ? 'd' : 'f') + rank;

    if (emptyFiles.every((file) => !board.has(file + rank))) {
      const rook = board.get(rookStart);
      if (rook?.role === 'rook' && rook.color === color) {
        return {
          move: { from, to: kingTarget },
          rookMove: { from: rookStart, to: rookTarget },
          castle: true,
        };
      }
    }
  }

  // CASE 2: Direct click on own rook to initiate castle
  const targetPiece = board.get(to);
  if (
    targetPiece?.role === 'rook' &&
    targetPiece.color === color &&
    (toFile === 'a' || toFile === 'h')
  ) {
    const longClick = toFile < fromFile; // clicked rook to the left
    const kingTarget = (longClick ? 'c' : 'g') + rank;
    const rookTarget = (longClick ? 'd' : 'f') + rank;

    return {
      move: { from, to: kingTarget },
      rookMove: { from: to, to: rookTarget },
      castle: true,
    };
  }

  // Default: normal move
  return { move: { from, to }, rookMove: { from: '', to: '' }, castle: false };
};
