const form = document.getElementById('uploadForm');
const gallery = document.getElementById('gallery');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    await fetch('/upload', {
        method: 'POST',
        body: formData
    });

    form.reset();
    loadImages();
});

async function loadImages() {
    const res = await fetch('/api/images');
    const images = await res.json();

    gallery.innerHTML = '';

    images.forEach(image => {
        const div = document.createElement('div');
        div.className = 'card';

        div.innerHTML = `
            <img src="/images/${image}">
            <a href="/images/${image}" download>Download</a>
        `;

        gallery.appendChild(div);
    });
}

loadImages();
