// Utility functions for Leave Management System

/**
 * Calculate the number of business days between two dates
 * Excludes weekends and public holidays
 */
export function calculateBusinessDays(
  startDate: string,
  endDate: string,
  holidayDates: string[] = []
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayDates.includes(dateStr);
    if (!isWeekend && !isHoliday) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  const date = new Date(dateString + 'T00:00:00');
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year  = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date range
 */
export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Export employee leave history to PDF using jsPDF
 */
export async function exportLeavesToPDF(
  leaves: any[],
  userName: string,
  department: string
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const navy = [15, 31, 61] as [number, number, number];
  const white = [255, 255, 255] as [number, number, number];
  const lightGray = [248, 249, 250] as [number, number, number];

  const pageW = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('en-ZA', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  // ── Header ──────────────────────────────────────────────────────
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageW, 40, 'F');

  doc.setFillColor(...white);
  doc.roundedRect(10, 8, 22, 22, 3, 3, 'F');
  doc.setTextColor(...navy);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('LMS', 21, 21, { align: 'center' });

  doc.setTextColor(...white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Leave History Report', 38, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${today}`, 38, 27);

  // ── Employee Info ────────────────────────────────────────────────
  doc.setFillColor(...lightGray);
  doc.rect(10, 48, pageW - 20, 24, 'F');
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('EMPLOYEE', 16, 56);
  doc.text('DEPARTMENT', 90, 56);
  doc.text('TOTAL REQUESTS', 155, 56);
  doc.setTextColor(15, 31, 61);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(userName, 16, 65);
  doc.text(department || 'N/A', 90, 65);
  doc.text(String(leaves.length), 155, 65);

  // ── Summary boxes ────────────────────────────────────────────────
  const approved  = leaves.filter(l => l.status === 'APPROVED').length;
  const pending   = leaves.filter(l => l.status === 'PENDING').length;
  const rejected  = leaves.filter(l => l.status === 'REJECTED').length;
  const cancelled = leaves.filter(l => l.status === 'CANCELLED').length;
  const totalDays = leaves.filter(l => l.status === 'APPROVED')
    .reduce((sum, l) => sum + (l.duration || 0), 0);

  const boxes = [
    { label: 'Approved', value: approved,  color: [16, 185, 129] as [number, number, number] },
    { label: 'Pending',  value: pending,   color: [245, 158, 11] as [number, number, number] },
    { label: 'Rejected', value: rejected,  color: [239, 68, 68]  as [number, number, number] },
    { label: 'Cancelled',value: cancelled, color: [156, 163, 175] as [number, number, number] },
    { label: 'Days Used', value: totalDays, color: navy },
  ];

  const boxW = (pageW - 20) / boxes.length;
  boxes.forEach((b, i) => {
    const x = 10 + i * boxW;
    doc.setFillColor(...b.color);
    doc.rect(x, 78, boxW - 2, 18, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(b.value), x + boxW / 2 - 1, 90, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(b.label.toUpperCase(), x + boxW / 2 - 1, 94, { align: 'center' });
  });

  // ── Table ────────────────────────────────────────────────────────
  const statusColor = (s: string) => {
    if (s === 'APPROVED')  return [16, 185, 129];
    if (s === 'REJECTED')  return [239, 68, 68];
    if (s === 'CANCELLED') return [156, 163, 175];
    return [245, 158, 11];
  };

  autoTable(doc, {
    startY: 103,
    head: [['#', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Comments']],
    body: leaves.map((l, i) => [
      i + 1,
      l.leaveType,
      formatDate(l.startDate),
      formatDate(l.endDate),
      l.duration,
      l.status,
      l.managerComments || '—',
    ]),
    headStyles: {
      fillColor: navy,
      textColor: white,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: lightGray },
    columnStyles: {
      0: { cellWidth: 8 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 22 },
      6: { cellWidth: 40 },
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 5) {
        const status = data.cell.raw as string;
        const [r, g, b] = statusColor(status);
        doc.setFillColor(r, g, b);
        doc.setTextColor(255, 255, 255);
        const { x, y, width, height } = data.cell;
        doc.roundedRect(x + 1, y + 1.5, width - 2, height - 3, 1.5, 1.5, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(status, x + width / 2, y + height / 2 + 0.5, { align: 'center' });
      }
    },
    margin: { left: 10, right: 10 },
  });

  // ── Footer ───────────────────────────────────────────────────────
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...navy);
    doc.rect(0, doc.internal.pageSize.getHeight() - 12, pageW, 12, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Leave Management System — Confidential', 10, doc.internal.pageSize.getHeight() - 4);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 10, doc.internal.pageSize.getHeight() - 4, { align: 'right' });
  }

  doc.save(`Leave_History_${userName.replace(/\s+/g, '_')}_${getTodayDate()}.pdf`);
}