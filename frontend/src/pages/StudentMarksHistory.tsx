
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/services/auth';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Filter, TrendingUp, BookOpen, Clock, FileText, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface MarkRecord {
    _id: string;
    subjectName: string;
    marks: number;
    assessmentType: string;
    semester: number;
    date: string;
    createdAt: string;
    maxMarks?: number;
}

export default function StudentMarksHistory() {
    const [marks, setMarks] = useState<MarkRecord[]>([]);
    const [filteredMarks, setFilteredMarks] = useState<MarkRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
    const [assessmentFilter, setAssessmentFilter] = useState<string>('ALL');
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const user = authService.getCurrentUser();
    const studentId = user?.studentId || user?.id;

    useEffect(() => {
        loadMarksHistory();
        const subj = searchParams.get('subject');
        if (subj) setSubjectFilter(subj);
    }, []);

    useEffect(() => {
        filterMarks();
    }, [subjectFilter, assessmentFilter, marks]);

    const loadMarksHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/marks/student/${studentId}`);
            if (response.data.success) {
                setMarks(response.data.marks || []);
            }
        } catch (error) {
            console.error('Error loading marks history:', error);
            toast.error('Failed to load marks history');
        } finally {
            setLoading(false);
        }
    };

    const filterMarks = () => {
        let filtered = [...marks];

        if (subjectFilter !== 'ALL') {
            filtered = filtered.filter(m =>
                (m.subjectName || '').toLowerCase() === subjectFilter.toLowerCase()
            );
        }

        if (assessmentFilter !== 'ALL') {
            filtered = filtered.filter(m => m.assessmentType === assessmentFilter);
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
        setFilteredRecords(filtered);
    };

    // Need to fix the state name in filterMarks to match filteredMarks
    const setFilteredRecords = (records: MarkRecord[]) => {
        setFilteredMarks(records);
    };

    const clearFilters = () => {
        setSubjectFilter('ALL');
        setAssessmentFilter('ALL');
        setSearchParams({});
    };

    const getAssessmentLabel = (type: string) => {
        switch (type) {
            case 'CIA_T1': return 'CIA Test 1';
            case 'CIA_T2': return 'CIA Test 2';
            case 'CIA_T3': return 'CIA Test 3';
            case 'SEMESTER': return 'End Semester';
            default: return type;
        }
    };

    const getGradeColor = (score: number) => {
        if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-100';
        if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-rose-600 bg-rose-50 border-rose-100';
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Subject', 'Assessment', 'Marks'];
        const rows = filteredMarks.map(m => [
            new Date(m.createdAt || m.date).toLocaleDateString(),
            m.subjectName,
            m.assessmentType,
            m.marks
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `marks-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Marks history exported!');
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Analyzing Performance Data...</p>
                </div>
            </div>
        );
    }

    const avgScore = filteredMarks.length > 0
        ? Math.round(filteredMarks.reduce((s, m) => s + m.marks, 0) / filteredMarks.length)
        : 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-indigo-100/40 rounded-full blur-[110px]"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-100/30 rounded-full blur-[90px]"></div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/student-dashboard')}
                            className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-200 hover:bg-white hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Academic Performance</h1>
                            <p className="text-sm text-slate-500 font-medium">Detailed marks analysis and assessment history</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => navigate('/settings')}
                            variant="outline"
                            className="gap-2 rounded-xl border-slate-200 bg-white hover:bg-slate-50 font-bold transition-all shadow-sm"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>
                        <Button onClick={exportToCSV} variant="outline" className="gap-2 rounded-xl border-slate-200 bg-white hover:bg-slate-50 font-bold transition-all shadow-sm">
                            <Download className="h-4 w-4" /> Export Report
                        </Button>
                    </div>

                </div>

                {/* Filters */}
                <Card className="rounded-[2.5rem] border-none bg-white shadow-xl shadow-slate-200/40 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Filter by Subject</Label>
                            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold focus:ring-indigo-100 transition-all px-6">
                                    <SelectValue placeholder="All Subjects" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                    <SelectItem value="ALL" className="font-bold py-3">All Subjects</SelectItem>
                                    {Array.from(new Set(marks.map(m => m.subjectName))).filter(Boolean).map(subj => (
                                        <SelectItem key={subj} value={subj} className="font-bold py-3">{subj}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Assessment Type</Label>
                            <Select value={assessmentFilter} onValueChange={setAssessmentFilter}>
                                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-bold focus:ring-indigo-100 transition-all px-6">
                                    <SelectValue placeholder="All Assessments" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                    <SelectItem value="ALL" className="font-bold py-3">All Assessments</SelectItem>
                                    <SelectItem value="CIA_T1" className="font-bold py-3">CIA 1</SelectItem>
                                    <SelectItem value="CIA_T2" className="font-bold py-3">CIA 2</SelectItem>
                                    <SelectItem value="CIA_T3" className="font-bold py-3">CIA 3</SelectItem>
                                    <SelectItem value="SEMESTER" className="font-bold py-3">Semester Exam</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={clearFilters} variant="secondary" className="w-full h-14 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-black text-[10px] tracking-widest uppercase border-none">
                                RESET FILTERS
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Stats Summary Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-lg shadow-slate-200/30 flex items-center justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.05] text-indigo-600 transition-transform group-hover:scale-125 duration-700">
                            <TrendingUp className="h-20 w-20" />
                        </div>
                        <div className="z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Score</p>
                            <h3 className="text-4xl font-display font-black text-slate-900">{avgScore}%</h3>
                        </div>
                        <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 z-10 transition-transform group-hover:rotate-12">
                            <TrendingUp className="h-7 w-7" />
                        </div>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-lg shadow-slate-200/30 flex items-center justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.05] text-blue-600 transition-transform group-hover:scale-125 duration-700">
                            <BookOpen className="h-20 w-20" />
                        </div>
                        <div className="z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assessments</p>
                            <h3 className="text-4xl font-display font-black text-slate-900">{filteredMarks.length}</h3>
                        </div>
                        <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 z-10 transition-transform group-hover:-rotate-12">
                            <BookOpen className="h-7 w-7" />
                        </div>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-lg shadow-slate-200/30 flex items-center justify-between group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.05] text-emerald-600 transition-transform group-hover:scale-125 duration-700">
                            <CheckCircle2 className="h-20 w-20" />
                        </div>
                        <div className="z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Highest Score</p>
                            <h3 className="text-4xl font-display font-black text-slate-900">
                                {filteredMarks.length > 0 ? Math.max(...filteredMarks.map(m => m.marks)) : 0}%
                            </h3>
                        </div>
                        <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 z-10 transition-transform group-hover:scale-110">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                    </Card>
                </div>

                {/* Marks Records List */}
                <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
                    <CardHeader className="p-10 pb-6 border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-black font-display text-slate-900">Performance Records</CardTitle>
                            {subjectFilter !== 'ALL' && (
                                <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 py-2 px-4 rounded-full transition-all flex gap-2" onClick={() => setSubjectFilter('ALL')}>
                                    {subjectFilter} <XCircle className="h-4 w-4" />
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[500px]">
                            {filteredMarks.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {filteredMarks.map((record) => (
                                        <div
                                            key={record._id}
                                            className="p-8 hover:bg-slate-50/50 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={cn(
                                                    "h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm group-hover:scale-110 transition-transform duration-500",
                                                    getGradeColor(record.marks)
                                                )}>
                                                    {record.subjectName?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{record.subjectName}</h4>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200 text-slate-400 py-1 px-2.5">
                                                            {getAssessmentLabel(record.assessmentType)}
                                                        </Badge>
                                                        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {new Date(record.createdAt || record.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5 italic">Earned Score</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className={cn("text-4xl font-display font-black", record.marks >= 50 ? "text-slate-900" : "text-rose-600")}>
                                                            {record.marks}
                                                        </span>
                                                        <span className="text-sm font-bold text-slate-300">/ 100</span>
                                                    </div>
                                                </div>

                                                <div className="h-16 w-[2px] bg-slate-100 hidden md:block"></div>

                                                <div className="min-w-[120px]">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                                        <span className="text-slate-400">Yield</span>
                                                        <span className={record.marks >= 50 ? "text-indigo-600" : "text-rose-500"}>{record.marks}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", record.marks >= 50 ? "bg-gradient-to-r from-indigo-500 to-blue-600" : "bg-rose-500")}
                                                            style={{ width: `${record.marks}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-32 text-center flex flex-col items-center gap-6">
                                    <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 animate-pulse">
                                        <FileText className="h-10 w-10 text-slate-200" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-display font-black text-slate-900">No Assessment Data</h3>
                                        <p className="text-sm text-slate-400 font-medium">Try adjusting your filters to find specific records.</p>
                                    </div>
                                    <Button onClick={clearFilters} variant="outline" className="mt-2 rounded-xl px-8 border-slate-200 font-black text-[10px] tracking-widest">
                                        RESET ALL VIEWPORTS
                                    </Button>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </main>

            <footer className="mx-auto max-w-7xl px-6 py-12 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] font-display">
                    © 2026 CLASSCONNECT ANALYTICS INFRASTRUCTURE. DATA SECURED.
                </p>
            </footer>
        </div>
    );
}
