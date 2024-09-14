import { describe, it, expect } from "vitest";
import { createColorExtractor } from "../main";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("ColorExtractor", () => {
  const colorExtractor = createColorExtractor("node");

  // 테스트 이미지 파일 경로
  const testImagePath = path.join(__dirname, "test.jpeg");

  it("extractColors should return correct number of colors", async () => {
    const result = await colorExtractor.extractColors({
      imageSource: testImagePath,
      k: 4,
      sampleRate: 1,
      onFilterSimilarColors: false,
      useHex: false,
    });

    expect(result.colors).toHaveLength(3); // k - 1, 하나는 dominantColor
    expect(result.dominantColor).toBeDefined();
  });

  it("extractColors should return colors in correct format", async () => {
    const result = await colorExtractor.extractColors({
      imageSource: testImagePath,
      k: 4,
      sampleRate: 1,
      onFilterSimilarColors: false,
      useHex: true,
    });

    expect(result.colors.every((color) => color.startsWith("#"))).toBe(true);
    expect(result.dominantColor.startsWith("#")).toBe(true);
  });

  it("extractColors should filter similar colors when specified", async () => {
    const resultWithoutFiltering = await colorExtractor.extractColors({
      imageSource: testImagePath,
      k: 4,
      sampleRate: 1,
      onFilterSimilarColors: false,
      useHex: false,
    });

    const resultWithFiltering = await colorExtractor.extractColors({
      imageSource: testImagePath,
      k: 4,
      sampleRate: 1,
      onFilterSimilarColors: true,
      useHex: false,
    });

    expect(resultWithFiltering.colors.length).toBeLessThanOrEqual(
      resultWithoutFiltering.colors.length,
    );
  });
});
