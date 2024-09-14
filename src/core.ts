import { kmeans } from "ml-kmeans";
import chroma from "chroma-js";
import { ColorExtractorError, InvalidInputError } from "./errors";
import {
  PlatformAdapter,
  ExtractColorsOptions,
  ExtractedColorsResult,
  Color,
} from "./types";

export class ColorExtractor {
  private static instance: ColorExtractor;
  private adapter: PlatformAdapter;

  private constructor(adapter: PlatformAdapter) {
    this.adapter = adapter;
  }

  static getInstance(adapter: PlatformAdapter): ColorExtractor {
    if (!ColorExtractor.instance) {
      ColorExtractor.instance = new ColorExtractor(adapter);
    }
    return ColorExtractor.instance;
  }

  async extractColors(
    options: ExtractColorsOptions,
  ): Promise<ExtractedColorsResult> {
    try {
      this.validateInputs(options);

      const img = await this.adapter.loadImage(options.imageSource);
      const { canvas, ctx } = this.adapter.prepareCanvas(img);
      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      const pixels = await this._systematicSamplePixels(
        imageData,
        canvas.width,
        canvas.height,
        options.sampleRate || 0.1,
      );

      const runs = 5;
      let allColors: Color[] = [];
      for (let i = 0; i < runs; i++) {
        const result = kmeans(pixels, options.k || 10, { seed: 42 });
        const colors = this._formatColors(
          result.centroids,
          options.useHex || false,
        );
        if (options.onFilterSimilarColors) {
          const colorRatios = this._calculateColorRatios(
            result.clusters,
            options.k || 10,
          );
          const filteredColors = this._filterSimilarColors(colors, colorRatios);
          allColors.push(...filteredColors);
        } else {
          allColors.push(...colors);
        }
      }

      const stabilizedColors = this._stabilizeColors(allColors);
      const sortedColors = this._sortColorsByRatio(stabilizedColors);
      const dominantColor = this._getDominantColor(sortedColors);

      const colors = sortedColors.slice(1).map((c) => c.rgb);

      return { colors, dominantColor };
    } catch (error) {
      console.error("Error extracting colors:", error);
      if (error instanceof ColorExtractorError) {
        throw error;
      }
      throw new ColorExtractorError(
        "An unexpected error occurred while extracting colors.",
      );
    }
  }

  private validateInputs(options: ExtractColorsOptions): void {
    if (!options.imageSource) {
      throw new InvalidInputError("Image source is required.");
    }

    if (
      options.k !== undefined &&
      (options.k <= 0 || !Number.isInteger(options.k))
    ) {
      throw new InvalidInputError("k must be a positive integer.");
    }

    if (
      options.sampleRate !== undefined &&
      (options.sampleRate <= 0 || options.sampleRate > 1)
    ) {
      throw new InvalidInputError(
        "sampleRate must be a positive number between 0 and 1.",
      );
    }
  }

  private async _systematicSamplePixels(
    imageData: Uint8ClampedArray,
    width: number,
    height: number,
    sampleRate: number,
  ): Promise<number[][]> {
    return new Promise((resolve) => {
      const pixels: number[][] = [];
      const step = Math.round(1 / sampleRate);
      const totalPixels = width * height;
      const batchSize = 10000;

      const processBatch = (start: number) => {
        const end = Math.min(start + batchSize, totalPixels);
        for (let i = start; i < end; i += step) {
          const x = i % width;
          const y = Math.floor(i / width);
          const index = (y * width + x) * 4;
          if (index + 2 < imageData.length) {
            pixels.push([
              imageData[index],
              imageData[index + 1],
              imageData[index + 2],
            ]);
          }
        }

        if (end < totalPixels) {
          setTimeout(() => processBatch(end), 0);
        } else {
          resolve(pixels);
        }
      };

      processBatch(0);
    });
  }

  private _formatColors(centroids: number[][], useHex: boolean): Color[] {
    return centroids.map((centroid) => {
      const rgb = `rgb(${Math.round(centroid[0])}, ${Math.round(centroid[1])}, ${Math.round(centroid[2])})`;
      const hex = chroma(rgb).hex();
      return {
        rgb: useHex ? hex : rgb,
        value: centroid,
      };
    });
  }

  private _calculateColorRatios(clusters: number[], k: number): number[] {
    const clusterSizes = Array(k).fill(0);
    clusters.forEach((clusterIndex) => {
      clusterSizes[clusterIndex]++;
    });
    const total = clusters.length;
    return clusterSizes.map((size) => size / total);
  }

  private _filterSimilarColors(
    colors: Color[],
    colorRatios: number[],
  ): Color[] {
    const filteredColors: Color[] = [];
    const colorThreshold = 20;

    colors.forEach((color, index) => {
      const similarColorIndex = filteredColors.findIndex(
        (existingColor) =>
          chroma.deltaE(color.rgb, existingColor.rgb) < colorThreshold,
      );

      if (similarColorIndex === -1) {
        filteredColors.push({ ...color, ratio: colorRatios[index] });
      } else {
        filteredColors[similarColorIndex].ratio =
          (filteredColors[similarColorIndex].ratio || 0) + colorRatios[index];
      }
    });

    return filteredColors;
  }

  private _stabilizeColors(allColors: Color[]): Color[] {
    const colorMap = new Map<string, Color & { count: number }>();
    allColors.forEach((color) => {
      const key = color.rgb;
      if (!colorMap.has(key)) {
        colorMap.set(key, { ...color, count: 1 });
      } else {
        const existing = colorMap.get(key)!;
        existing.ratio = (existing.ratio || 0) + (color.ratio || 0);
        existing.count += 1;
      }
    });

    return Array.from(colorMap.values()).map((color) => ({
      ...color,
      ratio: (color.ratio || 0) / color.count,
    }));
  }

  private _sortColorsByRatio(colors: Color[]): Color[] {
    return colors.sort(
      (a, b) =>
        (b.ratio || 0) - (a.ratio || 0) ||
        chroma(b.rgb).luminance() - chroma(a.rgb).luminance(),
    );
  }

  private _getDominantColor(sortedColors: Color[]): string {
    return sortedColors[0].rgb;
  }
}
