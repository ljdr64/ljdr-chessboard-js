import { movePieceOnBoard } from './movePieceOnBoard.js';
import { notationToPixels } from './coords.js';
import { validateIndex } from './validations.js';

/**
 * Animates the movement of a chess piece, handling captures and allowing for abrupt cancellation.
 * Converts algebraic notation into pixel-based coordinates depending on board orientation.
 */
export const animateMove = (
  boardMapCurrent: Map<string, { color: string; role: string; index: number }>,
  boardMapIndexCurrent: Map<
    number,
    { color: string; role: string; square: string }
  >,
  freeIndexes: Set<number>,
  pieceRefs: { [key: number]: HTMLDivElement | null },
  ghostAnimateRef1: HTMLDivElement | null,
  ghostAnimateRef2: HTMLDivElement | null,
  ghostAnimateRef3: HTMLDivElement | null,
  warpAnimateRef: HTMLDivElement | null,
  moves: { from: string; to: string; render?: boolean }[],
  squareSize: number,
  orientation: string,
  animation: {
    enabled: boolean;
    duration: number;
    type: 'normal' | 'ghosts' | 'warp';
  },
  onComplete?: () => void,
  onCancel?: () => void
) => {
  const easeMain = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
  const ghostLagCurve = (t: number) => (t < 0.5 ? 2 * t * t : 1 - t);

  const easeGhost1 = (t: number) => easeMain(t) - 0.3 * ghostLagCurve(t);
  const easeGhost2 = (t: number) => easeMain(t) - 0.6 * ghostLagCurve(t);
  const easeGhost3 = (t: number) => easeMain(t) - 0.9 * ghostLagCurve(t);

  // --- SINGLE MOVE ---
  if (moves[0] && moves.length === 1) {
    const fromSquare = moves[0].from;
    const toSquare = moves[0].to;

    const pieceCapturedIndex = boardMapCurrent.get(toSquare)?.index;

    if (boardMapCurrent.has(fromSquare)) {
      const { role, color, index } = boardMapCurrent.get(fromSquare)!;

      if (validateIndex(index)) {
        const pieceDiv = pieceRefs[index];
        if (pieceDiv) {
          if (validateIndex(pieceCapturedIndex)) {
            const capturedPieceDiv = pieceRefs[pieceCapturedIndex!];
            if (capturedPieceDiv) {
              capturedPieceDiv.classList.add('fade');
            }
          }
          pieceDiv.classList.add('animate');

          let startTime: number;
          let animationFrame: number;

          const startPos = notationToPixels(
            fromSquare,
            squareSize,
            orientation
          );
          const endPos = notationToPixels(toSquare, squareSize, orientation);

          const ghostRefs = [
            {
              ref: ghostAnimateRef1,
              class: 'ghost-animate1',
              opacity: '0.8',
              easing: easeGhost1,
            },
            {
              ref: ghostAnimateRef2,
              class: 'ghost-animate2',
              opacity: '0.6',
              easing: easeGhost2,
            },
            {
              ref: ghostAnimateRef3,
              class: 'ghost-animate3',
              opacity: '0.4',
              easing: easeGhost3,
            },
          ];

          ghostRefs.forEach(({ ref, class: className, opacity }) => {
            if (ref) {
              ref.style.visibility = 'visible';
              ref.style.opacity = opacity;
              ref.classList.add(color, role, className);
            }
          });

          if (warpAnimateRef) {
            warpAnimateRef.style.visibility = 'visible';
            warpAnimateRef.classList.add(color, role, 'warp-animate');
          }

          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;

            const progress = (timestamp - startTime) / animation.duration;
            const easedProgress = easeMain(progress);

            if (progress < 1) {
              const newX =
                startPos[0] + (endPos[0] - startPos[0]) * easedProgress;
              const newY =
                startPos[1] + (endPos[1] - startPos[1]) * easedProgress;

              if (animation.type === 'ghosts') {
                ghostRefs.forEach(({ ref, easing }) => {
                  if (ref) {
                    const eased = easing(progress);
                    const gx = startPos[0] + (endPos[0] - startPos[0]) * eased;
                    const gy = startPos[1] + (endPos[1] - startPos[1]) * eased;
                    ref.style.transform = `translate(${gx}px, ${gy}px)`;
                  }
                });
              }

              if (animation.type === 'warp' && warpAnimateRef) {
                warpAnimateRef.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;
                warpAnimateRef.style.opacity = `${progress * progress}`;
                pieceDiv.style.opacity = `${(progress - 1) * (progress - 1)}`;

                if (validateIndex(pieceCapturedIndex)) {
                  const capturedPieceDiv = pieceRefs[pieceCapturedIndex!];
                  if (capturedPieceDiv) {
                    capturedPieceDiv.style.opacity = `${(1 - progress) * 0.3}`;
                  }
                }
              }

              pieceDiv.style.transform = `translate(${newX}px, ${newY}px)`;
              animationFrame = requestAnimationFrame(animate);
            } else {
              movePieceOnBoard(fromSquare, toSquare, {
                boardMap: boardMapCurrent,
                boardMapIndex: boardMapIndexCurrent,
                freeIndexes,
              });

              if (validateIndex(pieceCapturedIndex)) {
                const capturedPieceDiv = pieceRefs[pieceCapturedIndex!];
                if (capturedPieceDiv) capturedPieceDiv.style.display = 'none';
              }

              // reset ghosts
              if (animation.type === 'ghosts') {
                ghostRefs.forEach(({ ref, class: className }) => {
                  if (ref) {
                    ref.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;
                    ref.classList.remove(color, role, className);
                    ref.style.visibility = 'hidden';
                    ref.style.opacity = '';
                  }
                });
              }

              if (animation.type === 'warp' && warpAnimateRef) {
                warpAnimateRef.classList.remove(color, role, 'warp-animate');
                warpAnimateRef.style.visibility = 'hidden';
                warpAnimateRef.style.opacity = '';
              }

              pieceDiv.classList.remove('animate');
              pieceDiv.style.opacity = '';
              pieceDiv.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;

              onComplete?.();
            }
          };

          animationFrame = requestAnimationFrame(animate);

          return {
            moves,
            cancel: () => {
              movePieceOnBoard(fromSquare, toSquare, {
                boardMap: boardMapCurrent,
                boardMapIndex: boardMapIndexCurrent,
                freeIndexes,
              });

              if (validateIndex(pieceCapturedIndex)) {
                const capturedPieceDiv = pieceRefs[pieceCapturedIndex!];
                if (capturedPieceDiv) capturedPieceDiv.style.display = 'none';
              }

              cancelAnimationFrame(animationFrame);

              ghostRefs.forEach(({ ref, class: className }) => {
                if (ref) {
                  ref.classList.remove(color, role, className);
                  ref.style.visibility = 'hidden';
                  ref.style.opacity = '';
                }
              });

              if (warpAnimateRef) {
                warpAnimateRef.classList.remove(color, role, 'warp-animate');
                warpAnimateRef.style.visibility = 'hidden';
                warpAnimateRef.style.opacity = '';
              }

              pieceDiv.classList.remove('animate');
              pieceDiv.style.opacity = '';
              pieceDiv.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;

              onCancel?.();
            },
          };
        }
      }
    }
    return { moves, cancel: () => {} };
  }

  // --- MULTI MOVE ---
  else if (moves.length >= 2) {
    type MoveAnimation = {
      fromSquare: string;
      toSquare: string;
      pieceDiv: HTMLDivElement;
      startPos: [number, number];
      endPos: [number, number];
      capturedPieceDiv?: HTMLDivElement | null;
    };

    const moveAnimations: MoveAnimation[] = [];

    for (const { from: fromSquare, to: toSquare } of moves) {
      if (!fromSquare || !toSquare) continue;

      const fromPiece = boardMapCurrent.get(fromSquare);
      if (!fromPiece) return { moves, cancel: () => {} };

      const { index } = fromPiece;
      if (!validateIndex(index)) return { moves, cancel: () => {} };

      const pieceDiv = pieceRefs[index];
      if (!pieceDiv) return { moves, cancel: () => {} };

      const captured = boardMapCurrent.get(toSquare);
      const capturedPieceDiv =
        captured && validateIndex(captured.index)
          ? pieceRefs[captured.index]
          : undefined;

      if (capturedPieceDiv) capturedPieceDiv.classList.add('fade');
      pieceDiv.classList.add('animate');

      const startPos = notationToPixels(fromSquare, squareSize, orientation);
      const endPos = notationToPixels(toSquare, squareSize, orientation);

      moveAnimations.push({
        fromSquare,
        toSquare,
        pieceDiv,
        startPos,
        endPos,
        capturedPieceDiv: capturedPieceDiv ?? null,
      });
    }

    let sharedStartTime: number | null = null;
    let animationFrameId: number;

    const animateAll = (timestamp: number) => {
      if (sharedStartTime === null) sharedStartTime = timestamp;
      const progress = (timestamp - sharedStartTime) / animation.duration;
      const eased = easeMain(Math.min(progress, 1));

      moveAnimations.forEach(({ pieceDiv, startPos, endPos }) => {
        const newX = startPos[0] + (endPos[0] - startPos[0]) * eased;
        const newY = startPos[1] + (endPos[1] - startPos[1]) * eased;
        pieceDiv.style.transform = `translate(${newX}px, ${newY}px)`;
      });

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateAll);
      } else {
        moveAnimations.forEach(
          ({ fromSquare, toSquare, pieceDiv, endPos, capturedPieceDiv }) => {
            movePieceOnBoard(fromSquare, toSquare, {
              boardMap: boardMapCurrent,
              boardMapIndex: boardMapIndexCurrent,
              freeIndexes,
            });

            if (capturedPieceDiv) capturedPieceDiv.style.display = 'none';

            pieceDiv.classList.remove('animate');
            pieceDiv.style.opacity = '';
            pieceDiv.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;
          }
        );

        onComplete?.();
      }
    };

    animationFrameId = requestAnimationFrame(animateAll);

    return {
      moves,
      cancel: () => {
        cancelAnimationFrame(animationFrameId);

        moveAnimations.forEach(
          ({ fromSquare, toSquare, pieceDiv, endPos, capturedPieceDiv }) => {
            movePieceOnBoard(fromSquare, toSquare, {
              boardMap: boardMapCurrent,
              boardMapIndex: boardMapIndexCurrent,
              freeIndexes,
            });

            if (capturedPieceDiv) capturedPieceDiv.style.display = 'none';

            pieceDiv.classList.remove('animate');
            pieceDiv.style.opacity = '';
            pieceDiv.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;
          }
        );

        onCancel?.();
      },
    };
  }

  return { moves: [], cancel: () => {} };
};
