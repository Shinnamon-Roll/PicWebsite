const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Set up storage for images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "images");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Serve static files
app.use(express.static("public"));

// Endpoint for uploading images
app.post("/upload", upload.single("imageFile"), (req, res) => {
    res.json({ message: "Image uploaded successfully!" });
});

// Endpoint to get images
app.get("/images", (req, res) => {
    const dirPath = path.join(__dirname, "images");
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to load images" });
        }
        const imagePaths = files.map(file => `/images/${file}`);
        res.json(imagnoePaths);
    });
});

// Serve the uploaded images
app.use("/images", express.static(path.join(__dirname, "images")));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
