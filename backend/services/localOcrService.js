// services/localOcrService.js
const { createWorker } = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');

function cleanExtractedText(rawText) {
  return rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line =>
      line.length > 10 &&                    // Skip very short lines
      /[a-zA-Z]/.test(line) &&               // Keep lines with letters
      !/[^a-zA-Z0-9\s,.?!'"/()-]/.test(line) // Remove lines with weird symbols
    )
    .join('\n');
}



exports.extractTextFromImage = async (imagePath) => {
  try {
    // Preprocess with sharp (grayscale + threshold)
    const processedBuffer = await sharp(imagePath)
      .grayscale()
      .threshold(180)
      .toBuffer();

    const worker = await createWorker('eng', 1, {
      logger: m => console.log(`[OCR] ${m.status}: ${m.progress}`),
    });

    const { data } = await worker.recognize(processedBuffer, {
      tessedit_pageseg_mode: 3,
    });

    await worker.terminate();

    const cleanedText = cleanExtractedText(data.text || '');

    return {
      extractedText: cleanedText,
    };
  } catch (error) {
    console.error('Tesseract OCR error:', error.message);
    return {
      extractedText: '',
      error: error.message,
    };
  }
};
