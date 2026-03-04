'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    { title: 'Leave Management', description: 'Employees apply for leave in seconds. Managers approve or reject with one click.', icon: '📋' },
    { title: 'Real-Time Dashboard', description: 'Live stats on leave trends, team availability, and pending approvals.', icon: '📊' },
    { title: 'Email Notifications', description: 'Automatic emails keep everyone informed at every step of the process.', icon: '📧' },
    { title: 'Role-Based Access', description: 'Separate portals for Admins, Managers and Employees — each with the right tools.', icon: '🔐' },
    { title: 'Reports and Analytics', description: 'Detailed reports by department, leave type and monthly trends.', icon: '📈' },
    { title: 'Document Uploads', description: 'Employees attach supporting documents like medical certificates directly.', icon: '📎' },
  ];

  const stats = [
    { value: '3', label: 'User Roles' },
    { value: '100%', label: 'Web Based' },
    { value: '24/7', label: 'Available' },
    { value: '0', label: 'Paperwork' },
  ];

  const howItWorks = [
    { step: '01', title: 'Admin sets up the system', desc: 'Add departments, positions and leave types. Create manager accounts.' },
    { step: '02', title: 'Managers add their teams', desc: 'Managers create employee accounts and assign them to the right department.' },
    { step: '03', title: 'Employees apply for leave', desc: 'Staff submit leave requests online with supporting documents in seconds.' },
    { step: '04', title: 'Managers review requests', desc: 'Approve or reject with comments. Employee is notified by email instantly.' },
  ];

  const roles = [
    {
      role: 'Administrator',
      desc: 'Full system control. Manage all users, view company-wide reports, configure settings.',
      perks: ['Manage all managers and employees', 'Company-wide reports', 'System configuration', 'Leave type management'],
      border: 'border-t-4 border-[#0f1f3d]'
    },
    {
      role: 'Manager',
      desc: 'Manage your team. Review and approve leave requests with full visibility.',
      perks: ['Approve or reject leave requests', 'Team reports and analytics', 'Email notifications', 'Add team members'],
      border: 'border-t-4 border-blue-500'
    },
    {
      role: 'Employee',
      desc: 'Simple and fast. Apply for leave, upload documents, track request status.',
      perks: ['Submit leave requests', 'Upload supporting documents', 'Track request status', 'View leave history'],
      border: 'border-t-4 border-blue-300'
    },
  ];

  const pricingItems = [
    'Unlimited employees and managers',
    'Admin, Manager and Employee portals',
    'Email notifications',
    'Reports and analytics',
    'Document uploads',
    'Leave calendar',
    'Priority support',
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0f1f3d] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">LMS</span>
            </div>
            <span className="font-bold text-[#0f1f3d] text-lg">LeaveMS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-[#0f1f3d] transition">Features</a>
            <a href="#how-it-works" className="hover:text-[#0f1f3d] transition">How It Works</a>
            <a href="#pricing" className="hover:text-[#0f1f3d] transition">Pricing</a>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="px-5 py-2.5 bg-[#0f1f3d] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3260] transition shadow"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 bg-[#0f1f3d] text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold tracking-widest uppercase mb-6">
              Enterprise Leave Management
            </span>
            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
              Manage Employee Leave<br />
              <span className="text-blue-400">Simply and Professionally</span>
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              A complete leave management system built for modern companies.
              Streamline approvals, reduce paperwork, and keep your team informed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-4 bg-white text-[#0f1f3d] font-bold rounded-xl hover:bg-blue-50 transition shadow-xl text-sm"
              >
                Get Started
              </button>
              <button
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition text-sm"
              >
                See How It Works
              </button>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto px-6 mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-white/10 border border-white/10 rounded-xl p-5 text-center"
              >
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="text-blue-300 text-xs mt-1 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Features</span>
            <h2 className="text-4xl font-black text-[#0f1f3d] mt-3 mb-4">Everything your company needs</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Built for HR teams, managers and employees alike.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
              >
                <div className="w-12 h-12 bg-[#0f1f3d]/5 rounded-xl flex items-center justify-center text-2xl mb-5">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-[#0f1f3d] text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Process</span>
            <h2 className="text-4xl font-black text-[#0f1f3d] mt-3 mb-4">Up and running in minutes</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Simple setup, powerful results.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {howItWorks.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5 p-6 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <div className="w-12 h-12 bg-[#0f1f3d] rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-[#0f1f3d] mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Access Control</span>
            <h2 className="text-4xl font-black text-[#0f1f3d] mt-3 mb-4">Three roles, one system</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((item, i) => (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white rounded-2xl p-7 shadow-sm ${item.border}`}
              >
                <h3 className="font-black text-[#0f1f3d] text-xl mb-2">{item.role}</h3>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed">{item.desc}</p>
                <ul className="space-y-2">
                  {item.perks.map(perk => (
                    <li key={perk} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-[#0f1f3d] rounded-full flex-shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Pricing</span>
            <h2 className="text-4xl font-black text-[#0f1f3d] mt-3 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500">One plan, everything included. No hidden fees.</p>
          </div>
          <div className="max-w-md mx-auto bg-[#0f1f3d] rounded-3xl p-10 text-white text-center shadow-2xl">
            <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-4">Enterprise Plan</p>
            <div className="mb-6">
              <span className="text-6xl font-black">R999</span>
              <span className="text-blue-300 text-lg">/month</span>
            </div>
            <p className="text-blue-200 text-sm mb-8">Per company. Unlimited users, all features included.</p>
            <ul className="space-y-3 text-left mb-10">
              {pricingItems.map(item => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-4 bg-white text-[#0f1f3d] font-bold rounded-xl hover:bg-blue-50 transition"
            >
              Get Started Today
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#0f1f3d] text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-black mb-5">Ready to modernise your leave management?</h2>
            <p className="text-blue-200 mb-10 text-lg">Join companies already saving hours every week with LeaveMS.</p>
            <button
              onClick={() => router.push('/login')}
              className="px-10 py-4 bg-white text-[#0f1f3d] font-bold rounded-xl hover:bg-blue-50 transition shadow-xl text-sm"
            >
              Start Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1628] text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">LMS</span>
            </div>
            <span className="text-white font-semibold">LeaveMS</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} LeaveMS. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <button onClick={() => router.push('/login')} className="hover:text-white transition">Sign In</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
