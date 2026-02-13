import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { authService, User } from '@/services/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, UserCheck, CheckCircle, Clock, Users, CalendarDays, GraduationCap, X, Check, Mail, Pencil, Trash2, Search, Filter, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import api from '@/services/api';

interface StudentSummary {
    _id: string;
    studentId: string; // The ID used for relations
    name: string;
    rollNumber: string;
    email: string;
    year: number;
    currentSemester: number;
    cgpa?: number;
    totalClasses?: number;
    present?: number;
    absent?: number;
    od?: number;
    percentage?: number;
}

interface LeaveRequest {
    _id: string;
    requestId: string;
    studentName: string;
    rollNumber: string;
    type: string;
    fromDate: string;
    toDate: string;
    reason: string;
    status: string;
    createdAt: string;
}

interface PendingStudent {
    _id: string;
    userId: string;
    name: string;
    email: string;
    rollNumber: string;
    year: number;
    currentSemester: number;
    createdAt: string;
}

interface AttendanceStat {
    period: number;
    subjectName: string;
    totalPresent: number;
    totalAbsent: number;
    totalOD: number;
    absentees: string[];
}

function TodaysAttendanceSection() {
    const [stats, setStats] = useState<AttendanceStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await api.get('/advisor/todays-attendance');
                if (response.data.success) {
                    setStats(response.data.stats);
                }
            } catch (error) {
                console.error('Error loading attendance:', error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (loading) {
        return (
            <div className="py-12 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <Card className="border-none shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-600" /> Today's Attendance Overview
                </CardTitle>
                <CardDescription>Period-wise attendance summary for your section.</CardDescription>
            </CardHeader>
            <CardContent>
                {stats.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                        <CalendarDays className="h-10 w-10 text-slate-300 mb-2" />
                        <p>No attendance records found for today.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Period</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead className="text-center text-emerald-600">Present</TableHead>
                                <TableHead className="text-center text-rose-500">Absent</TableHead>
                                <TableHead className="text-center text-amber-500">On Duty</TableHead>
                                <TableHead className="text-right">Absentees</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.map((stat) => (
                                <TableRow key={stat.period}>
                                    <TableCell className="font-bold">Period {stat.period}</TableCell>
                                    <TableCell>{stat.subjectName}</TableCell>
                                    <TableCell className="text-center font-bold text-emerald-600">
                                        {stat.totalPresent}
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-rose-500">
                                        {stat.totalAbsent}
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-amber-500">
                                        {stat.totalOD}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {stat.absentees.length > 0 ? (
                                            <div className="flex flex-wrap justify-end gap-1">
                                                {stat.absentees.slice(0, 3).map((roll, i) => (
                                                    <Badge key={i} variant="outline" className="text-rose-500 bg-rose-50 border-rose-100">
                                                        {roll}
                                                    </Badge>
                                                ))}
                                                {stat.absentees.length > 3 && (
                                                    <Badge variant="outline" className="text-slate-500">
                                                        +{stat.absentees.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

export default function AdvisorDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Data States
    const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
    const [myStudents, setMyStudents] = useState<StudentSummary[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'above75' | 'below50'>('all');

    // Detail View State
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [studentDetails, setStudentDetails] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Grade Update State (8 Semesters)
    const [gradeForm, setGradeForm] = useState({
        semesterResults: Array.from({ length: 8 }, (_, i) => ({ semester: i + 1, sgpa: '' })),
        cgpa: ''
    });

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'advisor') {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        loadDashboardData();
    }, [navigate]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadPendingStudents(),
                loadMyStudents(),
                loadLeaveRequests()
            ]);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingStudents = async () => {
        try {
            const response = await api.get('/advisor/pending-students');
            if (response.data.success) setPendingStudents(response.data.students);
        } catch (error) { console.error('Pending load error', error); }
    };

    const loadMyStudents = async () => {
        try {
            const response = await api.get('/advisor/my-students');
            if (response.data.success) {
                const students = response.data.students;

                // Fetch stats for these students
                try {
                    const statsResponse = await api.get('/attendance/stats/bulk');
                    if (statsResponse.data.success && statsResponse.data.stats) {
                        const statsMap = new Map();
                        statsResponse.data.stats.forEach((stat: any) => {
                            statsMap.set(stat.studentId, stat);
                        });

                        const enriched = students.map((s: any) => {
                            const stats = statsMap.get(s.studentId) || {
                                totalClasses: 0,
                                present: 0,
                                absent: 0,
                                od: 0,
                                percentage: 0
                            };
                            return { ...s, ...stats };
                        });
                        setMyStudents(enriched);
                    } else {
                        setMyStudents(students);
                    }
                } catch (error) {
                    console.error('Stats load error', error);
                    setMyStudents(students);
                }
            }
        } catch (error) { console.error('Students load error', error); }
    };

    const loadLeaveRequests = async () => {
        try {
            const response = await api.get('/advisor/leave-requests');
            if (response.data.success) setLeaveRequests(response.data.requests);
        } catch (error) { console.error('Leaves load error', error); }
    };

    // Actions
    const handleApproveStudent = async (studentUserId: string, studentName: string) => {
        try {
            await api.put(`/advisor/approve-student/${studentUserId}`);
            toast.success(`Approved access for ${studentName}`);
            loadPendingStudents();
            loadMyStudents(); // Refresh main list too
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to approve');
        }
    };

    const handleLeaveAction = async (requestId: string, status: 'approved' | 'rejected') => {
        try {
            await api.put(`/advisor/leave-request/${requestId}`, { status });
            toast.success(`Request ${status}`);
            loadLeaveRequests();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Action failed');
        }
    };

    const handleDeleteStudentFromList = async (studentId: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;
        try {
            await api.delete(`/students/${studentId}`);
            toast.success('Student deleted successfully');
            loadMyStudents();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete student');
        }
    };

    const openStudentDetails = async (studentId: string) => {
        setSelectedStudentId(studentId);
        setIsDetailsOpen(true);
        setStudentDetails(null); // Reset prev details

        try {
            const response = await api.get(`/advisor/student/${studentId}`);
            if (response.data.success) {
                setStudentDetails(response.data);
                // Initialize grade form with current values if available
                // Initialize grade form with all 8 sems
                const existingResults = response.data.student.semesterResults || [];
                const fullResults = Array.from({ length: 8 }, (_, i) => {
                    const sem = i + 1;
                    const found = existingResults.find((r: any) => r.semester === sem);
                    return { semester: sem, sgpa: found ? found.sgpa.toString() : '' };
                });

                setGradeForm({
                    semesterResults: fullResults,
                    cgpa: response.data.student.cgpa?.toString() || ''
                });
            }
        } catch (error) {
            toast.error('Failed to load details');
            setIsDetailsOpen(false);
        }
    };

    const handleUpdateGrades = async () => {
        if (!selectedStudentId) return;

        try {
            await api.put(`/advisor/student/${selectedStudentId}/grades`, {
                semesterResults: gradeForm.semesterResults.map(r => ({
                    semester: r.semester,
                    sgpa: r.sgpa !== '' ? parseFloat(r.sgpa) : undefined
                })).filter(r => r.sgpa !== undefined),
                cgpa: gradeForm.cgpa !== '' ? parseFloat(gradeForm.cgpa) : undefined
            });
            toast.success('Grades updated successfully');
            openStudentDetails(selectedStudentId); // Reload details
            loadMyStudents(); // Update listing
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update grades');
        }
    };

    const filteredStudents = myStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (attendanceFilter === 'above75') return (student.percentage || 0) >= 75;
        if (attendanceFilter === 'below50') return (student.percentage || 0) < 50;

        return true;
    }).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                        EA
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-lg text-slate-800">Advisor Portal</h1>
                        <p className="text-xs text-slate-500 font-medium">
                            {user?.departmentId} • Section {user?.section}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-700">{user?.name}</span>
                    <Button variant="ghost" size="icon" onClick={() => { authService.logout(); navigate('/login'); }} className="text-rose-500">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            <main className="p-8 max-w-7xl mx-auto space-y-8">
                <Tabs defaultValue="students" className="w-full space-y-6">
                    <TabsList className="bg-white border border-slate-200 p-1 w-full md:w-auto h-auto">
                        <TabsTrigger value="students" className="px-6 py-2">My Students</TabsTrigger>
                        <TabsTrigger value="attendance" className="px-6 py-2">Today's Attendance</TabsTrigger>
                        <TabsTrigger value="leaves" className="px-6 py-2">Leave Requests ({leaveRequests.length})</TabsTrigger>
                        <TabsTrigger value="pending" className="px-6 py-2">Account Approvals ({pendingStudents.length})</TabsTrigger>
                    </TabsList>

                    {/* My Students Tab */}
                    <TabsContent value="students" className="space-y-6">
                        {/* Search and Filters */}
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 group w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                                <Input
                                    placeholder="Search by name or roll number..."
                                    className="pl-10 h-11 border-slate-200 focus:border-indigo-600 focus:ring-indigo-100 transition-all bg-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button
                                    variant={attendanceFilter === 'all' ? 'default' : 'outline'}
                                    className={attendanceFilter === 'all' ? 'bg-indigo-600' : 'border-slate-200'}
                                    onClick={() => setAttendanceFilter('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={attendanceFilter === 'above75' ? 'default' : 'outline'}
                                    className={attendanceFilter === 'above75' ? 'bg-emerald-600 text-white' : 'border-slate-200'}
                                    onClick={() => setAttendanceFilter('above75')}
                                >
                                    Above 75%
                                </Button>
                                <Button
                                    variant={attendanceFilter === 'below50' ? 'default' : 'outline'}
                                    className={attendanceFilter === 'below50' ? 'bg-rose-600 text-white' : 'border-slate-200'}
                                    onClick={() => setAttendanceFilter('below50')}
                                >
                                    Below 50%
                                </Button>
                            </div>
                        </div>

                        {/* Summary Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-white border-none shadow-sm h-32 flex flex-col justify-center">
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold font-display text-slate-800">{myStudents.length}</p>
                                        <p className="text-sm text-muted-foreground">Total Students</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-none shadow-sm h-32 flex flex-col justify-center ring-1 ring-emerald-50">
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold font-display text-emerald-600">
                                            {myStudents.filter(s => (s.percentage || 0) >= 75).length}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Above 75%</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-none shadow-sm h-32 flex flex-col justify-center ring-1 ring-rose-50">
                                <CardContent className="pt-6">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold font-display text-rose-600">
                                            {myStudents.filter(s => (s.percentage || 0) < 50).length}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Below 50%</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="border-b border-slate-50 bg-white/50">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-indigo-600" /> Class Performance</CardTitle>
                                        <CardDescription>
                                            {attendanceFilter === 'all'
                                                ? `Showing ${filteredStudents.length} students`
                                                : `Showing ${filteredStudents.length} students filtered by attendance`}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow>
                                            <TableHead className="pl-6">Student</TableHead>
                                            <TableHead>Roll Number</TableHead>
                                            <TableHead className="text-center">Total</TableHead>
                                            <TableHead className="text-center">Present</TableHead>
                                            <TableHead className="text-center">Absent</TableHead>
                                            <TableHead className="text-center">OD</TableHead>
                                            <TableHead>Attendance</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-right pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStudents.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                                    No students found matching your criteria.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredStudents.map((student) => (
                                                <TableRow key={student._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-100">
                                                                {student.name.split(' ').map((n: string) => n[0]).join('')}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-900">{student.name}</p>
                                                                <p className="text-xs text-muted-foreground">{student.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">{student.rollNumber}</TableCell>
                                                    <TableCell className="text-center text-slate-600">{student.totalClasses || 0}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-emerald-600 font-semibold">{student.present || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-rose-500 font-semibold">{student.absent || 0}</span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-amber-500 font-semibold">{student.od || 0}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3 min-w-[120px]">
                                                            <Progress
                                                                value={student.percentage}
                                                                className={cn(
                                                                    "h-1.5 w-16",
                                                                    (student.percentage || 0) >= 75 ? "[&>div]:bg-emerald-500" :
                                                                        (student.percentage || 0) >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-rose-500"
                                                                )}
                                                            />
                                                            <span className={cn(
                                                                "text-xs font-bold",
                                                                (student.percentage || 0) >= 75 ? "text-emerald-600" :
                                                                    (student.percentage || 0) >= 50 ? "text-amber-600" : "text-rose-600"
                                                            )}>
                                                                {student.percentage || 0}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {(student.percentage || 0) >= 75 ? (
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none hover:bg-emerald-50 px-2 py-0.5 rounded-full">
                                                                <TrendingUp className="h-3 w-3 mr-1" /> Good
                                                            </Badge>
                                                        ) : (student.percentage || 0) >= 50 ? (
                                                            <Badge className="bg-amber-50 text-amber-700 border-amber-100 shadow-none hover:bg-amber-50 px-2 py-0.5 rounded-full">
                                                                <Minus className="h-3 w-3 mr-1" /> Warning
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-rose-50 text-rose-700 border-rose-100 shadow-none hover:bg-rose-50 px-2 py-0.5 rounded-full">
                                                                <TrendingDown className="h-3 w-3 mr-1" /> Critical
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6 space-x-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-auto px-3 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                            onClick={() => openStudentDetails(student.studentId)}
                                                        >
                                                            View
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                            onClick={() => navigate('/advisor/students', { state: { editStudentId: student.studentId } })}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                            onClick={() => handleDeleteStudentFromList(student.studentId, student.name)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Today's Attendance Tab */}
                    <TabsContent value="attendance">
                        <TodaysAttendanceSection />
                    </TabsContent>

                    {/* Leave Requests Tab */}
                    <TabsContent value="leaves">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-amber-600" /> Pending Leave Requests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {leaveRequests.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">No pending leave requests.</div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Dates</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {leaveRequests.map((req) => (
                                                <TableRow key={req._id}>
                                                    <TableCell>
                                                        <div className="font-medium">{req.studentName}</div>
                                                        <div className="text-xs text-slate-500">{req.rollNumber}</div>
                                                    </TableCell>
                                                    <TableCell><Badge variant="outline">{req.type}</Badge></TableCell>
                                                    <TableCell className="text-sm">
                                                        {new Date(req.fromDate).toLocaleDateString()} - {new Date(req.toDate).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate" title={req.reason}>{req.reason}</TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleLeaveAction(req.requestId, 'approved')}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => handleLeaveAction(req.requestId, 'rejected')}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Pending Approvals Tab */}
                    <TabsContent value="pending">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-blue-600" /> Account Approvals</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Roll Number</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingStudents.map((student) => (
                                            <TableRow key={student.userId}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell>{student.rollNumber}</TableCell>
                                                <TableCell>{student.email}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => handleApproveStudent(student.userId, student.name)}>
                                                        Approve
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Student Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Student Details</DialogTitle>
                        <DialogDescription>Academic performance and records</DialogDescription>
                    </DialogHeader>

                    {studentDetails ? (
                        <div className="space-y-8">
                            {/* Detailed Info Header */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                                <div>
                                    <h3 className="font-bold text-lg">{studentDetails.student.name}</h3>
                                    <p className="text-slate-500">{studentDetails.student.rollNumber}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-semibold">Attendance</div>
                                    <div className={`text-2xl font-bold ${parseFloat(studentDetails.attendance.percentage) < 75 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {studentDetails.attendance.percentage}%
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {studentDetails.attendance.presentCount}/{studentDetails.attendance.totalSessions} Sessions
                                    </div>
                                </div>
                            </div>

                            {/* Grade Update Section */}
                            <div className="border border-indigo-100 rounded-lg p-5 bg-indigo-50/50">
                                <h4 className="font-semibold mb-6 flex items-center gap-2 text-indigo-900">
                                    <GraduationCap className="h-5 w-5 text-indigo-600" /> Academic CGPA & Semester SGPA
                                </h4>

                                <div className="space-y-6">
                                    {/* CGPA Input (Main) */}
                                    <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                                        <Label className="text-indigo-900 font-bold text-sm mb-2 block uppercase tracking-wider">Overall CGPA</Label>
                                        <Input
                                            type="number" step="0.01"
                                            placeholder="Enter overall CGPA (e.g. 8.50)"
                                            className="text-lg font-bold border-indigo-200"
                                            value={gradeForm.cgpa}
                                            onChange={(e) => setGradeForm({ ...gradeForm, cgpa: e.target.value })}
                                        />
                                    </div>

                                    {/* 8 Semester Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {gradeForm.semesterResults.map((res, idx) => (
                                            <div key={res.semester} className="space-y-1.5 p-3 bg-white rounded-lg border border-slate-200">
                                                <Label className="text-[10px] uppercase font-bold text-slate-500">Semester {res.semester}</Label>
                                                <Input
                                                    type="number" step="0.01"
                                                    placeholder="SGPA"
                                                    className="h-9 text-sm"
                                                    value={res.sgpa}
                                                    onChange={(e) => {
                                                        const newResults = [...gradeForm.semesterResults];
                                                        newResults[idx].sgpa = e.target.value;
                                                        setGradeForm({ ...gradeForm, semesterResults: newResults });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-6 text-lg" onClick={handleUpdateGrades}>
                                    Save All Academic Records
                                </Button>
                            </div>
                            {/* Recent Marks */}
                            <div>
                                <h4 className="font-semibold mb-3">Recent Marks</h4>
                                {studentDetails.recentMarks.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>Exam</TableHead>
                                                <TableHead>Score</TableHead>
                                                <TableHead>Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {studentDetails.recentMarks.map((mark: any) => (
                                                <TableRow key={mark._id}>
                                                    <TableCell className="font-medium">{mark.subjectName}</TableCell>
                                                    <TableCell><Badge variant="outline">{mark.assessmentType}</Badge></TableCell>
                                                    <TableCell>
                                                        <span className={mark.marks < 40 ? 'text-red-500 font-bold' : ''}>
                                                            {mark.marks}/{mark.maxMarks}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-slate-500">{new Date(mark.createdAt).toLocaleDateString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">No recent marks found.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
