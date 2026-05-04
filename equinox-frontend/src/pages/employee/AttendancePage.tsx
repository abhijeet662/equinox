import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AttendanceRecord {
  date: string;       // YYYY-MM-DD
  checkIn: string | null;
  checkOut: string | null;
  status: 'present' | 'absent' | 'half-day' | 'weekend';
  hoursWorked: number;
}

const STORAGE_KEY = 'equinox_attendance';

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function calcHours(checkIn: string, checkOut: string): number {
  const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 1000 / 3600;
  return Math.round(diff * 100) / 100;
}

function generateSeedData(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const now = new Date();
  for (let i = 27; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    const key = d.toISOString().split('T')[0];
    if (dow === 0 || dow === 6) {
      records.push({ date: key, checkIn: null, checkOut: null, status: 'weekend', hoursWorked: 0 });
    } else {
      const absent = Math.random() < 0.08;
      if (absent) {
        records.push({ date: key, checkIn: null, checkOut: null, status: 'absent', hoursWorked: 0 });
      } else {
        const inH = 8 + Math.floor(Math.random() * 2);
        const inM = Math.floor(Math.random() * 30);
        const outH = 17 + Math.floor(Math.random() * 2);
        const outM = Math.floor(Math.random() * 59);
        const ci = new Date(d); ci.setHours(inH, inM, 0);
        const co = new Date(d); co.setHours(outH, outM, 0);
        const hrs = calcHours(ci.toISOString(), co.toISOString());
        records.push({ date: key, checkIn: ci.toISOString(), checkOut: co.toISOString(), status: hrs >= 4 ? 'present' : 'half-day', hoursWorked: hrs });
      }
    }
  }
  return records;
}

function loadHistory(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AttendanceRecord[];
  } catch { /* */ }
  const seed = generateSeedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveHistory(records: AttendanceRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

const STATUS_BADGE: Record<string, string> = {
  present:  'bg-green-100 text-green-700',
  absent:   'bg-red-100 text-red-700',
  'half-day': 'bg-amber-100 text-amber-700',
  weekend:  'bg-surface-100 text-surface-500',
};

const AttendancePage: React.FC = () => {
  const [history, setHistory]   = useState<AttendanceRecord[]>([]);
  const [elapsed, setElapsed]   = useState(0); // seconds
  const [tick, setTick]         = useState(0);

  useEffect(() => { setHistory(loadHistory()); }, []);

  // Live timer for current session
  useEffect(() => {
    const today = history.find(r => r.date === todayKey());
    if (today?.checkIn && !today.checkOut) {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(today.checkIn!).getTime()) / 1000));
        setTick(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [history, tick]);

  const today = history.find(r => r.date === todayKey());
  const isCheckedIn  = !!today?.checkIn && !today?.checkOut;
  const isCheckedOut = !!today?.checkOut;

  const handleCheckIn = () => {
    const now = new Date().toISOString();
    const key = todayKey();
    const newRecord: AttendanceRecord = { date: key, checkIn: now, checkOut: null, status: 'present', hoursWorked: 0 };
    const updated = history.filter(r => r.date !== key).concat(newRecord);
    updated.sort((a, b) => a.date.localeCompare(b.date));
    setHistory(updated);
    saveHistory(updated);
    setElapsed(0);
    toast.success('Checked in! Have a great day 🎉');
  };

  const handleCheckOut = () => {
    const now = new Date().toISOString();
    const key = todayKey();
    const updated = history.map(r => {
      if (r.date !== key) return r;
      const hrs = calcHours(r.checkIn!, now);
      return { ...r, checkOut: now, status: hrs >= 4 ? 'present' : ('half-day' as AttendanceRecord['status']), hoursWorked: hrs };
    });
    setHistory(updated);
    saveHistory(updated);
    toast.success('Checked out! See you tomorrow 👋');
  };

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Stats from last 30 records excluding weekends
  const workdays = history.filter(r => r.status !== 'weekend');
  const presentDays = workdays.filter(r => r.status === 'present').length;
  const absentDays  = workdays.filter(r => r.status === 'absent').length;
  const halfDays    = workdays.filter(r => r.status === 'half-day').length;
  const totalHours  = workdays.reduce((sum, r) => sum + r.hoursWorked, 0);
  const attendancePct = workdays.length ? Math.round((presentDays / workdays.length) * 100) : 0;

  // Last 14 days for display
  const recent = [...history].reverse().slice(0, 14);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Attendance</h1>
        <p className="text-surface-500 text-sm mt-0.5">Track your daily check-in and check-out times.</p>
      </div>

      {/* Check-in / Check-out card */}
      <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="text-primary-200 text-sm font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl font-bold font-mono tracking-tight">
                {isCheckedIn ? formatElapsed(elapsed) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isCheckedIn && <span className="text-primary-300 text-sm animate-pulse">● LIVE</span>}
            </div>
            <div className="flex items-center gap-6 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-primary-100">
                <LogIn size={14} />
                {today?.checkIn ? formatTime(today.checkIn) : '—'}
              </span>
              <span className="flex items-center gap-1.5 text-primary-100">
                <LogOut size={14} />
                {today?.checkOut ? formatTime(today.checkOut) : '—'}
              </span>
            </div>
          </div>

          <div className="flex gap-3 flex-shrink-0">
            {!isCheckedIn && !isCheckedOut && (
              <button
                onClick={handleCheckIn}
                className="flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors shadow-sm"
              >
                <LogIn size={18} /> Check In
              </button>
            )}
            {isCheckedIn && (
              <button
                onClick={handleCheckOut}
                className="flex items-center gap-2 bg-white/20 backdrop-blur border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors"
              >
                <LogOut size={18} /> Check Out
              </button>
            )}
            {isCheckedOut && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur border border-white/30 text-white font-semibold px-6 py-3 rounded-xl">
                <CheckCircle size={18} /> {today!.hoursWorked.toFixed(1)}h logged
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">{presentDays}</p>
            <p className="text-xs text-surface-500">Present Days</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <XCircle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">{absentDays}</p>
            <p className="text-xs text-surface-500">Absent Days</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">{halfDays}</p>
            <p className="text-xs text-surface-500">Half Days</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-primary-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">{attendancePct}%</p>
            <p className="text-xs text-surface-500">Attendance Rate</p>
          </div>
        </div>
      </div>

      {/* Attendance log */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-surface-400" />
            <h2 className="font-semibold text-surface-800">Recent Attendance Log</h2>
          </div>
          <span className="text-xs text-surface-400">{Math.round(totalHours)} hrs total this month</span>
        </div>
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="table-th">Date</th>
              <th className="table-th">Check In</th>
              <th className="table-th">Check Out</th>
              <th className="table-th">Hours</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {recent.map(rec => (
              <tr key={rec.date} className={`hover:bg-surface-50 transition-colors ${rec.status === 'weekend' ? 'opacity-50' : ''}`}>
                <td className="table-td font-medium text-surface-800">
                  {new Date(rec.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </td>
                <td className="table-td text-surface-600">{rec.checkIn ? formatTime(rec.checkIn) : '—'}</td>
                <td className="table-td text-surface-600">{rec.checkOut ? formatTime(rec.checkOut) : rec.checkIn ? <span className="text-amber-500 text-xs">Not checked out</span> : '—'}</td>
                <td className="table-td text-surface-600">{rec.hoursWorked > 0 ? `${rec.hoursWorked.toFixed(1)}h` : '—'}</td>
                <td className="table-td">
                  <span className={`badge capitalize text-xs ${STATUS_BADGE[rec.status]}`}>{rec.status.replace('-', ' ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendancePage;
