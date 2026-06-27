/**
 * Parallax background renderer for Abandoned Ward.
 * Manages layered rendering with different scroll speeds to create depth.
 */

export class ParallaxRenderer {
  constructor() {
    this.layers = [];
  }

  /**
   * Set the layers for parallax rendering.
   * Each layer: { drawFunction, parallaxFactor (0-1), yOffset (default 0) }
   * @param {Array} layerArray
   */
  setLayers(layerArray) {
    this.layers = layerArray.map(layer => ({
      drawFunction: layer.drawFunction,
      parallaxFactor: layer.parallaxFactor || 0,
      yOffset: layer.yOffset || 0
    }));
  }

  /**
   * Add a single layer.
   * @param {Function} drawFunction - function(ctx, offsetX, canvasWidth, canvasHeight)
   * @param {number} parallaxFactor - 0 = static, 1 = full scroll
   * @param {number} yOffset - vertical offset for this layer
   */
  addLayer(drawFunction, parallaxFactor, yOffset = 0) {
    this.layers.push({
      drawFunction,
      parallaxFactor,
      yOffset
    });
  }

  /**
   * Remove all layers.
   */
  clearLayers() {
    this.layers = [];
  }

  /**
   * Render all layers with parallax offset.
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} camera - camera object with x, y properties
   * @param {number} scrollX - current horizontal scroll position
   */
  render(ctx, camera, scrollX) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const offsetX = scrollX * layer.parallaxFactor;

      ctx.save();
      ctx.translate(0, layer.yOffset);

      try {
        layer.drawFunction(ctx, offsetX, canvasWidth, canvasHeight, scrollX);
      } catch (e) {
        // Layer draw function failed silently
      }

      ctx.restore();
    }
  }

  /**
   * Get the number of registered layers.
   * @returns {number}
   */
  get layerCount() {
    return this.layers.length;
  }
}

/**
 * Create a repeating gradient layer function for parallax rendering.
 * @param {CanvasRenderingContext2D} ctx - used to cache gradient
 * @param {Array<string>} colors - array of color stops
 * @param {number} height - height of the gradient area
 * @param {number} factor - parallax factor
 * @returns {object} layer configuration
 */
export function createGradientLayer(colors, height, factor) {
  const drawFunc = (ctx, offsetX, canvasWidth, canvasHeight) => {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    for (let i = 0; i < colors.length; i++) {
      const stop = i / (colors.length - 1);
      grad.addColorStop(stop, colors[i]);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasWidth, height);
  };

  return {
    drawFunction: drawFunc,
    parallaxFactor: factor,
    yOffset: 0
  };
}

/**
 * Create a tiled pattern layer for parallax scrolling.
 * Draws a repeating tile pattern that scrolls with parallax.
 * @param {Function} tileDrawFunc - function(ctx, tileX, tileY, tileSize) to draw one tile
 * @param {number} tileSize - width/height of a single tile
 * @param {number} factor - parallax factor
 * @param {number} yOffset - vertical position offset
 * @returns {object} layer configuration
 */
export function createTiledLayer(tileDrawFunc, tileSize, factor, yOffset = 0) {
  const drawFunc = (ctx, offsetX, canvasWidth, canvasHeight) => {
    const startX = -Math.floor(offsetX / tileSize) * tileSize - offsetX;
    const y = yOffset;
    for (let x = startX; x < canvasWidth + tileSize; x += tileSize) {
      tileDrawFunc(ctx, x, y, tileSize);
    }
  };

  return {
    drawFunction: drawFunc,
    parallaxFactor: factor,
    yOffset: yOffset
  };
}

/**
 * Create a layer with scattered decorative objects.
 * Objects are drawn at fixed world positions but scroll with parallax.
 * @param {Array} objects - array of { worldX, worldY, drawFunc }
 * @param {number} factor - parallax factor
 * @param {number} yOffset - vertical offset
 * @returns {object} layer configuration
 */
export function createObjectLayer(objects, factor, yOffset = 0) {
  const drawFunc = (ctx, offsetX, canvasWidth, canvasHeight, scrollX) => {
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const screenX = obj.worldX - offsetX;
      if (screenX > -200 && screenX < canvasWidth + 200) {
        obj.drawFunc(ctx, screenX, obj.worldY + yOffset);
      }
    }
  };

  return {
    drawFunction: drawFunc,
    parallaxFactor: factor,
    yOffset: yOffset
  };
}

export default ParallaxRenderer;
