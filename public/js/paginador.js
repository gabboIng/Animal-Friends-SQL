document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.row.g-5');        // contenedor de cards
    const paginador = document.querySelector('.paginador');  // nav del paginador

    async function cargarPagina(page) {
        // 1. Pedir datos al servidor
        const res = await fetch(`/api/mascotas?page=${page}&limit=6`);
        const data = await res.json();

        // 2. Reconstruir las cards con los nuevos datos del servidor sin recargar la página
        grid.innerHTML = data.mascotas.map(mascota => `
            <div class="col-lg-4 col-md-6 col-sm-12">
                <div class="card card-mascota">
                    <div class="card-img-contenedor">
                        <img src="${mascota.imagen}" class="card-img-top" alt="${mascota.nombre}" onerror="this.src='/img/mascotas.png'">
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${mascota.nombre}</h5>
                        <p class="card-info">${mascota.tipo} · ${mascota.edad} años</p>
                        <p class="card-desc">${mascota.descripcion || ''}</p>
                        <div class="card-botones">
                            <button class="btn-editar" data-id="${mascota._id}" data-nombre="${mascota.nombre}" data-tipo="${mascota.tipo}" data-sexo="${mascota.sexo || ''}" data-edad="${mascota.edad || ''}" data-descripcion="${mascota.descripcion || ''}" data-imagen="${mascota.imagen || ''}" data-adoptado="${mascota.adoptado}">Editar</button>
                            <button class="btn-eliminar" data-id="${mascota._id}">Eliminar</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // 3. Actualizar los botones del paginador (Anterior/Siguiente) según la página actual
        paginador.innerHTML = `
            ${data.hasPrev ? `<a href="#" class="btn-paginador" data-page="${data.prevPage}">← Anterior</a>` : ''}
            <span class="pagina-actual">Página ${data.currentPage} de ${data.totalPages}</span>
            ${data.hasNext ? `<a href="#" class="btn-paginador" data-page="${data.nextPage}">Siguiente →</a>` : ''}
        `;

        // 4. Scroll suave al grid de mascotas (evita saltar al inicio de la página)
        document.querySelector('#mascotas').scrollIntoView({ behavior: 'smooth' });
    }

    // 5. Event delegation para botones de las cards (editar y eliminar)
    grid.addEventListener('click', async (e) => {
        // === BOTÓN ELIMINAR ===
        const btnEliminar = e.target.closest('.btn-eliminar');
        if (btnEliminar) {
            const result = await Swal.fire({
                title: '¿Eliminar mascota?',
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ff4d4d',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (!result.isConfirmed) return;

            const id = btnEliminar.dataset.id;
            const token = localStorage.getItem('token');
            const res = await fetch(`/mascotas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (res.ok) {
                Swal.fire('Eliminado', 'La mascota fue eliminada', 'success');
                const paginaActual = document.querySelector('.pagina-actual');
                const match = paginaActual?.textContent.match(/Página (\d+)/);
                const page = match ? parseInt(match[1]) : 1;
                cargarPagina(page);
            } else {
                Swal.fire('Error', 'No se pudo eliminar la mascota', 'error');
            }
            return;
        }

        // === BOTÓN EDITAR ===
        const btnEditar = e.target.closest('.btn-editar');
        if (btnEditar) {
            document.getElementById('editarId').value = btnEditar.dataset.id;
            document.getElementById('editarNombre').value = btnEditar.dataset.nombre;
            document.getElementById('editarTipo').value = btnEditar.dataset.tipo;
            document.getElementById('editarSexo').value = btnEditar.dataset.sexo;
            document.getElementById('editarEdad').value = btnEditar.dataset.edad;
            document.getElementById('editarDescripcion').value = btnEditar.dataset.descripcion;
            document.getElementById('editarAdoptado').checked = btnEditar.dataset.adoptado === 'true';

            const previewImg = document.getElementById('editarPreview');
            const imgSrc = btnEditar.dataset.imagen;
            previewImg.src = imgSrc || '/img/imagen_De_Perfil.png';
            previewImg.onerror = () => { previewImg.src = '/img/imagen_De_Perfil.png'; };

            document.getElementById('editarImagen').value = '';

            const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
            modal.show();
            return;
        }
    });

    // 6. Guardar cambios del modal editar
    document.getElementById('btnGuardarEditar').addEventListener('click', async () => {
        const id = document.getElementById('editarId').value;
        const token = localStorage.getItem('token');
        const formData = new FormData();

        formData.append('nombre', document.getElementById('editarNombre').value);
        formData.append('tipo', document.getElementById('editarTipo').value);
        formData.append('sexo', document.getElementById('editarSexo').value);
        formData.append('edad', document.getElementById('editarEdad').value);
        formData.append('descripcion', document.getElementById('editarDescripcion').value);
        formData.append('adoptado', document.getElementById('editarAdoptado').checked);

        const imagen = document.getElementById('editarImagen').files[0];
        if (imagen) formData.append('imagen', imagen);

        const res = await fetch(`/mascotas/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
            Swal.fire('Guardado', 'Mascota actualizada', 'success');
            const match = document.querySelector('.pagina-actual')?.textContent.match(/Página (\d+)/);
            cargarPagina(match ? parseInt(match[1]) : 1);
        } else {
            Swal.fire('Error', 'No se pudo actualizar', 'error');
        }
    });

    // 6. Interceptar clics en el paginador (event delegation)
    paginador.addEventListener('click', (e) => {
        e.preventDefault();
        const btn = e.target.closest('[data-page]');
        if (btn) cargarPagina(parseInt(btn.dataset.page));
    });
});