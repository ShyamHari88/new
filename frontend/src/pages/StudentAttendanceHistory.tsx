import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/services/auth';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, XCircle, Clock, Filter, Download, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AttendanceRecord {
    _id: string;
    date: string;
    subject: string;
    status: 'present' | 'absent' | 'od';
    period: number;
    sessionId?: string;
}

export default function StudentAttendanceHistory() {
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [dateFilter, setDateFilter] = useState({
        from: '',
        to: '',
    });
    const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
    const [searchParams, setSearchParams] = useSearchParams();

    const user = authService.getCurrentUser();
    const studentId = user?.studentId || user?.id;

    useEffect(() => {
        loadAttendanceHistory();

        const subj = searchParams.get('subject');
        if (subj) {
            setSubjectFilter(subj);
        }
    }, []);

    useEffect(() => {
        filterRecords();
    }, [dateFilter, subjectFilter, attendanceRecords]);

    const loadAttendanceHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/attendance/student/${studentId}/history`);

            if (response.data.success) {
                setAttendanceRecords(response.data.records || []);
            }
        } catch (error) {
            console.error('Error loading attendance history:', error);
            toast.error('Failed to load attendance history');
        } finally {
            setLoading(false);
        }
    };

    const filterRecords = () => {
        let filtered = [...attendanceRecords];

        if (dateFilter.from) {
            filtered = filtered.filter(record =>
                new Date(record.date) >= new Date(dateFilter.from)
            );
        }

        if (dateFilter.to) {
            filtered = filtered.filter(record =>
                new Date(record.date) <= new Date(dateFilter.to)
            );
        }

        if (subjectFilter !== 'ALL') {
            filtered = filtered.filter(record =>
                record.subject.toLowerCase() === subjectFilter.toLowerCase()
            );
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setFilteredRecords(filtered);
    };

    const clearFilters = () => {
        setDateFilter({ from: '', to: '' });
        setSubjectFilter('ALL');
        setSearchParams({});
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present':
                return <CheckCircle2 className="h-5 w-5 text-green-600" />;
            case 'absent':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'od':
                return <Clock className="h-5 w-5 text-blue-600" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            present: 'bg-green-50 text-green-700 border-green-200',
            absent: 'bg-red-50 text-red-700 border-red-200',
            od: 'bg-blue-50 text-blue-700 border-blue-200',
        };

        return (
            <Badge className={cn('text-xs font-bold uppercase', styles[status as keyof typeof styles])}>
                {status === 'od' ? 'On Duty' : status}
            </Badge>
        );
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Subject', 'Period', 'Status'];
        const rows = filteredRecords.map(record => [
            new Date(record.date).toLocaleDateString(),
            record.subject,
            record.period,
            record.status.toUpperCase(),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Attendance history exported!');
    };

    // Group records by date
    const groupedRecords = filteredRecords.reduce((acc, record) => {
        const dateKey = new Date(record.date).toLocaleDateString();
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(record);
        return acc;
    }, {} as Record<string, AttendanceRecord[]>);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading attendance history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/student-dashboard')}
                            className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-200 hover:bg-white hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Attendance History</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                View your complete attendance records
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={exportToCSV}
                        variant="outline"
                        className="gap-2"
                        disabled={filteredRecords.length === 0}
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>

                {/* Filters */}
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Filter className="h-5 w-5" />
                            Filter by Date Range
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="from-date" className="text-sm font-medium">
                                    From Date
                                </Label>
                                <Input
                                    id="from-date"
                                    type="date"
                                    value={dateFilter.from}
                                    onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                                    className="rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="to-date" className="text-sm font-medium">
                                    To Date
                                </Label>
                                <Input
                                    id="to-date"
                                    type="date"
                                    value={dateFilter.to}
                                    onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                                    className="rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Subject
                                </Label>
                                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                    <SelectTrigger className="w-full rounded-lg">
                                        <SelectValue placeholder="All Subjects" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Subjects</SelectItem>
                                        {Array.from(new Set(attendanceRecords.map(r => r.subject))).map(subj => (
                                            <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-3 flex justify-between items-end gap-4">
                                {subjectFilter !== 'ALL' && (
                                    <Button
                                        onClick={() => setSubjectFilter('ALL')}
                                        variant="secondary"
                                        className="gap-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border-none"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Show All Subjects
                                    </Button>
                                )}
                                <Button
                                    onClick={clearFilters}
                                    variant="outline"
                                    className="px-8 rounded-lg ml-auto"
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="rounded-2xl border-slate-200 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total Records</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        {filteredRecords.length}
                                    </p>
                                </div>
                                <Calendar className="h-8 w-8 text-slate-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Present</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {filteredRecords.filter(r => r.status === 'present').length}
                                    </p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-green-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Absent</p>
                                    <p className="text-2xl font-bold text-red-600 mt-1">
                                        {filteredRecords.filter(r => r.status === 'absent').length}
                                    </p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-400" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">On Duty</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">
                                        {filteredRecords.filter(r => r.status === 'od').length}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8 text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Attendance Records */}
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-lg">
                            {subjectFilter === 'ALL' ? 'Attendance Records' : `Attendance: ${subjectFilter}`}
                        </CardTitle>
                        {subjectFilter !== 'ALL' && (
                            <Badge
                                variant="secondary"
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer gap-2 py-1.5 px-3 rounded-full border-none transition-all active:scale-95"
                                onClick={() => setSubjectFilter('ALL')}
                            >
                                {subjectFilter} <XCircle className="h-3.5 w-3.5" />
                            </Badge>
                        )}
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[600px] pr-4">
                            {Object.keys(groupedRecords).length > 0 ? (
                                <div className="space-y-6">
                                    {Object.entries(groupedRecords).map(([date, records]) => (
                                        <div key={date} className="space-y-3">
                                            <div className="flex items-center gap-2 sticky top-0 bg-slate-50 px-4 py-2 rounded-lg">
                                                <Calendar className="h-4 w-4 text-slate-500" />
                                                <h3 className="text-sm font-bold text-slate-700">{date}</h3>
                                                <Badge variant="outline" className="ml-auto text-xs">
                                                    {records.length} {records.length === 1 ? 'period' : 'periods'}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2">
                                                {records.map((record) => (
                                                    <div
                                                        key={record._id}
                                                        onClick={() => setSubjectFilter(prev => prev === record.subject ? 'ALL' : record.subject)}
                                                        className={cn(
                                                            "flex items-center justify-between p-4 bg-white border rounded-xl hover:shadow-md transition-all cursor-pointer group",
                                                            subjectFilter === record.subject ? "border-blue-500 bg-blue-50/20 shadow-sm" : "border-slate-200 hover:border-blue-200"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center justify-center w-10 h-10 bg-slate-50 rounded-lg">
                                                                {getStatusIcon(record.status)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-slate-900">
                                                                    {record.subject}
                                                                </h4>
                                                                <p className="text-xs text-slate-500 mt-0.5">
                                                                    Period {record.period}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {getStatusBadge(record.status)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <Calendar className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                        No Records Found
                                    </h3>
                                    <p className="text-sm text-slate-500 max-w-sm">
                                        {dateFilter.from || dateFilter.to
                                            ? 'No attendance records found for the selected date range. Try adjusting your filters.'
                                            : 'No attendance records available yet.'}
                                    </p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
