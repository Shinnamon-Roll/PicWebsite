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

// Endpoint to get images in saved order
app.get("/images", (req, res) => {
    fs.readFile(orderFilePath, (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Failed to load image order" });
        }
        const orderedImages = JSON.parse(data);
        res.json(orderedImages);
    });
});

// Endpoint to save the new image order
app.post("/save-order", (req, res) => {
    const newOrder = req.body.order;

    // Save new order in imageOrder.json
    fs.writeFile(orderFilePath, JSON.stringify(newOrder), (err) => {
        if (err) {
            return res.json({ success: false, message: "Failed to save image order" });
        }
        res.json({ success: true });
    });
});

// Endpoint for image uploads (same as before)
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

app.post("/upload", upload.single("imageFile"), (req, res) => {
    res.json({ message: "Image uploaded successfully!" });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
