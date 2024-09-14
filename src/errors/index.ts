export class ColorExtractorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ColorExtractorError";
  }
}

export class InvalidInputError extends ColorExtractorError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}

export class ImageLoadError extends ColorExtractorError {
  constructor(message: string) {
    super(message);
    this.name = "ImageLoadError";
  }
}
