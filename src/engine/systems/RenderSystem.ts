import type { PositionComponent } from "../../shared/types";
import type { System, World } from "../World";
import type { EngineComponents, EngineResources } from "../types";

export class RenderSystem implements System<EngineComponents, EngineResources> {
  private readonly staticSpriteCache = new Map<string, HTMLCanvasElement | OffscreenCanvas>();

  execute(world: World<EngineComponents, EngineResources>): void {
    const canvas = world.getResource("canvas");
    const context = world.getResource("context");
    const viewport = world.getResource("viewport");
    const camera = world.getResource("camera");
    const blueprintLibrary = world.getResource("blueprintLibrary");
    const renderStats = world.getResource("renderStats");
    const runtimeMetrics = world.getResource("runtimeMetrics");

    if (
      !canvas ||
      !context ||
      !viewport ||
      !camera ||
      !renderStats ||
      !blueprintLibrary ||
      !runtimeMetrics
    ) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = viewport.background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    renderStats.drawCalls = 0;
    renderStats.visibleEntities = 0;

    const entities = [...world.getEntitiesWith("position", "pixelArt", "renderLayer")].sort(
      (left, right) => {
        const leftLayer = world.getComponent(left, "renderLayer")?.order ?? 0;
        const rightLayer = world.getComponent(right, "renderLayer")?.order ?? 0;

        if (leftLayer !== rightLayer) {
          return leftLayer - rightLayer;
        }

        const leftPosition = world.getComponent(left, "position")?.y ?? 0;
        const rightPosition = world.getComponent(right, "position")?.y ?? 0;
        return leftPosition - rightPosition;
      },
    );

    for (const entity of entities) {
      const position = world.getComponent(entity, "position");
      const pixelArt = world.getComponent(entity, "pixelArt");

      if (!position || !pixelArt) {
        continue;
      }

      if (!this.isVisible(position, pixelArt, viewport, camera)) {
        continue;
      }

      renderStats.visibleEntities += 1;
      renderStats.drawCalls += this.drawPixelArt(
        context,
        world,
        entity,
        position,
        pixelArt,
        camera,
        blueprintLibrary,
      );
    }
  }

  private drawPixelArt(
    context: CanvasRenderingContext2D,
    world: World<EngineComponents, EngineResources>,
    entity: { id: number },
    position: PositionComponent,
    pixelArt: EngineComponents["pixelArt"],
    camera: EngineResources["camera"],
    blueprintLibrary: EngineResources["blueprintLibrary"],
    depth = 0,
  ): number {
    if (depth > 4) {
      return 0;
    }

    let drawCalls = 0;
    let activeColor = "";
    const frame = this.getRenderableFrame(pixelArt);
    const matrix = frame.matrix;
    const height = matrix.length;
    const width = matrix[0]?.length ?? 0;
    const runtimeMetrics = world.getResource("runtimeMetrics");
    const velocity = world.getComponent(entity, "velocity");

    if (
      depth === 0 &&
      runtimeMetrics?.lowPerformanceMode &&
      velocity &&
      velocity.x === 0 &&
      velocity.y === 0
    ) {
      const cached = this.getCachedStaticSprite(pixelArt, frame.frameIndex);
      context.drawImage(
        cached,
        Math.round(position.x - camera.x),
        Math.round(position.y - camera.y),
      );
      return 1;
    }

    for (let row = 0; row < height; row += 1) {
      for (let column = 0; column < width; column += 1) {
        const sourceColumn = pixelArt.flipX ? width - column - 1 : column;
        const sourceRow = pixelArt.flipY ? height - row - 1 : row;
        const colorKey = matrix[sourceRow]?.[sourceColumn];
        if (!colorKey) {
          continue;
        }

        const color = pixelArt.colorMap[colorKey];
        if (!color) {
          continue;
        }

        if (activeColor !== color) {
          context.fillStyle = color;
          activeColor = color;
        }

        context.fillRect(
          Math.round(position.x - camera.x) + column * pixelArt.pixelSize,
          Math.round(position.y - camera.y) + row * pixelArt.pixelSize,
          pixelArt.pixelSize,
          pixelArt.pixelSize,
        );
        drawCalls += 1;
      }
    }

    for (const child of pixelArt.childBlueprints ?? []) {
      const blueprint = blueprintLibrary.get(child.blueprintName);
      if (!blueprint) {
        continue;
      }

      drawCalls += this.drawPixelArt(
        context,
        world,
        entity,
        {
          x: position.x + child.offsetX,
          y: position.y + child.offsetY,
        },
        {
          ...blueprint,
          flipX: child.flipX ?? blueprint.flipX,
          flipY: child.flipY ?? blueprint.flipY,
        },
        camera,
        blueprintLibrary,
        depth + 1,
      );
    }

    return drawCalls;
  }

  private isVisible(
    position: PositionComponent,
    pixelArt: EngineComponents["pixelArt"],
    viewport: EngineResources["viewport"],
    camera: EngineResources["camera"],
  ): boolean {
    const matrix = this.getRenderableFrame(pixelArt).matrix;
    const width = (matrix[0]?.length ?? 0) * pixelArt.pixelSize;
    const height = matrix.length * pixelArt.pixelSize;
    const screenX = position.x - camera.x;
    const screenY = position.y - camera.y;

    return (
      screenX + width >= 0 &&
      screenY + height >= 0 &&
      screenX <= viewport.width &&
      screenY <= viewport.height
    );
  }

  private getRenderableFrame(pixelArt: EngineComponents["pixelArt"]): {
    frameIndex: number;
    matrix: string[][];
  } {
    if (pixelArt.spriteFrames && pixelArt.spriteFrames.length > 0) {
      const frameIndex = Math.floor(performance.now() / 220) % pixelArt.spriteFrames.length;
      return {
        frameIndex,
        matrix: pixelArt.spriteFrames[frameIndex] ?? pixelArt.matrix,
      };
    }

    return {
      frameIndex: 0,
      matrix: pixelArt.matrix,
    };
  }

  private getCachedStaticSprite(
    pixelArt: EngineComponents["pixelArt"],
    frameIndex: number,
  ): HTMLCanvasElement | OffscreenCanvas {
    const signature = `${frameIndex}:${pixelArt.flipX ? "1" : "0"}:${pixelArt.flipY ? "1" : "0"}:${JSON.stringify(pixelArt.colorMap)}:${JSON.stringify(pixelArt.matrix)}:${JSON.stringify(pixelArt.spriteFrames ?? [])}:${pixelArt.pixelSize}`;
    const existing = this.staticSpriteCache.get(signature);
    if (existing) {
      return existing;
    }

    const matrix = this.getRenderableFrame(pixelArt).matrix;
    const width = (matrix[0]?.length ?? 1) * pixelArt.pixelSize;
    const height = matrix.length * pixelArt.pixelSize;
    const surface =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement("canvas"), { width, height });
    const context = surface.getContext("2d");
    if (!context) {
      return surface;
    }

    let activeColor = "";
    for (let row = 0; row < matrix.length; row += 1) {
      for (let column = 0; column < matrix[row].length; column += 1) {
        const sourceColumn = pixelArt.flipX ? matrix[row].length - column - 1 : column;
        const sourceRow = pixelArt.flipY ? matrix.length - row - 1 : row;
        const token = matrix[sourceRow]?.[sourceColumn];
        if (!token) {
          continue;
        }

        const color = pixelArt.colorMap[token];
        if (!color) {
          continue;
        }

        if (activeColor !== color) {
          context.fillStyle = color;
          activeColor = color;
        }

        context.fillRect(
          column * pixelArt.pixelSize,
          row * pixelArt.pixelSize,
          pixelArt.pixelSize,
          pixelArt.pixelSize,
        );
      }
    }

    this.staticSpriteCache.set(signature, surface);
    return surface;
  }
}
