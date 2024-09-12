const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware to handle JSON
app.use(express.json());

// Serve static files (frontend)
app.use(express.static("public"));

// Store image order in a JSON file
const orderFilePath = path.join(__dirname, "imageOrder.json");

// Ensure the image order file exists
function ensureImageOrderFile() {
    if (!fs.existsSync(orderFilePath)) {
        fs.writeFileSync(orderFilePath, JSON.stringify([]));
    }
}

// Endpoint to get images in saved order
app.get("/images", (req, res) => {
    ensureImageOrderFile();

    fs.readFile(orderFilePath, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Failed to load image order" });
        }

        try {
            const orderedImages = JSON.parse(data);
            res.json(orderedImages);
        } catch (e) {
            res.json([]);
        }
    });
});

// Endpoint to save the new image order
app.post("/save-order", (req, res) => {
    const newOrder = req.body.order;

    fs.writeFile(orderFilePath, JSON.stringify(newOrder), (err) => {
        if (err) {
            return res.json({ success: false, message: "Failed to save image order" });
        }
        res.json({ success: true });
    });
});

// Setup multer for image uploads
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
    }
});
const upload = multer({ storage });

// Endpoint for multiple image uploads
app.post("/upload-multiple", upload.array("imageFiles", 10), (req, res) => {
    if (!req.files) {
        return res.status(400).json({ message: "No files uploaded" });
    }
    res.json({ message: `${req.files.length} image(s) uploaded successfully!` });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
