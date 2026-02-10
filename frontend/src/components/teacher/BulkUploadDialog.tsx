import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { dataService } from '@/services/data';
import { departments } from '@/data/mockData';

interface BulkUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface UploadResult {
    success: number;
    errors: { row: number; message: string }[];
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess }: BulkUploadDialogProps) {
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setResult(null);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

            // Define possible header name variations for each field
            const headerMappings = {
                studentId: ['student id', 'studentid', 'id', 'student_id'],
                name: ['student name', 'name', 'studentname', 'student_name', 'full name', 'fullname'],
                rollNumber: ['roll number', 'rollnumber', 'roll no', 'rollno', 'roll_number', 'roll_no'],
                department: ['department', 'dept', 'branch'],
                year: ['year', 'yr', 'class'],
                semester: ['semester', 'sem'],
                email: ['email', 'e-mail', 'mail', 'email id'],
                phone: ['phone number', 'phone', 'mobile', 'contact', 'phone_number', 'mobile number']
            };

            // Function to find matching header
            const findHeader = (headers: string[], variations: string[]): string | null => {
                for (const header of headers) {
                    const normalizedHeader = header.toLowerCase().trim();
                    if (variations.some(v => normalizedHeader === v || normalizedHeader.includes(v))) {
                        return header;
                    }
                }
                return null;
            };

            if (jsonData.length === 0) {
                setResult({
                    success: 0,
                    errors: [{ row: 0, message: 'Excel file is empty or has no data rows' }]
                });
                setUploading(false);
                event.target.value = '';
                return;
            }

            // Get headers from first row
            const headers = Object.keys(jsonData[0]);

            // Map headers to fields
            const columnMap = {
                studentId: findHeader(headers, headerMappings.studentId),
                name: findHeader(headers, headerMappings.name),
                rollNumber: findHeader(headers, headerMappings.rollNumber),
                department: findHeader(headers, headerMappings.department),
                year: findHeader(headers, headerMappings.year),
                semester: findHeader(headers, headerMappings.semester),
                email: findHeader(headers, headerMappings.email),
                phone: findHeader(headers, headerMappings.phone)
            };

            // Check for missing required columns
            const missingColumns: string[] = [];
            if (!columnMap.studentId) missingColumns.push('Student ID');
            if (!columnMap.name) missingColumns.push('Student Name');
            if (!columnMap.rollNumber) missingColumns.push('Roll Number');
            if (!columnMap.department) missingColumns.push('Department');
            if (!columnMap.year) missingColumns.push('Year');
            if (!columnMap.semester) missingColumns.push('Semester');
            if (!columnMap.email) missingColumns.push('Email');

            if (missingColumns.length > 0) {
                setResult({
                    success: 0,
                    errors: [{
                        row: 0,
                        message: `Missing required columns: ${missingColumns.join(', ')}. Please ensure your Excel has these column headers.`
                    }]
                });
                setUploading(false);
                event.target.value = '';
                return;
            }

            const students: any[] = [];
            const errors: { row: number; message: string }[] = [];

            jsonData.forEach((row, index) => {
                const rowNumber = index + 2; // +2 because Excel rows start at 1 and we have header

                // Skip empty rows
                if (!row || Object.keys(row).length === 0) return;

                // Extract values using mapped columns
                const studentId = row[columnMap.studentId!];
                const name = row[columnMap.name!];
                const rollNumber = row[columnMap.rollNumber!];
                const deptName = row[columnMap.department!];
                const year = row[columnMap.year!];
                const semester = row[columnMap.semester!];
                const email = row[columnMap.email!];
                const phone = columnMap.phone ? row[columnMap.phone] : undefined;

                // Validate required fields
                if (!studentId || !name || !rollNumber || !deptName || !year || !semester || !email) {
                    errors.push({ row: rowNumber, message: 'Missing required fields' });
                    return;
                }

                // Find department ID
                const dept = departments.find(d =>
                    d.name.toLowerCase() === String(deptName).toLowerCase() ||
                    d.code.toLowerCase() === String(deptName).toLowerCase()
                );

                if (!dept) {
                    errors.push({ row: rowNumber, message: `Invalid department: ${deptName}` });
                    return;
                }

                // Validate year
                const yearNum = Number(year);
                if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) {
                    errors.push({ row: rowNumber, message: `Invalid year: ${year}` });
                    return;
                }

                // Validate semester
                const semesterNum = Number(semester);
                if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
                    errors.push({ row: rowNumber, message: `Invalid semester: ${semester}` });
                    return;
                }

                students.push({
                    id: String(studentId),
                    name: String(name),
                    rollNumber: String(rollNumber),
                    email: String(email),
                    departmentId: dept.id,
                    year: yearNum,
                    section: 'A', // Default section, can be enhanced later
                    currentSemester: semesterNum,
                    phone: phone ? String(phone) : undefined
                });
            });

            // Use bulk add method
            const uploadResult = dataService.bulkAddStudents(students);

            // Combine validation errors with upload errors
            const allErrors = [...errors, ...uploadResult.errors];

            setResult({
                success: uploadResult.success,
                errors: allErrors
            });

            if (uploadResult.success > 0 && onSuccess) {
                onSuccess();
            }
        } catch (error) {
            setResult({
                success: 0,
                errors: [{ row: 0, message: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}` }]
            });
        } finally {
            setUploading(false);
            // Reset file input
            event.target.value = '';
        }
    };

    const handleClose = () => {
        setResult(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Upload Student Excel
                    </DialogTitle>
                    <DialogDescription>
                        Upload an Excel file (.xlsx) with student data. The columns can be in any order - just make sure the column headers match the required field names.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* File Upload */}
                    <div className="flex items-center gap-4">
                        <Input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="flex-1"
                        />
                        {uploading && (
                            <div className="text-sm text-muted-foreground">Processing...</div>
                        )}
                    </div>

                    {/* Expected Format */}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            <strong>Required column headers (any order):</strong>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <div>• <strong>Student ID</strong> or ID</div>
                                <div>• <strong>Student Name</strong> or Name</div>
                                <div>• <strong>Roll Number</strong> or Roll No</div>
                                <div>• <strong>Department</strong> or Dept</div>
                                <div>• <strong>Year</strong> (1-4)</div>
                                <div>• <strong>Semester</strong> (1-8)</div>
                                <div>• <strong>Email</strong></div>
                                <div>• Phone Number (optional)</div>
                            </div>
                            <p className="mt-2 text-muted-foreground">
                                💡 Tip: Column names are flexible - use any variation like "StudentID", "Student_ID", "Roll No", "Dept", etc.
                            </p>
                        </AlertDescription>
                    </Alert>
                    {/* Results */}
                    {result && (
                        <div className="space-y-3">
                            {result.success > 0 && (
                                <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        <strong>Success!</strong> {result.success} student{result.success !== 1 ? 's' : ''} added successfully.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {result.errors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Errors found:</strong>
                                        <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                            {result.errors.map((error, idx) => (
                                                <div key={idx} className="text-xs">
                                                    {error.row > 0 ? `Row ${error.row}: ` : ''}{error.message}
                                                </div>
                                            ))}
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
