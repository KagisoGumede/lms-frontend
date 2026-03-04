// Type definitions for Leave Management System

export type UserRole = 'employee' | 'manager';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  surname: string;
  role: UserRole;
  department: string;
  position: string;
  managerId?: string; // ID of the manager (for employees)
  status: 'active' | 'inactive';
  joinDate: string;
  leaveBalance: {
    annual: number;
    sick: number;
    other: number;
  };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  status: LeaveStatus;
  submittedDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  managerComments?: string;
  supportingDocument?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}
