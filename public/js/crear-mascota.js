const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('imagen');
const preview = document.getElementById('preview');

uploadArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
        uploadArea.classList.add('has-image');
    }
});

document.getElementById('formCrearMascota').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('nombre', document.getElementById('nombre').value);
    formData.append('tipo', document.getElementById('tipo').value);
    formData.append('sexo', document.getElementById('sexo').value);
    formData.append('edad', document.getElementById('edad').value);
    formData.append('descripcion', document.getElementById('descripcion').value);
    formData.append('adoptado', document.getElementById('adoptado').checked);

    if (fileInput.files[0]) {
        formData.append('imagen', fileInput.files[0]);
    }

    const token = localStorage.getItem('token');

    try {
        const res = await fetch('/mascotas', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            await Swal.fire({
                title: 'Mascota agregada',
                text: 'La mascota se publicó con éxito',
                icon: 'success',
                confirmButtonColor: '#FF6F61',
                confirmButtonText: 'OK'
            });
            window.location.href = '/';
        } else {
            const msg = document.getElementById('mensaje');
            msg.className = 'alert alert-danger';
            msg.textContent = data.message || 'Error al crear la mascota';
        }
    } catch (err) {
        const msg = document.getElementById('mensaje');
        msg.className = 'alert alert-danger';
        msg.textContent = 'Error de conexión';
    }
});
