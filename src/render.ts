import { notationToTranslate } from './coords.js';
import { getSquareClasses } from './board.js';
import type { ChessBoardConfig } from './props.js';

const ranks = [1, 2, 3, 4, 5, 6, 7, 8];
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function render(
  container: HTMLElement,
  boardConfig: ChessBoardConfig,
  boardMapIndex: Map<number, { color: string; role: string; square: string }>,
  boardMapFuture: Map<string, { color: string; role: string; index: number }>,
  pieceRefs: Record<number, HTMLElement>,
  handleMouseDown: (e: Event) => void,
  handleTouchStart: (e: Event) => void
) {
  // clear container
  container.innerHTML = '';

  // wrap element
  const wrap = document.createElement('div');
  wrap.className = 'ljdr-wrap';
  container.appendChild(wrap);

  // board container
  const boardContainer = document.createElement('div');
  boardContainer.className = 'ljdr-container';
  boardContainer.style.width = `${boardConfig.squareSize * 8}px`;
  boardContainer.style.height = `${boardConfig.squareSize * 8}px`;
  wrap.appendChild(boardContainer);

  // board element
  const board = document.createElement('div');
  board.className = 'ljdr-board';
  board.addEventListener('mousedown', handleMouseDown as EventListener);
  board.addEventListener('touchstart', handleTouchStart as EventListener);
  boardContainer.appendChild(board);

  // squares
  const squareClasses = getSquareClasses(
    { current: boardConfig },
    { current: boardMapFuture }
  );
  for (const [square, classNames] of Object.entries(squareClasses)) {
    const sqEl = document.createElement('div');
    sqEl.className = `ljdr-square ${classNames}`;
    sqEl.style.transform = notationToTranslate(
      square,
      boardConfig.squareSize,
      boardConfig.orientation
    );
    board.appendChild(sqEl);
  }

  // pieces
  for (const [index, piece] of boardMapIndex.entries()) {
    const { color, role, square } = piece;
    const translate = notationToTranslate(
      square,
      boardConfig.squareSize,
      boardConfig.orientation
    );
    const pieceEl = document.createElement('div');
    pieceEl.className = `ljdr-piece ${color} ${role}`;
    pieceEl.style.transform = translate;
    pieceEl.addEventListener('mousedown', handleMouseDown as EventListener);
    pieceEl.addEventListener('touchstart', handleTouchStart as EventListener);
    pieceRefs[index] = pieceEl;
    board.appendChild(pieceEl);
  }

  // coordinates
  if (boardConfig.coordinates) {
    // rank coordinates
    const ranksEl = document.createElement('div');
    ranksEl.className = 'coords ranks';
    for (const rank of ranks) {
      const coord = document.createElement('div');
      coord.className = 'coord';
      coord.textContent =
        boardConfig.orientation === 'white' ? String(rank) : String(9 - rank);
      ranksEl.appendChild(coord);
    }
    boardContainer.appendChild(ranksEl);

    // file coordinates
    const filesEl = document.createElement('div');
    filesEl.className = 'coords files';
    files.forEach((file, index) => {
      const coord = document.createElement('div');
      coord.className = 'coord';
      coord.textContent =
        boardConfig.orientation === 'white'
          ? file
          : (files[7 - index] as string);
      filesEl.appendChild(coord);
    });
    boardContainer.appendChild(filesEl);
  }

  // ghost piece
  if (boardConfig.draggable.showGhost) {
    const ghost = document.createElement('div');
    ghost.className = 'ljdr-ghost';
    ghost.style.visibility = 'hidden';
    boardContainer.appendChild(ghost);
  }

  // ghost animations
  if (
    boardConfig.animation.enabled &&
    boardConfig.animation.type === 'ghosts'
  ) {
    for (let i = 1; i <= 3; i++) {
      const ghostAnim = document.createElement('div');
      ghostAnim.className = `ljdr-ghost-animate${i}`;
      ghostAnim.style.visibility = 'hidden';
      boardContainer.appendChild(ghostAnim);
    }
  }

  // warp animation
  if (boardConfig.animation.enabled && boardConfig.animation.type === 'warp') {
    const warpAnim = document.createElement('div');
    warpAnim.className = 'ljdr-warp-animate';
    warpAnim.style.visibility = 'hidden';
    boardContainer.appendChild(warpAnim);
  }

  return { wrap, boardContainer, board };
}
