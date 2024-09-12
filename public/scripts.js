document.addEventListener("DOMContentLoaded", function() {
    fetch("/images")
        .then(response => response.json())
        .then(data => {
            const gallery = document.getElementById("gallery");
            gallery.innerHTML = ""; // Clear gallery
            data.forEach(imgPath => {
                const imgElement = document.createElement("img");
                imgElement.src = imgPath;
                gallery.appendChild(imgElement);
            });
        })
        .catch(error => console.error('Error loading images:', error));
});
