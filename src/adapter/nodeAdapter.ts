import fs from "fs";
import * as pureimage from "pureimage";
import { Bitmap } from "pureimage";
import sharp from "sharp";
import tempfile from "tempfile";
import { PlatformAdapter } from "../types";
import { ImageLoadError } from "../errors";

export class NodeAdapter implements PlatformAdapter {
  async loadImage(imageSource: string): Promise<Bitmap> {
    console.log("imageSource", imageSource);
    const tempImagePath = await this._convertToPNG(imageSource);
    const stream = fs.createReadStream(tempImagePath);

    try {
      return await pureimage.decodePNGFromStream(stream);
    } catch (error) {
      console.error(`Error loading image from path: ${imageSource}`, error);
      throw new ImageLoadError(
        "Failed to load image. Please ensure the file is not corrupted and is in PNG or JPG format.",
      );
    }
  }

  private async _convertToPNG(imageSource: string): Promise<string> {
    const pngImagePath = tempfile({ extension: "png" });
    await sharp(imageSource).png().toFile(pngImagePath);
    return pngImagePath;
  }

  prepareCanvas(img: Bitmap): { canvas: any; ctx: any } {
    const maxSize = 1000;
    let { width, height } = img;

    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }

    const canvas = pureimage.make(width, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    return { canvas, ctx };
  }
}
