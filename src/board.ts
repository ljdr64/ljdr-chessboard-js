import type { ChessBoardConfig } from './props.js';

type Piece = { color: string; role: string; index: number };

/**
 * Returns an object that maps each square to the CSS classes it should have
 * according to the current board state.
 *
 * @param config - Current chessboard configuration.
 * @param boardMapFuture - Future board state (piece per square).
 */
export function getSquareClasses(
  config: ChessBoardConfig,
  boardMapFuture: Map<string, Piece>
): Record<string, string> {
  const squareClassMap: Record<string, string[]> = {};

  const addClass = (square: string | undefined, className: string) => {
    if (!square) return;
    if (!squareClassMap[square]) squareClassMap[square] = [];
    if (!squareClassMap[square].includes(className)) {
      squareClassMap[square].push(className);
    }
  };

  // move-dest
  if (config.selected && config.movable.showDests === true) {
    config.movable?.dests?.get(config.selected)?.forEach((sq) => {
      addClass(sq, 'move-dest');
      if (boardMapFuture.has(sq)) addClass(sq, 'oc');
    });
  }

  // premove-dest
  config.premovable?.dests?.forEach((sq) => {
    addClass(sq, 'premove-dest');
    if (boardMapFuture.has(sq)) addClass(sq, 'oc');
  });

  // current-premove
  config.premovable?.current?.forEach((sq) => {
    addClass(sq, 'current-premove');
  });

  // check
  addClass(config.check, 'ljdr-check');

  // last-move
  const [from, to] = config.lastMove ?? [];

  // last-move2
  const [from2, to2] = config.lastMove2 ?? [];

  // last-move3
  const [from3, to3] = config.lastMove3 ?? [];

  const isSelectedInLastMoves = [from, from2, from3, to, to2, to3].includes(
    config.selected
  );

  // select (only if the selected square is not part of last moves)
  if (!isSelectedInLastMoves) addClass(config.selected, 'select');

  // add last-move classes
  addClass(from, 'ljdr-last-move');
  addClass(to, 'ljdr-last-move');

  addClass(from2, 'ljdr-last-move2');
  addClass(to2, 'ljdr-last-move2');

  addClass(from3, 'ljdr-last-move3');
  addClass(to3, 'ljdr-last-move3');

  // if the selected square is part of last moves, then add select here
  if (isSelectedInLastMoves) addClass(config.selected, 'select');

  // Final result: convert arrays into joined strings
  const result: Record<string, string> = {};
  for (const sq in squareClassMap) {
    result[sq] = squareClassMap[sq].join(' ');
  }

  return result;
}
