package main

import (
    "fmt"
    "io"
    "net/http"
    "encoding/json"
    "io/ioutil"
    "net/http"
    "os"
    "path/filepath"
    "github.com/gorilla/mux"
    "github.com/gorilla/handlers"
)

var imagesDir = "./images"
var orderFilePath = "./imageOrder.json"

func handler(w http.ResponseWriter, r *http.Request) {
    io.WriteString(w, "Hello, World!")
}

func main() {
    http.HandleFunc("/", handler)
    http.ListenAndServe(":8080", nil)
}

func ensureFiles() {
    if _, err := os.Stat(imagesDir); os.IsNotExist(err) {
        os.Mkdir(imagesDir, os.ModePerm)
    }
    if _, err := os.Stat(orderFilePath); os.IsNotExist(err) {
        ioutil.WriteFile(orderFilePath, []byte("[]"), 0644)
    }
}

func getImagesHandler(w http.ResponseWriter, r *http.Request) {
    ensureFiles()
    data, err := ioutil.ReadFile(orderFilePath)
    if err != nil {
        http.Error(w, "Failed to load image order", http.StatusInternalServerError)
        return
    }
    var orderedImages []string
    if err := json.Unmarshal(data, &orderedImages); err != nil {
        http.Error(w, "Failed to parse image order", http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(orderedImages)
}

func saveOrderHandler(w http.ResponseWriter, r *http.Request) {
    var newOrder []string
    if err := json.NewDecoder(r.Body).Decode(&newOrder); err != nil {
        http.Error(w, "Failed to parse order", http.StatusBadRequest)
        return
    }
    data, err := json.Marshal(newOrder)
    if err != nil {
        http.Error(w, "Failed to encode order", http.StatusInternalServerError)
        return
    }
    if err := ioutil.WriteFile(orderFilePath, data, 0644); err != nil {
        http.Error(w, "Failed to save image order", http.StatusInternalServerError)
        return
    }
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"success": true}`))
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
    if err := r.ParseMultipartForm(10 << 20); err != nil {
        http.Error(w, "Failed to parse form", http.StatusBadRequest)
        return
    }

    files := r.MultipartForm.File["imageFiles"]
    var newImages []string
    for _, file := range files {
        filePath := filepath.Join(imagesDir, file.Filename)
        src, err := file.Open()
        if err != nil {
            http.Error(w, "Failed to open file", http.StatusInternalServerError)
            return
        }
        dst, err := os.Create(filePath)
        if err != nil {
            http.Error(w, "Failed to save file", http.StatusInternalServerError)
            return
        }
        if _, err := io.Copy(dst, src); err != nil {
            http.Error(w, "Failed to copy file", http.StatusInternalServerError)
            return
        }
        src.Close()
        dst.Close()
        newImages = append(newImages, "/images/"+file.Filename)
    }

    // Read existing order
    existingOrderData, err := ioutil.ReadFile(orderFilePath)
    if err != nil {
        http.Error(w, "Failed to read image order", http.StatusInternalServerError)
        return
    }
    var existingOrder []string
    if err := json.Unmarshal(existingOrderData, &existingOrder); err != nil {
        existingOrder = []string{}
    }

    // Append new images
    updatedOrder := append(existingOrder, newImages...)
    updatedOrderData, err := json.Marshal(updatedOrder)
    if err != nil {
        http.Error(w, "Failed to encode image order", http.StatusInternalServerError)
        return
    }
    if err := ioutil.WriteFile(orderFilePath, updatedOrderData, 0644); err != nil {
        http.Error(w, "Failed to save image order", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.Write([]byte(`{"message": "Images uploaded successfully!"}`))
}

func deleteImageHandler(w http.ResponseWriter, r *http.Request) {
    var requestData struct {
        Path string `json:"path"`
    }
    if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
        http.Error(w, "Failed to parse request", http.StatusBadRequest)
        return
    }

    // Remove file
    if err := os.Remove(filepath.Join(imagesDir, filepath.Base(requestData.Path))); err != nil {
        http.Error(w, "Failed to delete image", http.StatusInternalServerError)
        return
    }

    // Remove from order
    existingOrderData, err := ioutil.ReadFile(orderFilePath)
    if err != nil {
        http.Error(w, "Failed to read image order", http.StatusInternalServerError)
        return
    }
    var existingOrder []string
    if err := json.Unmarshal(existingOrderData, &existingOrder); err != nil {
        http.Error(w, "Failed to parse image order", http.StatusInternalServerError)
        return
    }
    updatedOrder := []string{}
    for _, img := range existingOrder {
        if img != requestData.Path {
            updatedOrder = append(updatedOrder, img)
        }
    }
    updatedOrderData, err := json.Marshal(updatedOrder)
    if err != nil {
        http.Error(w, "Failed to encode image order", http.StatusInternalServerError)
        return
    }
    if err := ioutil.WriteFile(orderFilePath, updatedOrderData, 0644); err != nil {
        http.Error(w, "Failed to save image order", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.Write([]byte(`{"success": true}`))
}

func main() {
    r := mux.NewRouter()
    r.HandleFunc("/images", getImagesHandler).Methods("GET")
    r.HandleFunc("/save-order", saveOrderHandler).Methods("POST")
    r.HandleFunc("/upload-multiple", uploadHandler).Methods("POST")
    r.HandleFunc("/delete-image", deleteImageHandler).Methods("POST")
    
    staticFileServer := http.FileServer(http.Dir("./public"))
    r.PathPrefix("/public/").Handler(http.StripPrefix("/public/", staticFileServer))
    
    http.Handle("/", r)
    http.ListenAndServe(":3000", handlers.CORS()(r))
}
