import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClassInfo, AttendanceStatus, Student } from '@/types/attendance';
import { generateStudents } from '@/data/mockData';
import { dataService } from '@/services/data';
import { ArrowLeft, Check, X, Clock, CheckCircle, Users, Save, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AttendanceMarkerProps {
  classInfo: ClassInfo;
  subject: string;
  date: string;
  period: string;
  onBack: () => void;
  editSessionId?: string;
  viewSessionId?: string;
  readOnly?: boolean;
}

type StudentAttendance = {
  student: Student;
  status: AttendanceStatus | null;
};

export function AttendanceMarker({ classInfo, subject, date, period, onBack, editSessionId, viewSessionId, readOnly }: AttendanceMarkerProps) {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);

  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [filter, setFilter] = useState<AttendanceStatus | 'all'>('all');
  const [topicCovered, setTopicCovered] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const studentList = await dataService.getStudentsByFilter(classInfo.departmentId, classInfo.year, classInfo.section);
        setStudents(studentList);
        setAttendance(studentList.map(student => ({ student, status: null })));
      } catch (error) {
        console.error('Error loading students:', error);
        toast.error('Failed to load students');
      } finally {
        setIsLoading(false);
      }
    };
    loadStudents();
  }, [classInfo.departmentId, classInfo.year, classInfo.section]);

  // Load existing attendance if editing/viewing
  useEffect(() => {
    const loadExistingAttendance = async () => {
      const sessionId = editSessionId || viewSessionId;
      if (!sessionId || students.length === 0) return;

      try {
        console.log('Loading attendance for session:', sessionId);

        // Load session metadata (topic covered)
        const sessions = await dataService.getAllSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (session?.topicCovered) {
          setTopicCovered(session.topicCovered);
          console.log('Topic covered:', session.topicCovered);
        }

        // Load attendance records
        const existingRecords = await dataService.getAttendanceBySession(sessionId);
        console.log('Loaded attendance records:', existingRecords);

        if (existingRecords.length > 0) {
          setAttendance(prev =>
            prev.map(item => {
              const record = existingRecords.find(r => r.studentId === item.student.id);
              return record ? { ...item, status: record.status } : item;
            })
          );
          console.log('Attendance data loaded successfully');
        } else {
          console.warn('No attendance records found for session:', sessionId);
        }
      } catch (error) {
        console.error('Error loading attendance:', error);
        toast.error('Failed to load attendance data');
      }
    };
    loadExistingAttendance();
  }, [editSessionId, viewSessionId, students.length]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev =>
      prev.map(item =>
        item.student.id === studentId ? { ...item, status } : item
      )
    );
  };

  const handleMarkAllPresent = () => {
    setAttendance(prev => prev.map(item => ({ ...item, status: 'present' })));
  };

  const handleSubmit = async () => {
    const unmarked = attendance.filter(a => a.status === null);
    if (unmarked.length > 0) {
      toast.error(`Please mark attendance for all ${unmarked.length} remaining students`);
      return;
    }

    // Save to persistence
    const records = attendance.map(a => ({
      studentId: a.student.id,
      status: a.status!,
      subject: subject,
      teacherId: 'teacher-1',
      date: date,
      period: period,
      timestamp: new Date().toISOString()
    }));

    try {
      if (editSessionId) {
        await dataService.updateAttendance(editSessionId, new Date().toISOString(), records);
        toast.success('Attendance updated successfully!');
      } else {
        await dataService.saveAttendance(
          Math.random().toString(36).substr(2, 9),
          new Date().toISOString(),
          records,
          topicCovered
        );
        toast.success('Attendance saved successfully!');
      }
      onBack();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save attendance');
    }
  };

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    od: attendance.filter(a => a.status === 'od').length,
    unmarked: attendance.filter(a => a.status === null).length,
  };

  const filteredAttendance = filter === 'all'
    ? attendance
    : attendance.filter(a => a.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {readOnly ? 'View Attendance' : (editSessionId ? 'Edit Attendance' : 'Mark Attendance')} – {classInfo.departmentCode} – {classInfo.year} – {classInfo.section}
            </h1>
            <p className="text-muted-foreground">{subject} • {period} • {format(new Date(date), 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>
        {!readOnly && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleMarkAllPresent}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark All Present
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              {editSessionId ? 'Update Attendance' : 'Save Attendance'}
            </Button>
          </div>
        )}
      </div>

      {readOnly ? (
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Topic Covered</h3>
          <p className="text-sm font-medium text-slate-700">{topicCovered || 'Not recorded'}</p>
        </div>
      ) : (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <div className="flex items-center gap-2 p-3 bg-slate-50 border-b">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Syllabus Tracker</h3>
          </div>
          <div className="p-4">
            <textarea
              placeholder="E.g. Introduction to React Hooks, Virtual DOM..."
              className="w-full min-h-[60px] p-3 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              value={topicCovered}
              onChange={(e) => setTopicCovered(e.target.value)}
            />
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div
          className={cn(
            "rounded-lg border border-border bg-card p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105",
            filter === 'all' && "ring-2 ring-primary"
          )}
          onClick={() => setFilter('all')}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Users className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display">{students.length}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "rounded-lg border border-success/20 bg-success/5 p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105",
            filter === 'present' && "ring-2 ring-success"
          )}
          onClick={() => setFilter(filter === 'present' ? 'all' : 'present')}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Check className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-success">{stats.present}</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "rounded-lg border border-destructive/20 bg-destructive/5 p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105",
            filter === 'absent' && "ring-2 ring-destructive"
          )}
          onClick={() => setFilter(filter === 'absent' ? 'all' : 'absent')}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <X className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-destructive">{stats.absent}</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "rounded-lg border border-warning/20 bg-warning/5 p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105",
            filter === 'od' && "ring-2 ring-warning"
          )}
          onClick={() => setFilter(filter === 'od' ? 'all' : 'od')}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold font-display text-warning">{stats.od}</p>
              <p className="text-sm text-muted-foreground">On Duty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="font-display">Student List</CardTitle>
          <CardDescription>
            {filter === 'all'
              ? (stats.unmarked > 0 ? `${stats.unmarked} students remaining` : 'All students marked')
              : `Showing ${filteredAttendance.length} ${filter === 'present' ? 'present' : filter === 'absent' ? 'absent' : 'on duty'} student${filteredAttendance.length !== 1 ? 's' : ''}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-sm text-muted-foreground">Loading students...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map(({ student, status }, index) => (
                  <div
                    key={student.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-4 transition-all duration-200',
                      status === 'present' && 'border-success/30 bg-success/5',
                      status === 'absent' && 'border-destructive/30 bg-destructive/5',
                      status === 'od' && 'border-warning/30 bg-warning/5',
                      !status && 'border-border bg-card hover:border-primary/30'
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-semibold text-foreground">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.rollNumber}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={status === 'present' ? 'success' : 'outline'}
                        onClick={() => !readOnly && handleStatusChange(student.id, 'present')}
                        className={cn(readOnly && status !== 'present' && "opacity-50 cursor-default")}
                        disabled={readOnly && status !== 'present'}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'absent' ? 'destructive' : 'outline'}
                        onClick={() => !readOnly && handleStatusChange(student.id, 'absent')}
                        className={cn(readOnly && status !== 'absent' && "opacity-50 cursor-default")}
                        disabled={readOnly && status !== 'absent'}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Absent
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'od' ? 'warning' : 'outline'}
                        onClick={() => !readOnly && handleStatusChange(student.id, 'od')}
                        className={cn(readOnly && status !== 'od' && "opacity-50 cursor-default")}
                        disabled={readOnly && status !== 'od'}
                      >
                        <Clock className="mr-1 h-4 w-4" />
                        OD
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No students {filter === 'present' ? 'marked as present' : filter === 'absent' ? 'marked as absent' : 'on duty'} yet.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
