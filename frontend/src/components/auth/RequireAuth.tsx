import { Navigate, useLocation } from 'react-router-dom';
import { authService, Role } from '@/services/auth';

interface RequireAuthProps {
    children: JSX.Element;
    role?: Role; // If omitted, just checks if logged in
}

export const RequireAuth = ({ children, role }: RequireAuthProps) => {
    const user = authService.getCurrentUser();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (role && user.role !== role) {
        // Redirect to their appropriate dashboard if they try to access wrong area
        let dest = '/login';
        if (user.role === 'admin') {
            dest = '/admin/dashboard';
        } else if (user.role === 'teacher') {
            dest = '/dashboard';
        } else if (user.role === 'student') {
            dest = '/student-dashboard';
        }
        return <Navigate to={dest} replace />;
    }

    return children;
};
