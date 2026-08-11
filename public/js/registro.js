document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    nombre: document.getElementById('nombre').value,
    apellido: document.getElementById('apellido').value,
    email: document.getElementById('email').value,
    clave: document.getElementById('clave').value,
    telefono: document.getElementById('telefono').value || undefined
  };
  const res = await fetch('/usuario/registrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (data.status === 'ok') {
   window.location.href = '/login';
  } else {
    const msg = document.getElementById('mensaje');
    msg.className = 'alert alert-danger';
    msg.textContent = data.message;
  }
});