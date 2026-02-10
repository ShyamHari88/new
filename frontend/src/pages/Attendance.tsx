import { useState, useEffect } from 'react';
import { ArrowRight, Building2, Calendar, GraduationCap, BookOpen, Clock } from 'lucide-react';
import { ClassSelector } from '@/components/attendance/ClassSelector';
import { AttendanceMarker } from '@/components/attendance/AttendanceMarker';
import { ClassInfo } from '@/types/attendance';
import { dataService } from '@/services/data';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Attendance() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editSessionId = searchParams.get('edit');
  const viewSessionId = searchParams.get('view');

  const [selectedClass, setSelectedClass] = useState<{
    classInfo: ClassInfo;
    subject: string;
    date: string;
    period: string;
    editSessionId?: string;
    viewSessionId?: string;
  } | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const sessionId = editSessionId || viewSessionId;
      if (sessionId) {
        try {
          console.log('Loading session:', sessionId);
          const sessions = await dataService.getAllSessions();
          console.log('All sessions:', sessions);

          const session = sessions.find(s => s.id === sessionId);

          if (session) {
            console.log('Found session:', session);
            setSelectedClass({
              classInfo: session.classInfo,
              subject: session.subject,
              date: session.date,
              period: session.period,
              editSessionId: editSessionId || undefined,
              viewSessionId: viewSessionId || undefined
            });
          } else {
            console.error('Session not found:', sessionId);
            toast.error('Session not found. Please try again.');
            navigate('/history');
          }
        } catch (error) {
          console.error('Error loading session:', error);
          toast.error('Failed to load session data');
          navigate('/history');
        }
      }
    };
    loadSession();
  }, [editSessionId, viewSessionId, navigate]);

  const handleClassSelect = (classInfo: ClassInfo, subject: string, date: string, period: string) => {
    setSelectedClass({ classInfo, subject, date, period });
  };

  const handleBack = () => {
    setSelectedClass(null);
    if (editSessionId) {
      setSearchParams({}); // Clear edit param when going back
    }
  };

  if (selectedClass) {
    return (
      <AttendanceMarker
        classInfo={selectedClass.classInfo}
        subject={selectedClass.subject}
        date={selectedClass.date}
        period={selectedClass.period}
        onBack={handleBack}
        editSessionId={selectedClass.editSessionId}
        viewSessionId={selectedClass.viewSessionId}
        readOnly={!!selectedClass.viewSessionId}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Mark Attendance</h1>
        <p className="mt-1 text-muted-foreground">
          Select a class to begin marking attendance for today's session.
        </p>
      </div>

      <ClassSelector onClassSelect={handleClassSelect} />
    </div>
  );
}
