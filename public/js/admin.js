document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    let usuario = null;
    try { usuario = JSON.parse(localStorage.getItem('usuario') || 'null'); } catch (e) {}

    if (!token || !usuario || usuario.rol !== 'admin') {
        await Swal.fire({ title: 'Acceso restringido', text: 'Solo administradores.', icon: 'warning', confirmButtonText: 'Entendido' });
        window.location.href = '/login';
        return;
    }

    const tbody = document.getElementById('tbodyUsuarios');
    const paginacion = document.getElementById('paginacion');
    const paginacionInfo = document.getElementById('paginacionInfo');
    const paginacionBotones = document.getElementById('paginacionBotones');
    const modalVer = new bootstrap.Modal(document.getElementById('modalVer'));
    const modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));

    const POR_PAGINA = 5;
    let paginaActual = 1;
    let usuariosData = [];

    const AVATAR_COLORS = ['#6d28d9','#0369a1','#b45309','#059669','#dc2626','#7c3aed','#0891b2','#ca8a04','#16a34a','#e11d48','#4f46e5','#0d9488','#c2410c','#9333ea','#2563eb'];

    function colorAvatar(nombre) {
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
    }

    function iniciales(nombre, apellido) {
        return ((nombre || '')[0] || '') + ((apellido || '')[0] || '');
    }

    function formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function badgeRol(rol) {
        const esAdmin = rol === 'admin';
        return `<span class="badge-rol ${esAdmin ? 'badge-rol-admin' : 'badge-rol-usuario'}">${esAdmin ? 'Administrador' : 'Usuario'}</span>`;
    }

    function resumenMascotas(publicadas, adoptadas) {
        const partes = [];
        if (publicadas > 0) partes.push(`<span class="resumen-linea"><strong>${publicadas}</strong> publicada${publicadas > 1 ? 's' : ''}</span>`);
        if (adoptadas > 0) partes.push(`<span class="resumen-linea"><strong>${adoptadas}</strong> adoptada${adoptadas > 1 ? 's' : ''}</span>`);
        if (partes.length === 0) return '<span class="resumen-vacio">Sin actividad</span>';
        return `<div class="resumen-mascotas">${partes.join('')}</div>`;
    }

    function esAdmin(u) { return u.rol === 'admin'; }

    // --- Cargar y renderizar ---
    async function cargarUsuarios() {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5"><i class="fa-solid fa-spinner fa-spin-pulse me-2"></i>Cargando usuarios...</td></tr>';

        const res = await fetch('/admin/api/usuarios', { headers: { Authorization: 'Bearer ' + token } });

        if (res.status === 401 || res.status === 403) {
            await Swal.fire({ title: 'Sesión expirada', text: 'Inicia sesión como administrador.', icon: 'error', confirmButtonText: 'Ir al login' });
            window.location.href = '/login';
            return;
        }

        if (!res.ok) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-5">No se pudieron cargar los usuarios.</td></tr>';
            return;
        }

        const { data } = await res.json();
        usuariosData = data;
        paginaActual = 1;
        renderizar();
    }

    function renderizar() {
        const total = usuariosData.length;
        const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
        if (paginaActual > totalPaginas) paginaActual = totalPaginas;

        const inicio = (paginaActual - 1) * POR_PAGINA;
        const pagina = usuariosData.slice(inicio, inicio + POR_PAGINA);

        if (total === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">No hay usuarios registrados.</td></tr>';
            paginacion.hidden = true;
            return;
        }

        tbody.innerHTML = pagina.map((u) => {
            const esPropia = u.id === usuario.id;
            const pub = u.mascotas_publicadas?.length || 0;
            const adp = u.mascotas_adoptadas?.length || 0;
            const color = colorAvatar(u.nombre);
            const ini = iniciales(u.nombre, u.apellido);

            return `
                <tr>
                    <td>
                        <div class="usuario-celda">
                            <div class="avatar" style="background:${color}">${ini}</div>
                            <div class="usuario-info">
                                <span class="usuario-nombre">${u.nombre} ${u.apellido}</span>
                                <span class="usuario-id">ID: #USR-${String(u.id).padStart(4, '0')}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="contacto-celda">
                            <span class="contacto-email">${u.email}</span>
                            <span class="contacto-telefono">${u.telefono || 'Sin teléfono'}</span>
                        </div>
                    </td>
                    <td>${badgeRol(u.rol)}</td>
                    <td>${resumenMascotas(pub, adp)}</td>
                    <td><span class="fecha-registro">${formatearFecha(u.createdAt)}</span></td>
                    <td>
                        <div class="acciones-celda">
                            <button class="btn-accion btn-ver" data-id="${u.id}" title="Ver detalle">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button class="btn-accion btn-editar" data-id="${u.id}" title="Editar usuario">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn-accion btn-eliminar" data-id="${u.id}" data-nombre="${u.nombre}" ${esPropia ? 'disabled title="No puedes eliminar tu cuenta"' : 'title="Eliminar usuario"'}>
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        // Paginación
        paginacion.hidden = totalPaginas <= 1;
        const desde = inicio + 1;
        const hasta = Math.min(inicio + POR_PAGINA, total);
        paginacionInfo.textContent = `Mostrando ${desde} a ${hasta} de ${total} usuarios`;

        let botones = '';
        botones += `<li class="page-item ${paginaActual === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-pag="${paginaActual - 1}">Anterior</a></li>`;
        for (let i = 1; i <= totalPaginas; i++) {
            botones += `<li class="page-item ${i === paginaActual ? 'active' : ''}"><a class="page-link" href="#" data-pag="${i}">${i}</a></li>`;
        }
        botones += `<li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}"><a class="page-link" href="#" data-pag="${paginaActual + 1}">Siguiente</a></li>`;
        paginacionBotones.innerHTML = botones;

        // Eventos de paginación
        paginacionBotones.querySelectorAll('.page-link').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const p = parseInt(link.dataset.pag, 10);
                if (p >= 1 && p <= totalPaginas) { paginaActual = p; renderizar(); }
            });
        });

        // Eventos de acciones
        tbody.querySelectorAll('.btn-ver').forEach((btn) => {
            btn.addEventListener('click', () => verUsuario(parseInt(btn.dataset.id)));
        });

        tbody.querySelectorAll('.btn-editar').forEach((btn) => {
            btn.addEventListener('click', () => editarUsuario(parseInt(btn.dataset.id)));
        });

        tbody.querySelectorAll('.btn-eliminar:not([disabled])').forEach((btn) => {
            btn.addEventListener('click', () => eliminarUsuario(parseInt(btn.dataset.id), btn.dataset.nombre));
        });
    }

    // --- Ver detalle ---
    async function verUsuario(id) {
        const res = await fetch(`/admin/api/usuarios/${id}`, { headers: { Authorization: 'Bearer ' + token } });
        if (!res.ok) { Swal.fire('Error', 'No se pudo cargar el usuario', 'error'); return; }
        const { data: u } = await res.json();

        const pub = u.mascotas_publicadas || [];
        const adp = u.mascotas_adoptadas || [];
        const listaHtml = (items) => items.length
            ? `<ul class="detalle-lista">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`
            : '<span class="detalle-vacio">Ninguna</span>';

        document.getElementById('modalVerBody').innerHTML = `
            <div class="d-flex align-items-center gap-3 mb-4">
                <div class="avatar" style="background:${colorAvatar(u.nombre)}; width:52px; height:52px; font-size:1.1rem;">${iniciales(u.nombre, u.apellido)}</div>
                <div>
                    <div class="usuario-nombre" style="font-size:1.1rem;">${u.nombre} ${u.apellido}</div>
                    <span class="usuario-id">ID: #USR-${String(u.id).padStart(4, '0')}</span>
                </div>
            </div>
            <div class="row">
                <div class="col-6 mb-3"><div class="detalle-label">Email</div><div class="detalle-valor">${u.email}</div></div>
                <div class="col-6 mb-3"><div class="detalle-label">Teléfono</div><div class="detalle-valor">${u.telefono || '—'}</div></div>
                <div class="col-6 mb-3"><div class="detalle-label">Rol</div><div class="detalle-valor">${badgeRol(u.rol)}</div></div>
                <div class="col-6 mb-3"><div class="detalle-label">Registro</div><div class="detalle-valor">${formatearFecha(u.createdAt)}</div></div>
            </div>
            <hr>
            <div class="row">
                <div class="col-6"><div class="detalle-label">Mascotas publicadas (${pub.length})</div>${listaHtml(pub)}</div>
                <div class="col-6"><div class="detalle-label">Mascotas adoptadas (${adp.length})</div>${listaHtml(adp)}</div>
            </div>`;

        modalVer.show();
    }

    // --- Editar ---
    async function editarUsuario(id) {
        const res = await fetch(`/admin/api/usuarios/${id}`, { headers: { Authorization: 'Bearer ' + token } });
        if (!res.ok) { Swal.fire('Error', 'No se pudo cargar el usuario', 'error'); return; }
        const { data: u } = await res.json();

        document.getElementById('editarId').value = u.id;
        document.getElementById('editarNombre').value = u.nombre;
        document.getElementById('editarApellido').value = u.apellido;
        document.getElementById('editarEmail').value = u.email;
        document.getElementById('editarTelefono').value = u.telefono || '';
        document.getElementById('editarRol').value = u.rol;

        modalEditar.show();
    }

    document.getElementById('formEditar').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editarId').value;
        const body = {
            nombre: document.getElementById('editarNombre').value.trim(),
            apellido: document.getElementById('editarApellido').value.trim(),
            email: document.getElementById('editarEmail').value.trim(),
            telefono: document.getElementById('editarTelefono').value.trim(),
            rol: document.getElementById('editarRol').value
        };

        const res = await fetch(`/admin/api/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            modalEditar.hide();
            await Swal.fire({ title: 'Actualizado', text: 'Usuario modificado correctamente.', icon: 'success', confirmButtonText: 'OK' });
            cargarUsuarios();
        } else {
            const err = await res.json().catch(() => ({}));
            Swal.fire('Error', err.message || 'No se pudo actualizar el usuario', 'error');
        }
    });

    // --- Eliminar ---
    async function eliminarUsuario(id, nombre) {
        const result = await Swal.fire({
            title: `¿Eliminar a ${nombre}?`,
            text: 'Se desactivarán sus mascotas y adopciones. El usuario será eliminado del sistema.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        const res = await fetch(`/admin/api/usuarios/${id}`, {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + token }
        });

        if (res.ok) {
            await Swal.fire({ title: 'Eliminado', text: 'Usuario eliminado correctamente.', icon: 'success', confirmButtonText: 'OK' });
            cargarUsuarios();
        } else {
            const err = await res.json().catch(() => ({}));
            Swal.fire({
                title: 'No se puede eliminar',
                text: err.message || 'No se pudo eliminar el usuario',
                icon: 'error',
                confirmButtonText: 'Entendido'
            });
        }
    }

    await cargarUsuarios();
});