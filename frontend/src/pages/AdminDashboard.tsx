
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { authService } from '@/services/auth';
import { dataService } from '@/services/data';
import { useNavigate } from 'react-router-dom';
import { departments, years, sections } from '@/data/mockData';
import { toast } from 'sonner';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    FileText,
    LogOut,
    Plus,
    Trash2,
    Search,
    BookOpen,
    BarChart3,
    Calendar,
    Settings,
    UserCog,
    Upload,

    TrendingUp,
    TrendingDown,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Filter
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import api from '@/services/api';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalSessions: 0,
        attendanceRate: 0,
        studentGrowth: 5.2,
        teacherGrowth: 2.1,
        attendanceTrend: 'up' as 'up' | 'down'
    });

    const [attendanceTrendData, setAttendanceTrendData] = useState([
        { name: 'Mon', rate: 85 },
        { name: 'Tue', rate: 88 },
        { name: 'Wed', rate: 82 },
        { name: 'Thu', rate: 90 },
        { name: 'Fri', rate: 87 },
        { name: 'Sat', rate: 78 },
        { name: 'Sun', rate: 0 },
    ]);

    const [deptPerformanceData, setDeptPerformanceData] = useState([
        { name: 'IT', rate: 88, color: '#3b82f6' },
        { name: 'CSE', rate: 92, color: '#6366f1' },
        { name: 'ECE', rate: 84, color: '#8b5cf6' },
        { name: 'MECH', rate: 76, color: '#f59e0b' },
    ]);

    const [recentActivities, setRecentActivities] = useState([
        { id: 1, type: 'attendance', user: 'Dr. John Doe', action: 'marked attendance', target: 'IT - 3rd Year', time: '10 mins ago' },
        { id: 2, type: 'user', user: 'Admin', action: 'added new student', target: 'Tamil (23IT151)', time: '25 mins ago' },
        { id: 3, type: 'subject', user: 'Admin', action: 'assigned subject', target: 'Data Structures', time: '1 hour ago' },
        { id: 4, type: 'leave', user: 'Priya Kumar', action: 'submitted OD request', target: 'Cultural Event', time: '2 hours ago' },
    ]);

    const [students, setStudents] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [advisors, setAdvisors] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter states for students
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedSection, setSelectedSection] = useState('all');
    const [selectedDeptSubject, setSelectedDeptSubject] = useState('all');
    const [selectedYearSubject, setSelectedYearSubject] = useState('all');
    const [selectedSemSubject, setSelectedSemSubject] = useState('all');



    // Form states
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
    const [isAddAdvisorOpen, setIsAddAdvisorOpen] = useState(false);
    const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);

    const [newStudent, setNewStudent] = useState({
        name: '', email: '', rollNumber: '', departmentId: '1', year: 1, section: 'A'
    });
    const [newTeacher, setNewTeacher] = useState({
        name: '', email: '', teacherId: '', password: '', departmentId: '1'
    });
    const [newAdvisor, setNewAdvisor] = useState({
        name: '', email: '', advisorId: '', password: '', departmentId: '1', section: 'A'
    });
    const [newSubject, setNewSubject] = useState({
        name: '', code: '', departmentId: '1', year: 1, semester: 1, teacherId: '', credits: 3
    });
    const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false);
    const [assigningSubject, setAssigningSubject] = useState<any>(null);
    const [selectedTeacherForAssign, setSelectedTeacherForAssign] = useState('');
    const [selectedDeptForAssign, setSelectedDeptForAssign] = useState('');
    const [selectedSectionForAssign, setSelectedSectionForAssign] = useState('');



    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [allStudents, allTeachers, allAdvisors, allSessions, allLeaves, allSubjects, allAssignments] = await Promise.all([
                dataService.getAllStudents(),
                dataService.getAllTeachers(),
                dataService.getAllAdvisors(),
                dataService.getAllSessions(),
                dataService.getAllLeaves(),
                dataService.getAllSubjects(),
                dataService.getAllAssignments()
            ]);

            setStudents(allStudents);
            setTeachers(allTeachers);
            setAdvisors(allAdvisors);
            setSessions(allSessions);
            setLeaves(allLeaves);
            setSubjects(allSubjects);
            setAssignments(allAssignments);

            // Calculate Stats
            const totalStudents = allStudents.length;
            const totalTeachers = allTeachers.length;
            const totalSessions = allSessions.length;

            // Calculate avg attendance rate
            const totalPresent = allSessions.reduce((acc, s) => acc + (s.presentCount || 0), 0);
            const totalPotential = allSessions.reduce((acc, s) => acc + (s.totalStudents || 0), 0);
            const attendanceRate = totalPotential > 0 ? Math.round((totalPresent / totalPotential) * 100) : 0;

            setStats(prev => ({
                ...prev,
                totalStudents,
                totalTeachers,
                totalSessions,
                attendanceRate
            }));

            // Calculate department stats dynamically if sessions exist
            if (allSessions.length > 0) {
                const deptStats: Record<string, { total: number, present: number }> = {};
                allSessions.forEach(s => {
                    const dept = s.classInfo?.departmentCode || 'Other';
                    if (!deptStats[dept]) deptStats[dept] = { total: 0, present: 0 };
                    deptStats[dept].total += s.totalStudents || 0;
                    deptStats[dept].present += s.presentCount || 0;
                });

                const dynamicDeptData = Object.entries(deptStats).map(([name, data]) => ({
                    name,
                    rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
                    color: name === 'IT' ? '#3b82f6' : name === 'CSE' ? '#6366f1' : name === 'ECE' ? '#8b5cf6' : '#f59e0b'
                })).sort((a, b) => b.rate - a.rate);

                if (dynamicDeptData.length > 0) setDeptPerformanceData(dynamicDeptData);
            }

        } catch (error) {
            console.error('Error loading admin data:', error);
            toast.error('Failed to load dashboard data');
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleDeleteUser = async (type: 'student' | 'teacher', id: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            if (type === 'student') {
                await dataService.deleteStudent(id);
                toast.success('Student deleted');
            } else {
                await dataService.deleteTeacher(id);
                toast.success('Teacher deleted');
            }
            loadData(); // Refresh
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const handleDeleteSubject = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await dataService.deleteSubject(id);
            toast.success('Subject deleted');
            loadData();
        } catch (error) {
            toast.error('Failed to delete subject');
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dataService.addStudent({
                ...newStudent,
                id: '', // Will be generated
                password: newStudent.rollNumber // Default password
            } as any);
            toast.success('Student added successfully');
            setIsAddStudentOpen(false);
            setNewStudent({ name: '', email: '', rollNumber: '', departmentId: '1', year: 1, section: 'A' });
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to add student');
        }
    };

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Using dataService to create teacher without logging them in
            await dataService.addTeacher({
                name: newTeacher.name,
                email: newTeacher.email,
                teacherId: newTeacher.teacherId,
                password: newTeacher.password,
                departmentId: newTeacher.departmentId
            });
            toast.success('Teacher added successfully');
            setIsAddTeacherOpen(false);
            setNewTeacher({ name: '', email: '', teacherId: '', password: '', departmentId: '1' });
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to add teacher');
        }
    };

    const handleAddAdvisor = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Frontend: Attempting to add advisor', newAdvisor);
        try {
            const result = await dataService.addAdvisor(newAdvisor);
            console.log('Frontend: Advisor added successfully', result);

            // Show explicit alert as requested
            alert(`Advisor ${newAdvisor.name} created successfully!`);
            toast.success('Advisor added successfully');

            setIsAddAdvisorOpen(false);
            setNewAdvisor({ name: '', email: '', advisorId: '', password: '', departmentId: '1', section: 'A' });
            loadData();
        } catch (error: any) {
            console.error('Frontend: Error adding advisor', error);
            const errorMessage = error.message || 'Failed to add advisor';
            alert(`Error: ${errorMessage}`);
            toast.error(errorMessage);
        }
    };

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const deptsToCreate = newSubject.departmentId === 'all' ? departments.map(d => d.id) : [newSubject.departmentId];
            const yearsToCreate = newSubject.year === 0 ? years.map(y => y.value) : [newSubject.year];
            const semestersToCreate = newSubject.semester === 0 ? [1, 2, 3, 4, 5, 6, 7, 8] : [newSubject.semester];

            let successCount = 0;
            let totalToCreate = deptsToCreate.length * yearsToCreate.length * semestersToCreate.length;

            if (totalToCreate > 20) {
                if (!confirm(`This will create ${totalToCreate} subjects. Are you sure?`)) return;
            }

            for (const deptId of deptsToCreate) {
                for (const year of yearsToCreate) {
                    for (const sem of semestersToCreate) {
                        try {
                            await dataService.addSubject({
                                ...newSubject,
                                departmentId: deptId,
                                year: year,
                                semester: sem as any,
                                code: newSubject.name,
                                id: ''
                            } as any);
                            successCount++;
                        } catch (err: any) {
                            console.error(`Failed to create subject for Dept:${deptId}, Year:${year}, Sem:${sem}`, err);
                            // If it's a duplicate, we can usually just continue
                            if (!err.message?.includes('already exists')) {
                                throw err;
                            }
                        }
                    }
                }
            }

            toast.success(`Successfully created ${successCount} subjects`);
            setIsAddSubjectOpen(false);
            setNewSubject({ name: '', code: '', departmentId: '1', year: 1, semester: 1, teacherId: '', credits: 3 });
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to add subject(s)');
        }
    };

    const handleAssignTeacher = async () => {
        if (!selectedTeacherForAssign || !selectedDeptForAssign || !selectedSectionForAssign) {
            toast.error('Please select department, section and teacher');
            return;
        }

        const subjectId = assigningSubject ? assigningSubject.id : (document.getElementById('subject-select') as HTMLSelectElement)?.value;

        if (!subjectId && !assigningSubject) {
            toast.error('Please select a subject');
            return;
        }

        try {
            await dataService.createAssignment({
                subjectId: assigningSubject?.id || subjectId,
                teacherId: selectedTeacherForAssign,
                department: selectedDeptForAssign,
                section: selectedSectionForAssign
            });

            toast.success('Faculty assigned successfully');
            setIsAssignTeacherOpen(false);
            setAssigningSubject(null);
            setSelectedTeacherForAssign('');
            setSelectedDeptForAssign('');
            setSelectedSectionForAssign('');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to assign teacher');
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                // Simple CSV parser (assumes no commas in fields)
                const lines = text.split('\n');
                const students = lines.slice(1).map(line => {
                    if (!line.trim()) return null;
                    const parts = line.split(',').map(s => s.trim());
                    if (parts.length < 3) return null;

                    const [name, email, rollNumber, departmentId, year, section] = parts;
                    return {
                        name,
                        email: email || `${rollNumber.toLowerCase()}@college.edu`,
                        rollNumber,
                        departmentId: departmentId || '1',
                        year: parseInt(year) || 1,
                        section: section || 'A',
                        password: rollNumber // Default password
                    };
                }).filter(s => s !== null);

                if (students.length > 0) {
                    const results = await dataService.bulkAddStudents(students);
                    toast.success(`Successfully imported ${results.success} students. ${results.failed} failed.`);
                    if (results.errors.length > 0) {
                        console.error('Import errors:', results.errors);
                    }
                    loadData();
                } else {
                    toast.error('No valid students found in CSV');
                }
            } catch (error) {
                console.error('Import error:', error);
                toast.error('Failed to import students');
            }
        };
        reader.readAsText(file);
    };

    const handleOpenAssignSubject = (teacherId: string, deptId: string) => {
        setNewSubject(prev => ({
            ...prev,
            teacherId: teacherId,
            departmentId: deptId || '1'
        }));
        setActiveTab('subjects');
        setIsAddSubjectOpen(true);
    };


    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDept === 'all' || s.departmentId === selectedDept;
        const matchesYear = selectedYear === 'all' || s.year === parseInt(selectedYear);
        const matchesSection = selectedSection === 'all' || s.section === selectedSection;

        return matchesSearch && matchesDept && matchesYear && matchesSection;
    });

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.teacherId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSubjects = subjects.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDeptSubject === 'all' || s.departmentId === selectedDeptSubject;
        const matchesYear = selectedYearSubject === 'all' || s.year.toString() === selectedYearSubject;
        const matchesSem = selectedSemSubject === 'all' || s.semester.toString() === selectedSemSubject;
        return matchesSearch && matchesDept && matchesYear && matchesSem;
    });



    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white z-50 shadow-2xl hidden md:flex flex-col border-r border-slate-800">
                <div className="p-8 border-b border-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
                            EA
                        </div>
                        <div>
                            <h1 className="font-display font-black text-xl tracking-tight">CLASS<span className="text-blue-500">CONNECT</span></h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">System Online</p>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4">Main Menu</div>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'}`}
                    >
                        <LayoutDashboard className={`h-5 w-5 transition-colors ${activeTab === 'overview' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                        <span className="font-semibold text-sm">Dashboard</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'}`}
                    >
                        <Users className={`h-5 w-5 transition-colors ${activeTab === 'users' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                        <span className="font-semibold text-sm">Members</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('subjects')}
                        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === 'subjects' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'}`}
                    >
                        <BookOpen className={`h-5 w-5 transition-colors ${activeTab === 'subjects' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                        <span className="font-semibold text-sm">Curriculum</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'}`}
                    >
                        <UserCheck className={`h-5 w-5 transition-colors ${activeTab === 'attendance' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                        <span className="font-semibold text-sm">Daily Logs</span>
                    </button>
                    <div className="pt-4 mt-4 border-t border-slate-800/50">

                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'}`}
                        >
                            <FileText className={`h-5 w-5 transition-colors ${activeTab === 'reports' ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                            <span className="font-semibold text-sm">Analytics</span>
                        </button>
                    </div>
                </nav>

                <div className="p-6 border-t border-slate-800/50">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-300 group"
                    >
                        <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                            <LogOut className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 min-h-screen p-10 bg-[#f8fafc]">
                <header className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-1 gap-0 bg-blue-600 rounded-full"></div>
                        <div>
                            <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">
                                {activeTab === 'overview' && 'System Command Center'}
                                {activeTab === 'users' && 'User Management'}
                                {activeTab === 'subjects' && 'Academic Curriculum'}
                                {activeTab === 'attendance' && 'Daily Attendance Hub'}

                                {activeTab === 'reports' && 'Analytical Reports'}
                            </h2>
                            <p className="text-slate-500 font-medium">Monitoring and managing college operations</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                            <div className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                            <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">Admin Access</span>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer">
                            <UserCog className="h-6 w-6" />
                        </div>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Executive Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                                <div className="absolute right-[-10px] top-[-10px] opacity-10">
                                    <Users className="h-24 w-24" />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-blue-100 text-sm font-medium">Total Students</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-3xl font-bold">{stats.totalStudents}</div>
                                            <div className="flex items-center text-xs text-blue-100 mt-1">
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                <span>+{stats.studentGrowth}% from last month</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <Users className="h-5 w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden relative">
                                <div className="absolute right-[-10px] top-[-10px] opacity-10">
                                    <BookOpen className="h-24 w-24" />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-indigo-100 text-sm font-medium">Faculty Members</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-3xl font-bold">{stats.totalTeachers}</div>
                                            <div className="flex items-center text-xs text-indigo-100 mt-1">
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                <span>+{stats.teacherGrowth}% new joins</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
                                <div className="absolute right-[-10px] top-[-10px] opacity-10">
                                    <Calendar className="h-24 w-24" />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-emerald-100 text-sm font-medium">Monthly sessions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-3xl font-bold">{stats.totalSessions}</div>
                                            <div className="flex items-center text-xs text-emerald-100 mt-1">
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                <span>Targeting 120+</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white overflow-hidden relative">
                                <div className="absolute right-[-10px] top-[-10px] opacity-10">
                                    <BarChart3 className="h-24 w-24" />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-amber-100 text-sm font-medium">Avg. Attendance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <div className="text-3xl font-bold">{stats.attendanceRate}%</div>
                                            <div className="flex items-center text-xs text-amber-100 mt-1">
                                                <div className={`flex items-center ${stats.attendanceTrend === 'up' ? 'text-emerald-300' : 'text-rose-300'}`}>
                                                    {stats.attendanceTrend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                                    <span>{stats.attendanceTrend === 'up' ? 'Improving' : 'Declining'} Trend</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <BarChart3 className="h-5 w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-800">Attendance Trend</CardTitle>
                                        <CardDescription>Daily attendance rate tracker</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-slate-400">
                                        <ArrowUpRight className="h-5 w-5" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="h-[300px] mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                domain={[60, 100]}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="rate"
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorRate)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-300">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-800">Department Performance</CardTitle>
                                        <CardDescription>Sector-wise average attendance</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-slate-400">
                                        <Filter className="h-5 w-5" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="h-[300px] mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={deptPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                                                width={60}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={24}>
                                                {deptPerformanceData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activity Feed */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 border-none shadow-sm h-full">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-bold text-slate-800">System Logs</CardTitle>
                                            <CardDescription>Live updates across the portal</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" className="h-8">View All</Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recentActivities.map((activity) => (
                                            <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                                <div className={`p-2 rounded-lg mt-0.5 ${activity.type === 'attendance' ? 'bg-emerald-100 text-emerald-600' :
                                                    activity.type === 'user' ? 'bg-blue-100 text-blue-600' :
                                                        activity.type === 'subject' ? 'bg-indigo-100 text-indigo-600' :
                                                            'bg-amber-100 text-amber-600'
                                                    }`}>
                                                    {activity.type === 'attendance' && <UserCheck className="h-4 w-4" />}
                                                    {activity.type === 'user' && <Users className="h-4 w-4" />}
                                                    {activity.type === 'subject' && <BookOpen className="h-4 w-4" />}
                                                    {activity.type === 'leave' && <Calendar className="h-4 w-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {activity.user} <span className="font-normal text-slate-500">{activity.action}</span>
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{activity.target}</p>
                                                </div>
                                                <div className="text-[10px] font-medium text-slate-400 mt-1 whitespace-nowrap">
                                                    {activity.time}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-lg bg-slate-900 text-white flex flex-col justify-center text-center p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <TrendingUp className="h-20 w-20" />
                                </div>
                                <div className="relative z-10">
                                    <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                                        <Download className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Generate Report</h3>
                                    <p className="text-slate-400 text-sm mb-8">Download complete analytical summary for the academic council.</p>
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-900/40 group overflow-hidden relative"
                                        onClick={() => toast.success('Academic Report generated and downloading...')}
                                    >
                                        <span className="relative z-10 flex items-center justify-center">
                                            <FileText className="h-5 w-5 mr-2" /> Download Council PDF
                                        </span>
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6 h-full">
                        <Tabs defaultValue="students" className="w-full">
                            <div className="flex flex-col space-y-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <TabsList>
                                        <TabsTrigger value="students">Students</TabsTrigger>
                                        <TabsTrigger value="teachers">Teachers</TabsTrigger>
                                        <TabsTrigger value="advisors">Advisors</TabsTrigger>
                                    </TabsList>
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-64">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search users..."
                                                className="pl-8"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <div className="relative">
                                            <Input
                                                type="file"
                                                accept=".csv"
                                                className="hidden"
                                                id="bulk-upload"
                                                onChange={handleBulkUpload}
                                            />
                                            <Label htmlFor="bulk-upload" className="cursor-pointer">
                                                <div className="h-10 px-4 py-2 bg-slate-900 text-white rounded-md flex items-center hover:bg-slate-800 transition-colors">
                                                    <Upload className="h-4 w-4 mr-2" /> Import CSV
                                                </div>
                                            </Label>
                                        </div>
                                        {/* Add Student Button */}
                                        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="bg-blue-600">
                                                    <Plus className="h-4 w-4 mr-2" /> Add Student
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Add New Student</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleAddStudent} className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Name</Label>
                                                            <Input value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} required />
                                                        </div>
                                                        <div>
                                                            <Label>Roll Number</Label>
                                                            <Input value={newStudent.rollNumber} onChange={e => setNewStudent({ ...newStudent, rollNumber: e.target.value })} required />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <Label>Email</Label>
                                                            <Input type="email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} required />
                                                        </div>
                                                        <div>
                                                            <Label>Department</Label>
                                                            <Select value={newStudent.departmentId} onValueChange={v => setNewStudent({ ...newStudent, departmentId: v })}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label>Year</Label>
                                                            <Select value={newStudent.year.toString()} onValueChange={v => setNewStudent({ ...newStudent, year: parseInt(v) })}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {years.map(y => <SelectItem key={y.value} value={y.value.toString()}>{y.label}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label>Section</Label>
                                                            <Select value={newStudent.section} onValueChange={v => setNewStudent({ ...newStudent, section: v })}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <Button type="submit" className="w-full">Create Student</Button>
                                                </form>
                                            </DialogContent>
                                        </Dialog>

                                        {/* Add Teacher Button (Only visible on teacher tab technically, but let's keep it clean or conditional) */}
                                        <Dialog open={isAddTeacherOpen} onOpenChange={setIsAddTeacherOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="bg-indigo-600 hidden group-data-[state=active]:flex"> {/* Just a separate button outside tabs generally or controlled by state */}
                                                    <Plus className="h-4 w-4 mr-2" /> Add Teacher
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Add New Teacher</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleAddTeacher} className="space-y-4">
                                                    <div>
                                                        <Label>Name</Label>
                                                        <Input value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} required />
                                                    </div>
                                                    <div>
                                                        <Label>Teacher ID</Label>
                                                        <Input value={newTeacher.teacherId} onChange={e => setNewTeacher({ ...newTeacher, teacherId: e.target.value })} required />
                                                    </div>
                                                    <div>
                                                        <Label>Email</Label>
                                                        <Input type="email" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} required />
                                                    </div>
                                                    <div>
                                                        <Label>Password</Label>
                                                        <Input type="password" value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })} required />
                                                    </div>
                                                    <div>
                                                        <Label>Department</Label>
                                                        <Select value={newTeacher.departmentId} onValueChange={v => setNewTeacher({ ...newTeacher, departmentId: v })}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button type="submit" className="w-full">Create Teacher</Button>
                                                </form>
                                            </DialogContent>
                                        </Dialog>

                                        {/* Add Advisor Button */}
                                        <Dialog open={isAddAdvisorOpen} onOpenChange={setIsAddAdvisorOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="bg-emerald-600 ml-2">
                                                    <Plus className="h-4 w-4 mr-2" /> Add Advisor
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Add New Advisor</DialogTitle>
                                                </DialogHeader>
                                                <form onSubmit={handleAddAdvisor} className="space-y-4">
                                                    <div>
                                                        <Label>Name</Label>
                                                        <Input value={newAdvisor.name} onChange={e => setNewAdvisor({ ...newAdvisor, name: e.target.value })} required />
                                                    </div>
                                                    <div>
                                                        <Label>Advisor ID</Label>
                                                        <Input value={newAdvisor.advisorId} onChange={e => setNewAdvisor({ ...newAdvisor, advisorId: e.target.value })} required />
                                                    </div>
                                                    <div>
                                                        <Label>Email</Label>
                                                        <Input type="email" value={newAdvisor.email} onChange={e => setNewAdvisor({ ...newAdvisor, email: e.target.value })} required />
                                                    </div>
                                                    <div>
                                                        <Label>Password</Label>
                                                        <Input type="password" value={newAdvisor.password} onChange={e => setNewAdvisor({ ...newAdvisor, password: e.target.value })} required />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Department</Label>
                                                            <Select value={newAdvisor.departmentId} onValueChange={v => setNewAdvisor({ ...newAdvisor, departmentId: v })}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label>Section</Label>
                                                            <Select value={newAdvisor.section} onValueChange={v => setNewAdvisor({ ...newAdvisor, section: v })}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <Button type="submit" className="w-full">Create Advisor</Button>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>

                                {/* Filters Row for Students */}
                                <TabsContent value="students" className="mt-0">
                                    <div className="flex flex-wrap gap-4 mb-4">
                                        <div className="w-[200px]">
                                            <Select value={selectedDept} onValueChange={setSelectedDept}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Departments</SelectItem>
                                                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-[150px]">
                                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Years</SelectItem>
                                                    {years.map(y => <SelectItem key={y.value} value={y.value.toString()}>{y.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-[120px]">
                                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Section" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Sections</SelectItem>
                                                    {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>

                            <TabsContent value="students" className="m-0">
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Roll No</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Department</TableHead>
                                                    <TableHead>Year/Sec</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredStudents.length > 0 ? (
                                                    filteredStudents.map((student) => (
                                                        <TableRow key={student.id}>
                                                            <TableCell className="font-medium">{student.rollNumber}</TableCell>
                                                            <TableCell>{student.name}</TableCell>
                                                            <TableCell>{departments.find(d => d.id === student.departmentId)?.name || student.departmentId}</TableCell>
                                                            <TableCell>{student.year} - {student.section}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                                    onClick={() => handleDeleteUser('student', student.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                                                            No students found matching filters
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="teachers">
                                <div className="flex justify-end mb-4">
                                    <Button onClick={() => setIsAddTeacherOpen(true)} className="bg-indigo-600">
                                        <Plus className="h-4 w-4 mr-2" /> Add Teacher
                                    </Button>
                                </div>
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Department</TableHead>
                                                    <TableHead>Subjects</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredTeachers.map((teacher) => (
                                                    <TableRow key={teacher.id}>
                                                        <TableCell className="font-medium">{teacher.teacherId || 'N/A'}</TableCell>
                                                        <TableCell>{teacher.name}</TableCell>
                                                        <TableCell>{teacher.email}</TableCell>
                                                        <TableCell>{departments.find(d => d.id === teacher.departmentId)?.name || teacher.departmentId}</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-1">
                                                                {subjects.filter(s => s.teacherId === teacher.teacherId).length > 0 ? (
                                                                    subjects.filter(s => s.teacherId === teacher.teacherId).map(s => (
                                                                        <span key={s.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                            {s.name}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-slate-400 text-xs italic">No subjects</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                                    onClick={() => handleOpenAssignSubject(teacher.teacherId || '', teacher.departmentId || '')}
                                                                >
                                                                    <Plus className="h-4 w-4 mr-1" /> Assign
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                                    onClick={() => handleDeleteUser('teacher', teacher.teacherId)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="advisors">
                                <div className="flex justify-end mb-4">
                                    <Button onClick={() => setIsAddAdvisorOpen(true)} className="bg-emerald-600">
                                        <Plus className="h-4 w-4 mr-2" /> Add Advisor
                                    </Button>
                                </div>
                                <Card className="border-none shadow-sm">
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Advisor ID</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Department</TableHead>
                                                    <TableHead>Section</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {advisors?.map((advisor) => (
                                                    <TableRow key={advisor._id || advisor.advisorId}>
                                                        <TableCell className="font-medium">{advisor.advisorId || 'N/A'}</TableCell>
                                                        <TableCell>{advisor.name}</TableCell>
                                                        <TableCell>{advisor.email}</TableCell>
                                                        <TableCell>{advisor.departmentId}</TableCell>
                                                        <TableCell>{advisor.section}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {advisors?.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                                                            No advisors found. Add one to get started.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                {activeTab === 'subjects' && (
                    <div className="space-y-6 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-700">All Subjects</h3>
                            <div className="flex gap-2">
                                <Button onClick={() => setIsAddSubjectOpen(true)} className="bg-blue-600 shadow-lg shadow-blue-500/20">
                                    <Plus className="h-4 w-4 mr-2" /> Add Subject
                                </Button>
                                <Button
                                    onClick={() => {
                                        setAssigningSubject(null);
                                        setSelectedDeptForAssign('');
                                        setSelectedSectionForAssign('');
                                        setSelectedTeacherForAssign('');
                                        setIsAssignTeacherOpen(true);
                                    }}
                                    variant="outline"
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm"
                                >
                                    <UserCog className="h-4 w-4 mr-2" /> Assign Teacher
                                </Button>
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="flex gap-4 mb-6">
                            <div className="w-[200px]">
                                <Select value={selectedDeptSubject} onValueChange={setSelectedDeptSubject}>
                                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 shadow-sm">
                                        <Filter className="h-4 w-4 mr-2 text-slate-400" />
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-[150px]">
                                <Select value={selectedYearSubject} onValueChange={setSelectedYearSubject}>
                                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 shadow-sm">
                                        <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Years</SelectItem>
                                        {years.map(y => <SelectItem key={y.value} value={y.value.toString()}>{y.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-[150px]">
                                <Select value={selectedSemSubject} onValueChange={setSelectedSemSubject}>
                                    <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 shadow-sm">
                                        <BookOpen className="h-4 w-4 mr-2 text-slate-400" />
                                        <SelectValue placeholder="Semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Semesters</SelectItem>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={s.toString()}>Sem {s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>


                        <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Subject</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddSubject} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Subject Name</Label>
                                            <Input value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} required />
                                        </div>

                                        <div>
                                            <Label>Department</Label>
                                            <Select value={newSubject.departmentId} onValueChange={v => setNewSubject({ ...newSubject, departmentId: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Departments</SelectItem>
                                                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Year (For Class)</Label>
                                            <Select value={newSubject.year.toString()} onValueChange={v => setNewSubject({ ...newSubject, year: parseInt(v) })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">All Years</SelectItem>
                                                    {years.map(y => <SelectItem key={y.value} value={y.value.toString()}>{y.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Semester</Label>
                                            <Select value={newSubject.semester.toString()} onValueChange={v => setNewSubject({ ...newSubject, semester: parseInt(v) })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">All Semesters</SelectItem>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={s.toString()}>Sem {s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold shadow-lg shadow-blue-500/20 mt-4">
                                        Create Subject(s)
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>


                        <Card className="border-none shadow-sm">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>

                                            <TableHead>Name</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Teacher</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSubjects.map((subject) => (
                                            <TableRow key={subject.id}>

                                                <TableCell>{subject.name}</TableCell>
                                                <TableCell>{departments.find(d => d.id === subject.departmentId)?.name}</TableCell>
                                                <TableCell>Year {subject.year} (Sem {subject.semester})</TableCell>
                                                <TableCell>
                                                    {assignments.filter(a => a.subjectId === subject.id).length > 0 ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            {assignments
                                                                .filter(a => a.subjectId === subject.id)
                                                                .sort((a, b) => a.section.localeCompare(b.section))
                                                                .map(a => (
                                                                    <div
                                                                        key={a.assignmentId}
                                                                        className="flex items-center gap-2 cursor-pointer hover:bg-blue-50/50 p-1 rounded-lg transition-colors group"
                                                                        onClick={() => toast.info(
                                                                            <div className="flex flex-col gap-1">
                                                                                <p className="font-bold text-blue-800">Assignment Details</p>
                                                                                <p className="text-xs text-slate-600">
                                                                                    Subject: <span className="font-semibold text-slate-900">{subject.name}</span>
                                                                                </p>
                                                                                <p className="text-xs text-slate-600">
                                                                                    Section: <span className="font-semibold text-slate-900">{a.section}</span>
                                                                                </p>
                                                                                <p className="text-xs text-slate-600">
                                                                                    Faculty: <span className="font-semibold text-slate-900">{teachers.find(t => t.teacherId === a.teacherId)?.name || 'Unknown'}</span>
                                                                                </p>
                                                                            </div>,
                                                                            { duration: 4000 }
                                                                        )}
                                                                    >
                                                                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 group-hover:bg-blue-100 transition-colors">Sec {a.section}</span>
                                                                        <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700 transition-colors">{teachers.find(t => t.teacherId === a.teacherId)?.name || 'Unknown'}</span>
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                            onClick={() => {
                                                                setAssigningSubject(subject);
                                                                setSelectedDeptForAssign(subject.departmentId);
                                                                setSelectedSectionForAssign('');
                                                                setSelectedTeacherForAssign(subject.teacherId || '');
                                                                setIsAssignTeacherOpen(true);
                                                            }}
                                                        >
                                                            <UserCog className="h-4 w-4 mr-1" /> {subject.teacherId ? 'Reassign' : 'Assign'}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                            onClick={() => handleDeleteSubject(subject.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Assign Teacher Dialog */}
                        <Dialog open={isAssignTeacherOpen} onOpenChange={setIsAssignTeacherOpen}>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <UserCog className="h-5 w-5 text-blue-600" />
                                        Faculty Assignment
                                    </DialogTitle>
                                    <DialogDescription>
                                        {assigningSubject ? (
                                            <>Assign faculty for: <span className="font-bold text-slate-900">{assigningSubject.name}</span></>
                                        ) : (
                                            "Select a subject and faculty member to create an assignment"
                                        )}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Department</Label>
                                        <Select value={selectedDeptForAssign} onValueChange={setSelectedDeptForAssign}>
                                            <SelectTrigger className="h-12 rounded-xl">
                                                <SelectValue placeholder="Choose department..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {!assigningSubject && (
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Subject</Label>
                                            <Select
                                                value={assigningSubject?.id || ""}
                                                onValueChange={(val) => {
                                                    const sub = subjects.find(s => s.id === val);
                                                    setAssigningSubject(sub);
                                                }}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl" id="subject-select">
                                                    <SelectValue placeholder="Choose a subject..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {subjects
                                                        .filter(s => !selectedDeptForAssign || s.departmentId === selectedDeptForAssign)
                                                        .map(s => (
                                                            <SelectItem key={s.id} value={s.id}>
                                                                {s.name} ({departments.find(d => d.id === s.departmentId)?.code} - Yr {s.year})
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Section</Label>
                                            <Select value={selectedSectionForAssign} onValueChange={setSelectedSectionForAssign}>
                                                <SelectTrigger className="h-12 rounded-xl">
                                                    <SelectValue placeholder="Sec" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['A', 'B', 'C'].map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Assign Faculty</Label>
                                            <Select value={selectedTeacherForAssign} onValueChange={setSelectedTeacherForAssign}>
                                                <SelectTrigger className="h-12 rounded-xl">
                                                    <SelectValue placeholder="Select faculty" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {teachers.map(t => (
                                                        <SelectItem key={t.teacherId} value={t.teacherId}>
                                                            <div className="flex flex-col py-1">
                                                                <span className="font-bold">{t.name}</span>
                                                                <span className="text-[10px] text-slate-500">
                                                                    {t.teacherId} • {departments.find(d => d.id === t.departmentId)?.code}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button variant="ghost" onClick={() => setIsAssignTeacherOpen(false)} className="rounded-xl h-12">Cancel</Button>
                                    <Button onClick={handleAssignTeacher} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl flex-1 shadow-lg shadow-blue-500/20">
                                        Save Changes
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>All Attendance Records</CardTitle>
                                <CardDescription>Comprehensive log of all classes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Recorded By</TableHead>
                                            <TableHead className="text-center">Results</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions.map((session, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-medium">{session.subject}</TableCell>
                                                <TableCell>
                                                    {session.classInfo?.departmentCode || 'DEPT'} - Year {session.classInfo?.year} ({session.classInfo?.section})
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">Teacher</TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center gap-2 text-xs">
                                                        <span className="text-emerald-600 font-bold">{session.presentCount} P</span>
                                                        <span className="text-rose-500 font-bold">{session.absentCount} A</span>
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle>System Reports</CardTitle>
                                <CardDescription>Export data for external use</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                <div className="p-4 border rounded-xl bg-slate-50 flex flex-col gap-3">
                                    <h3 className="font-bold text-slate-800">Student Attendance Report</h3>
                                    <p className="text-sm text-muted-foreground">Export detailed attendance % for all students</p>
                                    <Button onClick={() => toast.info('Download started for Students Report')} variant="outline" className="mt-auto w-full">
                                        <FileText className="mr-2 h-4 w-4" /> Download CSV
                                    </Button>
                                </div>
                                <div className="p-4 border rounded-xl bg-slate-50 flex flex-col gap-3">
                                    <h3 className="font-bold text-slate-800">Session History Log</h3>
                                    <p className="text-sm text-muted-foreground">Export log of all classes conducted</p>
                                    <Button onClick={() => toast.info('Download started for Session Log')} variant="outline" className="mt-auto w-full">
                                        <Calendar className="mr-2 h-4 w-4" /> Download CSV
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
}

