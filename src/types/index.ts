import { Bitmap } from "pureimage";

export interface PlatformAdapter {
  loadImage(
    imageSource: string | HTMLImageElement,
  ): Promise<HTMLImageElement | Bitmap>;
  prepareCanvas(img: HTMLImageElement | Bitmap): {
    canvas: HTMLCanvasElement | any;
    ctx: CanvasRenderingContext2D | any;
  };
}

export interface ExtractColorsOptions {
  imageSource: string | HTMLImageElement;
  k?: number;
  sampleRate?: number;
  onFilterSimilarColors?: boolean;
  useHex?: boolean;
}

export interface Color {
  rgb: string;
  value: number[];
  ratio?: number;
  count?: number;
}

export interface ExtractedColorsResult {
  colors: string[];
  dominantColor: string;
}
