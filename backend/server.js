// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const documentsRouter = require('./routes/documents');

const app = express();

// CORS (must match exact origins, no trailing slash)
app.use(
  cors({
    origin: [
      'https://file-upload-brown.vercel.app',  
      'https://doc-extraction-ten.vercel.app',  
      'http://localhost:5173',                
    ],
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Document backend is running ✅' });
});

// Documents routes
app.use('/documents', documentsRouter);

// Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
