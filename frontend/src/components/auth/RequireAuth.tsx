import { Navigate, useLocation } from 'react-router-dom';
import { authService, Role } from '@/services/auth';

interface RequireAuthProps {
    children: JSX.Element;
    role?: Role | Role[]; // Support single role or multiple roles
}

export const RequireAuth = ({ children, role }: RequireAuthProps) => {
    const user = authService.getCurrentUser();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (role) {
        const roles = Array.isArray(role) ? role : [role];
        if (!roles.includes(user.role as Role)) {
            // Redirect to their appropriate dashboard if they try to access wrong area
            let dest = '/login';
            if (user.role === 'admin') {
                dest = '/admin/dashboard';
            } else if (user.role === 'teacher') {
                dest = '/dashboard';
            } else if (user.role === 'student') {
                dest = '/student-dashboard';
            } else if (user.role === 'advisor') {
                dest = '/advisor/dashboard';
            }
            return <Navigate to={dest} replace />;
        }
    }

    return children;
};
