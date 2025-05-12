// Hakee lomakkeet ja tulostusalueet
const form = document.getElementById('upload-form');
const searchForm = document.getElementById('search-form');
const searchResult = document.getElementById('search-result');
const uploadInfo = document.getElementById('upload-info');
const clearButton = document.getElementById('clear-storage-button');
const clearInfo = document.getElementById('clear-info');

// Kuvan lataaminen
form.addEventListener('submit', async function (event) {
    event.preventDefault(); // Estää sivun latautumisen uudelleen

    const fileInput = document.getElementById('image-input');
    const imageNameInput = document.getElementById('image-name');
    const file = fileInput.files[0];
    const name = imageNameInput.value.trim();

    if (file && name) {
        try {
            // 1. Haetaan presigned URL Lambda-funktiolta
            const response = await fetch("https://ny71z404e8.execute-api.eu-north-1.amazonaws.com/SignedURL", {
                method: "GET"
            });

            const data = await response.json();
            const { upload_url } = data;

            // 2. Lähetetään kuva suoraan S3:een presigned URLin avulla
            const fileType = file.type;
            const uploadResponse = await fetch(upload_url, {
                method: "PUT",
                headers: {
                    "Content-Type": fileType
                },
                body: file
            });

if (uploadResponse.ok) {
    // Get the tags
    const tagsInput = document.getElementById('image-tags');
    const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    // Send metadata to Lambda
    const metadataResponse = await fetch('https://ofx0bjwtoe.execute-api.eu-north-1.amazonaws.com/UploadMeta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            imageId: data.image_id,
            tags: tags,
            url: upload_url.split('?')[0]  // Clean S3 URL
        })
    });

    if (metadataResponse.ok) {
        uploadInfo.textContent = `✅ Kuva ja metatiedot tallennettu onnistuneesti!`;
        uploadInfo.style.color = "green";

        let images = JSON.parse(localStorage.getItem('images')) || {};
        images[name] = upload_url;
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


// Kuvan haku id:llä
searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    searchImage();
});

function searchImage() {
    const query = document.getElementById('search-input').value.trim();
    const images = JSON.parse(localStorage.getItem('images')) || {};

    searchResult.innerHTML = '';

    if (images[query]) {
        const resultTitle = document.createElement('p');
        resultTitle.textContent = `Löytyi kuva: "${query}"`;

        const resultImage = document.createElement('img');
        resultImage.src = images[query];  // Käytetään S3 URLia
        resultImage.alt = query;

        searchResult.appendChild(resultTitle);
        searchResult.appendChild(resultImage);
    } else {
        const notFound = document.createElement('p');
        notFound.textContent = '❗ Kuvaa ei löytynyt annetulla ID:llä.';
        notFound.style.color = "red";
        searchResult.appendChild(notFound);
    }
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

