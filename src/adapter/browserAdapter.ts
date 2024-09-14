import { PlatformAdapter } from "../types";
import { ImageLoadError } from "../errors";

export class BrowserAdapter implements PlatformAdapter {
  async loadImage(
    imageSource: string | HTMLImageElement,
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (typeof imageSource === "string") {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSource;
        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(
            new ImageLoadError(`Failed to load image from URL: ${imageSource}`),
          );
      } else if (imageSource instanceof HTMLImageElement) {
        resolve(imageSource);
      } else {
        reject(
          new ImageLoadError(
            "Invalid image source. Please provide a valid URL or an HTMLImageElement.",
          ),
        );
      }
    });
  }

  prepareCanvas(img: HTMLImageElement): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
  } {
    const maxSize = 1000;
    let { width, height } = img;

    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context from canvas");
    }
    ctx.drawImage(img, 0, 0, width, height);
    return { canvas, ctx };
  }
}
