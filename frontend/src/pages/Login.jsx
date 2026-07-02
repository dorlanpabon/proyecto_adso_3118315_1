import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.status === 200) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Error al iniciar sesión.');
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100 animate-fade-in">
      <div className="row justify-content-center w-100">
        <div className="col-md-6 col-lg-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '70px', height: '70px' }}>
              <i className="bi bi-shield-lock-fill fs-1"></i>
            </div>
            <h2 className="fs-1 font-title">EvidenciaADSO</h2>
            <p className="text-secondary">Plataforma de Calificación de Evidencias</p>
          </div>
          
          <div className="glass-card p-4 p-sm-5">
            <h3 className="text-center mb-4 font-title">Iniciar Sesión</h3>
            
            {error && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
                <div>{error}</div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label text-secondary small fw-bold">Usuario</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted" style={{ border: '1px solid var(--border-color)', borderRight: 'none', borderRadius: '10px 0 0 10px' }}>
                    <i className="bi bi-person"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control input-custom border-start-0" 
                    id="username" 
                    placeholder="Tu nombre de usuario" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ borderRadius: '0 10px 10px 0' }}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="password" className="form-label text-secondary small fw-bold">Contraseña</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0 text-muted" style={{ border: '1px solid var(--border-color)', borderRight: 'none', borderRadius: '10px 0 0 10px' }}>
                    <i className="bi bi-key"></i>
                  </span>
                  <input 
                    type="password" 
                    className="form-control input-custom border-start-0" 
                    id="password" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ borderRadius: '0 10px 10px 0' }}
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-custom-primary w-100 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Autenticando...
                  </>
                ) : 'Ingresar'}
              </button>
            </form>
            
            <div className="text-center mt-3">
              <span className="text-secondary small">¿No tienes una cuenta? </span>
              <Link to="/register" className="text-primary fw-bold text-decoration-none small">Regístrate aquí</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
