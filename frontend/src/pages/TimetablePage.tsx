
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { departments, years, sections } from '@/data/mockData';
import { dataService } from '@/services/data';
import { toast } from 'sonner';
import { CalendarDays, Plus, Trash2, Clock, Save, Loader2 } from 'lucide-react';

export default function TimetablePage() {
    const [filter, setFilter] = useState({
        dept: '1', year: 1, section: 'A'
    });
    const [timetableData, setTimetableData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingDay, setEditingDay] = useState<string | null>(null);
    const [editingPeriods, setEditingPeriods] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);

    useEffect(() => {
        loadTeachers();
        handleLoadTimetable();
    }, []);

    const loadTeachers = async () => {
        try {
            const allTeachers = await dataService.getAllTeachers();
            setTeachers(allTeachers);
        } catch (error) {
            console.error('Error loading teachers:', error);
        }
    };

    const handleLoadTimetable = async () => {
        setIsLoading(true);
        try {
            const data = await dataService.getClassTimetable(
                filter.dept,
                filter.year,
                filter.section
            );
            setTimetableData(data || []);
        } catch (error) {
            toast.error('Failed to load timetable');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTimetableDay = async () => {
        if (!editingDay) return;
        setIsSaving(true);
        try {
            await dataService.updateClassTimetable({
                departmentId: filter.dept,
                year: filter.year,
                section: filter.section,
                days: [{ day: editingDay, periods: editingPeriods }]
            });
            toast.success(`${editingDay} schedule updated successfully!`);
            setEditingDay(null);
            handleLoadTimetable(); // Refresh
        } catch (error: any) {
            toast.error(error.message || 'Failed to update timetable');
        } finally {
            setIsSaving(false);
        }
    };

    const addPeriod = () => {
        const nextNum = editingPeriods.length + 1;
        setEditingPeriods([...editingPeriods, {
            periodNumber: nextNum,
            subject: '',
            startTime: '09:00',
            endTime: '10:00',
            teacherId: ''
        }]);
    };

    const removePeriod = (index: number) => {
        const updated = editingPeriods.filter((_, i) => i !== index)
            .map((p, i) => ({ ...p, periodNumber: i + 1 }));
        setEditingPeriods(updated);
    };

    const updatePeriod = (index: number, field: string, value: any) => {
        const updated = [...editingPeriods];
        updated[index] = { ...updated[index], [field]: value };
        setEditingPeriods(updated);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Schedule Orchestrator</h1>
                    <p className="text-slate-500 font-medium">Manage daily timetables for all departments and years</p>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">Class Selection</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Department</Label>
                            <Select value={filter.dept} onValueChange={(val) => setFilter({ ...filter, dept: val })}>
                                <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-blue-500 transition-all duration-300">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 w-32">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Year</Label>
                            <Select value={filter.year.toString()} onValueChange={(val) => setFilter({ ...filter, year: parseInt(val) })}>
                                <SelectTrigger className="bg-slate-50/50 border-slate-200">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => <SelectItem key={y.value} value={y.value.toString()}>{y.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 w-32">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Section</Label>
                            <Select value={filter.section} onValueChange={(val) => setFilter({ ...filter, section: val })}>
                                <SelectTrigger className="bg-slate-50/50 border-slate-200">
                                    <SelectValue placeholder="Section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleLoadTimetable}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all duration-300"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarDays className="h-4 w-4 mr-2" />}
                            Load Timetable
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {timetableData.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                        const dayData = timetableData.find(d => d.day === day);
                        return (
                            <Card key={day} className="border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
                                <div className="bg-slate-900 group-hover:bg-blue-900 transition-colors text-white px-5 py-3 flex justify-between items-center">
                                    <span className="font-bold tracking-wide uppercase text-xs">{day}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-3 text-blue-400 hover:text-white hover:bg-white/10 text-xs font-bold"
                                        onClick={() => {
                                            setEditingDay(day);
                                            setEditingPeriods(dayData ? dayData.periods : []);
                                        }}
                                    >
                                        EDIT DAY
                                    </Button>
                                </div>
                                <CardContent className="p-4 bg-white min-h-[200px]">
                                    {dayData && dayData.periods.length > 0 ? (
                                        <div className="space-y-3">
                                            {dayData.periods.map((p: any) => (
                                                <div key={p.periodNumber} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50/20 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm">
                                                            P{p.periodNumber}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{p.subject}</span>
                                                            <span className="text-[10px] font-medium text-slate-400">
                                                                {teachers.find(t => t.teacherId === p.teacherId)?.name || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="text-[10px] tabular-nums">{p.startTime}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-10 opacity-40">
                                            <CalendarDays className="h-8 w-8 mb-2" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">No Schedule</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <CalendarDays className="h-8 w-8 text-slate-200" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No Timetable Found</h3>
                    <p className="text-slate-400 text-sm max-w-sm text-center mt-1">Select a class from the options above and click Load to see or create its weekly schedule.</p>
                </div>
            )}

            <Dialog open={!!editingDay} onOpenChange={(open) => !open && setEditingDay(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50">
                    <DialogHeader className="p-6 bg-white border-b border-slate-100">
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <Clock className="h-5 w-5 text-blue-600" />
                            {editingDay} Schedule Configuration
                        </DialogTitle>
                        <DialogDescription className="font-medium">
                            Set up the class schedule for {departments.find(d => d.id === filter.dept)?.code} - Year {filter.year} ({filter.section})
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {editingPeriods.length > 0 ? (
                            editingPeriods.map((period, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-end p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group/period">
                                    <div className="col-span-1 h-full flex items-center justify-center">
                                        <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                                            {period.periodNumber}
                                        </div>
                                    </div>
                                    <div className="col-span-4 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Subject Name</Label>
                                        <Input
                                            placeholder="e.g. Mathematics"
                                            value={period.subject}
                                            onChange={(e) => updatePeriod(index, 'subject', e.target.value)}
                                            className="bg-slate-50/50 border-slate-100 focus:bg-white"
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Timing</Label>
                                        <div className="flex items-center gap-1.5">
                                            <Input
                                                type="time"
                                                className="px-2 h-10 w-full tabular-nums bg-slate-50/50 border-slate-100"
                                                value={period.startTime}
                                                onChange={(e) => updatePeriod(index, 'startTime', e.target.value)}
                                            />
                                            <span className="text-slate-300 font-bold">-</span>
                                            <Input
                                                type="time"
                                                className="px-2 h-10 w-full tabular-nums bg-slate-50/50 border-slate-100"
                                                value={period.endTime}
                                                onChange={(e) => updatePeriod(index, 'endTime', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-3 space-y-1.5">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Instructor</Label>
                                        <Select value={period.teacherId} onValueChange={(val) => updatePeriod(index, 'teacherId', val)}>
                                            <SelectTrigger className="h-10 text-xs bg-slate-50/50 border-slate-100">
                                                <SelectValue placeholder="Select Teacher" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teachers.map(t => <SelectItem key={t.teacherId} value={t.teacherId}>{t.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <Button size="icon" variant="ghost" className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => removePeriod(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white py-10 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center opacity-50">
                                <Plus className="h-10 w-10 text-slate-300 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No Periods Defined</p>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            className="w-full border-dashed border-2 py-8 rounded-2xl text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 transition-all font-bold"
                            onClick={addPeriod}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add Next Period
                        </Button>
                    </div>

                    <DialogFooter className="p-6 bg-white border-t border-slate-100">
                        <Button variant="ghost" className="font-bold text-slate-500 hover:bg-slate-50" onClick={() => setEditingDay(null)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveTimetableDay}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-lg shadow-blue-500/20"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Publish Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
