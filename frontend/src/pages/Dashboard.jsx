import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  
  // Mensajes de Alerta
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Tab Activo (Según el rol, tendrá un valor por defecto diferente)
  const [activeTab, setActiveTab] = useState('');

  // ----------------------------------------------------
  // ESTADOS Y VARIABLES POR MÓDULO
  // ----------------------------------------------------

  // 1. Módulo de Usuarios (Coordinador)
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '', fullname: '', email: '', password: '', role: 'aprendiz'
  });

  // 2. Módulo de Cursos / Fichas (Coordinador)
  const [courses, setCourses] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [courseFormData, setCourseFormData] = useState({
    code: '', name: ''
  });

  // 3. Módulo de Asignaciones (Coordinador)
  const [assignments, setAssignments] = useState([]); // Listado plano para visualización
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState('');
  const [selectedCourseForAssign, setSelectedCourseForAssign] = useState('');

  // 4. Módulo de Cursos de Instructor (Instructor)
  const [myCourses, setMyCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null); // Curso seleccionado para ver actividades o integrantes
  
  // 5. Módulo de Actividades / Evidencias (Instructor / Aprendiz)
  const [activities, setActivities] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDeleteActivityModal, setShowDeleteActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [activityFormData, setActivityFormData] = useState({
    title: '', description: '', due_date: ''
  });

  // 6. Módulo de Entregas y Calificaciones (Instructor / Aprendiz)
  const [selectedActivity, setSelectedActivity] = useState(null); // Actividad seleccionada para ver entregas
  const [submissions, setSubmissions] = useState([]); // Entregas de una actividad (Instructor)
  const [mySubmissions, setMySubmissions] = useState([]); // Mis entregas (Aprendiz)
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmissionForGrade, setSelectedSubmissionForGrade] = useState(null);
  const [gradeFormData, setGradeFormData] = useState({
    grade: 'Aprobado', feedback: ''
  });

  // Estado para el modal de entrega (Aprendiz)
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionFormData, setSubmissionFormData] = useState({
    file_url: '', comments: ''
  });

  // ----------------------------------------------------
  // CARGA INICIAL
  // ----------------------------------------------------
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      navigate('/');
      return;
    }
    const user = JSON.parse(userJson);
    setCurrentUser(user);

    // Definir pestaña por defecto según rol
    if (user.role === 'coordinador') {
      setActiveTab('usuarios');
      fetchUsers();
      fetchCourses();
    } else if (user.role === 'instructor') {
      setActiveTab('instructor_cursos');
      fetchMyCourses();
    } else if (user.role === 'aprendiz') {
      setActiveTab('aprendiz_cursos');
      fetchMyCourses();
      fetchMySubmissions();
    }
  }, [navigate]);

  // Carga reactiva de datos al cambiar de pestaña
  useEffect(() => {
    if (!activeTab || !currentUser) return;
    setError('');
    setSuccess('');

    if (activeTab === 'usuarios') fetchUsers();
    if (activeTab === 'cursos') fetchCourses();
    if (activeTab === 'asignaciones') {
      fetchUsers();
      fetchCourses();
      fetchAssignments();
    }
    if (activeTab === 'instructor_cursos') fetchMyCourses();
    if (activeTab === 'aprendiz_cursos') fetchMyCourses();
  }, [activeTab]);

  // Cerrar Sesión
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }

  const token = localStorage.getItem('token');

  // ----------------------------------------------------
  // LLAMADOS A API: USUARIOS (Coordinador)
  // ----------------------------------------------------
  async function fetchUsers() {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 200) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    setError('');
    const url = editingUser ? `${API_URL}/api/users/${editingUser.id}` : `${API_URL}/api/users`;
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(userFormData)
      });
      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        setSuccess(editingUser ? 'Usuario actualizado con éxito.' : 'Usuario creado con éxito.');
        setShowUserModal(false);
        fetchUsers();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message || 'Error al guardar el usuario.');
      }
    } catch (err) {
      setError('Error de conexión.');
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return;
    try {
      const response = await fetch(`${API_URL}/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 200) {
        setSuccess('Usuario eliminado exitosamente.');
        setShowDeleteUserModal(false);
        fetchUsers();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al eliminar.');
      }
    } catch (err) {
      setError('Error de conexión.');
    }
  }

  // ----------------------------------------------------
  // LLAMADOS A API: CURSOS (Coordinador)
  // ----------------------------------------------------
  async function fetchCourses() {
    try {
      const response = await fetch(`${API_URL}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 200) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveCourse(e) {
    e.preventDefault();
    setError('');
    const url = editingCourse ? `${API_URL}/api/courses/${editingCourse.id}` : `${API_URL}/api/courses`;
    const method = editingCourse ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(courseFormData)
      });
      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        setSuccess(editingCourse ? 'Curso actualizado.' : 'Curso creado.');
        setShowCourseModal(false);
        fetchCourses();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message || 'Error al guardar.');
      }
    } catch (err) {
      setError('Error de conexión.');
    }
  }

  async function handleDeleteCourse() {
    if (!courseToDelete) return;
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 200) {
        setSuccess('Curso eliminado exitosamente.');
        setShowDeleteCourseModal(false);
        fetchCourses();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error al eliminar.');
      }
    } catch (err) {
      setError('Error.');
    }
  }

  // ----------------------------------------------------
  // LLAMADOS A API: ASIGNACIONES (Coordinador)
  // ----------------------------------------------------
  async function fetchAssignments() {
    // Para simplificar la visualización de asignaciones, consultamos los miembros de cada curso
    try {
      const tempAssignments = [];
      const response = await fetch(`${API_URL}/api/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 200) {
        const courseList = await response.json();
        for (const crs of courseList) {
          const resMem = await fetch(`${API_URL}/api/courses/${crs.id}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resMem.status === 200) {
            const members = await resMem.json();
            members.forEach(m => {
              tempAssignments.push({
                user_id: m.id,
                fullname: m.fullname,
                role: m.role,
                course_id: crs.id,
                course_code: crs.code,
                course_name: crs.name,
                assigned_at: m.assigned_at
              });
            });
          }
        }
        setAssignments(tempAssignments);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveAssignment(e) {
    e.preventDefault();
    setError('');
    if (!selectedUserForAssign || !selectedCourseForAssign) {
      setError('Selecciona un usuario y un curso.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/courses/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: selectedUserForAssign, course_id: selectedCourseForAssign })
      });
      const data = await response.json();

      if (response.status === 201) {
        setSuccess('Asignación creada con éxito.');
        setShowAssignModal(false);
        fetchAssignments();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message || 'Error al asignar.');
      }
    } catch (err) {
      setError('Error de conexión.');
    }
  }

  async function handleRemoveAssignment(userId, courseId) {
    if (!window.confirm('¿Deseas desvincular a este usuario de la ficha?')) return;
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/courses/assign`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, course_id: courseId })
      });
      if (response.status === 200) {
        setSuccess('Asignación removida.');
        fetchAssignments();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error.');
      }
    } catch (err) {
      setError('Error.');
    }
  }

  // ----------------------------------------------------
  // LLAMADOS A API: MIS CURSOS (Instructor / Aprendiz)
  // ----------------------------------------------------
  async function fetchMyCourses() {
    try {
      const response = await fetch(`${API_URL}/api/courses/my-courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 200) {
        const data = await response.json();
        setMyCourses(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ----------------------------------------------------
  // LLAMADOS A API: ACTIVIDADES (Instructor / Aprendiz)
  // ----------------------------------------------------
  async function fetchActivities(courseId) {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/activities/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 200) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectCourse(course) {
    setSelectedCourse(course);
    setSelectedActivity(null);
    setSubmissions([]);
    fetchActivities(course.id);
  }

  async function handleSaveActivity(e) {
    e.preventDefault();
    setError('');
    const url = editingActivity ? `${API_URL}/api/activities/${editingActivity.id}` : `${API_URL}/api/activities`;
    const method = editingActivity ? 'PUT' : 'POST';

    const payload = editingActivity 
      ? activityFormData 
      : { ...activityFormData, course_id: selectedCourse.id };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        setSuccess(editingActivity ? 'Evidencia actualizada.' : 'Evidencia planteada con éxito.');
        setShowActivityModal(false);
        fetchActivities(selectedCourse.id);
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message || 'Error al guardar.');
      }
    } catch (err) {
      setError('Error.');
    }
  }

  async function handleDeleteActivity() {
    if (!activityToDelete) return;
    try {
      const response = await fetch(`${API_URL}/api/activities/${activityToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 200) {
        setSuccess('Actividad eliminada.');
        setShowDeleteActivityModal(false);
        fetchActivities(selectedCourse.id);
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError('Error.');
    }
  }

  // ----------------------------------------------------
  // LLAMADOS A API: ENTREGAS Y EVALUACIÓN (Instructor / Aprendiz)
  // ----------------------------------------------------
  async function fetchSubmissions(activityId) {
    try {
      const response = await fetch(`${API_URL}/api/submissions/activity/${activityId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 200) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleSelectActivityForGrades(act) {
    setSelectedActivity(act);
    fetchSubmissions(act.id);
  }

  async function fetchMySubmissions() {
    try {
      const response = await fetch(`${API_URL}/api/submissions/my-submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 200) {
        const data = await response.json();
        setMySubmissions(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleGradeSubmission(e) {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/submissions/${selectedSubmissionForGrade.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(gradeFormData)
      });
      if (response.status === 200) {
        setSuccess('Evidencia evaluada correctamente.');
        setShowGradeModal(false);
        fetchSubmissions(selectedActivity.id);
        setTimeout(() => setSuccess(''), 4000);
      } else {
        const data = await response.json();
        setError(data.message || 'Error.');
      }
    } catch (err) {
      setError('Error.');
    }
  }

  async function handleSubmitEvidence(e) {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          activity_id: selectedActivity.id,
          file_url: submissionFormData.file_url,
          comments: submissionFormData.comments
        })
      });
      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        setSuccess('Evidencia enviada correctamente.');
        setShowSubmitModal(false);
        fetchMySubmissions();
        // Recargar actividades del curso para actualizar la visualización local
        if (selectedCourse) fetchActivities(selectedCourse.id);
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message || 'Error al enviar.');
      }
    } catch (err) {
      setError('Error.');
    }
  }

  // Helper para verificar si una actividad tiene entrega en el panel del Aprendiz
  function getSubmissionForActivity(activityId) {
    return mySubmissions.find(sub => sub.activity_id === activityId);
  }

  // ----------------------------------------------------
  // CONTEOS DE ESTADÍSTICAS (Coordinador)
  // ----------------------------------------------------
  const totalCoordinadores = users.filter(u => u.role === 'coordinador').length;
  const totalInstructores = users.filter(u => u.role === 'instructor').length;
  const totalAprendices = users.filter(u => u.role === 'aprendiz').length;

  return (
    <div className="d-flex min-vh-100">
      
      {/* SIDEBAR */}
      <div className="sidebar d-none d-lg-flex flex-column justify-content-between py-4">
        <div>
          <div className="px-4 mb-4 d-flex align-items-center gap-2">
            <i className="bi bi-shield-check text-primary fs-2"></i>
            <span className="fs-4 fw-bold font-title">EvidenciaADSO</span>
          </div>

          <div className="nav flex-column">
            {currentUser?.role === 'coordinador' && (
              <>
                <button onClick={() => setActiveTab('usuarios')} className={`btn border-0 sidebar-link ${activeTab === 'usuarios' ? 'active' : ''}`}>
                  <i className="bi bi-people-fill"></i>
                  <span>Gestión de Usuarios</span>
                </button>
                <button onClick={() => setActiveTab('cursos')} className={`btn border-0 sidebar-link ${activeTab === 'cursos' ? 'active' : ''}`}>
                  <i className="bi bi-journal-bookmark-fill"></i>
                  <span>Gestión de Cursos</span>
                </button>
                <button onClick={() => setActiveTab('asignaciones')} className={`btn border-0 sidebar-link ${activeTab === 'asignaciones' ? 'active' : ''}`}>
                  <i className="bi bi-link-45deg"></i>
                  <span>Asignaciones</span>
                </button>
              </>
            )}

            {currentUser?.role === 'instructor' && (
              <>
                <button onClick={() => { setActiveTab('instructor_cursos'); setSelectedCourse(null); }} className={`btn border-0 sidebar-link ${activeTab === 'instructor_cursos' ? 'active' : ''}`}>
                  <i className="bi bi-collection-fill"></i>
                  <span>Mis Fichas</span>
                </button>
              </>
            )}

            {currentUser?.role === 'aprendiz' && (
              <>
                <button onClick={() => { setActiveTab('aprendiz_cursos'); setSelectedCourse(null); }} className={`btn border-0 sidebar-link ${activeTab === 'aprendiz_cursos' ? 'active' : ''}`}>
                  <i className="bi bi-book-fill"></i>
                  <span>Mis Cursos</span>
                </button>
                <button onClick={() => setActiveTab('aprendiz_calificaciones')} className={`btn border-0 sidebar-link ${activeTab === 'aprendiz_calificaciones' ? 'active' : ''}`}>
                  <i className="bi bi-patch-check-fill"></i>
                  <span>Mis Calificaciones</span>
                </button>
              </>
            )}
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

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        
        {/* HEADER */}
        <header className="dashboard-header d-flex justify-content-between align-items-center">
          <div>
            <h4 className="m-0 font-title">
              {activeTab === 'usuarios' && 'Gestión de Usuarios'}
              {activeTab === 'cursos' && 'Gestión de Cursos'}
              {activeTab === 'asignaciones' && 'Asignación de Fichas'}
              {activeTab === 'instructor_cursos' && (selectedCourse ? `Ficha: ${selectedCourse.name}` : 'Mis Fichas Asignadas')}
              {activeTab === 'aprendiz_cursos' && (selectedCourse ? `Ficha: ${selectedCourse.name}` : 'Mis Cursos de Formación')}
              {activeTab === 'aprendiz_calificaciones' && 'Mis Calificaciones y Feedback'}
            </h4>
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
            </div>
          )}
        </header>

        {/* CUERPO DEL PANEL */}
        <main className="p-4 p-md-5 flex-grow-1 animate-fade-in" style={{ overflowY: 'auto' }}>
          
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

          {/* ----------------------------------------------------
              VISTA 1: GESTIÓN DE USUARIOS (Coordinador)
              ---------------------------------------------------- */}
          {activeTab === 'usuarios' && currentUser?.role === 'coordinador' && (
            <>
              {/* Estadísticas */}
              <div className="row g-4 mb-5">
                <div className="col-12 col-sm-4">
                  <div className="glass-card stat-card-gradient-1 p-4 d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-secondary small fw-bold uppercase">Instructores</span>
                      <h2 className="m-0 fs-1 mt-1">{totalInstructores}</h2>
                    </div>
                    <div className="bg-primary bg-opacity-20 text-primary p-3 rounded-3">
                      <i className="bi bi-mortarboard fs-2"></i>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="glass-card stat-card-gradient-2 p-4 d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-secondary small fw-bold uppercase">Aprendices</span>
                      <h2 className="m-0 fs-1 mt-1">{totalAprendices}</h2>
                    </div>
                    <div className="bg-info bg-opacity-20 text-info p-3 rounded-3">
                      <i className="bi bi-backpack fs-2"></i>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-sm-4">
                  <div className="glass-card stat-card-gradient-3 p-4 d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-secondary small fw-bold uppercase">Coordinadores</span>
                      <h2 className="m-0 fs-1 mt-1">{totalCoordinadores}</h2>
                    </div>
                    <div className="bg-success bg-opacity-20 text-success p-3 rounded-3">
                      <i className="bi bi-person-workspace fs-2"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* CRUD Control */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="m-0">Listado de Integrantes</h4>
                <button onClick={handleOpenCreateModal} className="btn btn-custom-primary d-flex align-items-center gap-2">
                  <i className="bi bi-person-plus-fill"></i>
                  <span>Crear Usuario</span>
                </button>
              </div>

              {/* Tabla */}
              <div className="glass-card p-0 custom-table-container">
                <table className="table custom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre Completo</th>
                      <th>Nombre Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td><span className="text-secondary font-monospace">#{u.id}</span></td>
                        <td><strong className="text-white">{u.fullname}</strong></td>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td><span className={`badge-custom badge-${u.role}`}>{u.role}</span></td>
                        <td>
                          <div className="d-flex gap-2 justify-content-center">
                            <button onClick={() => handleOpenEditModal(u)} className="btn btn-sm btn-outline-info"><i className="bi bi-pencil-square"></i></button>
                            <button onClick={() => { setUserToDelete(u); setShowDeleteUserModal(true); }} className="btn btn-sm btn-outline-danger" disabled={currentUser.id === u.id}><i className="bi bi-trash"></i></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ----------------------------------------------------
              VISTA 2: GESTIÓN DE CURSOS / FICHAS (Coordinador)
              ---------------------------------------------------- */}
          {activeTab === 'cursos' && currentUser?.role === 'coordinador' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="m-0">Programas de Formación y Fichas</h4>
                  <p className="text-secondary m-0 small">Registra y edita las fichas y programas activos.</p>
                </div>
                <button onClick={() => { setEditingCourse(null); setCourseFormData({ code: '', name: '' }); setShowCourseModal(true); }} className="btn btn-custom-primary d-flex align-items-center gap-2">
                  <i className="bi bi-folder-plus"></i>
                  <span>Crear Curso / Ficha</span>
                </button>
              </div>

              <div className="glass-card p-0 custom-table-container">
                <table className="table custom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ficha (Código)</th>
                      <th>Nombre del Programa</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-4 text-secondary">No hay cursos registrados.</td></tr>
                    ) : (
                      courses.map(c => (
                        <tr key={c.id}>
                          <td><span className="text-secondary font-monospace">#{c.id}</span></td>
                          <td><strong className="text-white">{c.code}</strong></td>
                          <td>{c.name}</td>
                          <td>
                            <div className="d-flex gap-2 justify-content-center">
                              <button onClick={() => { setEditingCourse(c); setCourseFormData({ code: c.code, name: c.name }); setShowCourseModal(true); }} className="btn btn-sm btn-outline-info"><i className="bi bi-pencil-square"></i></button>
                              <button onClick={() => { setCourseToDelete(c); setShowDeleteCourseModal(true); }} className="btn btn-sm btn-outline-danger"><i className="bi bi-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ----------------------------------------------------
              VISTA 3: ASIGNACIONES (Coordinador)
              ---------------------------------------------------- */}
          {activeTab === 'asignaciones' && currentUser?.role === 'coordinador' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="m-0">Asociación de Fichas</h4>
                  <p className="text-secondary m-0 small">Asigna instructores y aprendices a las fichas formativas.</p>
                </div>
                <button onClick={() => { setSelectedUserForAssign(''); setSelectedCourseForAssign(''); setShowAssignModal(true); }} className="btn btn-custom-primary d-flex align-items-center gap-2">
                  <i className="bi bi-link-45deg"></i>
                  <span>Crear Asignación</span>
                </button>
              </div>

              <div className="glass-card p-0 custom-table-container">
                <table className="table custom-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Ficha</th>
                      <th>Programa de Formación</th>
                      <th>Asignado el</th>
                      <th className="text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-4 text-secondary">No hay asignaciones activas.</td></tr>
                    ) : (
                      assignments.map((asg, idx) => (
                        <tr key={idx}>
                          <td><strong className="text-white">{asg.fullname}</strong></td>
                          <td><span className={`badge-custom badge-${asg.role}`}>{asg.role}</span></td>
                          <td><code>{asg.course_code}</code></td>
                          <td>{asg.course_name}</td>
                          <td>{new Date(asg.assigned_at).toLocaleDateString()}</td>
                          <td className="text-center">
                            <button onClick={() => handleRemoveAssignment(asg.user_id, asg.course_id)} className="btn btn-sm btn-outline-danger" title="Desvincular"><i className="bi bi-x-circle"></i></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ----------------------------------------------------
              VISTA 4: CURSOS / FICHAS DE INSTRUCTOR (Instructor)
              ---------------------------------------------------- */}
          {activeTab === 'instructor_cursos' && currentUser?.role === 'instructor' && (
            <>
              {!selectedCourse ? (
                // Mostrar tarjetas de Cursos Asignados
                <div className="row g-4">
                  {myCourses.length === 0 ? (
                    <div className="col-12 text-center py-5">
                      <i className="bi bi-journal-x fs-1 text-secondary"></i>
                      <p className="mt-3 text-secondary">No tienes fichas asignadas por el coordinador por el momento.</p>
                    </div>
                  ) : (
                    myCourses.map(c => (
                      <div className="col-md-6" key={c.id}>
                        <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
                          <div>
                            <span className="badge-custom badge-instructor">Ficha {c.code}</span>
                            <h3 className="mt-3 fs-4 font-title">{c.name}</h3>
                            <p className="text-secondary small mt-2">Vincular actividades, evaluar aprendices y controlar el envío de evidencias para este programa.</p>
                          </div>
                          <button onClick={() => handleSelectCourse(c)} className="btn btn-custom-primary w-100 mt-4 py-2">
                            <span>Ingresar a Ficha</span>
                            <i className="bi bi-arrow-right-short ms-1"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // Si hay un curso seleccionado, mostrar su panel de actividades
                <div>
                  <button onClick={() => setSelectedCourse(null)} className="btn btn-custom-secondary mb-4 py-2 px-3">
                    <i className="bi bi-arrow-left-short me-1"></i>
                    <span>Volver a Mis Fichas</span>
                  </button>

                  <div className="glass-card p-4 mb-5">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
                      <div>
                        <span className="badge-custom badge-instructor">Ficha {selectedCourse.code}</span>
                        <h2 className="mt-2 font-title m-0">{selectedCourse.name}</h2>
                      </div>
                      <button onClick={() => { setEditingActivity(null); setActivityFormData({ title: '', description: '', due_date: '' }); setShowActivityModal(true); }} className="btn btn-custom-primary py-2 d-flex align-items-center gap-2">
                        <i className="bi bi-file-earmark-plus"></i>
                        <span>Nueva Actividad / Evidencia</span>
                      </button>
                    </div>
                  </div>

                  {/* Listado de Actividades del Curso */}
                  <h4 className="mb-4">Evidencias Solicitadas</h4>
                  
                  {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
                  ) : activities.length === 0 ? (
                    <div className="glass-card p-5 text-center">
                      <i className="bi bi-journal-text text-muted fs-1"></i>
                      <p className="mt-3 text-secondary">No hay evidencias planteadas para este curso.</p>
                    </div>
                  ) : (
                    <div className="row g-4">
                      {activities.map(act => (
                        <div className="col-12" key={act.id}>
                          <div className={`glass-card p-4 ${selectedActivity?.id === act.id ? 'border-primary border-opacity-50 shadow-primary' : ''}`}>
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                              <div style={{ flex: 1 }}>
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                  <h4 className="m-0 text-white font-title">{act.title}</h4>
                                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 py-1 px-2 small">
                                    Vence: {new Date(act.due_date).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-secondary mt-2 mb-0" style={{ whiteSpace: 'pre-wrap' }}>{act.description}</p>
                              </div>
                              
                              <div className="d-flex gap-2 align-self-stretch align-self-md-auto align-items-center justify-content-end">
                                <button onClick={() => { setEditingActivity(act); setActivityFormData({ title: act.title, description: act.description, due_date: act.due_date.substring(0,16) }); setShowActivityModal(true); }} className="btn btn-sm btn-outline-info" title="Editar"><i className="bi bi-pencil-square"></i></button>
                                <button onClick={() => { setActivityToDelete(act); setShowDeleteActivityModal(true); }} className="btn btn-sm btn-outline-danger" title="Eliminar"><i className="bi bi-trash"></i></button>
                                <button onClick={() => handleSelectActivityForGrades(act)} className="btn btn-sm btn-primary py-2 px-3 ms-2 d-flex align-items-center gap-1">
                                  <span>Calificar Entregas</span>
                                  <i className="bi bi-chevron-down"></i>
                                </button>
                              </div>
                            </div>

                            {/* Mostrar Entregas Expandidas de la Actividad Seleccionada */}
                            {selectedActivity?.id === act.id && (
                              <div className="mt-4 pt-4 border-top border-secondary border-opacity-25">
                                <h5 className="mb-3 text-secondary font-title"><i className="bi bi-cloud-arrow-up-fill me-2"></i>Entregas Recibidas</h5>
                                
                                {submissions.length === 0 ? (
                                  <p className="text-secondary small m-0 py-2">Ningún aprendiz ha realizado una entrega para esta actividad aún.</p>
                                ) : (
                                  <div className="table-responsive">
                                    <table className="table custom-table table-sm">
                                      <thead>
                                        <tr>
                                          <th>Aprendiz</th>
                                          <th>Comentarios</th>
                                          <th>Fecha Envío</th>
                                          <th>Enlace</th>
                                          <th>Nota</th>
                                          <th className="text-center">Evaluar</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {submissions.map(sub => (
                                          <tr key={sub.id}>
                                            <td>
                                              <strong className="text-white">{sub.apprentice_name}</strong><br />
                                              <small className="text-secondary">{sub.apprentice_email}</small>
                                            </td>
                                            <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sub.comments}>
                                              {sub.comments || <span className="text-muted small">Sin comentario</span>}
                                            </td>
                                            <td>{new Date(sub.submitted_at).toLocaleString()}</td>
                                            <td>
                                              <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-outline-primary py-1 px-2 small text-decoration-none">
                                                <i className="bi bi-box-arrow-up-right me-1"></i>
                                                <span>Ver Archivo</span>
                                              </a>
                                            </td>
                                            <td>
                                              {sub.grade ? (
                                                <span className={`badge-custom badge-${sub.grade === 'Aprobado' ? 'aprendiz' : 'danger'}`}>{sub.grade}</span>
                                              ) : (
                                                <span className="badge bg-warning bg-opacity-10 text-warning py-1 px-2 border border-warning border-opacity-25 small">Por Calificar</span>
                                              )}
                                            </td>
                                            <td className="text-center">
                                              <button 
                                                onClick={() => { setSelectedSubmissionForGrade(sub); setGradeFormData({ grade: sub.grade || 'Aprobado', feedback: sub.feedback || '' }); setShowGradeModal(true); }} 
                                                className="btn btn-sm btn-custom-primary py-1 px-2"
                                              >
                                                <i className="bi bi-bookmark-star"></i>
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ----------------------------------------------------
              VISTA 5: CURSOS DE APRENDIZ (Aprendiz)
              ---------------------------------------------------- */}
          {activeTab === 'aprendiz_cursos' && currentUser?.role === 'aprendiz' && (
            <>
              {!selectedCourse ? (
                // Mostrar Cursos Matriculados
                <div className="row g-4">
                  {myCourses.length === 0 ? (
                    <div className="col-12 text-center py-5">
                      <i className="bi bi-journal-x fs-1 text-secondary"></i>
                      <p className="mt-3 text-secondary">No estás matriculado en ninguna ficha por el momento.</p>
                    </div>
                  ) : (
                    myCourses.map(c => (
                      <div className="col-md-6" key={c.id}>
                        <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
                          <div>
                            <span className="badge-custom badge-aprendiz">Matriculado - Ficha {c.code}</span>
                            <h3 className="mt-3 fs-4 font-title">{c.name}</h3>
                            <p className="text-secondary small mt-2">Visualiza actividades planteadas, realiza envíos de evidencias y consulta tus calificaciones asignadas.</p>
                          </div>
                          <button onClick={() => handleSelectCourse(c)} className="btn btn-custom-primary w-100 mt-4 py-2">
                            <span>Ingresar a Ficha</span>
                            <i className="bi bi-arrow-right-short ms-1"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // Actividades del curso para el Aprendiz
                <div>
                  <button onClick={() => setSelectedCourse(null)} className="btn btn-custom-secondary mb-4 py-2 px-3">
                    <i className="bi bi-arrow-left-short me-1"></i>
                    <span>Volver a Mis Cursos</span>
                  </button>

                  <div className="glass-card p-4 mb-5">
                    <span className="badge-custom badge-aprendiz">Ficha {selectedCourse.code}</span>
                    <h2 className="mt-2 font-title m-0">{selectedCourse.name}</h2>
                  </div>

                  <h4 className="mb-4">Evidencias y Trabajos de la Ficha</h4>

                  {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
                  ) : activities.length === 0 ? (
                    <div className="glass-card p-5 text-center">
                      <i className="bi bi-journal-check text-muted fs-1"></i>
                      <p className="mt-3 text-secondary">No hay actividades asignadas en este curso actualmente.</p>
                    </div>
                  ) : (
                    <div className="row g-4">
                      {activities.map(act => {
                        const submission = getSubmissionForActivity(act.id);
                        return (
                          <div className="col-12" key={act.id}>
                            <div className="glass-card p-4">
                              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                                <div style={{ flex: 1 }}>
                                  <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <h4 className="m-0 text-white font-title">{act.title}</h4>
                                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 py-1 px-2 small">
                                      Vence: {new Date(act.due_date).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-secondary mt-2 mb-0" style={{ whiteSpace: 'pre-wrap' }}>{act.description}</p>
                                </div>

                                <div className="d-flex flex-column align-items-end gap-2 justify-content-center">
                                  {submission ? (
                                    <>
                                      <span className={`badge-custom badge-${submission.grade === 'Aprobado' ? 'aprendiz' : submission.grade === 'Deficiente' ? 'danger' : 'warning'}`}>
                                        {submission.grade ? `Calificación: ${submission.grade}` : 'Entregado - Sin Calificar'}
                                      </span>
                                      {submission.grade !== 'Aprobado' && (
                                        <button 
                                          onClick={() => { setSelectedActivity(act); setSubmissionFormData({ file_url: submission.file_url, comments: submission.comments || '' }); setShowSubmitModal(true); }} 
                                          className="btn btn-sm btn-outline-info py-2"
                                        >
                                          <span>Corregir/Reenviar</span>
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="badge bg-secondary bg-opacity-10 text-secondary py-1 px-2 border border-secondary border-opacity-25 small">No Entregado</span>
                                      <button 
                                        onClick={() => { setSelectedActivity(act); setSubmissionFormData({ file_url: '', comments: '' }); setShowSubmitModal(true); }} 
                                        className="btn btn-sm btn-primary py-2 px-4"
                                      >
                                        <span>Entregar Trabajo</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Mostrar Retroalimentación si existe */}
                              {submission && submission.feedback && (
                                <div className="mt-3 p-3 bg-dark bg-opacity-40 rounded-3 border border-secondary border-opacity-10">
                                  <span className="small text-muted fw-bold d-block"><i className="bi bi-chat-text-fill me-1 text-primary"></i>Retroalimentación del Instructor:</span>
                                  <p className="text-secondary small m-0 mt-1">{submission.feedback}</p>
                                </div>
                              )}

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ----------------------------------------------------
              VISTA 6: CALIFICACIONES (Aprendiz)
              ---------------------------------------------------- */}
          {activeTab === 'aprendiz_calificaciones' && currentUser?.role === 'aprendiz' && (
            <>
              <div className="glass-card p-0 custom-table-container">
                <table className="table custom-table">
                  <thead>
                    <tr>
                      <th>Ficha</th>
                      <th>Evidencia (Actividad)</th>
                      <th>Fecha Envío</th>
                      <th>Calificación</th>
                      <th>Instructor Evaluador</th>
                      <th>Retroalimentación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySubmissions.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-4 text-secondary">No has realizado ninguna entrega aún.</td></tr>
                    ) : (
                      mySubmissions.map(sub => (
                        <tr key={sub.id}>
                          <td><code>{sub.course_code}</code></td>
                          <td><strong className="text-white">{sub.activity_title}</strong></td>
                          <td>{new Date(sub.submitted_at).toLocaleDateString()}</td>
                          <td>
                            {sub.grade ? (
                              <span className={`badge-custom badge-${sub.grade === 'Aprobado' ? 'aprendiz' : 'danger'}`}>{sub.grade}</span>
                            ) : (
                              <span className="badge bg-warning bg-opacity-10 text-warning py-1 px-2 border border-warning border-opacity-25 small">Pendiente</span>
                            )}
                          </td>
                          <td>{sub.graded_by ? sub.grader_name : <span className="text-muted small">Sin calificar</span>}</td>
                          <td style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: '0.85rem' }}>
                            {sub.feedback || <span className="text-muted small">-</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </main>
      </div>

      {/* ----------------------------------------------------
          MODALES DE COORDINADOR
          ---------------------------------------------------- */}
      {/* 1. Modal de Usuario (Crear/Editar) */}
      {showUserModal && (
        <div className="modal fade show animate-fade-in" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-title m-0">
                  {editingUser ? `Editar Usuario: ${editingUser.fullname}` : 'Crear Nuevo Usuario'}
                </h5>
                <button type="button" className="modal-close-btn" onClick={() => setShowUserModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <form onSubmit={handleSaveUser}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 mb-3 small">{error}</div>}
                  
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Nombre Completo</label>
                    <input type="text" className="form-control input-custom" required placeholder="Ej. Juan Gómez" value={userFormData.fullname} onChange={(e) => setUserFormData({ ...userFormData, fullname: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Correo Electrónico</label>
                    <input type="email" className="form-control input-custom" required placeholder="Ej. juan@correo.com" value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} />
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label text-secondary small fw-bold">Nombre de Usuario</label>
                      <input type="text" className="form-control input-custom" required placeholder="Ej. jgomez" value={userFormData.username} onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })} />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label text-secondary small fw-bold">Rol</label>
                      <select className="form-select input-custom" value={userFormData.role} onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })} style={{ appearance: 'auto' }}>
                        <option value="aprendiz">Aprendiz</option>
                        <option value="instructor">Instructor</option>
                        <option value="coordinador">Coordinador</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-1">
                    <label className="form-label text-secondary small fw-bold">Contraseña {editingUser && <span className="text-muted">(dejar en blanco para no modificar)</span>}</label>
                    <input type="password" className="form-control input-custom" required={!editingUser} placeholder={editingUser ? "Nueva contraseña (opcional)" : "Escribe una contraseña segura"} value={userFormData.password} onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer modal-footer-custom d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-custom-secondary py-2" onClick={() => setShowUserModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-custom-primary py-2">{editingUser ? 'Guardar Cambios' : 'Crear Usuario'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Usuario */}
      {showDeleteUserModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom d-flex justify-content-between align-items-center border-0 pb-0">
                <h5 className="modal-title font-title text-danger m-0">Confirmar Eliminación de Usuario</h5>
                <button type="button" className="modal-close-btn" onClick={() => setShowDeleteUserModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="modal-body p-4">
                <p className="m-0">¿Deseas eliminar permanentemente al usuario <strong>{userToDelete?.fullname}</strong>?</p>
              </div>
              <div className="modal-footer modal-footer-custom border-0 pt-0 d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-custom-secondary py-2" onClick={() => setShowDeleteUserModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger py-2" onClick={handleDeleteUser} style={{ borderRadius: '10px' }}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal de Curso (Crear/Editar) */}
      {showCourseModal && (
        <div className="modal fade show animate-fade-in" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-title m-0">
                  {editingCourse ? `Editar Ficha: ${editingCourse.code}` : 'Crear Nueva Ficha / Curso'}
                </h5>
                <button type="button" className="modal-close-btn" onClick={() => setShowCourseModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <form onSubmit={handleSaveCourse}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 mb-3 small">{error}</div>}
                  
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Código de Ficha</label>
                    <input type="text" className="form-control input-custom" required placeholder="Ej. 3118315" value={courseFormData.code} onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })} />
                  </div>
                  <div className="mb-1">
                    <label className="form-label text-secondary small fw-bold">Nombre del Programa</label>
                    <input type="text" className="form-control input-custom" required placeholder="Ej. Análisis y Desarrollo de Software" value={courseFormData.name} onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer modal-footer-custom d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-custom-secondary py-2" onClick={() => setShowCourseModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-custom-primary py-2">{editingCourse ? 'Guardar Cambios' : 'Crear Curso'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Curso */}
      {showDeleteCourseModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom d-flex justify-content-between align-items-center border-0 pb-0">
                <h5 className="modal-title font-title text-danger m-0">Confirmar Eliminación de Curso</h5>
                <button type="button" className="modal-close-btn" onClick={() => setShowDeleteCourseModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="modal-body p-4">
                <p className="m-0">¿Deseas eliminar la ficha <strong>{courseToDelete?.code} - {courseToDelete?.name}</strong>?</p>
                <p className="text-secondary small mt-2 m-0">Advertencia: Se eliminarán todas las asignaciones y actividades de esta ficha.</p>
              </div>
              <div className="modal-footer modal-footer-custom border-0 pt-0 d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-custom-secondary py-2" onClick={() => setShowDeleteCourseModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger py-2" onClick={handleDeleteCourse} style={{ borderRadius: '10px' }}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal de Asignación */}
      {showAssignModal && (
        <div className="modal fade show animate-fade-in" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-title m-0">Vincular Integrante a Ficha</h5>
                <button type="button" className="modal-close-btn" onClick={() => setShowAssignModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <form onSubmit={handleSaveAssignment}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 mb-3 small">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Seleccionar Usuario</label>
                    <select className="form-select input-custom" required value={selectedUserForAssign} onChange={(e) => setSelectedUserForAssign(e.target.value)} style={{ appearance: 'auto' }}>
                      <option value="">-- Elige un usuario --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.fullname} ({u.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-1">
                    <label className="form-label text-secondary small fw-bold">Seleccionar Ficha / Curso</label>
                    <select className="form-select input-custom" required value={selectedCourseForAssign} onChange={(e) => setSelectedCourseForAssign(e.target.value)} style={{ appearance: 'auto' }}>
                      <option value="">-- Elige una ficha --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer modal-footer-custom d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-custom-secondary py-2" onClick={() => setShowAssignModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-custom-primary py-2">Crear Vinculación</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* ----------------------------------------------------
          MODALES DE INSTRUCTOR
          ---------------------------------------------------- */}
      {/* 1. Modal de Actividad (Crear/Editar) */}
      {showActivityModal && (
        <div className="modal fade show animate-fade-in" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-title m-0">
                  {editingActivity ? 'Editar Evidencia' : 'Plantear Nueva Evidencia'}
                </h5>
                <button type="button" className="modal-close-btn" onClick={() => setShowActivityModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <form onSubmit={handleSaveActivity}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 mb-3 small">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Título de la Actividad</label>
                    <input type="text" className="form-control input-custom" required placeholder="Ej. Evidencia 1: Taller de Base de Datos" value={activityFormData.title} onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Instrucciones y Descripción</label>
                    <textarea className="form-control input-custom" rows="4" required placeholder="Describe las instrucciones de la entrega..." value={activityFormData.description} onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}></textarea>
                  </div>
                  <div className="mb-1">
                    <label className="form-label text-secondary small fw-bold">Fecha y Hora Límite de Entrega</label>
                    <input type="datetime-local" className="form-control input-custom" required value={activityFormData.due_date} onChange={(e) => setActivityFormData({ ...activityFormData, due_date: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer modal-footer-custom d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-custom-secondary py-2" onClick={() => setShowActivityModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-custom-primary py-2">{editingActivity ? 'Guardar Cambios' : 'Publicar Evidencia'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Actividad */}
      {showDeleteActivityModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom d-flex justify-content-between align-items-center border-0 pb-0">
                <h5 className="modal-title font-title text-danger m-0">Confirmar Eliminación de Actividad</h5>
                <button type="button" className="modal-close-btn" onClick={() => setShowDeleteActivityModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="modal-body p-4">
                <p className="m-0">¿Deseas eliminar la actividad <strong>{activityToDelete?.title}</strong>?</p>
                <p className="text-secondary small mt-2 m-0">Advertencia: Se borrarán permanentemente todos los envíos y notas asignadas a esta evidencia.</p>
              </div>
              <div className="modal-footer modal-footer-custom border-0 pt-0 d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-custom-secondary py-2" onClick={() => setShowDeleteActivityModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-danger py-2" onClick={handleDeleteActivity} style={{ borderRadius: '10px' }}>Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal de Calificación (Evaluación por Instructor) */}
      {showGradeModal && (
        <div className="modal fade show animate-fade-in" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-title m-0">Calificar Evidencia</h5>
                <button type="button" className="modal-close-btn" onClick={() => setShowGradeModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <form onSubmit={handleGradeSubmission}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 mb-3 small">{error}</div>}

                  <p className="mb-3">Evaluando entrega de: <strong>{selectedSubmissionForGrade?.apprentice_name}</strong></p>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Calificación SENA</label>
                    <select className="form-select input-custom" required value={gradeFormData.grade} onChange={(e) => setGradeFormData({ ...gradeFormData, grade: e.target.value })} style={{ appearance: 'auto' }}>
                      <option value="Aprobado">Aprobado (A)</option>
                      <option value="Deficiente">Deficiente (D)</option>
                    </select>
                  </div>
                  <div className="mb-1">
                    <label className="form-label text-secondary small fw-bold">Retroalimentación / Comentarios</label>
                    <textarea className="form-control input-custom" rows="4" placeholder="Escribe recomendaciones, felicitaciones o puntos a corregir..." value={gradeFormData.feedback} onChange={(e) => setGradeFormData({ ...gradeFormData, feedback: e.target.value })}></textarea>
                  </div>
                </div>
                <div className="modal-footer modal-footer-custom d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-custom-secondary py-2" onClick={() => setShowGradeModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-custom-primary py-2">Guardar Evaluación</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* ----------------------------------------------------
          MODALES DE APRENDIZ
          ---------------------------------------------------- */}
      {/* 1. Modal de Envío de Trabajo */}
      {showSubmitModal && (
        <div className="modal fade show animate-fade-in" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-content-custom">
              <div className="modal-header modal-header-custom d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-title m-0">Enviar Evidencia</h5>
                <button type="button" className="modal-close-btn" onClick={() => setShowSubmitModal(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <form onSubmit={handleSubmitEvidence}>
                <div className="modal-body p-4">
                  {error && <div className="alert alert-danger py-2 mb-3 small">{error}</div>}

                  <p className="mb-3">Actividad: <strong>{selectedActivity?.title}</strong></p>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-bold">Enlace del Archivo (Google Drive / GitHub / URL de documento)</label>
                    <input 
                      type="url" 
                      className="form-control input-custom" 
                      required 
                      placeholder="https://..." 
                      value={submissionFormData.file_url} 
                      onChange={(e) => setSubmissionFormData({ ...submissionFormData, file_url: e.target.value })} 
                    />
                  </div>
                  <div className="mb-1">
                    <label className="form-label text-secondary small fw-bold">Comentarios adicionales para el Instructor</label>
                    <textarea className="form-control input-custom" rows="3" placeholder="Mensaje adicional (opcional)..." value={submissionFormData.comments} onChange={(e) => setSubmissionFormData({ ...submissionFormData, comments: e.target.value })}></textarea>
                  </div>
                </div>
                <div className="modal-footer modal-footer-custom d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-custom-secondary py-2" onClick={() => setShowSubmitModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-custom-primary py-2">Enviar Trabajo</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  // Helper para abrir modal de creación de usuario
  function handleOpenCreateModal() {
    setEditingUser(null);
    setUserFormData({ username: '', fullname: '', email: '', password: '', role: 'aprendiz' });
    setError('');
    setShowUserModal(true);
  }

  // Helper para abrir modal de edición de usuario
  function handleOpenEditModal(user) {
    setEditingUser(user);
    setUserFormData({ username: user.username, fullname: user.fullname, email: user.email, password: '', role: user.role });
    setError('');
    setShowUserModal(true);
  }
}

export default Dashboard;
