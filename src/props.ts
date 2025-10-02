export interface ChessGameProps {
  id?: string;
  fen?: string;
  orientation?: string;
  turnColor?: string;
  check?: string | boolean;
  lastMove?: [string, string];
  lastMove2?: [string, string];
  lastMove3?: [string, string];
  selected?: string;
  coordinates?: boolean;
  autoCastle?: boolean;
  squareSize?: number;
  animation?: {
    enabled?: boolean;
    duration?: number;
    type?: string;
  };
  movable?: {
    free?: boolean;
    color?: string;
    dests?: Map<string, string[]>;
    showDests?: boolean;
    events?: {
      after?: (orig: string, dest: string) => void;
      afterNewPiece?: (role: string, key: string) => void;
    };
  };
  premovable?: {
    enabled?: boolean;
    showDests?: boolean;
    dests?: string[];
    customDests?: Map<string, string[]>;
    events?: {
      set?: (orig: string, dest: string) => void;
      unset?: () => void;
    };
  };
  draggable?: {
    enabled?: boolean;
    distance?: number;
    autoDistance?: boolean;
    showGhost?: boolean;
    deleteOnDropOff?: boolean;
  };
  events?: {
    beforeMove?: (
      from: string,
      to: string,
      capturedPiece: {
        color: string;
        role: string;
      } | null
    ) => void;
    move?: (
      from: string,
      to: string,
      capturedPiece: {
        color: string;
        role: string;
      } | null
    ) => void;
    moves?: (
      moves: {
        from: string;
        to: string;
        capturedPiece: {
          color: string;
          role: string;
        } | null;
        lastMoveNumber: number;
      }[]
    ) => void;
    change?: () => void;
    select?: (square: string) => void;
  };
}

export interface ChessBoardConfig {
  id: string;
  fen: string;
  orientation: string;
  turnColor: string;
  check: string;
  lastMove: [string, string];
  lastMove2: [string, string];
  lastMove3: [string, string];
  selected: string;
  coordinates: boolean;
  autoCastle: boolean;
  squareSize: number;
  animation: {
    enabled: boolean;
    duration: number;
    type: string;
  };
  movable: {
    free: boolean;
    color: string;
    dests?: Map<string, string[]>;
    showDests: boolean;
    events: {
      after?: (orig: string, dest: string) => void;
      afterNewPiece?: (role: string, key: string) => void;
    };
  };
  premovable: {
    enabled: boolean;
    showDests: boolean;
    dests?: string[];
    customDests?: Map<string, string[]>;
    current?: [string, string];
    events: {
      set?: (orig: string, dest: string) => void;
      unset?: () => void;
    };
  };
  draggable: {
    enabled: boolean;
    distance: number;
    autoDistance: boolean;
    showGhost: boolean;
    deleteOnDropOff: boolean;
  };
  events: {
    beforeMove: (
      from: string,
      to: string,
      capturedPiece: {
        color: string;
        role: string;
      } | null
    ) => void;
    move: (
      from: string,
      to: string,
      capturedPiece: {
        color: string;
        role: string;
      } | null
    ) => void;
    moves: (
      moves: {
        from: string;
        to: string;
        capturedPiece: {
          color: string;
          role: string;
        } | null;
        lastMoveNumber: number;
      }[]
    ) => void;
    change: () => void;
    select: (square: string) => void;
  };
}

export type ChessBoardHandle = {
  set: (config: Partial<ChessGameProps>) => void;
  setPieces: (
    pieces: Map<string, { role: string; color: string } | null>
  ) => void;
  selectSquare: (square: string | null) => void;
  newPiece: (
    piece: {
      color: string;
      role: string;
      promoted?: boolean;
    },
    square: string
  ) => void;
  deletePiece: (square: string) => void;
  playPremove: () => { from: string; to: string } | undefined;
  cancelPremove: () => void;
  move: (fromSquare: string, toSquare: string) => void;
  moves: (
    moves: { from: string; to: string; render?: boolean; lastMove: number }[]
  ) => void;
  cancelMove: () => void;
  stop: () => void;
  toggleOrientation: () => void;
  getOrientation: () => string;
  getPieces: () => Record<string, { color: string; role: string } | null>;
  getFen: () => string;
  getMaterialDiff: () => {
    white: Record<string, number>;
    black: Record<string, number>;
  };
};

export const defaultId = 'default-id';
export const defaultFEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export const defaultOrientation = 'white';
export const defaultTurnColor = 'white';
export const defaultCheck = false;
export const defaultLastMove: [string, string] = ['', ''];
export const defaultLastMove2: [string, string] = ['', ''];
export const defaultLastMove3: [string, string] = ['', ''];
export const defaultSelected = '';
export const defaultCoordinates = true;
export const defaultAutoCastle = true;
export const defaultSquareSize = 60;
export const defaultAnimation = {
  enabled: true,
  duration: 200,
  type: 'normal',
};
export const defaultMovable = {
  free: true,
  color: 'both',
  showDests: true,
  events: {
    after: () => {},
    afterNewPiece: () => {},
  },
};
export const defaultPremovable = {
  enabled: true,
  showDests: true,
  events: {
    set: () => {},
    unset: () => {},
  },
};
export const defaultDraggable = {
  enabled: true,
  distance: 3,
  autoDistance: true,
  showGhost: true,
  deleteOnDropOff: false,
};
export const defaultEvents = {
  beforeMove: () => {},
  move: () => {},
  moves: () => {},
  change: () => {},
  select: () => {},
};
