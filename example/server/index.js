import path from "path";
import fs from "fs";
import multer from "multer";
import express from "express";

import { createColorExtractor } from "../../dist/node.js";

const port = 3000;
const app = express();
function ensureUploadDirExists(uploadDir) {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
}

function initMulter(uploadDir) {
  return multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // 파일 확장자를 유지
      },
    }),
  });
}

async function handleFileUpload(req, res) {
  try {
    const colorExtractor = await createColorExtractor();
    const { colors, dominantColor } = await colorExtractor.extractColors({
      imageSource: req.file.path,
      k: 10,
      sampleRate: 0.1,
      onFilterSimilarColors: false,
      useHex: true,
    });
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("Failed to delete file:", err);
      }
    });
    res.json({ colors, dominantColor });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Error processing image");
  }
}

const uploadDir = "uploads";
ensureUploadDirExists(uploadDir);
const upload = initMulter(uploadDir);

app.post("/upload", upload.single("image"), handleFileUpload);
app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
