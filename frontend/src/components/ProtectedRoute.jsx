import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Componente Guard que protege las rutas del frontend.
 * Si no hay un token de autenticación válido, redirige al Login.
 * Si se especifican roles permitidos, valida que el rol del usuario coincida.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');

  // Si no hay token, redirigir al Login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Si se requieren roles específicos, validar el rol del usuario
  if (allowedRoles) {
    try {
      const user = JSON.parse(userJson);
      
      if (!user || !allowedRoles.includes(user.role)) {
        // Si no tiene el rol adecuado, redirigir a una ruta segura (Dashboard)
        return <Navigate to="/dashboard" replace />;
      }
    } catch (error) {
      // Si ocurre un error al procesar el usuario, limpiar sesión y redirigir al Login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/" replace />;
    }
  }

  // Si pasa todas las validaciones, renderizar la ruta hija
  return children;
};

export default ProtectedRoute;
