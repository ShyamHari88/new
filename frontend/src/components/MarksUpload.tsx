import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { departments, years, sections, getSemestersForYear } from '@/data/mockData';
import { dataService } from '@/services/data';
import { AssessmentType, SubjectMark, Subject } from '@/types/attendance';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Hardcoded assessment types
const assessmentTypes: { value: AssessmentType; label: string }[] = [
    { value: 'CIA_T1', label: 'CIA Test 1' },
    { value: 'CIA_T2', label: 'CIA Test 2' },
    { value: 'CIA_T3', label: 'CIA Test 3' },
    { value: 'SEMESTER', label: 'Semester Exam' },
];

export function MarksUpload() {
    const [departmentFilter, setDepartmentFilter] = useState<string>('1');
    const [yearFilter, setYearFilter] = useState<string>('1');
    const [semesterFilter, setSemesterFilter] = useState<string>('1');
    const [sectionFilter, setSectionFilter] = useState<string>('C');
    const [subject, setSubject] = useState<string>('');
    const [assessmentType, setAssessmentType] = useState<AssessmentType>('CIA_T1');
    const [maxMarks, setMaxMarks] = useState<number>(100);

    const [studentsData, setStudentsData] = useState<any[]>([]);
    const [marksInput, setMarksInput] = useState<{ [key: string]: number }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        const loadSubjects = async () => {
            const subjects = await dataService.getAllSubjects();
            setAvailableSubjects(subjects);
        };
        loadSubjects();
    }, []);

    // Update semester when year changes
    useEffect(() => {
        const sems = getSemestersForYear(parseInt(yearFilter));
        if (sems.length > 0) {
            setSemesterFilter(sems[0].value.toString());
        }
    }, [yearFilter]);

    const filteredSubjects = availableSubjects.filter(s =>
        s.departmentId === departmentFilter &&
        s.year === parseInt(yearFilter) &&
        s.semester === parseInt(semesterFilter)
    );

    const handleLoadStudents = async () => {
        if (!subject) {
            toast.error('Please select a subject first');
            return;
        }

        setIsLoading(true);
        try {
            const data = await dataService.getMarksForClass(
                departmentFilter,
                parseInt(yearFilter),
                sectionFilter,
                subject,
                assessmentType
            );
            setStudentsData(data);

            // Initialize marks input with existing marks
            const initialMarks: { [key: string]: number } = {};
            data.forEach((item: any) => {
                if (item.mark !== null) {
                    initialMarks[item.student.id] = item.mark;
                }
            });
            setMarksInput(initialMarks);
        } catch (error) {
            console.error('Failed to load students:', error);
            toast.error('Failed to load students');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveMarks = async () => {
        const teacherId = localStorage.getItem('teacher_id') || 'teacher1';
        const now = new Date().toISOString();
        const date = new Date().toISOString().split('T')[0];

        const marksToSave: SubjectMark[] = [];
        setIsLoading(true);

        try {
            for (const item of studentsData) {
                const marks = marksInput[item.student.id];
                if (marks !== undefined && marks !== null) {
                    if (item.markId) {
                        // Update existing mark
                        await dataService.updateMark(item.markId, marks);
                    } else {
                        // Create new mark
                        marksToSave.push({
                            id: Math.random().toString(36).substr(2, 9),
                            studentId: item.student.id,
                            subject,
                            assessmentType,
                            marks,
                            maxMarks,
                            date,
                            uploadedBy: teacherId,
                            timestamp: now,
                        });
                    }
                }
            }

            if (marksToSave.length > 0) {
                await dataService.saveMarks(marksToSave);
            }

            toast.success('Marks saved successfully!');
            await handleLoadStudents(); // Reload to show updated marks
        } catch (error) {
            console.error('Failed to save marks:', error);
            toast.error('Failed to save marks');
        } finally {
            setIsLoading(false);
        }
    };

    const availableSemesters = getSemestersForYear(parseInt(yearFilter));

    return (
        <Card className="card-elevated">
            <CardHeader>
                <CardTitle className="font-display">Upload Marks</CardTitle>
                <CardDescription>Enter marks for students by class, subject, and assessment type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                    {dept.code}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y.value} value={y.value.toString()}>
                                    {y.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Semester" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableSemesters.map((s) => (
                                <SelectItem key={s.value} value={s.value.toString()}>
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={sectionFilter} onValueChange={setSectionFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Section" />
                        </SelectTrigger>
                        <SelectContent>
                            {sections.map((s) => (
                                <SelectItem key={s} value={s}>
                                    Section {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredSubjects.length > 0 ? (
                                filteredSubjects.map((s) => (
                                    <SelectItem key={s.id} value={s.name}>
                                        {s.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="none" disabled>No subjects found</SelectItem>
                            )}
                        </SelectContent>
                    </Select>

                    <Select value={assessmentType} onValueChange={(v) => setAssessmentType(v as AssessmentType)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Assessment" />
                        </SelectTrigger>
                        <SelectContent>
                            {assessmentTypes.map((a) => (
                                <SelectItem key={a.value} value={a.value}>
                                    {a.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleLoadStudents} className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load Students'
                        )}
                    </Button>
                </div>

                {/* Students Table */}
                {studentsData.length > 0 && (
                    <>
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium">Max Marks:</label>
                            <Input
                                type="number"
                                value={maxMarks}
                                onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)}
                                className="w-24"
                            />
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Roll No</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Marks (out of {maxMarks})</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentsData.map((item: any) => (
                                    <TableRow key={item.student.id}>
                                        <TableCell className="font-mono">{item.student.rollNumber}</TableCell>
                                        <TableCell>{item.student.name}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                max={maxMarks}
                                                value={marksInput[item.student.id] || ''}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value);
                                                    setMarksInput({
                                                        ...marksInput,
                                                        [item.student.id]: isNaN(value) ? 0 : value,
                                                    });
                                                }}
                                                className="w-24"
                                                placeholder="Enter marks"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="flex justify-end">
                            <Button onClick={handleSaveMarks} size="lg">
                                {studentsData.some(item => item.markId) ? 'Update Marks' : 'Save Marks'}
                            </Button>
                        </div>
                    </>
                )}

                {studentsData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        Select filters and click "Load Students" to begin entering marks
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
