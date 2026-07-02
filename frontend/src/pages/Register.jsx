import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullname, setFullname] = useState('');
  const [role, setRole] = useState('aprendiz');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password || !email || !fullname) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, email, fullname, role })
      });

      const data = await response.json();

      if (response.status === 201) {
        setSuccess('¡Registro exitoso! Redirigiendo al login...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(data.message || 'Error al registrarse.');
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100 animate-fade-in">
      <div className="row justify-content-center w-100">
        <div className="col-md-7 col-lg-6 my-4">
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '70px', height: '70px' }}>
              <i className="bi bi-person-plus-fill fs-1"></i>
            </div>
            <h2 className="fs-1 font-title">Crear una Cuenta</h2>
            <p className="text-secondary">Únete a la plataforma EvidenciaADSO</p>
          </div>

          <div className="glass-card p-4 p-sm-5">
            {error && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="alert alert-success d-flex align-items-center" role="alert">
                <i className="bi bi-check-circle-fill me-2 text-success"></i>
                <div>{success}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="fullname" className="form-label text-secondary small fw-bold">Nombre Completo</label>
                  <input
                    type="text"
                    className="form-control input-custom"
                    id="fullname"
                    placeholder="Ej. Juan Pérez"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="email" className="form-label text-secondary small fw-bold">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-control input-custom"
                    id="email"
                    placeholder="Ej. juan@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="username" className="form-label text-secondary small fw-bold">Nombre de Usuario</label>
                  <input
                    type="text"
                    className="form-control input-custom"
                    id="username"
                    placeholder="Ej. juan123"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="role" className="form-label text-secondary small fw-bold">Rol</label>
                  <select
                    className="form-select input-custom"
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="aprendiz">Aprendiz</option>
                    <option value="instructor">Instructor</option>
                    <option value="coordinador">Coordinador</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label text-secondary small fw-bold">Contraseña</label>
                <input
                  type="password"
                  className="form-control input-custom"
                  id="password"
                  placeholder="Elige una contraseña segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-custom-primary w-100 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creando cuenta...
                  </>
                ) : 'Registrarse'}
              </button>
            </form>

            <div className="text-center mt-3">
              <span className="text-secondary small">¿Ya tienes una cuenta? </span>
              <Link to="/" className="text-primary fw-bold text-decoration-none small">Inicia sesión aquí</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
