// backend/services/uploadService.js
const multer = require('multer');
const path = require('path');

// Configure disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);

    cb(null, `${baseName}-${timestamp}${ext}`);
  }
});

// Accept any file for now (we'll restrict later if needed)
const upload = multer({ storage });

module.exports = upload;
