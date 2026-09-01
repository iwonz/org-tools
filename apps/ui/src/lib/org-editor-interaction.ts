export type SpatialRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

const rectsIntersect = (first: SpatialRect, second: SpatialRect) =>
  first.x <= second.x + second.width &&
  first.x + first.width >= second.x &&
  first.y <= second.y + second.height &&
  first.y + first.height >= second.y;

const getCellRange = (rect: SpatialRect, cellSize: number) => ({
  maxX: Math.floor((rect.x + rect.width) / cellSize),
  maxY: Math.floor((rect.y + rect.height) / cellSize),
  minX: Math.floor(rect.x / cellSize),
  minY: Math.floor(rect.y / cellSize),
});

const getCellKey = (x: number, y: number) => `${x}:${y}`;

export type SpatialQueryResult<T> = {
  candidateCount: number;
  items: T[];
};

export const createSpatialIndex = <T>(
  items: readonly T[],
  getRect: (item: T) => SpatialRect,
  cellSize = 512,
) => {
  if (!Number.isFinite(cellSize) || cellSize <= 0) {
    throw new Error("Spatial index cell size must be a positive finite number.");
  }

  const rects = items.map(getRect);
  const itemIndexesByCell = new Map<string, number[]>();

  rects.forEach((rect, itemIndex) => {
    const range = getCellRange(rect, cellSize);

    for (let cellY = range.minY; cellY <= range.maxY; cellY += 1) {
      for (let cellX = range.minX; cellX <= range.maxX; cellX += 1) {
        const key = getCellKey(cellX, cellY);
        const itemIndexes = itemIndexesByCell.get(key);

        if (itemIndexes) {
          itemIndexes.push(itemIndex);
        } else {
          itemIndexesByCell.set(key, [itemIndex]);
        }
      }
    }
  });

  return {
    query(rect: SpatialRect): SpatialQueryResult<T> {
      const range = getCellRange(rect, cellSize);
      const candidateIndexes = new Set<number>();

      for (let cellY = range.minY; cellY <= range.maxY; cellY += 1) {
        for (let cellX = range.minX; cellX <= range.maxX; cellX += 1) {
          for (const itemIndex of itemIndexesByCell.get(getCellKey(cellX, cellY)) ?? []) {
            candidateIndexes.add(itemIndex);
          }
        }
      }

      const sortedCandidateIndexes = [...candidateIndexes].sort((first, second) => first - second);

      return {
        candidateCount: sortedCandidateIndexes.length,
        items: sortedCandidateIndexes.flatMap((itemIndex) => {
          const item = items[itemIndex];
          const itemRect = rects[itemIndex];

          return item !== undefined && itemRect && rectsIntersect(itemRect, rect) ? [item] : [];
        }),
      };
    },
    size: items.length,
  };
};

export const createLatestFrameScheduler = <T>({
  cancelFrame,
  onFrame,
  requestFrame,
}: {
  cancelFrame: (frameId: number) => void;
  onFrame: (value: T) => void;
  requestFrame: (callback: () => void) => number;
}) => {
  let frameId: number | null = null;
  let pendingValue: T | undefined;

  const runPending = () => {
    frameId = null;
    if (pendingValue === undefined) return;

    const value = pendingValue;
    pendingValue = undefined;
    onFrame(value);
  };

  return {
    cancel() {
      if (frameId !== null) cancelFrame(frameId);
      frameId = null;
      pendingValue = undefined;
    },
    flush() {
      if (frameId !== null) cancelFrame(frameId);
      runPending();
    },
    schedule(value: T) {
      pendingValue = value;
      if (frameId === null) frameId = requestFrame(runPending);
    },
  };
};
