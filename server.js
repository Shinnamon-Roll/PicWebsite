const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Middleware to handle JSON
app.use(express.json());

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

// Serve static files (frontend)
app.use(express.static("public"));

// Endpoint for uploading images
app.post("/upload", upload.single("imageFile"), (req, res) => {
    res.json({ message: "Image uploaded successfully!" });
});

// Endpoint to get images (for frontend to display)
app.get("/images", (req, res) => {
    const dirPath = path.join(__dirname, "images");
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to load images" });
        }
        const imagePaths = files.map(file => `/images/${file}`);
        res.json(imagePaths);
    });
});

// Endpoint to delete an image
app.post("/delete", (req, res) => {
    const imagePath = path.join(__dirname, req.body.path);  // Full path to image

    fs.unlink(imagePath, (err) => {
        if (err) {
            return res.json({ success: false, message: "Failed to delete image" });
        }
        res.json({ success: true });
    });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "admin123") {
        // Send success response
        res.json({ success: true });
    } else {
        // Send failure response
        res.json({ success: false });
    }
});


// Serve the uploaded images
app.use("/images", express.static(path.join(__dirname, "images")));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
