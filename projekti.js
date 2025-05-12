// Hakee lomakkeet ja tulostusalueet
const form = document.getElementById('upload-form');
const searchForm = document.getElementById('search-form');
const searchResult = document.getElementById('search-result');
const uploadInfo = document.getElementById('upload-info');
const clearButton = document.getElementById('clear-storage-button');
const clearInfo = document.getElementById('clear-info');

// Kuvan lataaminen
form.addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent page reload

    const fileInput = document.getElementById('image-input');
    const imageNameInput = document.getElementById('image-name');
    const file = fileInput.files[0];
    const nameWithoutExt = imageNameInput.value.trim();

    if (file && nameWithoutExt) {
        try {
            // Ensure file extension is included in the image name
            const extension = file.name.split('.').pop();
            const imageName = `${nameWithoutExt}.${extension}`;

            // 1. Request a presigned upload URL
            const response = await fetch(`https://ny71z404e8.execute-api.eu-north-1.amazonaws.com/SignedURL?imageID=${encodeURIComponent(imageName)}`, {
                method: "GET"
            });

            const data = await response.json();
            const { upload_url, image_id } = data;

            // 2. Upload the image directly to S3
            const fileType = file.type;
            const uploadResponse = await fetch(upload_url, {
                method: "PUT",
                headers: {
                    "Content-Type": fileType
                },
                body: file
            });

            if (uploadResponse.ok) {
                // 3. Send metadata (image ID, tags, clean URL) to Lambda
                const tagsInput = document.getElementById('image-tags');
                const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

                const metadataResponse = await fetch('https://ofx0bjwtoe.execute-api.eu-north-1.amazonaws.com/UploadMeta', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageId: image_id,
                        tags: tags,
                        url: upload_url.split('?')[0] // Clean URL
                    })
                });

                if (metadataResponse.ok) {
                    uploadInfo.textContent = `✅ Kuva ja metatiedot tallennettu onnistuneesti!`;
                    uploadInfo.style.color = "green";

                    let images = JSON.parse(localStorage.getItem('images')) || {};
                    images[imageName] = upload_url;
                    localStorage.setItem('images', JSON.stringify(images));

                    fileInput.value = '';
                    imageNameInput.value = '';
                    tagsInput.value = '';
                } else {
                    uploadInfo.textContent = "❌ Kuvan lataus onnistui, mutta metatietojen tallennus epäonnistui.";
                    uploadInfo.style.color = "red";
                }
            } else {
                uploadInfo.textContent = "❌ Kuvan lataaminen epäonnistui.";
                uploadInfo.style.color = "red";
            }
        } catch (error) {
            uploadInfo.textContent = "❌ Virhe kuvan latauksessa.";
            uploadInfo.style.color = "red";
            console.error(error);
        }
    } else {
        uploadInfo.textContent = "❌ Täytä kaikki kentät ja valitse kuva.";
        uploadInfo.style.color = "red";
    }
});



// Kuvan haku id:llä tai tagilla
searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    searchImage();
});

async function searchImage() {
    const query = document.getElementById('search-input').value.trim();
    const searchOption = document.querySelector('input[name="search-option"]:checked').value;
    const apiUrl = 'https://ofx0bjwtoe.execute-api.eu-north-1.amazonaws.com/SearchByTags';  

    searchResult.innerHTML = '';  // Clear previous search results

    if (query) {
        try {
            const searchParams = {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            };

            // Add the correct query parameter based on search option
            const url = searchOption === 'name' 
                ? `${apiUrl}?imageID=${query}`
                : `${apiUrl}?tag=${query}`;

            // Fetch search results
            const response = await fetch(url, searchParams);
            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                data.forEach(item => {
                    const resultTitle = document.createElement('p');
                    resultTitle.textContent = `Kuva: "${item.imageID}"`;

                    const resultImage = document.createElement('img');
                    resultImage.src = item.url;  // URL for image preview
                    resultImage.alt = item.imageID;
                    resultImage.style.maxWidth = '300px'; // Control image size

                    const downloadButton = document.createElement('button');
                    downloadButton.textContent = 'Lataa kuva';
                    downloadButton.addEventListener('click', () => downloadImage(item.url));

                    searchResult.appendChild(resultTitle);
                    searchResult.appendChild(resultImage);
                    searchResult.appendChild(downloadButton);
                });
            } else {
                const notFound = document.createElement('p');
                notFound.textContent = '❗ Kuvaa ei löytynyt.';
                notFound.style.color = "red";
                searchResult.appendChild(notFound);
            }
        } catch (error) {
            const errorMessage = document.createElement('p');
            errorMessage.textContent = `❗ Virhe hakutulosten hakemisessa: ${error.message}`;
            errorMessage.style.color = 'red';
            searchResult.appendChild(errorMessage);
            console.error(error);
        }
    } else {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = '❗ Syötä hakukysely!';
        emptyMessage.style.color = 'red';
        searchResult.appendChild(emptyMessage);
    }
}

// Kuvan lataus
function downloadImage(url) {
    const a = document.createElement('a');
    a.href = url;  // Image URL
    a.download = '';  // Trigger download without specifying a filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// Tyhjennä kaikki kuvat
clearButton.addEventListener('click', function () {
    if (confirm('Haluatko varmasti tyhjentää kaikki tallennetut kuvat?')) {
        localStorage.removeItem('images');
        clearInfo.textContent = '✅ Kaikki kuvat on poistettu!';
        clearInfo.style.color = 'green';
        searchResult.innerHTML = '';
        uploadInfo.innerHTML = '';
    }
});

