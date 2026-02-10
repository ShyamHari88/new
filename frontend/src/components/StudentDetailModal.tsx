
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Student, StudentAttendanceSummary, AssessmentType } from "@/types/attendance";
import { dataService } from "@/services/data";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentDetailModalProps {
    student: (Student & { percentage: number; present: number; absent: number }) | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (id: string, name: string) => void;
}

export function StudentDetailModal({
    student,
    isOpen,
    onClose,
    onDelete,
}: StudentDetailModalProps) {
    const [performance, setPerformance] = useState<any>(null);
    const [selectedAssessment, setSelectedAssessment] = useState<AssessmentType | 'ALL'>('ALL');
    const [filteredMarks, setFilteredMarks] = useState<any[]>([]);

    useEffect(() => {
        const fetchPerformance = async () => {
            if (student?.id) {
                const data = await dataService.getStudentPerformance(student.id);
                setPerformance(data);
            }
        };
        fetchPerformance();
    }, [student?.id]);

    // Filter marks based on selected assessment
    useEffect(() => {
        if (performance?.allMarks && selectedAssessment !== 'ALL') {
            const filtered = performance.allMarks.filter(
                (m: any) => m.assessmentType === selectedAssessment
            );

            // Group by subject and calculate average for this assessment
            const subjectMarks: { [key: string]: { total: number, count: number } } = {};
            filtered.forEach((m: any) => {
                if (!subjectMarks[m.subject]) {
                    subjectMarks[m.subject] = { total: 0, count: 0 };
                }
                subjectMarks[m.subject].total += m.marks;
                subjectMarks[m.subject].count += 1;
            });

            const marksData = Object.keys(subjectMarks).map(subject => ({
                subject,
                score: Math.round(subjectMarks[subject].total / subjectMarks[subject].count),
                fullMark: 100
            }));

            setFilteredMarks(marksData);
        } else {
            setFilteredMarks(performance?.marks || []);
        }
    }, [selectedAssessment, performance]);

    if (!student) return null;

    const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

    // Custom Pie Label
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
        return null; // Simplified for clean look, center text handles it
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50/50">

                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                            {student.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
                            <p className="text-slate-600">
                                Class: {student.year} | Section: {student.section} | Roll No: {student.rollNumber}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => {
                                onDelete(student.id, student.name);
                                onClose();
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Student
                        </Button>
                    </div>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="shadow-sm border-blue-200 bg-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Attendance This Year</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-blue-600">{student.percentage}%</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-emerald-200 bg-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Average Marks</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-emerald-600">{performance?.averageMarks || 0}%</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-indigo-200 bg-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Classes This Semester</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>Present:</span>
                                        <span className="font-bold text-slate-700">{student.present}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Absent:</span>
                                        <span className="font-bold text-slate-700">{student.absent}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Attendance History Chart */}
                        <Card className="shadow-sm border-none bg-white col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">Attendance History</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performance?.attendanceHistory || []}>
                                        <defs>
                                            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPv)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Marks Analysis Chart */}
                        <Card className="shadow-sm border-none bg-white col-span-1">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Marks Analysis</CardTitle>
                                <Select value={selectedAssessment} onValueChange={(v) => setSelectedAssessment(v as AssessmentType | 'ALL')}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Assessment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Average</SelectItem>
                                        <SelectItem value="CIA_T1">CIA Test 1</SelectItem>
                                        <SelectItem value="CIA_T2">CIA Test 2</SelectItem>
                                        <SelectItem value="CIA_T3">CIA Test 3</SelectItem>
                                        <SelectItem value="SEMESTER">Semester</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent className="h-[250px] flex items-center justify-between">
                                <div className="w-[60%] h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={filteredMarks} margin={{ left: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="subject" type="category" width={60} tick={{ fontSize: 12 }} interval={0} />
                                            <Tooltip cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                                                {performance?.marks?.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Overall Performance Circle */}
                                <div className="w-[40%] flex flex-col items-center justify-center">
                                    <div className="relative h-32 w-32">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[{ name: 'Score', value: performance?.averageMarks || 0 }, { name: 'Rest', value: 100 - (performance?.averageMarks || 0) }]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={55}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#3b82f6" />
                                                    <Cell fill="#e2e8f0" />
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-slate-800">{performance?.averageMarks}%</span>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500 font-medium">Overall Performance</p>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
