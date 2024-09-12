const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware to handle JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static("public"));

// Ensure image directory and order file exist
const imagesDir = path.join(__dirname, "images");
const orderFilePath = path.join(__dirname, "imageOrder.json");

function ensureFiles() {
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }
    if (!fs.existsSync(orderFilePath)) {
        fs.writeFileSync(orderFilePath, JSON.stringify([]));
    }
}

ensureFiles();

// Endpoint to get images in saved order
app.get("/images", (req, res) => {
    fs.readFile(orderFilePath, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Failed to load image order" });
        }

        try {
            const orderedImages = JSON.parse(data);
            res.json(orderedImages.map(img => `/images/${path.basename(img)}`)); // Serve images with proper URL
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

// Endpoint for multiple image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.post("/upload-multiple", upload.array("imageFiles", 10), (req, res) => {
    if (!req.files) {
        return res.status(400).json({ message: "No files uploaded" });
    }
    res.json({ message: `${req.files.length} image(s) uploaded successfully!` });
});

// Endpoint to delete an image
app.post("/delete-image", (req, res) => {
    const imagePath = req.body.path;
    const filePath = path.join(imagesDir, path.basename(imagePath));

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Failed to delete image" });
        }
        res.json({ success: true });
    });
});

app.post("/upload-multiple", upload.array("imageFiles", 10), (req, res) => {
    if (!req.files) {
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
