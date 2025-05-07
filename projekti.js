// Hakee lomakkeet ja tulostusalueet
const form = document.getElementById('upload-form');
const searchForm = document.getElementById('search-form');
const searchResult = document.getElementById('search-result');
const uploadInfo = document.getElementById('upload-info');
const clearButton = document.getElementById('clear-storage-button');
const clearInfo = document.getElementById('clear-info');

// Kuvan lataaminen
form.addEventListener('submit', function (event) {
    event.preventDefault(); // Estää sivun latautumisen uudelleen

    const fileInput = document.getElementById('image-input');
    const imageNameInput = document.getElementById('image-name');
    const file = fileInput.files[0];
    const name = imageNameInput.value.trim();

    if (file && name) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const imageData = e.target.result;

            // Haetaan nykyiset kuvat tai luodaan uusi objekti
            let images = JSON.parse(localStorage.getItem('images')) || {};
            images[name] = imageData;
            localStorage.setItem('images', JSON.stringify(images));

            fileInput.value = '';
            imageNameInput.value = '';

            uploadInfo.textContent = `✅ Kuva "${name}" tallennettu onnistuneesti!`;
            uploadInfo.style.color = "green";
        };

        reader.onerror = function () {
            uploadInfo.textContent = "❌ Kuvan lataaminen epäonnistui.";
            uploadInfo.style.color = "red";
        };

        reader.readAsDataURL(file); // TÄRKEÄ -> kuva muutetaan base64
    } else {
        uploadInfo.textContent = "❌ Täytä molemmat kentät ja valitse kuva.";
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
        resultImage.src = images[query];
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
