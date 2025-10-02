import type { ChessGameProps, ChessBoardConfig } from './props.js';

import {
  defaultId,
  defaultFEN,
  defaultOrientation,
  defaultTurnColor,
  defaultCheck,
  defaultLastMove,
  defaultLastMove2,
  defaultLastMove3,
  defaultSelected,
  defaultCoordinates,
  defaultAutoCastle,
  defaultSquareSize,
  defaultAnimation,
  defaultMovable,
  defaultPremovable,
  defaultDraggable,
  defaultEvents,
} from './props.js';

import {
  normalizePixels,
  notationToTranslate,
  pixelsToNotation,
  pixelsToTranslate,
  translateToPixels,
} from './coords.js';

import { fenToIndexedBoardMap, getPositionCheck } from './fen.js';
import { tryAutoCastle } from './tryAutoCastle.js';
import { animateMove } from './animateMove.js';
import { movePieceOnBoard } from './movePieceOnBoard.js';
import { premove } from './premove.js';
import { render } from './render.js';

export function createChessBoard(options: Partial<ChessGameProps> = {}) {
  const {
    id = defaultId,
    fen = defaultFEN,
    orientation = defaultOrientation,
    turnColor = defaultTurnColor,
    check = defaultCheck,
    lastMove = defaultLastMove,
    lastMove2 = defaultLastMove2,
    lastMove3 = defaultLastMove3,
    selected = defaultSelected,
    coordinates = defaultCoordinates,
    autoCastle = defaultAutoCastle,
    squareSize = defaultSquareSize,
    animation = defaultAnimation,
    movable = defaultMovable,
    premovable = defaultPremovable,
    draggable = defaultDraggable,
    events = defaultEvents,
  } = options;

  const animationConfig = { ...defaultAnimation, ...animation };
  const movableConfig = { ...defaultMovable, ...movable };
  const premovableConfig = { ...defaultPremovable, ...premovable };
  const draggableConfig = { ...defaultDraggable, ...draggable };
  const eventsConfig = { ...defaultEvents, ...events };

  const boardConfig: ChessBoardConfig = {
    id,
    fen,
    orientation,
    turnColor,
    check: getPositionCheck(check, turnColor, fen),
    lastMove,
    lastMove2,
    lastMove3,
    selected,
    coordinates,
    autoCastle,
    squareSize,
    animation: animationConfig,
    movable: movableConfig,
    premovable: premovableConfig,
    draggable: draggableConfig,
    events: eventsConfig,
  };

  let isMovableEnabled = true;
  const pieceRefs: Record<number, HTMLDivElement> = {};
  let ghostEl: HTMLDivElement | null = null;
  let ghostAnimate1: HTMLDivElement | null = null;
  let ghostAnimate2: HTMLDivElement | null = null;
  let ghostAnimate3: HTMLDivElement | null = null;
  let warpAnimateEl: HTMLDivElement | null = null;
  let lastAnimation: {
    moves: { from: string; to: string }[];
    cancel: () => void;
  } | null = null;
  let boardEl: HTMLDivElement | null = null;

  const [boardMap, boardIndexMap, pieceCount] = fenToIndexedBoardMap(
    boardConfig.fen
  );

  const freeIndexes = new Set<number>();
  let currentLastIndex = pieceCount;

  let boardMapCurrent = new Map(boardMap);
  let boardMapFuture = new Map(boardMap);
  let boardMapIndexCurrent = new Map(boardIndexMap);
  let boardMapIndexFuture = new Map(boardIndexMap);

  let selectedPiece: {
    color: string;
    role: string;
    square: string;
    index: number;
  } | null =
    selected && boardMap.get(selected)
      ? { ...boardMap.get(selected)!, square: selected }
      : null;

  let isSelect = !!selected;
  let isDragging = false;
  let isTouchStarted = false;

  let lastOffset: [number, number] = [0, 0];
  let lastMoveType: 'select' | 'drag' = 'drag';

  let distancePassed = false;

  function handleMouseDown(event: any) {
    event.stopPropagation();

    if (!isMovableEnabled) return;

    let eventType: MouseEvent | Touch;
    if (event.type === 'mousedown') {
      eventType = event as MouseEvent;
      isTouchStarted = false;
    } else {
      eventType = (event as TouchEvent).touches[0];
      isTouchStarted = true;
    }
    if (event.type === 'mousedown' && isTouchStarted) return;

    const rect = boardEl?.getBoundingClientRect();
    if (!rect) return;

    const x = eventType.clientX - rect.left;
    const y = eventType.clientY - rect.top;
    const currentSquare = pixelsToNotation(
      [x, y],
      boardConfig.squareSize,
      boardConfig.orientation
    );

    const isMovableSelectedColor =
      boardConfig.movable.color === 'both' ||
      (boardConfig.movable.color === selectedPiece?.color &&
        boardConfig.turnColor === selectedPiece?.color);

    const canMove =
      selectedPiece &&
      (boardConfig.movable.free === true ||
        (isMovableSelectedColor &&
          boardConfig.movable.dests
            ?.get(selectedPiece.square)
            ?.includes(currentSquare)));

    const current = boardMapCurrent.get(currentSquare);
    const future = boardMapFuture.get(currentSquare);

    const isMovablePieceColor =
      !boardConfig.premovable.dests?.includes(currentSquare) &&
      (boardConfig.movable.color === 'both' ||
        boardConfig.movable.color === future?.color);

    if (
      (selectedPiece?.square === currentSquare && isSelect) ||
      (!selectedPiece && !isSelect) ||
      !canMove
    ) {
      const prevPremovableDests = boardConfig.premovable.dests;

      if (
        !boardConfig.premovable.dests?.includes(currentSquare) &&
        boardConfig.premovable.enabled === true &&
        boardConfig.premovable.showDests === true &&
        boardConfig.movable.color === future?.color &&
        boardConfig.turnColor !== future?.color
      ) {
        const newDests = premove(boardMapFuture, currentSquare, true);
        boardConfig.premovable.dests = newDests;
      } else {
        boardConfig.premovable.dests = [];
      }

      if (
        prevPremovableDests &&
        prevPremovableDests.length > 0 &&
        prevPremovableDests.includes(currentSquare)
      ) {
        if (selectedPiece?.square) {
          boardConfig.premovable.current = [
            selectedPiece.square,
            currentSquare,
          ];
          boardConfig.premovable.events.set?.(
            selectedPiece.square,
            currentSquare
          );
        }
      } else if (
        !future ||
        boardConfig.turnColor === future?.color ||
        boardConfig.premovable.current?.[0] === currentSquare
      ) {
        boardConfig.premovable.current = undefined;
        boardConfig.premovable.events.unset?.();
      }

      selectedPiece = null;
      isSelect = false;
      boardConfig.selected = '';

      if (isMovablePieceColor) {
        if (
          boardMapCurrent.has(currentSquare) &&
          current?.index === future?.index
        ) {
          isDragging = true;
          isSelect = true;
          if (selectedPiece?.square === currentSquare) isSelect = false;

          const pieceData = boardMapCurrent.get(currentSquare);
          if (pieceData) {
            const { index, role, color } = pieceData;
            selectedPiece = { index, role, color, square: currentSquare };
            boardConfig.selected = currentSquare;
            if (!isSelect || !canMove) {
              eventsConfig.select?.(currentSquare);
            }
          }

          const pieceIndex = boardMapCurrent.get(currentSquare)!.index;
          const pieceDiv = pieceRefs[pieceIndex];
          if (pieceDiv && boardConfig.draggable.enabled) {
            const position = translateToPixels(pieceDiv.style.transform);
            const r = pieceDiv.getBoundingClientRect();
            if (position) {
              const offsetX =
                position[0] +
                eventType.clientX -
                r.left -
                boardConfig.squareSize / 2;
              const offsetY =
                position[1] +
                eventType.clientY -
                r.top -
                boardConfig.squareSize / 2;
              lastOffset = [offsetX, offsetY];
              if (
                boardConfig.draggable.distance === 0 ||
                (boardConfig.draggable.autoDistance && lastMoveType === 'drag')
              ) {
                pieceDiv.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
              }
            }
            pieceDiv.classList.add('drag');

            if (ghostEl) {
              const t = notationToTranslate(
                currentSquare,
                boardConfig.squareSize,
                boardConfig.orientation
              );
              ghostEl.style.visibility = 'visible';
              ghostEl.style.transform = t;

              if (ghostEl.classList.length > 2) {
                ghostEl.classList.replace(
                  ghostEl.classList[1],
                  pieceDiv.classList[1]
                );
                ghostEl.classList.replace(
                  ghostEl.classList[2],
                  pieceDiv.classList[2]
                );
              } else {
                ghostEl.classList.add(pieceDiv.classList[1]);
                ghostEl.classList.add(pieceDiv.classList[2]);
              }
            }
          }
        } else if (boardMapFuture.has(currentSquare)) {
          isDragging = true;
          isSelect = true;

          const selectedPieceTranslate = notationToTranslate(
            currentSquare,
            boardConfig.squareSize,
            boardConfig.orientation
          );

          if (lastAnimation) lastAnimation.cancel();
          const pieceData = boardMapFuture.get(currentSquare);
          if (pieceData) {
            const { index, role, color } = pieceData;
            selectedPiece = { index, role, color, square: currentSquare };
            boardConfig.selected = currentSquare;
            eventsConfig.select?.(currentSquare);

            if (ghostEl) {
              ghostEl.style.visibility = 'visible';
              ghostEl.style.transform = selectedPieceTranslate;
              if (ghostEl.classList.length > 2) {
                ghostEl.classList.replace(ghostEl.classList[1], color);
                ghostEl.classList.replace(ghostEl.classList[2], role);
              } else {
                ghostEl.classList.add(color);
                ghostEl.classList.add(role);
              }
            }
            pieceRefs[index]?.classList.add('drag');
          }
        } else {
          selectedPiece = null;
          isSelect = false;
          boardConfig.selected = '';
        }
      }
    } else if (selectedPiece) {
      const fromSquare = selectedPiece.square;
      const toSquare = currentSquare;
      const toTranslate = notationToTranslate(
        currentSquare,
        boardConfig.squareSize,
        boardConfig.orientation
      );
      const pieceIndex = boardMapCurrent.get(fromSquare)!.index;
      const pieceDiv = pieceRefs[pieceIndex];

      selectedPiece = null;
      isSelect = false;

      if (canMove) {
        let moveOrCastle: { from: string; to: string; render?: boolean }[] = [];
        const resultCastle = tryAutoCastle(
          fromSquare,
          toSquare,
          boardMapFuture
        );

        if (boardConfig.autoCastle && resultCastle.castle) {
          moveOrCastle = [
            resultCastle.move,
            { from: '', to: '' },
            { from: '', to: '' },
            resultCastle.rookMove,
          ];
        } else {
          moveOrCastle = [{ from: fromSquare, to: toSquare }];
        }

        const captured = boardMapFuture.get(toSquare);
        const capturedPiece = captured
          ? { color: captured.color, role: captured.role }
          : null;

        boardConfig.events.beforeMove?.(fromSquare, toSquare, capturedPiece);

        moveOrCastle.forEach(({ from, to, render }) => {
          if (from && to) {
            if (render !== false) {
              movePieceOnBoard(from, to, {
                boardMap: boardMapFuture,
                boardMapIndex: boardMapIndexFuture,
                freeIndexes,
              });
            }
          }
        });

        boardConfig.events.move?.(fromSquare, toSquare, capturedPiece);
        boardConfig.events.change?.();
        boardConfig.movable.events.after?.(fromSquare, toSquare);

        if (
          boardConfig.animation.enabled &&
          boardConfig.animation.duration > 70
        ) {
          if (lastAnimation) lastAnimation.cancel();
          const currentAnimation = animateMove(
            boardMapCurrent,
            boardMapIndexCurrent,
            freeIndexes,
            pieceRefs,
            ghostAnimate1,
            ghostAnimate2,
            ghostAnimate3,
            warpAnimateEl,
            moveOrCastle,
            boardConfig.squareSize,
            boardConfig.orientation,
            boardConfig.animation,
            () => {
              lastAnimation = null;
            },
            () => {
              lastAnimation = null;
            }
          );
          lastAnimation = currentAnimation;
        } else {
          moveOrCastle.forEach(({ from, to }) => {
            if (from && to) {
              if (pieceDiv) pieceDiv.style.transform = toTranslate;
              movePieceOnBoard(from, to, {
                boardMap: boardMapCurrent,
                boardMapIndex: boardMapIndexCurrent,
                freeIndexes,
              });
            }
          });
        }

        if (ghostEl) {
          ghostEl.style.visibility = 'hidden';
          ghostEl.style.transform = toTranslate;
        }
        boardConfig.turnColor =
          boardConfig.turnColor === 'white' ? 'black' : 'white';
        boardConfig.movable.dests = new Map<string, string[]>();
        boardConfig.selected = '';
        boardConfig.check = '';
        boardConfig.lastMove = [fromSquare, toSquare];
        boardConfig.lastMove2 = ['', ''];
        boardConfig.lastMove3 = ['', ''];
      }
    }
  }

  function handleMouseMove(event: any) {
    let eventType: MouseEvent | Touch;
    if (event.type === 'mousemove') {
      eventType = event as MouseEvent;
    } else {
      eventType = (event as TouchEvent).touches[0];
    }

    if (boardConfig.draggable.enabled && selectedPiece) {
      const draggedIndexPiece = selectedPiece.index;
      const pieceDiv = pieceRefs[draggedIndexPiece];
      if (!pieceDiv) return;

      const position = translateToPixels(pieceDiv.style.transform);
      if (!position) return;

      const rect = pieceDiv.getBoundingClientRect();

      if (isDragging) {
        const offsetX =
          position[0] +
          eventType.clientX -
          rect.left -
          boardConfig.squareSize / 2;
        const offsetY =
          position[1] +
          eventType.clientY -
          rect.top -
          boardConfig.squareSize / 2;

        if (distancePassed) {
          pieceDiv.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        } else {
          if (
            Math.hypot(lastOffset[0] - offsetX, lastOffset[1] - offsetY) >
              boardConfig.draggable.distance ||
            (boardConfig.draggable.autoDistance && lastMoveType === 'drag')
          ) {
            pieceDiv.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            distancePassed = true;
          }
        }
      }
    }
  }

  function handleMouseUp() {
    if (!isDragging || !selectedPiece) return;

    const { index, square } = selectedPiece;
    const pieceDiv = pieceRefs[index];
    if (!pieceDiv) return;

    const position = translateToPixels(pieceDiv.style.transform);
    if (!position) return;

    const fromSquare = square;
    const normalCoords = normalizePixels(
      position[0] + boardConfig.squareSize / 2,
      position[1] + boardConfig.squareSize / 2,
      boardConfig.squareSize
    );
    const toSquare = pixelsToNotation(
      normalCoords,
      boardConfig.squareSize,
      boardConfig.orientation
    );
    const fromTranslate = notationToTranslate(
      square,
      boardConfig.squareSize,
      boardConfig.orientation
    );
    const toTranslate = pixelsToTranslate(normalCoords);

    const isPieceOffBoard =
      position[0] < -boardConfig.squareSize / 2 ||
      position[1] < -boardConfig.squareSize / 2 ||
      position[0] > boardConfig.squareSize * 7 + boardConfig.squareSize / 2 ||
      position[1] > boardConfig.squareSize * 7 + boardConfig.squareSize / 2;

    if (isPieceOffBoard) {
      if (boardConfig.draggable.deleteOnDropOff) {
        const existingFuture = boardMapFuture.get(fromSquare);
        const existingCurrent = boardMapCurrent.get(fromSquare);

        if (existingFuture) boardMapIndexFuture.delete(existingFuture.index);
        if (existingCurrent) boardMapIndexCurrent.delete(existingCurrent.index);

        boardMapFuture.delete(fromSquare);
        boardMapCurrent.delete(fromSquare);
      }

      if (ghostEl) {
        ghostEl.style.visibility = 'hidden';
        ghostEl.style.transform = toTranslate;
      }
      pieceDiv.style.transform = fromTranslate;

      selectedPiece = null;
      boardConfig.selected = '';
      isSelect = false;
    } else {
      pieceDiv.style.transform = toTranslate;

      if (fromSquare === toSquare) {
        if (!isSelect) {
          selectedPiece = null;
          boardConfig.selected = '';
          boardConfig.premovable.dests = [];
        }
      } else {
        if (
          boardConfig.premovable.dests &&
          boardConfig.premovable.dests.length > 0 &&
          boardConfig.premovable.dests.includes(toSquare)
        ) {
          boardConfig.premovable.current = [fromSquare, toSquare];
          boardConfig.premovable.dests = [];
          boardConfig.premovable.events.set?.(fromSquare, toSquare);
        }

        const isMovableSelectedColor =
          boardConfig.movable.color === 'both' ||
          (boardConfig.movable.color === selectedPiece.color &&
            boardConfig.turnColor === selectedPiece.color);

        const canMove =
          boardConfig.movable.free === true ||
          (isMovableSelectedColor &&
            boardConfig.movable.dests?.get(fromSquare)?.includes(toSquare));

        if (!canMove) {
          if (ghostEl) {
            ghostEl.style.visibility = 'hidden';
            ghostEl.style.transform = toTranslate;
          }
          pieceDiv.style.transform = fromTranslate;

          selectedPiece = null;
          boardConfig.selected = '';
          isSelect = false;
        } else {
          if (lastAnimation) lastAnimation.cancel();
          if (lastAnimation && typeof lastAnimation.cancel === 'function') {
            lastAnimation.cancel();
          }

          let moveOrCastle: { from: string; to: string; render?: boolean }[] =
            [];
          const resultCastle = tryAutoCastle(
            fromSquare,
            toSquare,
            boardMapFuture
          );

          if (boardConfig.autoCastle && resultCastle.castle) {
            moveOrCastle = [
              resultCastle.move,
              { from: '', to: '' },
              { from: '', to: '' },
              resultCastle.rookMove,
            ];
          } else {
            moveOrCastle = [{ from: fromSquare, to: toSquare }];
          }

          const captured = boardMapFuture.get(toSquare);
          const capturedPiece = captured
            ? { color: captured.color, role: captured.role }
            : null;

          boardConfig.events.beforeMove?.(fromSquare, toSquare, capturedPiece);

          moveOrCastle.forEach(({ from, to, render }) => {
            if (from && to) {
              if (render !== false) {
                movePieceOnBoard(from, to, {
                  boardMap: boardMapFuture,
                  boardMapIndex: boardMapIndexFuture,
                  freeIndexes: freeIndexes,
                });
              }
            }
            boardMapCurrent = new Map(boardMapFuture);
            boardMapIndexCurrent = new Map(boardMapIndexFuture);
          });

          boardConfig.events.move?.(fromSquare, toSquare, capturedPiece);
          boardConfig.events.change?.();
          boardConfig.movable.events.after?.(fromSquare, toSquare);

          selectedPiece = null;
          isSelect = false;
          lastMoveType = 'drag';

          boardConfig.turnColor =
            boardConfig.turnColor === 'white' ? 'black' : 'white';
          boardConfig.movable.dests = new Map<string, string[]>();
          boardConfig.premovable.dests = [];
          boardConfig.selected = '';
          boardConfig.check = '';
          boardConfig.lastMove = [fromSquare, toSquare];
          boardConfig.lastMove2 = ['', ''];
          boardConfig.lastMove3 = ['', ''];

          if (ghostEl) {
            ghostEl.style.visibility = 'hidden';
            ghostEl.style.transform = toTranslate;
          }
        }
      }
    }

    pieceDiv.classList.remove('drag');
    isDragging = false;
  }

  function handleTouchStart(event: any) {
    handleMouseDown(event);
  }
  function handleTouchMove(event: any) {
    handleMouseMove(event);
  }
  function handleTouchEnd() {
    handleMouseUp();
  }

  function wrap(container: HTMLElement) {
    return render(
      container,
      boardConfig,
      boardMapIndexFuture,
      boardMapFuture,
      pieceRefs,
      handleMouseDown,
      handleTouchStart
    );
  }

  return {
    wrap,
    getConfig: () => boardConfig,
    getPieceRefs: () => pieceRefs,
  };
}
