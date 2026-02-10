import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { departments, years, semesters, getSemestersForYear } from '@/data/mockData';
import { Subject, Semester } from '@/types/attendance';
import { dataService } from '@/services/data';
import { authService } from '@/services/auth';
import { Plus, Trash2, BookOpen, GraduationCap, Building2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function SubjectManager() {
    const [departmentId, setDepartmentId] = useState<string>('');
    const [year, setYear] = useState<string>('');
    const [semester, setSemester] = useState<string>('');
    const [subjectName, setSubjectName] = useState<string>('');
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const user = authService.getCurrentUser();
    const teacherId = user?.id || 'teacher-1';

    // Load teacher's subjects
    useEffect(() => {
        const loadSubjects = async () => {
            const teacherSubjects = await dataService.getTeacherSubjects(teacherId);
            setSubjects(teacherSubjects);
        };
        loadSubjects();
    }, [teacherId]);

    const selectedDept = departments.find(d => d.id === departmentId);
    const availableSemesters = year ? getSemestersForYear(parseInt(year)) : [];

    const handleAddSubject = async () => {
        if (!departmentId || !year || !semester || !subjectName.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        const newSubject: Subject = {
            id: Math.random().toString(36).substr(2, 9),
            name: subjectName.trim(),
            code: subjectName.trim().substring(0, 6).toUpperCase(),
            semester: parseInt(semester) as Semester,
            departmentId,
            year: parseInt(year),
            teacherId,
            createdAt: new Date().toISOString()
        };

        try {
            await dataService.addSubject(newSubject);
            const updatedSubjects = await dataService.getTeacherSubjects(teacherId);
            setSubjects(updatedSubjects);

            // Reset form
            setSubjectName('');
            toast.success(`Subject "${newSubject.name}" added successfully!`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to add subject');
        }
    };

    const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
        if (confirm(`Are you sure you want to delete "${subjectName}"?`)) {
            await dataService.deleteSubject(subjectId);
            const updatedSubjects = await dataService.getTeacherSubjects(teacherId);
            setSubjects(updatedSubjects);
            toast.success(`Subject "${subjectName}" deleted`);
        }
    };

    const isFormComplete = departmentId && year && semester && subjectName.trim();

    // Group subjects by class and semester
    const groupedSubjects = subjects.reduce((acc, subject) => {
        const dept = departments.find(d => d.id === subject.departmentId);
        const key = `${dept?.code || 'Unknown'} - Year ${subject.year}`;
        if (!acc[key]) {
            acc[key] = {};
        }
        const semesterKey = `Semester ${subject.semester}`;
        if (!acc[key][semesterKey]) {
            acc[key][semesterKey] = [];
        }
        acc[key][semesterKey].push(subject);
        return acc;
    }, {} as Record<string, Record<string, Subject[]>>);

    return (
        <div className="space-y-6">
            {/* Add Subject Form */}
            <Card className="card-elevated">
                <CardHeader>
                    <CardTitle className="font-display">Add New Subject</CardTitle>
                    <CardDescription>Add a subject for a specific class and semester</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Department */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                Department
                            </label>
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Year */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Year
                            </label>
                            <Select value={year} onValueChange={setYear} disabled={!departmentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y.value} value={y.value.toString()}>
                                            {y.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Semester */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                Semester
                            </label>
                            <Select value={semester} onValueChange={setSemester} disabled={!year}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSemesters.map((s) => (
                                        <SelectItem key={s.value} value={s.value.toString()}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Subject Name */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                Subject Name
                            </label>
                            <Input
                                placeholder="e.g., Data Structures"
                                value={subjectName}
                                onChange={(e) => setSubjectName(e.target.value)}
                                disabled={!semester}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && isFormComplete) {
                                        handleAddSubject();
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <Button
                            onClick={handleAddSubject}
                            disabled={!isFormComplete}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Subject
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Subjects List */}
            <Card className="card-elevated">
                <CardHeader>
                    <CardTitle className="font-display">Your Subjects</CardTitle>
                    <CardDescription>
                        {subjects.length} subject{subjects.length !== 1 ? 's' : ''} added
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {subjects.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No subjects added yet. Add your first subject above.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedSubjects).map(([classKey, semesters]) => (
                                <div key={classKey} className="space-y-3">
                                    <h3 className="font-semibold text-foreground border-b pb-2">{classKey}</h3>
                                    {Object.entries(semesters).map(([semesterKey, subjectList]) => (
                                        <div key={semesterKey} className="ml-4 space-y-2">
                                            <h4 className="text-sm font-medium text-muted-foreground">{semesterKey}</h4>
                                            <div className="space-y-2">
                                                {subjectList.map((subject) => (
                                                    <div
                                                        key={subject.id}
                                                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <BookOpen className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <span className="font-medium text-foreground">{subject.name}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteSubject(subject.id, subject.name)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
