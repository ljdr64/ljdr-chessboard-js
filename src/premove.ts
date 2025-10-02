type Mobility = (x1: number, y1: number, x2: number, y2: number) => boolean;

const posToSquare = ([x, y]: [number, number]): string => {
  const file = String.fromCharCode(97 + x); // 'a' = 97
  const rank = (y + 1).toString(); // 0 → '1'
  return file + rank;
};

const squareToPos = (square: string): [number, number] => [
  square.charCodeAt(0) - 97, // 'a' = 0
  parseInt(square[1], 10) - 1, // '1' = 0
];

const allPos: readonly [number, number][] = Array.from({ length: 8 }, (_, x) =>
  Array.from({ length: 8 }, (_, y) => [x, y] as [number, number])
).flat();

const diff = (a: number, b: number): number => Math.abs(a - b);

const pawn =
  (color: string): Mobility =>
  (x1, y1, x2, y2) =>
    diff(x1, x2) < 2 &&
    (color === 'white'
      ? y2 === y1 + 1 || (y1 <= 1 && y2 === y1 + 2 && x1 === x2)
      : y2 === y1 - 1 || (y1 >= 6 && y2 === y1 - 2 && x1 === x2));

const knight: Mobility = (x1, y1, x2, y2) => {
  const xd = diff(x1, x2);
  const yd = diff(y1, y2);
  return (xd === 1 && yd === 2) || (xd === 2 && yd === 1);
};

const bishop: Mobility = (x1, y1, x2, y2) => {
  return diff(x1, x2) === diff(y1, y2);
};

const rook: Mobility = (x1, y1, x2, y2) => {
  return x1 === x2 || y1 === y2;
};

const queen: Mobility = (x1, y1, x2, y2) => {
  return bishop(x1, y1, x2, y2) || rook(x1, y1, x2, y2);
};

const king =
  (color: string, rookFiles: number[], canCastle: boolean): Mobility =>
  (x1, y1, x2, y2) =>
    (diff(x1, x2) < 2 && diff(y1, y2) < 2) ||
    (canCastle &&
      y1 === y2 &&
      y1 === (color === 'white' ? 0 : 7) &&
      ((x1 === 4 &&
        ((x2 === 2 && rookFiles.includes(0)) ||
          (x2 === 6 && rookFiles.includes(7)))) ||
        rookFiles.includes(x2)));

const rookFilesOf = (
  pieces: Map<string, { color: string; role: string; index: number }>,
  color: string
) => {
  const backrank = color === 'white' ? '1' : '8';
  const files = [];
  for (const [square, piece] of pieces) {
    if (
      square[1] === backrank &&
      piece.color === color &&
      piece.role === 'rook'
    ) {
      files.push(squareToPos(square)[0]);
    }
  }
  return files;
};

export const premove = (
  pieces: Map<string, { color: string; role: string; index: number }>,
  square: string,
  canCastle: boolean
): string[] => {
  const piece = pieces.get(square);
  if (!piece) return [];
  const pos = squareToPos(square),
    r = piece.role,
    mobility: Mobility =
      r === 'pawn'
        ? pawn(piece.color)
        : r === 'knight'
        ? knight
        : r === 'bishop'
        ? bishop
        : r === 'rook'
        ? rook
        : r === 'queen'
        ? queen
        : king(piece.color, rookFilesOf(pieces, piece.color), canCastle);
  return allPos
    .filter(
      (pos2) =>
        (pos[0] !== pos2[0] || pos[1] !== pos2[1]) &&
        mobility(pos[0], pos[1], pos2[0], pos2[1])
    )
    .map(posToSquare);
};
