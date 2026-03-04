'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

const BASE_URL = 'http://localhost:8080/api';

export default function AdminTeams() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/teams/status`)
      .then(r => r.text())
      .then(text => {
        if (!text || !text.startsWith('{')) return;
        const res = JSON.parse(text);
        if (res.success) setStatus(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${BASE_URL}/teams/test`, { method: 'POST' }).then(r => r.json());
      setTestResult(res.success ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminLayout title="Teams Integration">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#0f1f3d] mb-1">Microsoft Teams Integration</h2>
          <p className="text-gray-500 text-sm">Send automatic notifications to your Teams channel</p>
        </div>

        {/* Status card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-bold text-[#0f1f3d] mb-4">Integration Status</h3>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Notifications Enabled</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  status?.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {status?.enabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Webhook Configured</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  status?.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}>
                  {status?.configured ? 'Configured ✓' : 'Not Configured'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Setup instructions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-bold text-[#0f1f3d] mb-4">Setup Instructions</h3>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Open Microsoft Teams', desc: 'Go to the channel where you want to receive notifications' },
              { step: '2', title: 'Add Incoming Webhook', desc: 'Click ••• next to the channel → Connectors → Incoming Webhook → Configure' },
              { step: '3', title: 'Name your webhook', desc: 'Name it "LMS Notifications" and optionally add a logo, then click Create' },
              { step: '4', title: 'Copy the webhook URL', desc: 'Copy the generated webhook URL — it starts with https://outlook.office.com/webhook/...' },
              { step: '5', title: 'Add to application.properties', desc: 'Paste it in your Spring Boot application.properties file' },
            ].map(item => (
              <div key={item.step} className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-[#0f1f3d] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-[#0f1f3d] text-sm">{item.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Config snippet */}
          <div className="mt-5">
            <p className="text-xs font-semibold text-gray-500 mb-2">Add to application.properties:</p>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 space-y-1">
              <p>teams.webhook.url=https://outlook.office.com/webhook/YOUR_URL</p>
              <p>teams.notifications.enabled=true</p>
            </div>
          </div>
        </div>

        {/* What triggers notifications */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-bold text-[#0f1f3d] mb-4">What Triggers Notifications</h3>
          <div className="space-y-2">
            {[
              { icon: '📋', label: 'New leave request submitted', color: 'bg-amber-50 text-amber-700' },
              { icon: '✅', label: 'Leave request approved', color: 'bg-emerald-50 text-emerald-700' },
              { icon: '❌', label: 'Leave request rejected', color: 'bg-red-50 text-red-600' },
              { icon: '📢', label: 'New company announcement created', color: 'bg-blue-50 text-blue-700' },
              { icon: '💬', label: 'New internal message sent', color: 'bg-purple-50 text-purple-700' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-base">{item.icon}</span>
                <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.color}`}>Active</span>
              </div>
            ))}
          </div>
        </div>

        {/* Test button */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-[#0f1f3d] mb-1">Test Integration</h3>
          <p className="text-gray-400 text-sm mb-4">
            Send a test message to your Teams channel to confirm everything is working.
          </p>

          {testResult === 'success' && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium">
              ✅ Test notification sent! Check your Teams channel.
            </div>
          )}
          {testResult === 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
              ❌ Failed to send. Make sure your webhook URL is configured in application.properties and Spring Boot is restarted.
            </div>
          )}

          <button onClick={handleTest} disabled={testing}
            className="px-5 py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2">
            {testing ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending...
              </>
            ) : '🔔 Send Test Notification'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}