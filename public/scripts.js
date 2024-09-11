document.addEventListener("DOMContentLoaded", function () {
    fetch("/images")  // Assuming the backend serves images via this endpoint
        .then(response => response.json())
        .then(data => {
            const gallery = document.getElementById("gallery");
            data.forEach(imgPath => {
                const imgElement = document.createElement("img");
                imgElement.src = imgPath;
                gallery.appendChild(imgElement);
            });
        });
});
