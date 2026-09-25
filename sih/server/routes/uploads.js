const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'pill-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * @route   POST /api/uploads
 * @desc    Upload medicine / pill photo
 * @access  Public / Private
 */
router.post('/', upload.single('photo'), (req, res) => {
  try {
    if (req.file) {
      const fileUrl = `/uploads/${req.file.filename}`;
      return res.json({ success: true, url: fileUrl });
    }

    // Support base64 payload as fallback for offline sync
    if (req.body.base64) {
      const matches = req.body.base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1].split('/')[1] || 'jpg';
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `pill-${Date.now()}.${ext}`;
        fs.writeFileSync(path.join(uploadDir, filename), buffer);
        return res.json({ success: true, url: `/uploads/${filename}` });
      }
    }

    res.status(400).json({ success: false, message: 'No valid image provided' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Server error processing upload' });
  }
});

module.exports = router;
