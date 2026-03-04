import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── Shared helpers ────────────────────────────────────────────────

const NAVY = [15, 31, 61] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const LIGHT_GRAY = [248, 249, 250] as [number, number, number];
const MID_GRAY = [107, 114, 128] as [number, number, number];

function addPDFHeader(doc: jsPDF, title: string, subtitle: string) {
  // Navy header bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 28, 'F');

  // LMS logo box
  doc.setFillColor(...WHITE);
  doc.roundedRect(10, 6, 16, 16, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('LMS', 18, 16.5, { align: 'center' });

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(title, 32, 13);

  // Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 197, 253);
  doc.text(subtitle, 32, 20);

  // Date stamp
  doc.setFontSize(7);
  doc.setTextColor(147, 197, 253);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}`, 200, 13, { align: 'right' });

  return 36; // return Y position after header
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text(title.toUpperCase(), 14, y);
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.5);
  doc.line(14, y + 1.5, 196, y + 1.5);
  return y + 7;
}

function addStatBoxes(doc: jsPDF, stats: { label: string; value: number | string }[], y: number): number {
  const boxW = (196 - (stats.length - 1) * 4) / stats.length;
  stats.forEach((s, i) => {
    const x = 14 + i * (boxW + 4);
    doc.setFillColor(...LIGHT_GRAY);
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(String(s.value ?? 0), x + boxW / 2, y + 11, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MID_GRAY);
    doc.text(s.label, x + boxW / 2, y + 16, { align: 'center' });
  });
  return y + 25;
}

// ─── Manager Report PDF ────────────────────────────────────────────

export function exportManagerReportPDF(report: any, managerName: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = addPDFHeader(doc, 'Leave Report', `Manager: ${managerName}`);

  // Stats
  y = addSectionTitle(doc, 'Summary', y);
  y = addStatBoxes(doc, [
    { label: 'Total Employees', value: report.totalEmployees },
    { label: 'Total Leaves', value: report.totalLeaves },
    { label: 'Pending', value: report.pendingLeaves },
    { label: 'Approved', value: report.approvedLeaves },
    { label: 'Rejected', value: report.rejectedLeaves },
  ], y);

  // Leave Status breakdown
  y = addSectionTitle(doc, 'Leave Status Breakdown', y);
  autoTable(doc, {
    startY: y,
    head: [['Status', 'Count', '% of Total']],
    body: [
      ['Approved', report.approvedLeaves, report.totalLeaves > 0 ? `${Math.round((report.approvedLeaves / report.totalLeaves) * 100)}%` : '0%'],
      ['Pending', report.pendingLeaves, report.totalLeaves > 0 ? `${Math.round((report.pendingLeaves / report.totalLeaves) * 100)}%` : '0%'],
      ['Rejected', report.rejectedLeaves, report.totalLeaves > 0 ? `${Math.round((report.rejectedLeaves / report.totalLeaves) * 100)}%` : '0%'],
    ],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // By Department
  if (Object.keys(report.leavesByDepartment || {}).length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, 'Leaves by Department', y);
    autoTable(doc, {
      startY: y,
      head: [['Department', 'Leaves', '% of Total']],
      body: Object.entries(report.leavesByDepartment as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .map(([dept, count]) => [dept, count, report.totalLeaves > 0 ? `${Math.round((count / report.totalLeaves) * 100)}%` : '0%']),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // By Leave Type
  if (Object.keys(report.leavesByType || {}).length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, 'Leaves by Type', y);
    autoTable(doc, {
      startY: y,
      head: [['Leave Type', 'Count', '% of Total']],
      body: Object.entries(report.leavesByType as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => [type, count, report.totalLeaves > 0 ? `${Math.round((count / report.totalLeaves) * 100)}%` : '0%']),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Monthly Trends
  if (report.leavesByMonth && Object.keys(report.leavesByMonth).length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, 'Monthly Trends', y);
    autoTable(doc, {
      startY: y,
      head: [['Month', 'Leaves']],
      body: Object.entries(report.leavesByMonth as Record<string, number>).map(([m, c]) => [m, c]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Employee Summary
  if (report.employeeSummaries?.length > 0) {
    doc.addPage(); y = 20;
    y = addSectionTitle(doc, 'Employee Summary', y);
    autoTable(doc, {
      startY: y,
      head: [['Employee', 'Department', 'Total', 'Pending', 'Approved', 'Rejected']],
      body: report.employeeSummaries.map((e: any) => [e.employeeName, e.department, e.totalLeaves, e.pendingLeaves, e.approvedLeaves, e.rejectedLeaves]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...NAVY);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text('Leave Management System — Confidential', 14, 293);
    doc.text(`Page ${i} of ${totalPages}`, 196, 293, { align: 'right' });
  }

  doc.save(`leave-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── Manager Report Excel ──────────────────────────────────────────

export function exportManagerReportExcel(report: any, managerName: string) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['Leave Management System — Manager Report'],
    [`Manager: ${managerName}`],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    ['SUMMARY'],
    ['Metric', 'Value'],
    ['Total Employees', report.totalEmployees ?? 0],
    ['Total Leaves', report.totalLeaves ?? 0],
    ['Pending', report.pendingLeaves ?? 0],
    ['Approved', report.approvedLeaves ?? 0],
    ['Rejected', report.rejectedLeaves ?? 0],
    [],
    ['LEAVE STATUS'],
    ['Status', 'Count', '% of Total'],
    ['Approved', report.approvedLeaves, report.totalLeaves > 0 ? `${Math.round((report.approvedLeaves / report.totalLeaves) * 100)}%` : '0%'],
    ['Pending', report.pendingLeaves, report.totalLeaves > 0 ? `${Math.round((report.pendingLeaves / report.totalLeaves) * 100)}%` : '0%'],
    ['Rejected', report.rejectedLeaves, report.totalLeaves > 0 ? `${Math.round((report.rejectedLeaves / report.totalLeaves) * 100)}%` : '0%'],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Departments sheet
  if (Object.keys(report.leavesByDepartment || {}).length > 0) {
    const deptData = [
      ['Department', 'Leaves', '% of Total'],
      ...Object.entries(report.leavesByDepartment as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .map(([dept, count]) => [dept, count, report.totalLeaves > 0 ? `${Math.round((count / report.totalLeaves) * 100)}%` : '0%'])
    ];
    const deptSheet = XLSX.utils.aoa_to_sheet(deptData);
    deptSheet['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, deptSheet, 'By Department');
  }

  // Leave Types sheet
  if (Object.keys(report.leavesByType || {}).length > 0) {
    const typeData = [
      ['Leave Type', 'Count', '% of Total'],
      ...Object.entries(report.leavesByType as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => [type, count, report.totalLeaves > 0 ? `${Math.round((count / report.totalLeaves) * 100)}%` : '0%'])
    ];
    const typeSheet = XLSX.utils.aoa_to_sheet(typeData);
    typeSheet['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, typeSheet, 'By Leave Type');
  }

  // Monthly Trends sheet
  if (report.leavesByMonth) {
    const monthData = [
      ['Month', 'Leaves'],
      ...Object.entries(report.leavesByMonth as Record<string, number>).map(([m, c]) => [m, c])
    ];
    const monthSheet = XLSX.utils.aoa_to_sheet(monthData);
    monthSheet['!cols'] = [{ wch: 16 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, monthSheet, 'Monthly Trends');
  }

  // Employees sheet
  if (report.employeeSummaries?.length > 0) {
    const empData = [
      ['Employee', 'Department', 'Total', 'Pending', 'Approved', 'Rejected'],
      ...report.employeeSummaries.map((e: any) => [e.employeeName, e.department, e.totalLeaves, e.pendingLeaves, e.approvedLeaves, e.rejectedLeaves])
    ];
    const empSheet = XLSX.utils.aoa_to_sheet(empData);
    empSheet['!cols'] = [{ wch: 24 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, empSheet, 'Employees');
  }

  XLSX.writeFile(wb, `leave-report-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ─── Admin Report PDF ──────────────────────────────────────────────

export function exportAdminReportPDF(reports: any) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = addPDFHeader(doc, 'Company-wide Leave Report', 'System Administrator — Full Access');

  // Stats
  y = addSectionTitle(doc, 'Company Summary', y);
  y = addStatBoxes(doc, [
    { label: 'Total Leaves', value: reports.totalLeaves },
    { label: 'Pending', value: reports.pendingLeaves },
    { label: 'Approved', value: reports.approvedLeaves },
    { label: 'Rejected', value: reports.rejectedLeaves },
  ], y);

  // By Department
  if (Object.keys(reports.leavesByDepartment || {}).length > 0) {
    y = addSectionTitle(doc, 'Leaves by Department', y);
    autoTable(doc, {
      startY: y,
      head: [['Department', 'Leaves', '% of Total']],
      body: Object.entries(reports.leavesByDepartment as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .map(([dept, count]) => [dept, count, reports.totalLeaves > 0 ? `${Math.round((count / reports.totalLeaves) * 100)}%` : '0%']),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // By Leave Type
  if (Object.keys(reports.leavesByType || {}).length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, 'Leaves by Type', y);
    autoTable(doc, {
      startY: y,
      head: [['Leave Type', 'Count', '% of Total']],
      body: Object.entries(reports.leavesByType as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => {
          const total = Object.values(reports.leavesByType as Record<string, number>).reduce((a, b) => a + b, 0);
          return [type, count, total > 0 ? `${Math.round((count / total) * 100)}%` : '0%'];
        }),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Monthly Trends
  if (reports.leavesByMonth && Object.keys(reports.leavesByMonth).length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, 'Monthly Trends', y);
    autoTable(doc, {
      startY: y,
      head: [['Month', 'Leaves']],
      body: Object.entries(reports.leavesByMonth as Record<string, number>).map(([m, c]) => [m, c]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Manager Summary
  if (reports.managerSummaries?.length > 0) {
    doc.addPage(); y = 20;
    y = addSectionTitle(doc, 'Manager Summary', y);
    autoTable(doc, {
      startY: y,
      head: [['Manager', 'Department', 'Employees', 'Total', 'Pending', 'Approved', 'Rejected']],
      body: reports.managerSummaries.map((m: any) => [m.managerName, m.department, m.totalEmployees, m.totalLeaves, m.pendingLeaves, m.approvedLeaves, m.rejectedLeaves]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...NAVY);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text('Leave Management System — Confidential', 14, 293);
    doc.text(`Page ${i} of ${totalPages}`, 196, 293, { align: 'right' });
  }

  doc.save(`company-leave-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── Admin Report Excel ────────────────────────────────────────────

export function exportAdminReportExcel(reports: any) {
  const wb = XLSX.utils.book_new();

  // Summary
  const summaryData = [
    ['Leave Management System — Company-wide Report'],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    ['SUMMARY'],
    ['Metric', 'Value'],
    ['Total Leaves', reports.totalLeaves ?? 0],
    ['Pending', reports.pendingLeaves ?? 0],
    ['Approved', reports.approvedLeaves ?? 0],
    ['Rejected', reports.rejectedLeaves ?? 0],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Departments
  if (Object.keys(reports.leavesByDepartment || {}).length > 0) {
    const deptData = [
      ['Department', 'Leaves', '% of Total'],
      ...Object.entries(reports.leavesByDepartment as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .map(([dept, count]) => [dept, count, reports.totalLeaves > 0 ? `${Math.round((count / reports.totalLeaves) * 100)}%` : '0%'])
    ];
    const deptSheet = XLSX.utils.aoa_to_sheet(deptData);
    deptSheet['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, deptSheet, 'By Department');
  }

  // Leave Types
  if (Object.keys(reports.leavesByType || {}).length > 0) {
    const total = Object.values(reports.leavesByType as Record<string, number>).reduce((a, b) => a + b, 0);
    const typeData = [
      ['Leave Type', 'Count', '% of Total'],
      ...Object.entries(reports.leavesByType as Record<string, number>)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => [type, count, total > 0 ? `${Math.round((count / total) * 100)}%` : '0%'])
    ];
    const typeSheet = XLSX.utils.aoa_to_sheet(typeData);
    typeSheet['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, typeSheet, 'By Leave Type');
  }

  // Monthly
  if (reports.leavesByMonth) {
    const monthData = [
      ['Month', 'Leaves'],
      ...Object.entries(reports.leavesByMonth as Record<string, number>).map(([m, c]) => [m, c])
    ];
    const monthSheet = XLSX.utils.aoa_to_sheet(monthData);
    monthSheet['!cols'] = [{ wch: 16 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, monthSheet, 'Monthly Trends');
  }

  // Manager Summary
  if (reports.managerSummaries?.length > 0) {
    const mgrData = [
      ['Manager', 'Department', 'Employees', 'Total', 'Pending', 'Approved', 'Rejected'],
      ...reports.managerSummaries.map((m: any) => [m.managerName, m.department, m.totalEmployees, m.totalLeaves, m.pendingLeaves, m.approvedLeaves, m.rejectedLeaves])
    ];
    const mgrSheet = XLSX.utils.aoa_to_sheet(mgrData);
    mgrSheet['!cols'] = [{ wch: 24 }, { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, mgrSheet, 'Manager Summary');
  }

  XLSX.writeFile(wb, `company-leave-report-${new Date().toISOString().split('T')[0]}.xlsx`);
}