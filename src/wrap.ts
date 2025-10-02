export interface Elements {
  board: HTMLElement;
  container: HTMLElement;
  wrap: HTMLElement;
}

export function renderWrap(element: HTMLElement): Elements {
  element.innerHTML = '';
  element.classList.add('ljdr-wrap');

  const container = document.createElement('ljdr-container');
  element.appendChild(container);

  const board = document.createElement('ljdr-board');
  container.appendChild(board);

  return { board, container, wrap: element };
}
