import { ColorExtractor } from "./core";

async function createColorExtractor(
  environment: "browser" | "node" = "browser",
) {
  let adapter;

  if (environment === "browser") {
    const { BrowserAdapter } = await import("./adapter/browserAdapter");
    adapter = new BrowserAdapter();
  } else {
    const { NodeAdapter } = await import("./adapter/nodeAdapter");
    adapter = new NodeAdapter();
  }

  return ColorExtractor.getInstance(adapter);
}

export { createColorExtractor };

if (typeof window !== "undefined") {
  (window as any).createColorExtractor = createColorExtractor;
}
