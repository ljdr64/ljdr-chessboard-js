/**
 * Maps each square on the chessboard to its corresponding piece details based on the FEN string,
 * and generates a second map from FEN-character index to the corresponding square on the board.
 */
export const fenToIndexedBoardMap = (
  fen: string
): [
  Map<string, { color: string; role: string; index: number }>,
  Map<number, { color: string; role: string; square: string }>,
  number
] => {
  const fenPieces = fen.split(' ')[0];
  const newIndexedBoardMap = new Map<
    string,
    { color: string; role: string; index: number }
  >();
  const newBoardMapIndex = new Map<
    number,
    { color: string; role: string; square: string }
  >();

  let row = 0;
  let col = 0;
  let currentLastIndex = 0;
  const DIGITS = '0123456789';

  for (let i = 0; i < fenPieces.length; i++) {
    const char = fenPieces[i];

    if (char === '/') {
      row += 1;
      col = 0;
    } else if (DIGITS.includes(char)) {
      col += parseInt(char, 10);
    } else {
      const file = String.fromCharCode('a'.charCodeAt(0) + col);
      const rank = (8 - row).toString();
      const square = `${file}${rank}`;
      const pieceNames: Record<
        string,
        'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'
      > = {
        p: 'pawn',
        r: 'rook',
        n: 'knight',
        b: 'bishop',
        q: 'queen',
        k: 'king',
      };

      const color = char === char.toUpperCase() ? 'white' : 'black';
      const role = pieceNames[char.toLowerCase()];

      const pieceBySquare = { color, role, index: currentLastIndex };
      const pieceByIndex = { color, role, square };

      newIndexedBoardMap.set(square, pieceBySquare);
      newBoardMapIndex.set(currentLastIndex, pieceByIndex);

      currentLastIndex += 1;
      col += 1;
    }
  }

  return [newIndexedBoardMap, newBoardMapIndex, currentLastIndex];
};

/**
 * Finds the position of a specific piece on the chessboard based on the FEN notation.
 */
export const findPieceSquareOnFEN = (fen: string, piece: string): string => {
  let row = 0;
  let col = 0;
  const DIGITS = '0123456789';

  for (let i = 0; i < fen.length; i++) {
    const char = fen[i];

    if (char === '/') {
      row += 1;
      col = 0;
    } else if (DIGITS.includes(char)) {
      col += parseInt(char);
    } else {
      const file = String.fromCharCode('a'.charCodeAt(0) + col);
      const rank = (8 - row).toString();

      if (char === piece) {
        return `${file}${rank}`;
      }

      col += 1;
    }
  }

  return '';
};

/**
 * Gets the square of the king that is in check based on the FEN, turn color, and board orientation.
 */
export const getPositionCheck = (
  check: string | boolean | undefined,
  turnColor: string,
  fen: string
): string => {
  const color =
    check === 'white' || check === 'black'
      ? check
      : check === true
      ? turnColor
      : null;

  if (color === 'white') return findPieceSquareOnFEN(fen, 'K');
  if (color === 'black') return findPieceSquareOnFEN(fen, 'k');

  return '';
};

/**
 * Converts piece role and color to its corresponding FEN character.
 */
export const pieceToFEN = (piece: { role: string; color: string }): string => {
  const roleMap: Record<string, string> = {
    pawn: 'p',
    knight: 'n',
    bishop: 'b',
    rook: 'r',
    queen: 'q',
    king: 'k',
  };
  const fenChar = roleMap[piece.role.toLowerCase()] || '?';
  return piece.color === 'white'
    ? fenChar.toUpperCase()
    : fenChar.toLowerCase();
};

/**
 * Converts a board map into a FEN string representation.
 */
export const boardMapToFEN = (
  boardMap: Record<string, { index?: number; role: string; color: string }>
): string => {
  let fen = '';
  for (let row = 8; row >= 1; row--) {
    let emptyCount = 0;
    for (let col = 0; col < 8; col++) {
      const file = String.fromCharCode('a'.charCodeAt(0) + col);
      const square = `${file}${row}`;
      const { role, color } = boardMap[square] || {};

      if (role && color) {
        if (emptyCount > 0) {
          fen += emptyCount.toString();
          emptyCount = 0;
        }
        fen += pieceToFEN({ role, color });
      } else {
        emptyCount++;
      }
    }
    if (emptyCount > 0) {
      fen += emptyCount.toString();
    }
    if (row > 1) {
      fen += '/';
    }
  }
  return fen;
};

/**
 * Parses a FEN string and maps each square to its piece details (color and role).
 */
export const fenToBoardMap = (
  fen: string
): Map<string, { color: string; role: string }> => {
  const fenPieces = fen.split(' ')[0];
  const newBoardMap = new Map<string, { color: string; role: string }>();

  let row = 0;
  let col = 0;
  const DIGITS = '0123456789';

  for (let i = 0; i < fenPieces.length; i++) {
    const char = fenPieces[i];

    if (char === '/') {
      row += 1;
      col = 0;
    } else if (DIGITS.includes(char)) {
      col += parseInt(char, 10);
    } else {
      const file = String.fromCharCode('a'.charCodeAt(0) + col);
      const rank = (8 - row).toString();
      const square = `${file}${rank}`;
      const pieceNames: Record<
        string,
        'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'
      > = {
        p: 'pawn',
        r: 'rook',
        n: 'knight',
        b: 'bishop',
        q: 'queen',
        k: 'king',
      };

      const color = char === char.toUpperCase() ? 'white' : 'black';
      const role = pieceNames[char.toLowerCase()];

      newBoardMap.set(square, { color, role });
      col += 1;
    }
  }

  return newBoardMap;
};
