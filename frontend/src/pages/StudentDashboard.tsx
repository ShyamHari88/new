import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/services/auth';
import { dataService } from '@/services/data';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssessmentType, Semester } from '@/types/attendance';
import { semesters, departments } from '@/data/mockData';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LogOut, CheckCircle2, History, Calendar as CalendarIcon, MessageSquare, ExternalLink, ChevronRight, TrendingUp, ShieldCheck, AlertTriangle, Plus, User, ArrowUpRight, Clock, Download, FileText, Bell, Layout, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/NotificationBell';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function StudentDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType | 'ALL'>('ALL');
    const [filteredMarks, setFilteredMarks] = useState<any[]>([]);
    const [subjectAttendance, setSubjectAttendance] = useState<any[]>([]);
    const [selectedSemester, setSelectedSemester] = useState<Semester | 'ALL'>(1);
    const [allSubjectAttendance, setAllSubjectAttendance] = useState<any[]>([]);
    const navigate = useNavigate();

    const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [leaveForm, setLeaveForm] = useState<{
        type: string;
        fromDate: string;
        toDate: string;
        reason: string;
        attachment?: File;
    }>({
        type: 'Medical',
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        reason: '',
        attachment: undefined
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            const user = authService.getCurrentUser();
            if (user && user.role === 'student') {
                const student = {
                    id: user.studentId || user.id || 'unknown',
                    name: String(user.name || 'Student'),
                    rollNumber: String(user.rollNumber || 'N/A'),
                    email: user.email || '',
                    departmentId: user.departmentId || '1',
                    year: Number(user.year) || 3,
                    section: user.section || 'C',
                    currentSemester: Number(user.currentSemester) || 5
                };
                setStudentInfo(student);
                setSelectedSemester((student.currentSemester || 5) as Semester);

                try {
                    // Fetch Leaves
                    if (student.id !== 'unknown') {
                        const leaves = await dataService.getStudentLeaves(student.id);
                        setLeaveRequests(Array.isArray(leaves) ? leaves : []);
                    }

                    const [attendanceRes, marksRes] = await Promise.all([
                        api.get(`/attendance/student/${student.id}`),
                        api.get(`/marks/student/${student.id}`)
                    ]);

                    if (attendanceRes.data.success) {
                        setAllSubjectAttendance(attendanceRes.data.subjectStats || []);
                    }

                    if (marksRes.data.success) {
                        setPerformance({
                            averageMarks: marksRes.data.averageMarks || 0,
                            allMarks: marksRes.data.marks || []
                        });
                    }



                } catch (error) {
                    console.error('Error fetching student dashboard data:', error);
                    toast.error("Some data could not be loaded. Please try again later.");
                }
            } else {
                navigate('/login');
            }
        };

        fetchInitialData();
    }, [navigate]);

    useEffect(() => {
        if (!studentInfo || !allSubjectAttendance.length) {
            // Initialize basic stats if no attendance data yet
            if (studentInfo) {
                setStats({
                    totalPeriods: 0,
                    present: 0,
                    absent: 0,
                    od: 0,
                    percentage: 0
                });
            }
            return;
        }

        let subjectsForStats = allSubjectAttendance;
        if (selectedSemester !== 'ALL') {
            subjectsForStats = allSubjectAttendance.filter(att => att && Number(att.semester) === Number(selectedSemester));
        }

        setSubjectAttendance(subjectsForStats);

        const totalPeriods = subjectsForStats.reduce((acc, curr) => acc + (Number(curr?.total) || 0), 0);
        const totalPresent = subjectsForStats.reduce((acc, curr) => acc + (Number(curr?.present) || 0), 0);
        const totalAbsent = subjectsForStats.reduce((acc, curr) => acc + (Number(curr?.absent) || 0), 0);
        const totalOD = subjectsForStats.reduce((acc, curr) => acc + (Number(curr?.od) || 0), 0);

        let overallPercentage = 0;
        if (totalPeriods > 0) {
            overallPercentage = (totalPresent / totalPeriods) * 100;
        }

        setStats({
            totalPeriods,
            present: totalPresent,
            absent: totalAbsent,
            od: totalOD,
            percentage: isNaN(overallPercentage) ? 0 : Number(overallPercentage.toFixed(2))
        });
    }, [selectedSemester, allSubjectAttendance, studentInfo]);

    useEffect(() => {
        if (!performance?.allMarks || !Array.isArray(performance.allMarks) || !studentInfo) {
            setFilteredMarks([]);
            return;
        }

        let filtered = [...performance.allMarks];
        if (selectedSemester !== 'ALL') {
            filtered = filtered.filter((m: any) => m && Number(m.semester) === Number(selectedSemester));
        }
        if (selectedAssessment !== 'ALL') {
            filtered = filtered.filter((m: any) => m && m.assessmentType === selectedAssessment);
        }

        const subjectMarks: { [key: string]: { total: number; count: number } } = {};
        filtered.forEach((m: any) => {
            const sName = m.subjectName || m.subject;
            if (!sName) return;
            if (!subjectMarks[sName]) subjectMarks[sName] = { total: 0, count: 0 };
            subjectMarks[sName].total += (Number(m.marks) || 0);
            subjectMarks[sName].count += 1;
        });

        const marksData = Object.keys(subjectMarks).map((subject) => ({
            subject,
            score: subjectMarks[subject].count > 0 ? Math.round(subjectMarks[subject].total / subjectMarks[subject].count) : 0,
        })).filter(item => !isNaN(item.score));

        setFilteredMarks(marksData);
    }, [selectedAssessment, selectedSemester, performance, studentInfo]);

    const handleApplyLeave = async () => {
        if (!studentInfo || !leaveForm.reason) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const res = await dataService.applyLeave({
                ...leaveForm,
                studentId: studentInfo.id,
                studentName: studentInfo.name,
                rollNumber: studentInfo.rollNumber
            });

            if (leaveForm.attachment && res.leave?.requestId) {
                const formData = new FormData();
                formData.append('files', leaveForm.attachment);
                await dataService.uploadLeaveAttachments(res.leave.requestId, formData);
            }

            toast.success('Application submitted successfully');
            setIsLeaveDialogOpen(false);
            setLeaveForm(prev => ({ ...prev, reason: '', attachment: undefined }));
            const leaves = await dataService.getStudentLeaves(studentInfo.id);
            setLeaveRequests(leaves);
        } catch (error: any) {
            toast.error(error.message || "Failed to submit application");
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const guidelines = [
        { title: 'Minimum Attendance', content: 'Students must maintain at least 75% attendance in each subject to qualify for final examinations.', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
        { title: 'On-Duty (OD) Protocol', content: 'OD applications must be submitted with proper validation at least 48 hours prior to the event.', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { title: 'Assessment Weightage', content: 'CIA Tests contribute 40% and End Semester Examinations 60% towards the final calculated grade.', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
        { title: 'Portal Support', content: 'For technical issues regarding attendance logging, please contact the IT department helpdesk.', icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50' }
    ];

    if (!studentInfo || !stats) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Initializing Portal...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100 selection:text-blue-700">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-100/40 rounded-full blur-[110px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-indigo-100/30 rounded-full blur-[90px]"></div>
            </div>

            {/* Navbar */}
            <header className="sticky top-0 z-50 glass-card border-none px-6 py-4 mx-4 mt-4 rounded-[2rem]">
                <div className="mx-auto max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 premium-gradient rounded-xl flex items-center justify-center text-white shadow-lg">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight font-display">
                                CLASS<span className="text-blue-600">CONNECT</span>
                            </h1>
                            <p className="text-[10px] h-3 uppercase tracking-widest font-bold text-slate-400">Student Portal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-xl">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-lg text-[10px] font-black tracking-wider uppercase hover:bg-white hover:text-blue-600"
                                onClick={() => navigate('/student/attendance-history')}
                            >
                                <History className="h-3 w-3 mr-1.5" /> Attendance
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[10px] font-black tracking-wider uppercase hover:bg-white hover:text-blue-600">
                                <Download className="h-3 w-3 mr-1.5" /> Reports
                            </Button>
                        </div>

                        <NotificationBell />

                        <Button
                            size="icon"
                            onClick={handleLogout}
                            className="h-10 w-10 rounded-xl border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
                {/* Hero / Header Row */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">
                            Welcome Back, <span className="text-premium">{studentInfo.name.split(' ')[0]}!</span>
                        </h2>
                        <p className="text-slate-500 font-medium">
                            Here's your academic journey overview for the current semester.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Filter By</span>
                        <div className="h-8 w-[1px] bg-slate-100"></div>
                        <Select value={selectedSemester.toString()} onValueChange={(v) => setSelectedSemester(v === 'ALL' ? 'ALL' : parseInt(v) as Semester)}>
                            <SelectTrigger className="h-9 border-none bg-blue-50 text-blue-700 font-bold px-4 rounded-xl focus:ring-0 min-w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                <SelectItem value="ALL">All Semesters</SelectItem>
                                {semesters.map(s => <SelectItem key={s.value} value={s.value.toString()}>{s.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* ROW 1: Top Stats Grid (3 Columns) - As per Sketch */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden group">
                        <div className="h-24 premium-gradient relative">
                            <div className="absolute -bottom-10 left-8">
                                <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-lg">
                                    <div className="h-full w-full rounded-xl bg-slate-50 flex items-center justify-center text-2xl font-black text-blue-600 font-display transition-transform group-hover:scale-110 duration-500">
                                        {studentInfo.name.charAt(0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <CardContent className="pt-14 pb-8 px-8 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-display font-black text-slate-900">{studentInfo.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">{studentInfo.rollNumber}</p>
                                <div className="flex gap-2 mt-4">
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase">CLASS {studentInfo.section}</Badge>
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase">{studentInfo.year} YEAR</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Overall Attendance Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8 relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-blue-600">
                            <TrendingUp className="h-24 w-24" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <span className={cn("text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border",
                                    stats.percentage >= 75 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100")}>
                                    {stats.percentage >= 75 ? 'Qualified' : 'Attendance Alert'}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Average</h4>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-3xl font-display font-black text-slate-900">{stats.percentage}%</span>
                                    <span className="text-xs font-bold text-slate-400">{stats.present} / {stats.totalPeriods} Hours</span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                <div
                                    className={cn("h-full transition-all duration-1000 ease-out shadow-sm", stats.percentage >= 75 ? "premium-gradient" : "bg-rose-500")}
                                    style={{ width: `${stats.percentage}%` }}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Overall Performance Card */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white p-8 relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-indigo-600">
                            <TrendingUp className="h-24 w-24 transform rotate-90" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-black px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full uppercase tracking-tighter shadow-sm">
                                    {performance?.averageMarks >= 80 ? 'Distinction' : performance?.averageMarks >= 60 ? 'First Class' : 'Pass'}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Performance</h4>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-3xl font-display font-black text-slate-900">{performance?.averageMarks || 0}%</span>
                                    <span className="text-xs font-bold text-slate-400">Total Avg Score</span>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-1000 ease-out shadow-sm"
                                    style={{ width: `${performance?.averageMarks || 0}%` }}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ROW 2: Main Content (2 Columns) - As per Sketch */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Attendance Analysis (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="rounded-[2.5rem] border-none bg-white shadow-xl shadow-slate-200/50 overflow-hidden min-h-[460px]">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-black font-display text-slate-900 tracking-tight">Attendance Matrix</CardTitle>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Subject-wise performance</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <History className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-8 pb-8">
                                <ScrollArea className="h-[340px] pr-4">
                                    <div className="space-y-6">
                                        {subjectAttendance.length > 0 ? (
                                            subjectAttendance.map((sub, idx) => (
                                                <div key={idx} className="group/sub">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <div className="max-w-[70%]">
                                                            <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-wide group-hover/sub:text-blue-600 transition-colors truncate">{sub.subject}</h5>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{sub.present}P / {sub.total}T • {sub.od} OD Periods</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={cn("text-sm font-black font-display", sub.percentage < 75 ? "text-rose-500" : "text-blue-600")}>{sub.percentage}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                        <div
                                                            className={cn("h-full transition-all duration-700 ease-out shadow-sm rounded-full", sub.percentage < 75 ? "bg-rose-500" : "premium-gradient")}
                                                            style={{ width: `${sub.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-24 text-center">
                                                <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100 border-dashed">
                                                    <Layout className="h-8 w-8 text-slate-200" />
                                                </div>
                                                <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">No Records Found</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Academic Performance Chart (5 Cols) */}
                    <div className="lg:col-span-5">
                        <Card className="rounded-[2.5rem] border-none bg-white shadow-xl shadow-slate-200/50 overflow-hidden min-h-[460px] flex flex-col">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-black font-display text-slate-900 tracking-tight text-premium">Performance</CardTitle>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Marks trend analysis</p>
                                    </div>
                                    <Select value={selectedAssessment} onValueChange={(v) => setSelectedAssessment(v as AssessmentType | 'ALL')}>
                                        <SelectTrigger className="h-9 min-w-[120px] bg-slate-50 border-none text-[10px] font-black uppercase tracking-wider text-slate-600 rounded-xl focus:ring-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="ALL" className="text-[10px] font-bold uppercase">All Tests</SelectItem>
                                            <SelectItem value="CIA_T1" className="text-[10px] font-bold uppercase">CIA 1</SelectItem>
                                            <SelectItem value="CIA_T2" className="text-[10px] font-bold uppercase">CIA 2</SelectItem>
                                            <SelectItem value="CIA_T3" className="text-[10px] font-bold uppercase">CIA 3</SelectItem>
                                            <SelectItem value="SEMESTER" className="text-[10px] font-bold uppercase">Semester</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-4 flex-1">
                                <div className="h-[300px] w-full">
                                    {filteredMarks.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={filteredMarks} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="subject" hide />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: '800' }} domain={[0, 100]} />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '1.5rem',
                                                        border: 'none',
                                                        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                                                        padding: '12px 20px'
                                                    }}
                                                    labelStyle={{ fontWeight: '900', color: '#1E293B', textTransform: 'uppercase', fontSize: '10px' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#3b82f6"
                                                    strokeWidth={5}
                                                    fill="url(#chartGradient)"
                                                    animationDuration={2000}
                                                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                                    activeDot={{ r: 7, strokeWidth: 0 }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-100 mt-10">
                                                <BarChart className="h-10 w-10 opacity-20" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Assessment Data</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>

                {/* ROW 3: Secondary Info (2 Columns) - As per Sketch */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Applications & OD Requests */}
                    <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-slate-200/50 relative overflow-hidden group/apps h-full">
                        <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black font-display text-slate-900 group-hover/apps:text-blue-600 transition-colors">Letter Center</CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Manage your special requests</p>
                            </div>
                            <Button
                                onClick={() => setIsLeaveDialogOpen(true)}
                                className="h-14 px-8 rounded-2xl premium-gradient text-white shadow-lg shadow-blue-500/30 font-black text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95 border-none"
                            >
                                NEW REQUEST <Plus className="h-4 w-4 ml-2" />
                            </Button>
                        </CardHeader>
                        <CardContent className="px-10 pb-10">
                            <ScrollArea className="h-[300px] pr-4">
                                <div className="space-y-4">
                                    {leaveRequests.length > 0 ? (
                                        leaveRequests.map((leave, i) => (
                                            <div key={i} className="flex items-center justify-between p-6 rounded-[2.5rem] bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/40 border border-slate-100 transition-all duration-300 group/item">
                                                <div className="flex items-center gap-6">
                                                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform duration-500 group-hover/item:scale-110",
                                                        leave.type === 'On-Duty' ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600")}>
                                                        {leave.type === 'On-Duty' ? <ShieldCheck className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-black text-slate-800 tracking-tight uppercase">{leave.type}</h4>
                                                            {leave.attachment && <Badge variant="outline" className="h-5 px-1.5 border-blue-100 text-[#3b82f6] text-[8px] font-black tracking-tighter uppercase">Document Linked</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                                                            <p className="text-[11px] text-slate-500 font-bold">{leave.fromDate} — {leave.toDate}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className={cn("text-[9px] font-black h-7 px-4 rounded-full uppercase tracking-widest border shadow-sm",
                                                        leave.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                            leave.status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                                "bg-blue-50 text-blue-600 border-blue-100")}>
                                                        {leave.status}
                                                    </Badge>
                                                    <p className="text-[9px] text-slate-300 mt-2 font-mono font-black tracking-tighter uppercase whitespace-nowrap">ID: {leave.requestId?.slice(-8).toUpperCase() || 'EXTERNAL'}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                                            <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                                <Clock className="h-8 w-8 text-slate-200" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Recent History</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Academic Guidelines (The "Guideline" section in sketch) */}
                    <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-slate-200/50 overflow-hidden h-full flex flex-col">
                        <CardHeader className="p-10 pb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-black font-display text-slate-900">Academic Guidelines</CardTitle>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Portal and Institutional Rules</p>
                                </div>
                                <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-10 pb-10 flex-1">
                            <div className="space-y-6">
                                {guidelines.map((guide, i) => (
                                    <div key={i} className="flex gap-5 group/guide">
                                        <div className={cn("h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover/guide:scale-110", guide.bg, guide.color)}>
                                            <guide.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h5 className="text-[13px] font-black text-slate-800 tracing-tight uppercase group-hover/guide:text-blue-600 transition-colors">{guide.title}</h5>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{guide.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-10 p-5 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                <p className="text-[10px] text-slate-400 font-bold text-center leading-loose">
                                    Compliance with these guidelines is mandatory for academic progress. <br />
                                    <span className="text-blue-600 cursor-pointer hover:underline">Download Comprehensive Rulebook (PDF)</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <footer className="mx-auto max-w-7xl px-6 py-12 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    © 2026 CLASSCONNECT ACADEMIC INFRASTRUCTURE. ALL RIGHTS RESERVED.
                </p>
            </footer>

            {/* Leave Dialog */}
            <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-[3rem] shadow-2xl">
                    <div className="premium-gradient px-8 py-10 text-white relative">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <FileText className="h-24 w-24" />
                        </div>
                        <DialogHeader className="p-0 text-left relative z-10">
                            <DialogTitle className="text-3xl font-display font-black tracking-tight text-white flex items-center gap-4">
                                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <Plus className="h-7 w-7" />
                                </div>
                                New Request
                            </DialogTitle>
                            <p className="text-white/70 font-bold uppercase tracking-widest text-[10px] mt-2">
                                Formal Academic Documentation Workflow
                            </p>
                        </DialogHeader>
                    </div>

                    <div className="px-8 py-10 space-y-8 bg-white max-h-[70vh] overflow-y-auto">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Application Type</Label>
                            <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm(p => ({ ...p, type: v }))}>
                                <SelectTrigger className="h-16 rounded-[1.5rem] border-slate-100 bg-slate-50/50 font-display font-black text-slate-700 focus:ring-blue-100 transition-all text-sm px-6">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                                    <SelectItem value="Medical" className="font-black text-xs uppercase py-4">Medical Leave</SelectItem>
                                    <SelectItem value="On-Duty" className="font-black text-xs uppercase py-4">On-Duty (OD)</SelectItem>
                                    <SelectItem value="Personal" className="font-black text-xs uppercase py-4">Personal Request</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Initiation Date</Label>
                                <Input
                                    type="date"
                                    className="h-16 rounded-[1.5rem] border-slate-100 bg-slate-50/50 font-black focus:ring-blue-100 px-6"
                                    value={leaveForm.fromDate}
                                    onChange={e => setLeaveForm(p => ({ ...p, fromDate: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Terminal Date</Label>
                                <Input
                                    type="date"
                                    className="h-16 rounded-[1.5rem] border-slate-100 bg-slate-50/50 font-black focus:ring-blue-100 px-6"
                                    value={leaveForm.toDate}
                                    onChange={e => setLeaveForm(p => ({ ...p, toDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Rationalization</Label>
                            <Textarea
                                className="min-h-[140px] rounded-[2rem] border-slate-100 bg-slate-50/50 font-bold text-sm resize-none p-6 focus:ring-blue-100"
                                placeholder="Clearly state the reason for your application..."
                                value={leaveForm.reason}
                                onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Supporting Documentation</Label>
                            <div className="relative group/up">
                                <div className="absolute inset-0 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center transition-all group-hover/up:bg-blue-50 group-hover/up:border-blue-200 pointer-events-none">
                                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                                        <Download className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 group-hover/up:text-blue-600 uppercase tracking-widest">
                                        {leaveForm.attachment ? leaveForm.attachment.name : 'Upload Credentials / Evidence'}
                                    </p>
                                </div>
                                <Input
                                    type="file"
                                    className="opacity-0 h-28 w-full cursor-pointer relative z-10"
                                    onChange={e => setLeaveForm(p => ({ ...p, attachment: e.target.files?.[0] }))}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col gap-4">
                            <Button
                                onClick={handleApplyLeave}
                                className="w-full h-16 rounded-[2rem] premium-gradient hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-xs tracking-widest shadow-[0_15px_35px_rgba(59,130,246,0.3)] text-white border-none"
                            >
                                TRANSMIT APPLICATION
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setIsLeaveDialogOpen(false)}
                                className="w-full h-12 font-bold text-[10px] text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] transition-colors"
                            >
                                Discard Application
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
