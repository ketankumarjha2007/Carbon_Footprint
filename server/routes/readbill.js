import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import pdf from "pdf-poppler";
import path from "path";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/read-bill", upload.single("bill"), async (req, res) => {

  try {

    let filePath = req.file.path;

    if (req.file.mimetype === "application/pdf") {

      const options = {
        format: "png",
        out_dir: "uploads",
        out_prefix: "bill",
        page: 1
      };

      await pdf.convert(filePath, options);

      filePath = path.join("uploads", "bill-1.png");

    }

    /* ----------- OCR ----------- */

    const result = await Tesseract.recognize(
      filePath,
      "eng+hin"
    );

    const text = result.data.text;

    console.log("OCR TEXT:", text);
    const match =
      text.match(/(\d+)\s*kwh/i) ||
      text.match(/(\d+)\s*units/i) ||
      text.match(/consumption\s*[:\-]?\s*(\d+)/i) ||
      text.match(/खपत\s*(\d+)/i) ||
      text.match(/कुल\s*खपत\s*(\d+)/i) ||
      text.match(/यूनिट\s*(\d+)/i) ||      
      text.match(/(\d+)\s*यूनिट/i) ||       
      text.match(/निशुल्क\s*यूनिट\s*(\d+)/i);

    let units = 0;

    if (match) {
      units = match[1];
    }

    res.json({
      units,
      extractedText: text
    });

  }
  catch (error) {

    console.error("Bill OCR Error:", error);

    res.status(500).json({
      units: 0,
      message: "Bill reading failed"
    });

  }

});

export default router;