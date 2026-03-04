'use client';
import { useState, useEffect, useRef } from 'react';
import EmployeeLayout from '@/components/EmployeeLayout';
import { useAuth } from '@/lib/AuthContext';

const BASE_URL = 'http://localhost:8080/api';

export default function EmployeeMessages() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [search, setSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout>();

  const fetchInbox = () => {
    if (!user) return;
    fetch(`${BASE_URL}/messages/inbox/${user.id}`)
      .then(r => r.text()).then(text => {
        if (!text || !text.startsWith('{')) return;
        const res = JSON.parse(text);
        if (res.success) setInbox(res.data ?? []);
      }).catch(console.error).finally(() => setLoading(false));
  };

  const fetchContacts = () => {
    if (!user) return;
    fetch(`${BASE_URL}/messages/contacts/${user.id}`)
      .then(r => r.text()).then(text => {
        if (!text || !text.startsWith('{')) return;
        const res = JSON.parse(text);
        if (res.success) setContacts(res.data ?? []);
      }).catch(console.error);
  };

  const fetchConversation = (contactId: number) => {
    if (!user) return;
    fetch(`${BASE_URL}/messages/conversation/${user.id}/${contactId}`)
      .then(r => r.text()).then(text => {
        if (!text || !text.startsWith('{')) return;
        const res = JSON.parse(text);
        if (res.success) setMessages(res.data ?? []);
      }).catch(console.error);
  };

  useEffect(() => {
    fetchInbox();
    fetchContacts();
  }, [user]);

  useEffect(() => {
    if (selectedContact) {
      fetchConversation(selectedContact.contactId ?? selectedContact.id);
      pollRef.current = setInterval(() => {
        fetchConversation(selectedContact.contactId ?? selectedContact.id);
        fetchInbox();
      }, 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact || !user) return;
    setSending(true);
    const contactId = selectedContact.contactId ?? selectedContact.id;
    try {
      const res = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, receiverId: contactId, content: newMessage.trim() })
      }).then(r => r.json());
      if (res.success) {
        setMessages(prev => [...prev, res.data]);
        setNewMessage('');
        fetchInbox();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact);
    setShowNewChat(false);
    setContactSearch('');
  };

  const handleNewChat = (contact: any) => {
    const asConversation = {
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.surname}`,
      contactRole: contact.role,
      contactDepartment: contact.department,
      lastMessage: null,
      unreadCount: 0,
    };
    setSelectedContact(asConversation);
    setMessages([]);
    setShowNewChat(false);
  };

  const formatTime = (dt: string) => {
    const d = new Date(dt);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  const roleBadge = (role: string) =>
    role === 'ADMIN'   ? 'bg-purple-50 text-purple-700' :
    role === 'MANAGER' ? 'bg-blue-50 text-blue-700' :
                         'bg-emerald-50 text-emerald-700';

  const filteredInbox = inbox.filter(c =>
    c.contactName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = contacts.filter(c =>
    `${c.firstName} ${c.surname} ${c.department}`.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const selectedName = selectedContact?.contactName ??
    `${selectedContact?.firstName} ${selectedContact?.surname}`;

  const selectedRole = selectedContact?.contactRole ?? selectedContact?.role;

  if (!user) return null;

  return (
    <EmployeeLayout title="Messages">
      <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[#0f1f3d] text-base">Messages</h2>
              <button onClick={() => { setShowNewChat(true); setSelectedContact(null); }}
                className="w-8 h-8 bg-[#0f1f3d] text-white rounded-full flex items-center justify-center text-lg font-bold hover:bg-[#1a3260] transition">
                +
              </button>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f3d]/20" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                      <div className="h-2 bg-gray-100 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredInbox.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-gray-400 text-sm">No conversations yet</p>
                <p className="text-gray-300 text-xs mt-1">Click + to start a new chat</p>
              </div>
            ) : (
              filteredInbox.map(c => (
                <button key={c.contactId} onClick={() => handleSelectContact(c)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-50 ${
                    selectedContact?.contactId === c.contactId ? 'bg-blue-50/50 border-l-2 border-l-[#0f1f3d]' : ''
                  }`}>
                  <div className="w-10 h-10 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {c.contactName?.charAt(0)}{c.contactName?.split(' ')[1]?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-semibold text-[#0f1f3d] text-sm truncate">{c.contactName}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {c.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-[#0f1f3d] text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {c.unreadCount}
                          </span>
                        )}
                        {c.lastMessageTime && (
                          <p className="text-xs text-gray-400">{formatTime(c.lastMessageTime)}</p>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs truncate ${c.unreadCount > 0 ? 'text-[#0f1f3d] font-medium' : 'text-gray-400'}`}>
                      {c.lastMessage ?? 'Start a conversation'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main area */}
        {showNewChat ? (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-[#0f1f3d] mb-1">New Conversation</h3>
              <p className="text-gray-400 text-xs">Select a person to message</p>
            </div>
            <div className="p-4">
              <input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                placeholder="Search by name or department..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f3d]/20 mb-4" />
              <div className="space-y-2">
                {filteredContacts.map(c => (
                  <button key={c.id} onClick={() => handleNewChat(c)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl border border-gray-100 transition text-left">
                    <div className="w-10 h-10 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.firstName?.charAt(0)}{c.surname?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#0f1f3d] text-sm">{c.firstName} {c.surname}</p>
                      <p className="text-xs text-gray-400">{c.department}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${roleBadge(c.role)}`}>
                      {c.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : selectedContact ? (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {selectedName?.charAt(0)}{selectedName?.split(' ')[1]?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-[#0f1f3d] text-sm">{selectedName}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${roleBadge(selectedRole)}`}>
                    {selectedRole}
                  </span>
                  {selectedContact.contactDepartment && (
                    <span className="text-xs text-gray-400">{selectedContact.contactDepartment}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-4xl mb-3">👋</p>
                  <p className="text-gray-500 font-medium text-sm">Start the conversation</p>
                  <p className="text-gray-400 text-xs mt-1">Send a message to {selectedName}</p>
                </div>
              ) : (
                messages.map(m => {
                  const isMine = m.senderId === user.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-2 flex-shrink-0 self-end">
                          {m.senderName?.charAt(0)}
                        </div>
                      )}
                      <div className={`max-w-xs lg:max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? 'bg-[#0f1f3d] text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          {m.content}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 px-1">{formatTime(m.sentAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex gap-2 items-end">
                <textarea value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Message ${selectedName}...`}
                  rows={1}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f3d]/20 resize-none" />
                <button onClick={handleSend} disabled={sending || !newMessage.trim()}
                  className="w-10 h-10 bg-[#0f1f3d] hover:bg-[#1a3260] text-white rounded-xl flex items-center justify-center transition disabled:opacity-40 flex-shrink-0">
                  <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 21L23 12 2 3v7l15 2-15 2v7z"/>
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 px-1">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-bold text-[#0f1f3d] mb-1">Your Messages</p>
            <p className="text-gray-400 text-sm mb-4">Select a conversation or start a new one</p>
            <button onClick={() => setShowNewChat(true)}
              className="px-4 py-2 bg-[#0f1f3d] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3260] transition">
              + New Message
            </button>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}