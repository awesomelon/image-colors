declare module "@j-ho/color-extractor" {
  export interface ExtractColorsOptions {
    imageSource: string | HTMLImageElement;
    k?: number;
    sampleRate?: number;
    onFilterSimilarColors?: boolean;
    useHex?: boolean;
  }

  export interface ExtractedColorsResult {
    colors: string[];
    dominantColor: string;
  }

  export class ColorExtractor {
    extractColors(options: ExtractColorsOptions): Promise<ExtractedColorsResult>;
  }

  export function createColorExtractor(environment?: "browser" | "node"): ColorExtractor;
}