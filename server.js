const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const imageDir = path.join(__dirname, 'images');

// Create images folder if not exists
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir);
}

// Serve frontend
app.use(express.static('public'));

// Serve images publicly
app.use('/images', express.static(imageDir));

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imageDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Upload route
app.post('/upload', upload.single('image'), (req, res) => {
    res.json({ message: "Upload successful" });
});

// API to list images
app.get('/api/images', (req, res) => {
    const files = fs.readdirSync(imageDir);
    res.json(files);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
