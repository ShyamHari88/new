import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { dataService } from '@/services/data';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    Calendar,
    User,
    Filter,
    RefreshCw,
    Eye,
    Download,
    ShieldCheck,
    MessageSquare,
    AlertTriangle,
    Inbox,
    ArrowLeft
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function LeaveRequests() {
    const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [teacherRemarks, setTeacherRemarks] = useState('');

    const fetchLeaveRequests = async () => {
        setIsLoading(true);
        try {
            const leaves = await dataService.getAllLeaves();
            setLeaveRequests(Array.isArray(leaves) ? leaves : []);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
            toast.error('Failed to load leave requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    const handleUpdateStatus = async (requestId: string, status: 'approved' | 'rejected') => {
        if (!requestId) {
            toast.error('No request ID found — cannot update status');
            console.error('handleUpdateStatus called with empty requestId');
            return;
        }
        console.log(`[LeaveRequests] Updating leave ${requestId} to ${status}`);
        try {
            await dataService.updateLeaveStatus(requestId, status);
            toast.success(`Leave request ${status} successfully`);
            // Refresh the list
            await fetchLeaveRequests();
            setIsDetailOpen(false);
            setSelectedRequest(null);
            setTeacherRemarks('');
        } catch (error: any) {
            console.error('[LeaveRequests] Update failed:', error);
            toast.error(error?.response?.data?.message || error.message || `Failed to ${status} leave request`);
        }
    };

    // Helper to get the best available ID for a leave request
    const getLeaveId = (req: any) => {
        return req.requestId || req._id;
    };

    const filteredRequests = leaveRequests.filter(req => {
        if (statusFilter !== 'all' && req.status !== statusFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (
                !(req.studentName || '').toLowerCase().includes(query) &&
                !(req.rollNumber || '').toLowerCase().includes(query)
            ) {
                return false;
            }
        }
        return true;
    });

    const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;
    const approvedCount = leaveRequests.filter(r => r.status === 'approved').length;
    const rejectedCount = leaveRequests.filter(r => r.status === 'rejected').length;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'On-Duty': return <ShieldCheck className="h-4 w-4" />;
            case 'Medical': return <AlertTriangle className="h-4 w-4" />;
            default: return <MessageSquare className="h-4 w-4" />;
        }
    };

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'On-Duty': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Medical': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-purple-50 text-purple-700 border-purple-200';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-red-50 text-red-700 border-red-200 font-semibold">
                        <XCircle className="h-3 w-3 mr-1" /> Rejected
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                );
        }
    };

    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    return (
        <div className="space-y-6">
            {user?.role === 'advisor' && (
                <Button
                    variant="ghost"
                    className="flex items-center gap-2 -ml-2 text-slate-500 hover:text-indigo-600"
                    onClick={() => navigate('/advisor/dashboard')}
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </Button>
            )}
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">
                        Leave Requests
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Review and respond to student leave & OD applications
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchLeaveRequests}
                        disabled={isLoading}
                        title="Refresh"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Status Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md hover:scale-105",
                        statusFilter === 'all' && "ring-2 ring-primary"
                    )}
                    onClick={() => setStatusFilter('all')}
                >
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">{leaveRequests.length}</p>
                                <p className="text-sm text-muted-foreground">Total Requests</p>
                            </div>
                            <div className="p-3 bg-slate-100 rounded-xl">
                                <Inbox className="h-5 w-5 text-slate-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md hover:scale-105",
                        statusFilter === 'pending' && "ring-2 ring-amber-500"
                    )}
                    onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                >
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                                <p className="text-sm text-muted-foreground">Pending</p>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md hover:scale-105",
                        statusFilter === 'approved' && "ring-2 ring-emerald-500"
                    )}
                    onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
                >
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
                                <p className="text-sm text-muted-foreground">Approved</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md hover:scale-105",
                        statusFilter === 'rejected' && "ring-2 ring-red-500"
                    )}
                    onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}
                >
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                                <p className="text-sm text-muted-foreground">Rejected</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-xl">
                                <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by student name or roll number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Requests Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests
                    </CardTitle>
                    <CardDescription>
                        Showing {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Roll No</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>From</TableHead>
                                <TableHead>To</TableHead>
                                <TableHead>Applied On</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.map((req, idx) => (
                                <TableRow key={req.requestId || req._id || idx} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                                {(req.studentName || 'S').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{req.studentName || 'Unknown'}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{req.rollNumber || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("gap-1", getTypeBadgeClass(req.type))}>
                                            {getTypeIcon(req.type)}
                                            {req.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">{formatDate(req.fromDate)}</TableCell>
                                    <TableCell className="text-sm">{formatDate(req.toDate)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{formatDate(req.appliedOn || req.createdAt)}</TableCell>
                                    <TableCell className="text-center">
                                        {getStatusBadge(req.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-3"
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setTeacherRemarks('');
                                                    setIsDetailOpen(true);
                                                }}
                                            >
                                                <Eye className="h-3.5 w-3.5 mr-1" />
                                                View
                                            </Button>
                                            {req.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        onClick={() => handleUpdateStatus(getLeaveId(req), 'approved')}
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => handleUpdateStatus(getLeaveId(req), 'rejected')}
                                                    >
                                                        <XCircle className="h-3.5 w-3.5 mr-1" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                                <Inbox className="h-8 w-8 opacity-20" />
                                            </div>
                                            <p className="text-xl font-medium">No leave requests found</p>
                                            <p className="mt-1 text-sm">
                                                {statusFilter !== 'all'
                                                    ? `No ${statusFilter} requests. Try changing the filter.`
                                                    : 'No student leave applications yet.'}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Leave Request Details
                        </DialogTitle>
                        <DialogDescription>
                            Review the student's leave application and take action
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-6 py-2">
                            {/* Student Info */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                                    {(selectedRequest.studentName || 'S').charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg">{selectedRequest.studentName}</h4>
                                    <p className="text-sm text-muted-foreground font-mono">{selectedRequest.rollNumber}</p>
                                </div>
                                <div className="ml-auto">
                                    {getStatusBadge(selectedRequest.status)}
                                </div>
                            </div>

                            {/* Request Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</p>
                                    <Badge variant="outline" className={cn("gap-1", getTypeBadgeClass(selectedRequest.type))}>
                                        {getTypeIcon(selectedRequest.type)}
                                        {selectedRequest.type}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applied On</p>
                                    <p className="text-sm font-medium">{formatDate(selectedRequest.appliedOn || selectedRequest.createdAt)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Date</p>
                                    <p className="text-sm font-medium flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        {formatDate(selectedRequest.fromDate)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To Date</p>
                                    <p className="text-sm font-medium flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        {formatDate(selectedRequest.toDate)}
                                    </p>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm leading-relaxed">
                                    {selectedRequest.reason || 'No reason provided'}
                                </div>
                            </div>

                            {/* Attachments */}
                            {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attachments</p>
                                    <div className="space-y-2">
                                        {selectedRequest.attachments.map((att: any, i: number) => (
                                            <a
                                                key={i}
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
                                            >
                                                <Download className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm text-blue-700 font-medium">{att.name}</span>
                                                <span className="text-xs text-blue-400 ml-auto">
                                                    {att.size ? `${(att.size / 1024).toFixed(1)} KB` : ''}
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons — only show for pending requests */}
                            {selectedRequest.status === 'pending' && (
                                <DialogFooter className="flex gap-3 pt-4 border-t">
                                    <Button
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => handleUpdateStatus(getLeaveId(selectedRequest), 'approved')}
                                    >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Approve Request
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => handleUpdateStatus(getLeaveId(selectedRequest), 'rejected')}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject Request
                                    </Button>
                                </DialogFooter>
                            )}

                            {selectedRequest.status !== 'pending' && (
                                <div className={cn(
                                    "p-4 rounded-xl text-center text-sm font-semibold",
                                    selectedRequest.status === 'approved'
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-red-50 text-red-700 border border-red-200"
                                )}>
                                    This request has been {selectedRequest.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
