const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Directories and file paths
const imagesDir = path.join(__dirname, "images");
const orderFilePath = path.join(__dirname, "imageOrder.json");

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Ensure directories and files exist
function ensureFiles() {
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }
    if (!fs.existsSync(orderFilePath)) {
        fs.writeFileSync(orderFilePath, JSON.stringify([]));
    }
}

// Endpoint to get images
app.get("/images", (req, res) => {
    ensureFiles();
    fs.readFile(orderFilePath, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Failed to load image order" });
        }
        try {
            const orderedImages = JSON.parse(data);
            res.json(orderedImages);
        } catch (e) {
            res.status(500).json({ error: "Failed to parse image order" });
        }
    });
});

// Endpoint to save image order
app.post("/save-order", (req, res) => {
    const newOrder = req.body.order;
    fs.writeFile(orderFilePath, JSON.stringify(newOrder), (err) => {
        if (err) {
            return res.json({ success: false, message: "Failed to save image order" });
        }
        res.json({ success: true });
    });
});

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Endpoint to handle multiple image uploads
app.post("/upload-multiple", upload.array("imageFiles", 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
    }

    const newImages = req.files.map(file => `/images/${path.basename(file.path)}`);
    
    fs.readFile(orderFilePath, (err, data) => {
        if (err) {
            return res.status(500).json({ message: "Failed to read image order" });
        }
        let currentOrder;
        try {
            currentOrder = JSON.parse(data);
        } catch (e) {
            currentOrder = [];
        }
        const updatedOrder = [...currentOrder, ...newImages];
        fs.writeFile(orderFilePath, JSON.stringify(updatedOrder), (err) => {
            if (err) {
                return res.status(500).json({ message: "Failed to update image order" });
            }
            res.json({ message: `${req.files.length} image(s) uploaded and saved successfully!` });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
