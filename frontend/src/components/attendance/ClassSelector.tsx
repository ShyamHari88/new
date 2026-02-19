import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { departments, years, sections, semesters, getSemestersForYear } from '@/data/mockData';
import { ClassInfo, Subject, Semester } from '@/types/attendance';
import { dataService } from '@/services/data';
import { ArrowRight, Building2, Calendar, GraduationCap, BookOpen, Clock } from 'lucide-react';
import { authService } from '@/services/auth';

interface ClassSelectorProps {
  onClassSelect: (classInfo: ClassInfo, subject: string, date: string, period: string) => void;
}

export function ClassSelector({ onClassSelect }: ClassSelectorProps) {
  const [departmentId, setDepartmentId] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [section, setSection] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [period, setPeriod] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  const periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8'];

  const selectedDept = departments.find(d => d.id === departmentId);
  const availableSemesters = year ? getSemestersForYear(parseInt(year)) : [];
  const selectedSubject = availableSubjects.find(s => s.id === subjectId);

  // Load subjects when semester changes
  useEffect(() => {
    const loadSubjects = async () => {
      if (departmentId && year && semester) {
        const user = authService.getCurrentUser();
        const teacherId = user?.role === 'teacher' ? user.teacherId : undefined;

        const subjects = await dataService.getSubjectsByFilter(
          departmentId,
          parseInt(year),
          parseInt(semester) as Semester,
          teacherId
        );
        setAvailableSubjects(subjects);
        setSubjectId(''); // Reset subject selection when filters change
      } else {
        setAvailableSubjects([]);
        setSubjectId('');
      }
    };
    loadSubjects();
  }, [departmentId, year, section, semester]);

  const handleProceed = () => {
    if (departmentId && year && section && semester && selectedSubject && selectedDept && period && date) {
      onClassSelect({
        departmentId,
        departmentName: selectedDept.name,
        departmentCode: selectedDept.code,
        year: parseInt(year),
        section,
        semester: parseInt(semester)
      }, selectedSubject.name, date, period);
    }
  };

  const isComplete = departmentId && year && section && semester && subjectId && period && date;

  return (
    <Card className="card-elevated animate-fade-in">
      <CardHeader>
        <CardTitle className="font-display">Select Class</CardTitle>
        <CardDescription>Choose department, year, section, and subject to mark attendance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                    {dept.name} ({dept.code})
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

          {/* Section */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Section
            </label>
            <Select value={section} onValueChange={setSection} disabled={!year}>
              <SelectTrigger>
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s} value={s}>
                    Section {s}
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
            <Select value={semester} onValueChange={setSemester} disabled={!section}>
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

          {/* Subject */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Subject
            </label>
            <Select value={subjectId} onValueChange={setSubjectId} disabled={!semester}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.length > 0 ? (
                  availableSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-subjects" disabled>
                    No subjects available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10"
            />
          </div>

          {/* Period */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Period
            </label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isComplete && (
          <div className="mt-6 flex items-center justify-between rounded-lg bg-primary/5 p-4 animate-slide-up">
            <div>
              <p className="text-sm text-muted-foreground">Selected Class</p>
              <p className="text-lg font-display font-semibold text-foreground">
                {selectedDept?.code} – {years.find(y => y.value === parseInt(year))?.label?.replace(' Year', '')} – {section}
              </p>
              <p className="text-sm text-muted-foreground">
                {semesters.find(s => s.value === parseInt(semester))?.label} • {selectedSubject?.name} • {date} • {period}
              </p>
            </div>
            <Button onClick={handleProceed} size="lg">
              Proceed to Mark Attendance
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
