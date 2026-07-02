import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  
  // Lista de usuarios y carga
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de Modales
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Estados del Formulario (Crear/Editar)
  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    email: '',
    password: '',
    role: 'aprendiz'
  });

  // Cargar usuario autenticado y lista de usuarios
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      navigate('/');
      return;
    }
    const user = JSON.parse(userJson);
    setCurrentUser(user);

    fetchUsers();
  }, [navigate]);

  // Obtener usuarios desde la API
  async function fetchUsers() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        const data = await response.statusText === 'No Content' ? [] : await response.json();
        setUsers(data);
      } else {
        const data = await response.json();
        setError(data.message || 'No se pudo cargar la lista de usuarios.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  }

  // Cerrar sesión
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }

  // Abrir modal para crear usuario
  function handleOpenCreateModal() {
    setEditingUser(null);
    setFormData({
      username: '',
      fullname: '',
      email: '',
      password: '',
      role: 'aprendiz'
    });
    setError('');
    setShowModal(true);
  }

  // Abrir modal para editar usuario
  function handleOpenEditModal(user) {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      password: '', // Contraseña en blanco por seguridad
      role: user.role
    });
    setError('');
    setShowModal(true);
  }

  // Abrir modal para confirmar eliminación
  function handleOpenDeleteModal(user) {
    setUserToDelete(user);
    setShowDeleteModal(true);
  }

  // Enviar formulario (Crear / Editar)
  async function handleSaveUser(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) return;

    // Validar campos requeridos
    if (!formData.username || !formData.fullname || !formData.email || !formData.role) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }
    
    // Contraseña requerida solo al crear
    if (!editingUser && !formData.password) {
      setError('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    const url = editingUser 
      ? `http://localhost:4000/api/users/${editingUser.id}` 
      : 'http://localhost:4000/api/users';
      
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        setSuccess(editingUser ? 'Usuario actualizado con éxito.' : 'Usuario creado con éxito.');
        setShowModal(false);
        fetchUsers();
        // Limpiar mensaje de éxito después de unos segundos
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message || 'Ocurrió un error al procesar el usuario.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de comunicación con el servidor.');
    }
  }

  // Confirmar y eliminar usuario
  async function handleDeleteUser() {
    if (!userToDelete) return;
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:4000/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.status === 200) {
        setSuccess('Usuario eliminado con éxito.');
        setShowDeleteModal(false);
        setUserToDelete(null);
        fetchUsers();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message || 'Error al eliminar usuario.');
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
      setShowDeleteModal(false);
    }
  }

  // Contar cantidad de usuarios por roles para los paneles de estadísticas
  const totalCoordinadores = users.filter(u => u.role === 'coordinador').length;
  const totalInstructores = users.filter(u => u.role === 'instructor').length;
  const totalAprendices = users.filter(u => u.role === 'aprendiz').length;

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar */}
      <div className="sidebar d-none d-lg-flex flex-column justify-content-between py-4">
        <div>
          <div className="px-4 mb-4 d-flex align-items-center gap-2">
            <i className="bi bi-shield-check text-primary fs-2"></i>
            <span className="fs-4 fw-bold font-title">EvidenciaADSO</span>
          </div>
          <div className="nav flex-column">
            <a href="#" className="sidebar-link active">
              <i className="bi bi-people-fill"></i>
              <span>Gestión de Usuarios</span>
            </a>
            <a href="#" className="sidebar-link">
              <i className="bi bi-journal-bookmark-fill"></i>
              <span>Cursos / Fichas</span>
            </a>
            <a href="#" className="sidebar-link">
              <i className="bi bi-file-earmark-text-fill"></i>
              <span>Evidencias</span>
            </a>
            <a href="#" className="sidebar-link">
              <i className="bi bi-star-fill"></i>
              <span>Calificaciones</span>
            </a>
          </div>
        </div>
        <div className="px-3">
          <hr className="text-secondary opacity-25" />
          <button onClick={handleLogout} className="btn btn-outline-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '10px' }}>
            <i className="bi bi-box-arrow-left"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Header */}
        <header className="dashboard-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-dark d-lg-none me-2" type="button" data-bs-toggle="collapse" data-bs-target="#mobileSidebar">
              <i className="bi bi-list fs-4"></i>
            </button>
            <h4 className="m-0 d-none d-sm-block">Panel de Control</h4>
          </div>
          {currentUser && (
            <div className="d-flex align-items-center gap-3">
              <div className="text-end d-none d-md-block">
                <p className="m-0 fw-bold">{currentUser.fullname}</p>
                <small className="text-secondary">{currentUser.email}</small>
              </div>
              <span className={`badge-custom badge-${currentUser.role}`}>
                {currentUser.role}
              </span>
              <button onClick={handleLogout} className="btn btn-sm btn-outline-light d-lg-none" title="Cerrar Sesión">
                <i className="bi bi-box-arrow-left"></i>
              </button>
            </div>
          )}
        </header>

        {/* Dashboard Body */}
        <main className="p-4 p-md-5 flex-grow-1 animate-fade-in">
          {success && (
            <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
              <i className="bi bi-check-circle-fill me-2 fs-5"></i>
              <div>{success}</div>
              <button type="button" className="btn-close btn-close-white" onClick={() => setSuccess('')}></button>
            </div>
          )}

          {error && (
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              <div>{error}</div>
              <button type="button" className="btn-close btn-close-white" onClick={() => setError('')}></button>
            </div>
          )}

          {/* Welcome and stats panel if role is Coordinator */}
          {currentUser?.role === 'coordinador' ? (
            <>
              {/* Grid de Estadísticas */}
              <div className="row g-4 mb-5">
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="glass-card stat-card-gradient-1 p-4 d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-secondary small fw-bold uppercase">Total Usuarios</span>
                      <h2 className="m-0 fs-1 mt-1">{users.length}</h2>
                    </div>
                    <div className="bg-primary bg-opacity-20 text-primary p-3 rounded-3">
                      <i className="bi bi-people fs-2"></i>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="glass-card stat-card-gradient-2 p-4 d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-secondary small fw-bold uppercase">Instructores</span>
                      <h2 className="m-0 fs-1 mt-1">{totalInstructores}</h2>
                    </div>
                    <div className="bg-info bg-opacity-20 text-info p-3 rounded-3">
                      <i className="bi bi-mortarboard fs-2"></i>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="glass-card stat-card-gradient-3 p-4 d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-secondary small fw-bold uppercase">Aprendices</span>
                      <h2 className="m-0 fs-1 mt-1">{totalAprendices}</h2>
                    </div>
                    <div className="bg-success bg-opacity-20 text-success p-3 rounded-3">
                      <i className="bi bi-backpack fs-2"></i>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="glass-card p-4 d-flex align-items-center justify-content-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                      <span className="text-secondary small fw-bold uppercase">Coordinadores</span>
                      <h2 className="m-0 fs-1 mt-1">{totalCoordinadores}</h2>
                    </div>
                    <div className="bg-light bg-opacity-10 text-white p-3 rounded-3">
                      <i className="bi bi-person-workspace fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* CRUD Header */}
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
                <div>
                  <h3 className="m-0 font-title">Gestión de Usuarios</h3>
                  <p className="text-secondary m-0">Registra, edita y administra los roles de los integrantes del centro de formación.</p>
                </div>
                <button onClick={handleOpenCreateModal} className="btn btn-custom-primary d-flex align-items-center gap-2">
                  <i className="bi bi-person-plus-fill"></i>
                  <span>Crear Usuario</span>
                </button>
              </div>

              {/* CRUD Table */}
              <div className="glass-card p-0 custom-table-container">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-3 text-secondary">Cargando lista de usuarios...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-people text-muted fs-1"></i>
                    <p className="mt-3 text-secondary">No hay usuarios registrados en el sistema.</p>
                  </div>
                ) : (
                  <table className="table custom-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre Completo</th>
                        <th>Usuario</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td><span className="text-secondary font-monospace">#{user.id}</span></td>
                          <td><strong className="text-white">{user.fullname}</strong></td>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge-custom badge-${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2 justify-content-center">
                              <button onClick={() => handleOpenEditModal(user)} className="btn btn-sm btn-outline-info" title="Editar">
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button 
                                onClick={() => handleOpenDeleteModal(user)} 
                                className="btn btn-sm btn-outline-danger" 
                                title="Eliminar"
                                disabled={currentUser?.id === user.id}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            // View for Instructors or Apprentices
            <div className="glass-card p-5 text-center my-5 max-w-xl mx-auto">
              <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-4" style={{ width: '90px', height: '90px' }}>
                <i className="bi bi-activity fs-1"></i>
              </div>
              <h2 className="mb-3 font-title">¡Bienvenido a EvidenciaADSO!</h2>
              <p className="text-secondary mb-4 fs-5">
                Hola <strong>{currentUser?.fullname}</strong>, has iniciado sesión como 
                <span className={`badge-custom badge-${currentUser?.role} mx-2`}>{currentUser?.role}</span>.
              </p>
              <div className="alert alert-warning border-warning border-opacity-25 bg-warning bg-opacity-10 text-start mx-auto" style={{ maxWidth: '600px' }} role="alert">
                <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                Como tu rol actual no es <strong>coordinador</strong>, no tienes permisos para visualizar o editar la lista de usuarios. 
                Próximamente se integrarán tus módulos específicos de visualización de cursos, envío de evidencias o calificación en este panel.
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Form Modal (Crear / Editar) */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-title m-0">
                  {editingUser ? `Editar Usuario: ${editingUser.fullname}` : 'Crear Nuevo Usuario'}
                </h5>
                <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <form onSubmit={handleSaveUser}>
                <div className="modal-body p-4">
                  
                  {error && (
                    <div className="alert alert-danger py-2 mb-3" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2 small"></i>
                      <span className="small">{error}</span>
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="modal-fullname" className="form-label text-secondary small fw-bold">Nombre Completo</label>
                    <input
                      type="text"
                      className="form-control input-custom"
                      id="modal-fullname"
                      required
                      placeholder="Ej. Juan Gómez"
                      value={formData.fullname}
                      onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="modal-email" className="form-label text-secondary small fw-bold">Correo Electrónico</label>
                    <input
                      type="email"
                      className="form-control input-custom"
                      id="modal-email"
                      required
                      placeholder="Ej. juan@correo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="row">
                    <div className="col-6 mb-3">
                      <label htmlFor="modal-username" className="form-label text-secondary small fw-bold">Nombre de Usuario</label>
                      <input
                        type="text"
                        className="form-control input-custom"
                        id="modal-username"
                        required
                        placeholder="Ej. jgomez"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>
                    <div className="col-6 mb-3">
                      <label htmlFor="modal-role" className="form-label text-secondary small fw-bold">Rol</label>
                      <select
                        className="form-select input-custom"
                        id="modal-role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        style={{ appearance: 'auto' }}
                      >
                        <option value="aprendiz">Aprendiz</option>
                        <option value="instructor">Instructor</option>
                        <option value="coordinador">Coordinador</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-1">
                    <label htmlFor="modal-password" className="form-label text-secondary small fw-bold">
                      Contraseña {editingUser && <span className="text-muted">(dejar en blanco para no modificar)</span>}
                    </label>
                    <input
                      type="password"
                      className="form-control input-custom"
                      id="modal-password"
                      required={!editingUser}
                      placeholder={editingUser ? "Nueva contraseña (opcional)" : "Escribe una contraseña segura"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                </div>
                <div className="modal-footer modal-footer-custom d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-custom-secondary py-2" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-custom-primary py-2">
                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom d-flex justify-content-between align-items-center border-0 pb-0">
                <h5 className="modal-title font-title text-danger m-0">Confirmar Eliminación</h5>
                <button type="button" className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="modal-body p-4">
                <p className="m-0 fs-5">
                  ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete?.fullname}</strong> (<code>{userToDelete?.username}</code>)?
                </p>
                <p className="text-secondary small mt-2 m-0">
                  Esta acción es irreversible y removerá permanentemente al usuario del sistema.
                </p>
              </div>
              <div className="modal-footer modal-footer-custom border-0 pt-0 d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-custom-secondary py-2" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger py-2 px-4" onClick={handleDeleteUser} style={{ borderRadius: '10px' }}>
                  Eliminar permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
