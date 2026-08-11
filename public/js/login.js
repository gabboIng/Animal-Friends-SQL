document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('/usuario/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: document.getElementById('email').value,
            clave: document.getElementById('clave').value
        })
    });
    const data = await res.json();
    if (data.status === 'ok') {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        window.location.href = '/';
    } else {
        const msg = document.getElementById('mensaje');
        msg.className = 'alert alert-danger';
        msg.textContent = data.message;
    }
});