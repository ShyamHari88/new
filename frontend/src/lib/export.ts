import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Utility to export JSON data to CSV and trigger a download
 * @param data Array of objects to export
 * @param filename Desired name of the file
 * @param headers Optional custom headers mapping { key: label }
 */
export const exportToCSV = (data: any[], filename: string, headers?: Record<string, string>) => {
    if (!data || !data.length) return;

    const keys = Object.keys(headers || data[0]);
    const labels = headers ? Object.values(headers) : keys;

    const csvContent = [
        labels.join(','), // Header row
        ...data.map(row =>
            keys.map(key => {
                const cell = row[key] === undefined || row[key] === null ? '' : row[key];
                // Escape commas and wrap in quotes if needed
                return `"${cell.toString().replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Utility to export JSON data to PDF as a table
 * @param data Array of objects to export
 * @param filename Desired name of the file
 * @param title Title of the PDF document
 * @param studentInfo Optional metadata for the header
 */
export const exportToPDF = (data: any[], filename: string, title: string, studentInfo?: any) => {
    if (!data || !data.length) return;

    const doc = new jsPDF('p', 'mm', 'a4');

    // Branding Header
    doc.setFillColor(37, 99, 235); // Primary Blue
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ACADEMIC REPORT CARD', 14, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.text(`Generated: ${dateStr}`, 160, 25);

    // Student Info Box
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 45, 182, 30, 3, 3, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(studentInfo?.name?.toUpperCase() || 'STUDENT NAME', 20, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Roll Number: ${studentInfo?.rollNumber || 'N/A'}`, 20, 62);
    const deptInfo = typeof studentInfo?.departmentId === 'string' ? studentInfo.departmentId : 'IT';
    doc.text(`Department: ${deptInfo}`, 20, 68);
    doc.text(`Year: ${studentInfo?.year || '3'}`, 100, 62);
    doc.text(`Section: ${studentInfo?.section || 'C'}`, 100, 68);

    // Separate Data by Type
    const attendanceData = data.filter(d => d.Type === 'Attendance');
    const marksData = data.filter(d => d.Type === 'Marks');

    let currentY = 85;

    // Attendance Table
    if (attendanceData.length > 0) {
        doc.setTextColor(37, 99, 235);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('I. ATTENDANCE SUMMARY', 14, currentY);

        const attHeaders = [['SUBJECT', 'PERIODS (P/T)', 'PERCENTAGE']];
        const attBody = attendanceData.map(d => [d.Subject, d.Detail, d.Percentage]);

        autoTable(doc, {
            head: attHeaders,
            body: attBody,
            startY: currentY + 5,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], fontSize: 10 },
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Marks Table
    if (marksData.length > 0) {
        if (currentY > 230) { doc.addPage(); currentY = 20; }

        doc.setTextColor(37, 99, 235);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('II. ACADEMIC PERFORMANCE (MARKS)', 14, currentY);

        const markHeaders = [['SUBJECT', 'ASSESSMENT TYPE', 'SCORE']];
        const markBody = marksData.map(d => [d.Subject, d.Detail, d.Percentage]);

        autoTable(doc, {
            head: markHeaders,
            body: markBody,
            startY: currentY + 5,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], fontSize: 10 }, // Success Green
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    // Footer Signature
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 260, 60, 260);
    doc.setFontSize(8);
    doc.text('AUTHORIZED SIGNATURE', 14, 265);

    doc.setTextColor(150, 150, 150);
    doc.text('This is an electronically generated report.', 105, 265, { align: 'center' });

    doc.save(`${filename}.pdf`);
};

/**
 * Utility to export bulk class data as a simple table (Teacher Side)
 */
export const exportClassDataPDF = (data: any[], filename: string, title: string) => {
    if (!data || !data.length) return;

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for many columns

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 297, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), 14, 16);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 240, 16);

    const headers = [Object.keys(data[0])];
    const body = data.map(row => Object.values(row).map(v => v?.toString() || ''));

    autoTable(doc, {
        head: headers,
        body: body,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.1 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
    });

    doc.save(`${filename}.pdf`);
};
