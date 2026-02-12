
import { Bell, CheckCircle2, XCircle, Clock, Info, AlertTriangle, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { dataService } from '@/services/data';
import { authService } from '@/services/auth';
import { toast } from 'sonner';

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const user = authService.getCurrentUser();
    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
    const isStudent = user?.role === 'student';

    const fetchData = async () => {
        if (isTeacher) {
            const leaves = await dataService.getAllLeaves();
            setPendingRequests(leaves.filter((l: any) => l.status === 'pending'));
        }

        // Both can have notifications, but mainly for students
        const notes = await dataService.getNotifications();
        setNotifications(notes);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [isTeacher, isStudent]);

    const handleUpdateLeaveStatus = async (requestId: string, status: string) => {
        try {
            await dataService.updateLeaveStatus(requestId, status);
            toast.success(`Request ${status}!`);
            await fetchData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await dataService.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark as read');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await dataService.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const unreadNotifications = notifications.filter(n => !n.isRead);
    const totalCount = (isTeacher ? pendingRequests.length : 0) + unreadNotifications.length;

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0 rounded-full hover:bg-slate-100">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {totalCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                            {totalCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[400px] p-0 shadow-2xl border-slate-200">
                <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                            {totalCount} UNREAD ITEMS
                        </p>
                    </div>
                    {unreadNotifications.length > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={handleMarkAllRead}>
                            MARK ALL READ
                        </Button>
                    )}
                </div>

                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                    {/* Pending Leave Requests (Teachers only) */}
                    {isTeacher && pendingRequests.length > 0 && (
                        <div className="bg-amber-50/30">
                            <div className="px-4 py-2 border-b border-amber-100/50">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pending Approvals</p>
                            </div>
                            <div className="divide-y divide-amber-100/30">
                                {pendingRequests.map((request) => (
                                    <div key={request.requestId || request._id} className="p-4 hover:bg-amber-50/50 transition-colors">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold", request.type === 'On-Duty' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600')}>
                                                    {request.type === 'On-Duty' ? 'OD' : 'LV'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800 leading-none mb-1">{request.studentName}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{request.rollNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                                                <Clock className="h-2.5 w-2.5" />
                                                PENDING
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 mb-3 bg-white/50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                                            {request.reason}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-[11px]" onClick={() => handleUpdateLeaveStatus(request.requestId || request._id, 'approved')}>
                                                APPROVE
                                            </Button>
                                            <Button size="sm" variant="outline" className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 font-bold h-8 text-[11px]" onClick={() => handleUpdateLeaveStatus(request.requestId || request._id, 'rejected')}>
                                                REJECT
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* General Notifications */}
                    {notifications.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {notifications.map((note) => (
                                <div key={note._id} className={cn("p-4 transition-colors relative group", !note.isRead ? "bg-blue-50/20" : "hover:bg-slate-50")}>
                                    {!note.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                                            note.type === 'attendance_alert' ? "bg-rose-100 text-rose-600" :
                                                note.type === 'leave_update' ? "bg-emerald-100 text-emerald-600" :
                                                    note.type === 'mark_alert' ? "bg-indigo-100 text-indigo-600" :
                                                        "bg-blue-100 text-blue-600"
                                        )}>
                                            {note.type === 'attendance_alert' ? <AlertTriangle className="h-4 w-4" /> :
                                                note.type === 'leave_update' ? <CheckCircle2 className="h-4 w-4" /> :
                                                    note.type === 'mark_alert' ? <FileText className="h-4 w-4" /> :
                                                        <Info className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-6">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <p className={cn("font-bold text-sm truncate", !note.isRead ? "text-slate-900" : "text-slate-600")}>
                                                    {note.title}
                                                </p>
                                                <span className="text-[9px] text-slate-400 font-medium shrink-0">
                                                    {new Date(note.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {note.message}
                                            </p>
                                        </div>
                                    </div>
                                    {!note.isRead && (
                                        <button
                                            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-blue-50 text-blue-600"
                                            onClick={() => handleMarkRead(note._id)}
                                            title="Mark as read"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        (!isTeacher || pendingRequests.length === 0) && (
                            <div className="p-12 text-center">
                                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Bell className="h-8 w-8 text-slate-200" />
                                </div>
                                <h4 className="font-bold text-slate-900 text-sm">All caught up!</h4>
                                <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">You've cleared all your notifications and pending tasks.</p>
                            </div>
                        )
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
