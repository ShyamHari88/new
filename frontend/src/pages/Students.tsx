import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentDetailModal } from '@/components/StudentDetailModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useNavigate, useLocation } from 'react-router-dom';
import { departments, years, sections } from '@/data/mockData';
import { Search, Filter, User, TrendingUp, TrendingDown, Minus, Pencil, Trash2, AlertTriangle, RefreshCw, Upload, Download, FileUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { dataService } from '@/services/data';
import { Student } from '@/types/attendance';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function Students() {
  const [departmentFilter, setDepartmentFilter] = useState<string>('1');
  const [yearFilter, setYearFilter] = useState<string>('1');
  const [sectionFilter, setSectionFilter] = useState<string>('C');

  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'above75' | 'below50'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Helper to fetch and enrich students with stats
  const getEnrichedStudents = async () => {
    const allStudents = await dataService.getAllStudents();

    // Fetch stats for all students in ONE request (bulk operation)
    try {
      const { default: api } = await import('@/services/api');
      const response = await api.get('/attendance/stats/bulk');

      if (response.data.success && response.data.stats) {
        const statsMap = new Map();
        response.data.stats.forEach((stat: any) => {
          statsMap.set(stat.studentId, stat);
        });

        // Enrich students with their stats
        return allStudents.map(s => {
          const stats = statsMap.get(s.id) || {
            totalClasses: 0,
            present: 0,
            absent: 0,
            od: 0,
            percentage: 0
          };
          return { ...s, ...stats };
        });
      }
    } catch (error) {
      console.error('Error fetching bulk stats:', error);
    }

    // Fallback: return students with zero stats
    return allStudents.map(s => ({
      ...s,
      totalClasses: 0,
      present: 0,
      absent: 0,
      od: 0,
      percentage: 0
    }));
  };

  // State holds all enriched students
  const [students, setStudents] = useState<any[]>([]);

  // Sync students from backend on mount
  useEffect(() => {
    const syncStudents = async () => {
      setIsLoading(true);
      try {
        await dataService.syncStudentsFromBackend();
        const enriched = await getEnrichedStudents();
        setStudents(enriched);
      } catch (error) {
        console.error('Error syncing students:', error);
      } finally {
        setIsLoading(false);
      }
    };
    syncStudents();
  }, []);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.openAdd) {
      handleAddClick();
    }
  }, [location]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Detail Modal State
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [studentRoll, setStudentRoll] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentDept, setStudentDept] = useState(departmentFilter);
  const [studentYear, setStudentYear] = useState(yearFilter);

  const [studentSection, setStudentSection] = useState(sectionFilter);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);

      // Expected: Name, RollNumber, Email, Password, DeptID, Year, Section
      const studentsToImport = [];

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map(c => c.trim());
        if (cols.length < 4) continue;

        studentsToImport.push({
          name: cols[0],
          rollNumber: cols[1],
          email: cols[2],
          password: cols[3],
          departmentId: cols[4] || departmentFilter,
          year: parseInt(cols[5] || yearFilter),
          section: cols[6] || sectionFilter,
          currentSemester: 1
        });
      }

      if (studentsToImport.length === 0) {
        toast.error('No valid student data found in CSV');
        return;
      }

      setIsLoading(true);
      try {
        const results = await dataService.bulkAddStudents(studentsToImport);
        toast.success(`Import complete! ${results.success} students added.`);
        if (results.errors && results.errors.length > 0) {
          toast.error(`${results.failed} errors occurred. Check console.`);
          console.log('Import errors:', results.errors);
        }

        // Refresh local list
        const refreshed = await dataService.getAllStudents();
        const enriched = refreshed.map(s => {
          const stats = dataService.getStudentStats(s.id);
          return { ...s, ...stats };
        });
        setStudents(enriched);
      } catch (err: any) {
        toast.error(err.message || 'Bulk import failed');
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const resetForm = () => {
    setStudentName('');
    setStudentRoll('');
    setStudentEmail('');
    setStudentPassword('');
    setStudentDept(departmentFilter);
    setStudentYear(yearFilter);
    setStudentSection(sectionFilter);
    setEditingStudentId(null);
    setDialogMode('add');
  };

  const handleSaveStudent = async () => {
    if (!studentName || !studentRoll) {
      toast.error('Please fill in Name and Roll Number');
      return;
    }

    if (dialogMode === 'add') {
      if (!studentEmail) {
        toast.error('Please provide student email');
        return;
      }
      if (!studentPassword) {
        toast.error('Please set a password for the student');
        return;
      }

      const newStudent: Student & { password?: string } = {
        id: Math.random().toString(36).substr(2, 9),
        name: studentName,
        email: studentEmail,
        rollNumber: studentRoll,
        departmentId: studentDept,
        year: parseInt(studentYear),
        section: studentSection,
        currentSemester: (parseInt(studentYear) * 2) - 1 as any,
        password: studentPassword, // Include password for MongoDB
      };

      try {
        await dataService.addStudent(newStudent);
        toast.success('Student added successfully! They can now login with their roll number and password.');
      } catch (error: any) {
        toast.error(error.message || 'Failed to add student');
        return;
      }
    } else if (dialogMode === 'edit' && editingStudentId) {
      dataService.updateStudent(editingStudentId, {
        name: studentName,
        rollNumber: studentRoll,
        departmentId: studentDept,
        year: parseInt(studentYear),
        section: studentSection,
        currentSemester: (parseInt(studentYear) * 2) - 1 as any,
      });
      toast.success('Student updated successfully');
    }

    const enriched = await getEnrichedStudents();
    setStudents(enriched);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleAddClick = () => {
    setDialogMode('add');
    resetForm(); // Ensure clean state
    setIsDialogOpen(true);
  };

  const handleEditClick = (student: Student) => {
    setDialogMode('edit');
    setEditingStudentId(student.id);
    setStudentName(student.name);
    setStudentRoll(student.rollNumber);
    setStudentDept(student.departmentId);
    setStudentYear(student.year.toString());
    setStudentSection(student.section);
    setIsDialogOpen(true);
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      dataService.deleteStudent(id);
      const enriched = await getEnrichedStudents();
      setStudents(enriched);
      toast.success('Student deleted');
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete ALL students? This cannot be undone.')) {
      dataService.clearAllStudents();
      setStudents([]);
      toast.success('All student records cleared');
    }
  };

  const handleDownloadExcel = async () => {
    try {
      // Fetch marks data for all students
      const { default: api } = await import('@/services/api');
      const marksPromises = filteredStudents.map(student =>
        api.get(`/marks/student/${student.id}`).catch(() => ({ data: { marks: [] } }))
      );
      const marksResults = await Promise.all(marksPromises);

      // Create CSV content
      const headers = [
        'Roll Number',
        'Name',
        'Email',
        'Department',
        'Year',
        'Section',
        'Semester',
        'Total Classes',
        'Present',
        'Absent',
        'OD',
        'Attendance %',
        'CIA-1',
        'CIA-2',
        'CIA-3',
        'Semester Exam',
        'Average Marks'
      ];

      const rows = filteredStudents.map((student, index) => {
        const marks = marksResults[index]?.data?.marks || [];
        const cia1 = marks.find((m: any) => m.assessmentType === 'CIA_T1')?.marks || '-';
        const cia2 = marks.find((m: any) => m.assessmentType === 'CIA_T2')?.marks || '-';
        const cia3 = marks.find((m: any) => m.assessmentType === 'CIA_T3')?.marks || '-';
        const semester = marks.find((m: any) => m.assessmentType === 'SEMESTER')?.marks || '-';
        const avgMarks = marksResults[index]?.data?.averageMarks || 0;

        const dept = departments.find(d => d.id === student.departmentId);

        return [
          student.rollNumber,
          student.name,
          student.email,
          dept?.code || student.departmentId,
          student.year,
          student.section,
          `Sem ${(student.year * 2) - 1}-${student.year * 2}`,
          student.totalClasses,
          student.present,
          student.absent,
          student.od,
          student.percentage,
          cia1,
          cia2,
          cia3,
          semester,
          avgMarks
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `students_${selectedDept?.code}_Y${yearFilter}_${sectionFilter}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel file');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Fetch marks data for all students
      const { default: api } = await import('@/services/api');
      const marksPromises = filteredStudents.map(student =>
        api.get(`/marks/student/${student.id}`).catch(() => ({ data: { marks: [] } }))
      );
      const marksResults = await Promise.all(marksPromises);

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Student Records</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #3b82f6; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .header-info { text-align: center; margin-bottom: 20px; }
            .good { color: #10b981; font-weight: bold; }
            .warning { color: #f59e0b; font-weight: bold; }
            .critical { color: #ef4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header-info">
            <h1>Student Records Report</h1>
            <p><strong>Department:</strong> ${selectedDept?.name} | <strong>Year:</strong> ${yearFilter} | <strong>Section:</strong> ${sectionFilter}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Total</th>
                <th>Present</th>
                <th>Absent</th>
                <th>OD</th>
                <th>Att %</th>
                <th>CIA-1</th>
                <th>CIA-2</th>
                <th>CIA-3</th>
                <th>Sem</th>
                <th>Avg</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents.map((student, index) => {
        const marks = marksResults[index]?.data?.marks || [];
        const cia1 = marks.find((m: any) => m.assessmentType === 'CIA_T1')?.marks || '-';
        const cia2 = marks.find((m: any) => m.assessmentType === 'CIA_T2')?.marks || '-';
        const cia3 = marks.find((m: any) => m.assessmentType === 'CIA_T3')?.marks || '-';
        const semester = marks.find((m: any) => m.assessmentType === 'SEMESTER')?.marks || '-';
        const avgMarks = marksResults[index]?.data?.averageMarks || 0;
        const attClass = student.percentage >= 75 ? 'good' : student.percentage >= 50 ? 'warning' : 'critical';

        return `
                  <tr>
                    <td>${student.rollNumber}</td>
                    <td>${student.name}</td>
                    <td>${student.totalClasses}</td>
                    <td>${student.present}</td>
                    <td>${student.absent}</td>
                    <td>${student.od}</td>
                    <td class="${attClass}">${student.percentage}%</td>
                    <td>${cia1}</td>
                    <td>${cia2}</td>
                    <td>${cia3}</td>
                    <td>${semester}</td>
                    <td>${avgMarks}</td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Create a new window and print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
        toast.success('PDF print dialog opened!');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };


  const filteredStudents = students.filter(student => {
    if (departmentFilter && student.departmentId !== departmentFilter) return false;
    if (yearFilter && student.year !== parseInt(yearFilter)) return false;
    if (sectionFilter && student.section !== sectionFilter) return false;

    if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by attendance percentage
    if (attendanceFilter === 'above75' && student.percentage < 75) return false;
    if (attendanceFilter === 'below50' && student.percentage >= 50) return false;

    return true;
  });

  const selectedDept = departments.find(d => d.id === departmentFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Student Records
          </h1>
          <p className="mt-1 text-muted-foreground">
            View individual student attendance history and performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              setIsLoading(true);
              try {
                await dataService.syncStudentsFromBackend();
                const enriched = await getEnrichedStudents();
                setStudents(enriched);
                toast.success('Students refreshed from database');
              } catch (error) {
                toast.error('Failed to refresh students');
              } finally {
                setIsLoading(false);
              }
            }}
            title="Refresh Data"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          {students.length > 0 && (
            <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleClearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Records
            </Button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileUpload}
          />

          <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={handleBulkImportClick} disabled={isLoading}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                disabled={filteredStudents.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadExcel}>
                <FileUp className="mr-2 h-4 w-4" />
                Export as Excel (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddClick}>Add Student</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dialogMode === 'add' ? 'Add New Student' : 'Edit Student'}</DialogTitle>
                <DialogDescription>
                  {dialogMode === 'add'
                    ? 'Enter the details of the student to add to the database.'
                    : 'Update the student details below.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="roll" className="text-right">
                    Roll No
                  </Label>
                  <Input
                    id="roll"
                    value={studentRoll}
                    onChange={(e) => setStudentRoll(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="col-span-3"
                    placeholder="student@example.com"
                  />
                </div>
                {dialogMode === 'add' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      className="col-span-3"
                      placeholder="Set login password"
                    />
                  </div>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dept" className="text-right">
                    Dept
                  </Label>
                  <Select value={studentDept} onValueChange={setStudentDept}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Year
                  </Label>
                  <Select
                    value={studentYear}
                    onValueChange={(value) => {
                      setStudentYear(value);
                    }}
                  >
                    <SelectTrigger className="col-span-3">
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
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="section" className="text-right">
                    Section
                  </Label>
                  <Select value={studentSection} onValueChange={setStudentSection}>
                    <SelectTrigger className="col-span-3">
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
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveStudent}>
                  {dialogMode === 'add' ? 'Add Student' : 'Update Student'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[140px]">
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
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="w-[120px]">
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

          </div>
        </CardContent>
      </Card>

      {/* Class Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className={cn(
            "card-elevated cursor-pointer transition-all hover:shadow-md hover:scale-105",
            attendanceFilter === 'all' && "ring-2 ring-primary"
          )}
          onClick={() => setAttendanceFilter('all')}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold font-display text-foreground">{filteredStudents.length}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "card-elevated cursor-pointer transition-all hover:shadow-md hover:scale-105",
            attendanceFilter === 'above75' && "ring-2 ring-success"
          )}
          onClick={() => setAttendanceFilter(attendanceFilter === 'above75' ? 'all' : 'above75')}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold font-display text-success">
                {students.filter(s => s.percentage >= 75 &&
                  (!departmentFilter || s.departmentId === departmentFilter) &&
                  (!yearFilter || s.year === parseInt(yearFilter)) &&
                  (!sectionFilter || s.section === sectionFilter) &&
                  (!searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                ).length}
              </p>
              <p className="text-sm text-muted-foreground">Above 75%</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "card-elevated cursor-pointer transition-all hover:shadow-md hover:scale-105",
            attendanceFilter === 'below50' && "ring-2 ring-destructive"
          )}
          onClick={() => setAttendanceFilter(attendanceFilter === 'below50' ? 'all' : 'below50')}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold font-display text-destructive">
                {students.filter(s => s.percentage < 50 &&
                  (!departmentFilter || s.departmentId === departmentFilter) &&
                  (!yearFilter || s.year === parseInt(yearFilter)) &&
                  (!sectionFilter || s.section === sectionFilter) &&
                  (!searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                ).length}
              </p>
              <p className="text-sm text-muted-foreground">Below 50%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-display">
            {selectedDept?.code} – Year {yearFilter} – Section {sectionFilter}
          </CardTitle>
          <CardDescription>
            {attendanceFilter === 'all'
              ? `Showing ${filteredStudents.length} students`
              : attendanceFilter === 'above75'
                ? `Showing ${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''} with attendance above 75%`
                : `Showing ${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''} with attendance below 50%`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">OD</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                      onClick={() => {
                        setSelectedStudent(student);
                        setIsDetailOpen(true);
                      }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-blue-600 hover:underline">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{student.rollNumber}</TableCell>
                  <TableCell className="text-center">{student.totalClasses}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-success font-medium">{student.present}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-destructive font-medium">{student.absent}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-warning font-medium">{student.od}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={student.percentage}
                        className="h-2 w-24"
                      />
                      <span className={`text-sm font-semibold ${student.percentage >= 75 ? 'text-success' :
                        student.percentage >= 50 ? 'text-warning' : 'text-destructive'
                        }`}>
                        {student.percentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {student.percentage >= 75 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                        <TrendingUp className="h-3 w-3" />
                        Good
                      </span>
                    ) : student.percentage >= 50 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                        <Minus className="h-3 w-3" />
                        Warning
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                        <TrendingDown className="h-3 w-3" />
                        Critical
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleEditClick(student)}
                        title="Edit Student"
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                        title="Delete Student"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <User className="h-8 w-8 opacity-20" />
                      </div>
                      <p className="text-xl font-medium">No students found</p>
                      <p className="mt-1">
                        There are no students in this class. Click "Add Student" to add one manually.
                      </p>
                      {students.length > 0 && (
                        <p className="mt-2 text-sm italic">
                          (Try adjusting your filters or search query)
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StudentDetailModal
        student={selectedStudent}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onDelete={handleDeleteStudent}
      />
    </div>
  );
}
