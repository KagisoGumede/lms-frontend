'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ManagerLayout from '@/components/ManagerLayout';
import { userAPI, settingsAPI } from '@/lib/api';
import { UserRole } from '@/types';

export default function AddUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [serverError, setServerError] = useState('');

  const [formData, setFormData] = useState({
    name: '', surname: '', email: '', password: '',
    role: 'employee' as UserRole,
    departmentId: '', department: '',
    positionId: '', position: '', managerId: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const availablePositions = positions.filter(
    p => p.departmentId === Number(formData.departmentId)
  );

  useEffect(() => {
    Promise.all([
      userAPI.getAllManagers(),
      settingsAPI.getDepartments(),
      settingsAPI.getPositions()
    ]).then(([mgrs, depts, pos]) => {
      if (mgrs.success) setManagers(mgrs.data);
      if (depts.success) setDepartments(depts.data);
      if (pos.success) setPositions(pos.data);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'departmentId') {
      const selected = departments.find(d => d.id === Number(value));
      setFormData(prev => ({
        ...prev, departmentId: value,
        department: selected?.name || '',
        positionId: '', position: ''
      }));
    } else if (name === 'positionId') {
      const selected = positions.find(p => p.id === Number(value));
      setFormData(prev => ({ ...prev, positionId: value, position: selected?.name || '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim())    newErrors.name    = 'First name is required';
    if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
    if (!formData.email.trim())   newErrors.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (formData.password && formData.password.length < 6)
      newErrors.password = 'Minimum 6 characters (or leave blank to auto-generate)';
    if (!formData.departmentId) newErrors.departmentId = 'Department is required';
    if (!formData.positionId)   newErrors.positionId   = 'Position is required';
    if (formData.role === 'employee' && !formData.managerId)
      newErrors.managerId = 'Manager is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setServerError('');
    setSuccessMessage('');
    try {
      const res = await userAPI.createUser({
        firstName:    formData.name,
        surname:      formData.surname,
        emailAddress: formData.email,
        password:     formData.password || '',   // blank = backend auto-generates
        department:   formData.department,
        role:         formData.role.toUpperCase(),
        managerId:    formData.managerId ? Number(formData.managerId) : null
      });
      if (res.success) {
        setSuccessMessage(
          `${formData.name} ${formData.surname} created successfully. ` +
          `A welcome email with login credentials has been sent to ${formData.email}.`
        );
        setFormData({
          name: '', surname: '', email: '', password: '',
          role: 'employee', departmentId: '', department: '',
          positionId: '', position: '', managerId: ''
        });
      } else {
        setServerError(res.message || 'Something went wrong');
      }
    } catch {
      setServerError('Cannot connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d] focus:border-[#0f1f3d] transition ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'
    }`;

  return (
    <ManagerLayout title="Add New User">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">Create User Account</h2>
          <p className="text-gray-500 text-sm">Add a new employee or manager to the system</p>
        </div>

        {successMessage && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
            {successMessage}
          </div>
        )}
        {serverError && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            {serverError}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">User Role</label>
              <div className="grid grid-cols-2 gap-3">
                {(['employee', 'manager'] as UserRole[]).map((role) => (
                  <button key={role} type="button"
                    onClick={() => setFormData({ ...formData, role, managerId: '' })}
                    className={`py-3 px-4 rounded-lg border-2 text-sm font-semibold transition ${
                      formData.role === role
                        ? 'bg-[#0f1f3d] text-white border-[#0f1f3d]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#0f1f3d]'
                    }`}>
                    {role === 'employee' ? 'Employee' : 'Manager'}
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Info */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Personal Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    className={inputClass('name')} placeholder="First name" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Surname <span className="text-red-500">*</span></label>
                  <input type="text" name="surname" value={formData.surname} onChange={handleChange}
                    className={inputClass('surname')} placeholder="Surname" />
                  {errors.surname && <p className="text-red-500 text-xs mt-1">{errors.surname}</p>}
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Account Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className={inputClass('email')} placeholder="user@company.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                    <span className="ml-1 text-xs font-normal text-gray-400">(leave blank to auto-generate)</span>
                  </label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange}
                    className={inputClass('password')} placeholder="Auto-generated if blank" />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    A welcome email with login credentials will be sent automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Work Info */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Work Information</p>
              {departments.length === 0 && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-medium">
                  No departments found. Add departments in Settings first.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
                  <select name="departmentId" value={formData.departmentId} onChange={handleChange}
                    className={inputClass('departmentId')}>
                    <option value="">Select Department</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {errors.departmentId && <p className="text-red-500 text-xs mt-1">{errors.departmentId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position <span className="text-red-500">*</span></label>
                  <select name="positionId" value={formData.positionId} onChange={handleChange}
                    disabled={!formData.departmentId}
                    className={`${inputClass('positionId')} ${!formData.departmentId ? 'bg-gray-50 cursor-not-allowed' : ''}`}>
                    <option value="">{formData.departmentId ? 'Select Position' : 'Select Department First'}</option>
                    {availablePositions.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {errors.positionId && <p className="text-red-500 text-xs mt-1">{errors.positionId}</p>}
                </div>
              </div>
            </div>

            {/* Manager Assignment */}
            {formData.role === 'employee' && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Manager Assignment</p>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Manager <span className="text-red-500">*</span></label>
                <select name="managerId" value={formData.managerId} onChange={handleChange}
                  className={inputClass('managerId')}>
                  <option value="">Select Manager</option>
                  {managers.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.firstName} {m.surname} — {m.department}</option>
                  ))}
                </select>
                {errors.managerId && <p className="text-red-500 text-xs mt-1">{errors.managerId}</p>}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="button" onClick={() => router.push('/manager/dashboard')}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create User Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ManagerLayout>
  );
}