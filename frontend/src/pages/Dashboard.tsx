import { useEffect, useState } from "react";
import { authService } from "@/services/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    Calendar,
    TrendingUp,
    ClipboardList,
    BookOpen,
    History,
    Eye,
    Edit,
    ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";

interface SessionData {
    _id: string;
    subject: string;
    class: string;
    date: string;
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    attendancePercentage: number;
}

const Dashboard = () => {
    const user = authService.getCurrentUser();
    const [stats, setStats] = useState({
        totalStudents: 0,
        todaySessions: 0,
        avgAttendance: 0,
        classesToday: 0,
    });
    const [recentSessions, setRecentSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Students (Independent Call)
            let studentCount = 0;
            try {
                console.log('Fetching students...');
                const studentsResponse = await api.get('/students');
                if (studentsResponse.data.students && Array.isArray(studentsResponse.data.students)) {
                    studentCount = studentsResponse.data.students.length;
                } else if (Array.isArray(studentsResponse.data)) {
                    studentCount = studentsResponse.data.length;
                }
                console.log('Students fetched:', studentCount);
            } catch (studentError) {
                console.error('Error fetching students:', studentError);
            }

            // 2. Fetch Sessions
            let sessions: SessionData[] = [];
            try {
                const sessionsResponse = await api.get('/attendance/sessions');
                if (sessionsResponse.data.sessions && Array.isArray(sessionsResponse.data.sessions)) {
                    sessions = sessionsResponse.data.sessions;
                } else if (Array.isArray(sessionsResponse.data)) {
                    sessions = sessionsResponse.data;
                }
                setRecentSessions(sessions.slice(0, 5));
            } catch (sessionError) {
                console.error('Error fetching sessions:', sessionError);
            }

            // 3. Calculate Session Stats
            const todaySessions = sessions.filter((s: SessionData) => {
                const sessionDate = new Date(s.date).toDateString();
                const today = new Date().toDateString();
                return sessionDate === today;
            }).length;

            const avgAttendance = sessions.length > 0
                ? Math.round(sessions.reduce((acc: number, s: SessionData) =>
                    acc + s.attendancePercentage, 0) / sessions.length)
                : 0;

            // 4. Update State
            setStats({
                totalStudents: studentCount,
                todaySessions,
                avgAttendance,
                classesToday: todaySessions,
            });

        } catch (error) {
            console.error("Critical error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: "Total Students",
            value: stats.totalStudents,
            description: "Across all departments",
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Today's Sessions",
            value: stats.todaySessions,
            description: stats.todaySessions === 0 ? "No sessions yet" : "Sessions completed",
            icon: Calendar,
            color: "text-green-600",
            bgColor: "bg-green-50",
        },
        {
            title: "Avg. Attendance",
            value: `${stats.avgAttendance}%`,
            description: "Across all sessions",
            icon: TrendingUp,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
        {
            title: "Classes Today",
            value: stats.classesToday,
            description: stats.classesToday === 0 ? "No classes yet" : "Classes scheduled",
            icon: ClipboardList,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
    ];

    const quickActions = [
        {
            label: "Mark Attendance",
            icon: ClipboardList,
            link: "/attendance",
            color: "text-blue-600",
        },
        {
            label: "Manage Subjects",
            icon: BookOpen,
            link: "/subjects",
            color: "text-green-600",
        },
        {
            label: "View Student Records",
            icon: Users,
            link: "/students",
            color: "text-purple-600",
        },
        {
            label: "Class History",
            icon: History,
            link: "/history",
            color: "text-orange-600",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <Icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Sessions */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Sessions</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Latest attendance records
                            </p>
                        </div>
                        <Link to="/history">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Loading sessions...
                            </div>
                        ) : recentSessions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No sessions yet. Start by marking attendance!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentSessions.map((session) => (
                                    <div
                                        key={session._id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold">{session.class}</h4>
                                                <span className="text-sm text-muted-foreground">
                                                    {session.subject}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(session.date).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    {session.totalStudents} students
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                                    ● {session.presentCount} Present
                                                </span>
                                                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                                                    ● {session.absentCount} Absent
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right mr-4">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {session.attendancePercentage}%
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <p className="text-sm text-muted-foreground">Common tasks</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {quickActions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <Link key={index} to={action.link}>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start hover:bg-accent"
                                        >
                                            <Icon className={`mr-3 h-5 w-5 ${action.color}`} />
                                            {action.label}
                                        </Button>
                                    </Link>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
