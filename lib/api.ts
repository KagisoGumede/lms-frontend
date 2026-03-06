const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const authAPI = {
  login: async (emailAddress: string, password: string) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailAddress, password })
    });
    return response.json();
  },
  forgotPassword: async (emailAddress: string) => {
    const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailAddress })
    });
    return response.json();
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    return response.json();
  }
};

export const userAPI = {
  createUser: async (data: {
    firstName: string; surname: string; emailAddress: string;
    password: string; department: string; role: string; managerId?: number | null;
  }) => {
    const response = await fetch(`${BASE_URL}/users/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  getAllManagers: async () => {
    const response = await fetch(`${BASE_URL}/users/managers`);
    return response.json();
  },
  getAllUsers: async () => {
    const response = await fetch(`${BASE_URL}/users`);
    return response.json();
  },
  getUserById: async (id: number) => {
    const response = await fetch(`${BASE_URL}/users/${id}`);
    return response.json();
  },
  getUsersByManager: async (managerId: number) => {
    const response = await fetch(`${BASE_URL}/users/manager/${managerId}`);
    return response.json();
  },
  getProfile: async (userId: number) => {
    const response = await fetch(`${BASE_URL}/users/${userId}/profile`);
    return response.json();
  },
  updateProfile: async (userId: number, data: {
    firstName: string; surname: string; emailAddress: string;
  }) => {
    const response = await fetch(`${BASE_URL}/users/${userId}/profile`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // ─── Change Password ─────────────────────────────────────────
  changePassword: async (userId: number, data: {
    currentPassword: string; newPassword: string; confirmPassword: string;
  }) => {
    const response = await fetch(`${BASE_URL}/users/${userId}/change-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // ─── Admin Update User ────────────────────────────────────────
  adminUpdateUser: async (userId: number, data: {
    department?: string;
    role?: string;
    managerId?: number | null;
  }) => {
    const response = await fetch(`${BASE_URL}/users/${userId}/admin-update`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

export const leaveAPI = {
  applyLeave: async (data: {
    employeeId: number; leaveType: string; startDate: string;
    endDate: string; duration: number; reason: string;
  }) => {
    const response = await fetch(`${BASE_URL}/leaves/apply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  getMyLeaves: async (employeeId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/employee/${employeeId}`);
    return response.json();
  },
  getTeamLeaves: async (managerId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/manager/${managerId}`);
    return response.json();
  },
  getLeaveById: async (leaveId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/detail/${leaveId}`);
    return response.json();
  },
  reviewLeave: async (leaveId: number, data: {
    managerId: number; status: string; managerComments: string;
    documentRequired?: boolean; documentDeadline?: string;
  }) => {
    const response = await fetch(`${BASE_URL}/leaves/${leaveId}/review`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  cancelLeave: async (leaveId: number, employeeId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/${leaveId}/cancel`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId })
    });
    return response.json();
  },
  getBalances: async (employeeId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/balance/${employeeId}`);
    return response.json();
  },

  // ─── Documents ───────────────────────────────────────────────
  uploadDocument: async (leaveId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/leaves/${leaveId}/upload`, {
      method: 'POST', body: formData
    });
    return response.json();
  },
  uploadRequiredDocument: async (leaveId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/leaves/${leaveId}/upload-required-doc`, {
      method: 'POST', body: formData
    });
    return response.json();
  },
  verifyDocument: async (leaveId: number, managerId: number, verified: boolean) => {
    const response = await fetch(`${BASE_URL}/leaves/${leaveId}/verify-document`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerId, verified })
    });
    return response.json();
  },
  getDocumentUrl: (leaveId: number) => `${BASE_URL}/leaves/documents/${leaveId}`,

  // ─── Notifications ───────────────────────────────────────────
  getNotifications: async (userId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/notifications/${userId}`);
    return response.json();
  },
  markAllNotificationsRead: async (userId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/notifications/${userId}/read-all`, { method: 'PUT' });
    return response.json();
  },
  markNotificationRead: async (notificationId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/notifications/${notificationId}/read`, { method: 'PUT' });
    return response.json();
  },

  // ─── Delegation ──────────────────────────────────────────────
  getDelegation: async (managerId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/delegate/${managerId}`);
    return response.json();
  },
  setDelegation: async (delegatorId: number, delegateId: number, expiryDate: string) => {
    const response = await fetch(`${BASE_URL}/leaves/delegate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delegatorId, delegateId, expiryDate })
    });
    return response.json();
  },
  removeDelegation: async (delegatorId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/delegate/${delegatorId}`, { method: 'DELETE' });
    return response.json();
  },
  getReports: async (managerId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/reports/${managerId}`);
    return response.json();
  },
  getDashboardStats: async (managerId: number) => {
    const response = await fetch(`${BASE_URL}/leaves/dashboard/${managerId}`);
    return response.json();
  }
};

export const settingsAPI = {
  getDepartments: async () => {
    const response = await fetch(`${BASE_URL}/settings/departments`);
    return response.json();
  },
  addDepartment: async (name: string) => {
    const response = await fetch(`${BASE_URL}/settings/departments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return response.json();
  },
  deleteDepartment: async (id: number) => {
    const response = await fetch(`${BASE_URL}/settings/departments/${id}`, { method: 'DELETE' });
    return response.json();
  },
  getPositions: async () => {
    const response = await fetch(`${BASE_URL}/settings/positions`);
    return response.json();
  },
  getPositionsByDepartment: async (departmentId: number) => {
    const response = await fetch(`${BASE_URL}/settings/positions/department/${departmentId}`);
    return response.json();
  },
  addPosition: async (name: string, departmentId: number) => {
    const response = await fetch(`${BASE_URL}/settings/positions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, departmentId: String(departmentId) })
    });
    return response.json();
  },
  deletePosition: async (id: number) => {
    const response = await fetch(`${BASE_URL}/settings/positions/${id}`, { method: 'DELETE' });
    return response.json();
  },
  getLeaveTypes: async () => {
    const response = await fetch(`${BASE_URL}/settings/leave-types`);
    return response.json();
  },
  addLeaveType: async (name: string) => {
    const response = await fetch(`${BASE_URL}/settings/leave-types`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return response.json();
  },
  deleteLeaveType: async (id: number) => {
    const response = await fetch(`${BASE_URL}/settings/leave-types/${id}`, { method: 'DELETE' });
    return response.json();
  },

  // ─── Public Holidays ─────────────────────────────────────────
  getPublicHolidays: async () => {
    const response = await fetch(`${BASE_URL}/settings/public-holidays`);
    return response.json();
  },
  addPublicHoliday: async (name: string, date: string) => {
    const response = await fetch(`${BASE_URL}/settings/public-holidays`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, date })
    });
    return response.json();
  },
  deletePublicHoliday: async (id: number) => {
    const response = await fetch(`${BASE_URL}/settings/public-holidays/${id}`, { method: 'DELETE' });
    return response.json();
  }
};

export const adminAPI = {
  getStats: async () => {
    const response = await fetch(`${BASE_URL}/admin/stats`);
    return response.json();
  },
  getAllUsers: async () => {
    const response = await fetch(`${BASE_URL}/admin/users`);
    return response.json();
  },
  getAllManagers: async () => {
    const response = await fetch(`${BASE_URL}/admin/managers`);
    return response.json();
  },
  getAllEmployees: async () => {
    const response = await fetch(`${BASE_URL}/admin/employees`);
    return response.json();
  },
  createManager: async (data: {
    firstName: string; surname: string; emailAddress: string;
    password: string; department: string;
  }) => {
    const response = await fetch(`${BASE_URL}/admin/managers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  deleteUser: async (id: number) => {
    const response = await fetch(`${BASE_URL}/admin/users/${id}`, { method: 'DELETE' });
    return response.json();
  },
  getAllLeaves: async () => {
    const response = await fetch(`${BASE_URL}/admin/leaves`);
    return response.json();
  },
  getReports: async () => {
    const response = await fetch(`${BASE_URL}/admin/reports`);
    return response.json();
  },
  getAuditLogs: async (page = 0, size = 50) => {
    const response = await fetch(`${BASE_URL}/admin/audit-logs?page=${page}&size=${size}`);
    return response.json();
  },
  getAuditLogsByAction: async (action: string) => {
    const response = await fetch(`${BASE_URL}/admin/audit-logs/action/${action}`);
    return response.json();
  },
  getLeaveBalances: async () => {
    const response = await fetch(`${BASE_URL}/admin/leave-balances`);
    return response.json();
  },
  setLeaveBalance: async (leaveType: string, allocatedDays: number) => {
    const response = await fetch(`${BASE_URL}/admin/leave-balances`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaveType, allocatedDays })
    });
    return response.json();
  }
};

// ─── Announcements ────────────────────────────────────────────
export const announcementAPI = {
  create: async (data: {
    title: string; content: string; category: string;
    targetAudience: string; targetDepartment?: string; targetRole?: string;
    pinned: boolean; expiresAt?: string | null; createdByUserId: number;
  }) => {
    const response = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/announcements`);
    return response.json();
  },
  getActive: async () => {
    const response = await fetch(`${BASE_URL}/announcements/active`);
    return response.json();
  },
  getForUser: async (userId: number) => {
    const response = await fetch(`${BASE_URL}/announcements/user/${userId}`);
    return response.json();
  },
  update: async (id: number, data: {
    title?: string; content?: string; category?: string;
    targetAudience?: string; targetDepartment?: string; targetRole?: string;
    pinned?: boolean; expiresAt?: string | null;
  }) => {
    const response = await fetch(`${BASE_URL}/announcements/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  togglePin: async (id: number) => {
    const response = await fetch(`${BASE_URL}/announcements/${id}/pin`, { method: 'PATCH' });
    return response.json();
  },
  deactivate: async (id: number) => {
    const response = await fetch(`${BASE_URL}/announcements/${id}/deactivate`, { method: 'PATCH' });
    return response.json();
  },
  delete: async (id: number) => {
    const response = await fetch(`${BASE_URL}/announcements/${id}`, { method: 'DELETE' });
    return response.json();
  },
};

// ─── Messages ─────────────────────────────────────────────────
export const messageAPI = {
  send: async (data: { senderId: number; receiverId: number; content: string }) => {
    const response = await fetch(`${BASE_URL}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  getInbox: async (userId: number) => {
    const response = await fetch(`${BASE_URL}/messages/inbox/${userId}`);
    return response.json();
  },
  getConversation: async (userA: number, userB: number) => {
    const response = await fetch(`${BASE_URL}/messages/conversation/${userA}/${userB}`);
    return response.json();
  },
  getUnreadCount: async (userId: number) => {
    const response = await fetch(`${BASE_URL}/messages/unread/${userId}`);
    return response.json();
  },
  getContacts: async (userId: number) => {
    const response = await fetch(`${BASE_URL}/messages/contacts/${userId}`);
    return response.json();
  },
};

// ─── Teams Integration ────────────────────────────────────────
export const teamsAPI = {
  getStatus: async () => {
    const response = await fetch(`${BASE_URL}/teams/status`);
    return response.json();
  },
  sendTest: async () => {
    const response = await fetch(`${BASE_URL}/teams/test`, { method: 'POST' });
    return response.json();
  },
};