export type PixelMatrix = string[][];

export function createMatrix(width: number, height: number, fill = ""): PixelMatrix {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

export function stampMatrix(
  target: PixelMatrix,
  source: PixelMatrix,
  offsetX: number,
  offsetY: number,
): PixelMatrix {
  const result = target.map((row) => [...row]);

  for (let row = 0; row < source.length; row += 1) {
    for (let column = 0; column < source[row].length; column += 1) {
      const targetY = row + offsetY;
      const targetX = column + offsetX;

      if (!result[targetY] || result[targetY][targetX] === undefined) {
        continue;
      }

      result[targetY][targetX] = source[row][column];
    }
  }

  return result;
}

export function mirrorHorizontally(matrix: PixelMatrix): PixelMatrix {
  return matrix.map((row) => [...row].reverse());
}

export function mergeMatrices(left: PixelMatrix, right: PixelMatrix): PixelMatrix {
  return left.map((row, index) => [...row, ...(right[index] ?? [])]);
}

export function replaceToken(
  matrix: PixelMatrix,
  currentToken: string,
  nextToken: string,
): PixelMatrix {
  return matrix.map((row) => row.map((token) => (token === currentToken ? nextToken : token)));
}
