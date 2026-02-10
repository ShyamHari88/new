import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { departments, years, sections, recentSessions } from '@/data/mockData';
import { Calendar, Search, Filter, Download, Pencil, Clock, Eye } from 'lucide-react';
import { format, isValid, subDays, parseISO, isWithinInterval } from 'date-fns';
import { dataService } from '@/services/data';
import { exportToCSV } from '@/lib/export';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function History() {
  const navigate = useNavigate();
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Date range filter states - default to today only
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<string>(startDate);
  const [tempEndDate, setTempEndDate] = useState<string>(endDate);

  const [historyData, setHistoryData] = useState<any[]>([]);
  const [editableSessions, setEditableSessions] = useState<Set<string>>(new Set());

  // Sync sessions from backend on component mount
  useEffect(() => {
    const syncSessions = async () => {
      try {
        const sessions = await dataService.syncSessionsFromBackend();
        setHistoryData(sessions);

        // Check which sessions are editable
        const editable = new Set<string>();
        for (const session of sessions) {
          const isEditable = await dataService.isSessionEditable(session.id);
          if (isEditable) {
            editable.add(session.id);
          }
        }
        setEditableSessions(editable);
      } catch (error) {
        console.error('Failed to sync sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    syncSessions();
  }, []);

  const filteredHistory = historyData.filter(session => {
    if (!session) return false;
    if (departmentFilter !== 'all' && session.classInfo?.departmentId !== departmentFilter) return false;
    if (searchQuery && !session.subject?.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // Date range filtering
    try {
      const sessionDate = parseISO(session.date);
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      if (isValid(sessionDate) && isValid(start) && isValid(end)) {
        if (!isWithinInterval(sessionDate, { start, end })) return false;
      }
    } catch (error) {
      console.error('Date parsing error:', error);
    }

    return true;
  });

  const handleApplyDateRange = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setIsDatePickerOpen(false);
  };

  const handleResetDateRange = () => {
    const defaultStart = format(new Date(), 'yyyy-MM-dd');
    const defaultEnd = format(new Date(), 'yyyy-MM-dd');
    setTempStartDate(defaultStart);
    setTempEndDate(defaultEnd);
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setIsDatePickerOpen(false);
  };

  const isDefaultDateRange = startDate === format(new Date(), 'yyyy-MM-dd') &&
    endDate === format(new Date(), 'yyyy-MM-dd');

  const handleExportCSV = () => {
    if (filteredHistory.length === 0) {
      alert('No data to export.');
      return;
    }

    const csvData = filteredHistory.map(session => ({
      Date: format(parseISO(session.date), 'yyyy-MM-dd'),
      Department: session.classInfo?.departmentCode || 'N/A',
      Year: session.classInfo?.year || 'N/A',
      Section: session.classInfo?.section || 'N/A',
      Subject: session.subject || 'N/A',
      Period: session.period || 'N/A',
      Total: session.totalStudents || 0,
      Present: session.presentCount || 0,
      Absent: session.absentCount || 0,
      OD: session.odCount || 0,
      Percentage: `${session.totalStudents > 0 ? Math.round((session.presentCount / session.totalStudents) * 100) : 0}%`
    }));

    exportToCSV(csvData, `Attendance_Report_${startDate}_to_${endDate}`);
  };

  const handleExportReport = () => {
    try {
      if (filteredHistory.length === 0) {
        alert('No data to export. Please adjust your filters.');
        return;
      }

      // Create new PDF document
      const doc = new jsPDF('landscape');

      // Add title
      doc.setFontSize(18);
      doc.text('Attendance Report', 14, 15);

      // Add date range
      doc.setFontSize(11);
      doc.text(`Period: ${format(parseISO(startDate), 'MMM dd, yyyy')} to ${format(parseISO(endDate), 'MMM dd, yyyy')}`, 14, 22);

      // Add generation date
      doc.setFontSize(9);
      doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 28);

      // Prepare table data
      const tableData = filteredHistory.map(session => {
        const total = session.totalStudents || 0;
        const present = session.presentCount || 0;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return [
          format(parseISO(session.date), 'yyyy-MM-dd'),
          format(parseISO(session.date), 'EEE'),
          session.classInfo?.departmentCode || 'N/A',
          session.classInfo?.year || 'N/A',
          session.classInfo?.section || 'N/A',
          session.subject || 'N/A',
          session.period ? (session.period.startsWith('Period') ? session.period : `Period ${session.period}`) : 'N/A',
          total.toString(),
          present.toString(),
          (session.absentCount || 0).toString(),
          (session.odCount || 0).toString(),
          `${percentage}%`
        ];
      });

      // Generate table
      autoTable(doc, {
        head: [['Date', 'Day', 'Dept', 'Year', 'Sec', 'Subject', 'Period', 'Total', 'Present', 'Absent', 'OD', 'Attendance %']],
        body: tableData,
        startY: 32,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 22 },  // Date
          1: { cellWidth: 15 },  // Day
          2: { cellWidth: 18 },  // Dept
          3: { cellWidth: 12 },  // Year
          4: { cellWidth: 12 },  // Sec
          5: { cellWidth: 40 },  // Subject
          6: { cellWidth: 20 },  // Period
          7: { cellWidth: 15 },  // Total
          8: { cellWidth: 18 },  // Present
          9: { cellWidth: 18 },  // Absent
          10: { cellWidth: 12 }, // OD
          11: { cellWidth: 25 }  // Attendance %
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      });

      const filename = `Attendance_Report_${startDate}_to_${endDate}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Class History</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage past attendance records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
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
                  placeholder="Search by subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.code} - {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={!isDefaultDateRange ? "border-primary" : ""}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {isDefaultDateRange
                    ? 'Date Range'
                    : `${format(parseISO(startDate), 'MMM d')} - ${format(parseISO(endDate), 'MMM d')}`
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Date</label>
                    <Input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      max={tempEndDate}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Date</label>
                    <Input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      min={tempStartDate}
                      max={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetDateRange}
                      className="flex-1"
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApplyDateRange}
                      className="flex-1"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* History Table - Grouped by Date */}
      {(() => {
        // Group sessions by date
        const groupedByDate = filteredHistory.reduce((groups, session) => {
          const dateKey = session.date;
          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push(session);
          return groups;
        }, {} as Record<string, typeof filteredHistory>);

        // Sort dates in descending order (newest first)
        const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
          new Date(b).getTime() - new Date(a).getTime()
        );

        const totalSessions = filteredHistory.length;

        return (
          <div className="space-y-6">
            {sortedDates.map((dateKey, dateIndex) => {
              const sessions = groupedByDate[dateKey];
              const sessionDate = parseISO(dateKey);
              const formattedDateHeader = isValid(sessionDate)
                ? format(sessionDate, 'EEEE, MMMM d, yyyy')
                : 'Invalid Date';

              return (
                <Card key={dateKey} className="card-elevated">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-display text-xl">{formattedDateHeader}</CardTitle>
                        <CardDescription>
                          {sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Class</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-center">Total</TableHead>
                          <TableHead className="text-center">Present</TableHead>
                          <TableHead className="text-center">Absent</TableHead>
                          <TableHead className="text-center">OD</TableHead>
                          <TableHead className="text-center">Percentage</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.map((session) => {
                          const total = session.totalStudents || 0;
                          const present = session.presentCount || 0;
                          const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                          return (
                            <TableRow key={session.id}>
                              <TableCell>
                                <span className="font-medium text-foreground">
                                  {session.classInfo ? (
                                    `${session.classInfo.departmentCode} – ${session.classInfo.year} – ${session.classInfo.section}`
                                  ) : (
                                    'Missing Class Info'
                                  )}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{session.subject || 'N/A'}</TableCell>
                              <TableCell className="text-muted-foreground whitespace-nowrap">
                                {session.period ? (typeof session.period === 'number' ? `Period ${session.period}` : (session.period.startsWith('Period') ? session.period : `Period ${session.period}`)) : 'N/A'}
                              </TableCell>
                              <TableCell className="text-center">{total}</TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium status-present border">
                                  {present}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium status-absent border">
                                  {session.absentCount || 0}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium status-od border">
                                  {session.odCount || 0}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-semibold ${percentage >= 75 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-destructive'}`}>
                                  {percentage}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/attendance?view=${session.id}`)}
                                  title="View Attendance Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/attendance?edit=${session.id}`)}
                                  disabled={!editableSessions.has(session.id)}
                                  title={!editableSessions.has(session.id) ? "Editing allowed only within 24 hours" : "Edit Attendance"}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}

            {sortedDates.length === 0 && (
              <Card className="card-elevated">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No attendance records found for the selected filters.</p>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}
    </div>
  );
}
