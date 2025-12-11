// services/localOcrService.js
const { createWorker } = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');

exports.extractTextFromImage = async (imagePath) => {
  try {
    // Preprocess with sharp (convert to grayscale + threshold)
    const processedBuffer = await sharp(imagePath)
      .grayscale()
      .threshold(180)
      .toBuffer();

    const worker = await createWorker('eng', 1, {
      logger: m => console.log(`[OCR] ${m.status}: ${m.progress}`),
    });

    const { data } = await worker.recognize(processedBuffer, {
      tessedit_pageseg_mode: 3, // Assume a single column of text
    });

    await worker.terminate();

    return {
      extractedText: data.text.trim(),
    };
  } catch (error) {
    console.error('Tesseract OCR error:', error.message);
    return {
      extractedText: '',
      error: error.message,
    };
  }
};
