import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Award, Users, TrendingUp, BarChart2, CheckCircle,
  XCircle, Loader2, Plus, Trash2, AlertCircle, Search, X,
} from 'lucide-react';
import { lmsService, type TrainingAnalytics, type LMSCourse } from '../../services/lms.service';
import { providersService } from '../../services/providers.service';

// ─── ASSIGN MODAL ─────────────────────────────────────────────────────────────

function AssignModal({
  courses,
  onClose,
}: {
  courses: LMSCourse[];
  onClose: () => void;
}) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [providers, setProviders] = useState<{ id: string; name: string; businessName: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [done, setDone] = useState<{ enrolled: number; total: number } | null>(null);

  useEffect(() => {
    providersService.listAll().then(res => {
      const list = (res.data ?? res) as { id: string; user: { name: string }; businessName: string }[];
      setProviders(list.map(p => ({ id: p.id, name: p.user?.name ?? '', businessName: p.businessName })));
    }).catch(console.error);
  }, []);

  const filtered = providers.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.businessName.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const handleAssign = async () => {
    if (!selectedCourse || selectedIds.size === 0) return;
    setAssigning(true);
    try {
      const result = await lmsService.assignTraining(selectedCourse, Array.from(selectedIds));
      setDone(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Assign Mandatory Training</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={28} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Training Assigned</h3>
            <p className="text-gray-500 text-sm mb-6">
              {done.enrolled} of {done.total} provider(s) enrolled. They'll receive a notification.
            </p>
            <button onClick={onClose} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Course select */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Select Course</label>
                <select
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">Choose a course…</option>
                  {courses.filter(c => c.status === 'PUBLISHED').map(c => (
                    <option key={c.id} value={c.id}>{c.thumbnailEmoji || '📚'} {c.title}</option>
                  ))}
                </select>
              </div>

              {/* Provider search */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Select Providers ({selectedIds.size} selected)
                </label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search providers…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto border rounded-xl p-2">
                  {filtered.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">No providers found</p>
                  )}
                  {filtered.map(p => (
                    <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggle(p.id)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.businessName}</p>
                        <p className="text-xs text-gray-500">{p.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t">
              <button
                onClick={handleAssign}
                disabled={!selectedCourse || selectedIds.size === 0 || assigning}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {assigning ? <Loader2 size={14} className="animate-spin" /> : null}
                Assign to {selectedIds.size} Provider{selectedIds.size !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AdminTrainingPage() {
  const [analytics, setAnalytics] = useState<TrainingAnalytics | null>(null);
  const [allCourses, setAllCourses] = useState<LMSCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [tab, setTab] = useState<'overview' | 'attempts'>('overview');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, coursesRes] = await Promise.all([
        lmsService.trainingAnalytics(),
        lmsService.listCourses({ limit: 100 }),
      ]);
      setAnalytics(analyticsRes);
      setAllCourses(coursesRes.data ?? (coursesRes as unknown as LMSCourse[]));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  const totalEnrollments = analytics?.courses.reduce((s, c) => s + c.enrollments, 0) ?? 0;
  const totalAttempts = analytics?.courses.reduce((s, c) => s + c.quizAttempts, 0) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 size={24} className="text-indigo-600" /> Training Analytics
            </h1>
            <p className="text-gray-500 text-sm mt-1">Monitor provider learning progress and certification rates.</p>
          </div>
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            <Plus size={15} /> Assign Training
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Courses', value: analytics?.courses.length ?? 0, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Total Enrollments', value: totalEnrollments, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Quiz Attempts', value: totalAttempts, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Certifications', value: analytics?.totalCertifications ?? 0, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4">
              <div className={`${card.bg} rounded-xl p-3`}>
                <card.icon size={20} className={card.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {(['overview', 'attempts'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'overview' ? 'Course Overview' : 'Recent Attempts'}
            </button>
          ))}
        </div>

        {/* Course Overview */}
        {tab === 'overview' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Course', 'Level', 'Tier', 'Enrolled', 'Quiz Attempts', 'Pass Rate', 'Certs'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(analytics?.courses ?? []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                      <AlertCircle size={24} className="mx-auto mb-2 opacity-40" />
                      No published courses yet
                    </td>
                  </tr>
                )}
                {(analytics?.courses ?? []).map(course => (
                  <tr key={course.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{course.thumbnailEmoji || '📚'}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{course.title}</p>
                          <p className="text-xs text-gray-400">{course.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${course.level === 'BEGINNER' ? 'bg-emerald-100 text-emerald-700' :
                          course.level === 'INTERMEDIATE' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'}`}>
                        {course.level}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {course.requiredForTier ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          {course.requiredForTier}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-700">{course.enrollments}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{course.quizAttempts}</td>
                    <td className="px-4 py-3.5">
                      {course.passRate !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${course.passRate >= 70 ? 'bg-emerald-500' : course.passRate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${course.passRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{course.passRate}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">No data</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-emerald-600 font-semibold text-sm">
                        <Award size={13} /> {course.certifications}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recent Attempts */}
        {tab === 'attempts' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Provider', 'Course', 'Score', 'Result', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(analytics?.recentAttempts ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No quiz attempts yet</td>
                  </tr>
                )}
                {(analytics?.recentAttempts ?? []).map(attempt => (
                  <tr key={attempt.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                          {attempt.user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attempt.user.name}</p>
                          <p className="text-xs text-gray-400">{attempt.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{attempt.quiz.course.title}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-sm font-bold ${attempt.passed ? 'text-emerald-600' : 'text-red-500'}`}>
                        {attempt.score}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {attempt.passed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle size={11} /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          <XCircle size={11} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAssign && (
        <AssignModal courses={allCourses} onClose={() => { setShowAssign(false); load(); }} />
      )}
    </div>
  );
}
