import { Outlet, Link, useLocation } from "react-router-dom";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    ClipboardList,
    History,
    Settings,
    LogOut,
    FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";

export const DashboardLayout = () => {
    const user = authService.getCurrentUser();
    const location = useLocation();

    const handleLogout = () => {
        authService.logout();
    };

    const navItems = [
        {
            path: "/dashboard",
            icon: LayoutDashboard,
            label: "Dashboard",
        },
        {
            path: "/marks",
            icon: FileText,
            label: "Upload Marks",
        },
        {
            path: "/attendance",
            icon: ClipboardList,
            label: "Mark Attendance",
        },
        {
            path: "/history",
            icon: History,
            label: "Class History",
        },
        {
            path: "/students",
            icon: Users,
            label: "Student Records",
        },
        {
            path: "/settings",
            icon: Settings,
            label: "Settings",
        },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
                {/* Logo Section */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">EasyAttendance</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-10">Management System</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-600 font-medium"
                                        : "text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Section */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user?.name?.charAt(0).toUpperCase() || "T"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user?.name || "Teacher"}
                            </p>
                            <p className="text-xs text-gray-500">Faculty</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto flex flex-col">
                {/* Top Bar with Notification */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end">
                    <NotificationBell />
                </div>
                <div className="p-6 flex-1">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
