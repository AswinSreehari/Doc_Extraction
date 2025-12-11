const vision = require('@google-cloud/vision');
const path = require('path');

// Load credentials from the JSON key file
const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, '../config/document-ocr-service.json'), 
});

exports.extractTextFromImage = async (imagePath) => {
  try {
    const [result] = await client.textDetection(imagePath);
    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      return '';
    }
    return detections[0].description.trim(); // first item is full text
  } catch (err) {
    console.error('Vision API OCR error:', err.message);
    throw new Error('Failed to perform OCR on image');
  }
};
