import React, { useState, useMemo } from 'react';
import {
  BookOpen, PlayCircle, Award, Clock, FileText, Video,
  Download, ExternalLink, Search, CheckCircle, Plus,
  ChevronRight, Layers, AlertCircle,
} from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';
import { useApi } from '../../hooks/useApi';
import { lmsService } from '../../services/lms.service';
import type { LMSCourse, LMSEnrollment } from '../../services/lms.service';
import toast from 'react-hot-toast';

// ─── Static SOPs & training videos (sourced from company knowledge base) ─────
const SOPS = [
  { id: 's1', title: 'Employee Onboarding Checklist',         dept: 'HR',          version: 'v2.1', updatedAt: '2026-03-15', pages: 8 },
  { id: 's2', title: 'Code Review Guidelines',                dept: 'Engineering', version: 'v3.0', updatedAt: '2026-04-01', pages: 12 },
  { id: 's3', title: 'Incident Response Procedure',           dept: 'Engineering', version: 'v1.5', updatedAt: '2026-02-20', pages: 6 },
  { id: 's4', title: 'Leave & Attendance Policy',             dept: 'HR',          version: 'v2.0', updatedAt: '2026-01-10', pages: 5 },
  { id: 's5', title: 'Client Communication Standards',        dept: 'Operations',  version: 'v1.2', updatedAt: '2026-03-28', pages: 9 },
  { id: 's6', title: 'Data Privacy & Security Handbook',      dept: 'Compliance',  version: 'v4.0', updatedAt: '2026-04-10', pages: 22 },
];

const VIDEOS = [
  { id: 'v1', title: 'Welcome to Equinox — Platform Overview',   duration: '12:30', category: 'Onboarding', thumbnail: '🎬', watched: true  },
  { id: 'v2', title: 'How to Use the Task Board',                 duration: '8:45',  category: 'Tools',      thumbnail: '📋', watched: true  },
  { id: 'v3', title: 'Leave Application Walkthrough',             duration: '5:10',  category: 'HR',         thumbnail: '📅', watched: false },
  { id: 'v4', title: 'Code Review Best Practices (Live Session)', duration: '45:00', category: 'Technical',  thumbnail: '💻', watched: false },
  { id: 'v5', title: 'Performance Review — What to Expect',       duration: '18:22', category: 'HR',         thumbnail: '📊', watched: false },
  { id: 'v6', title: 'Security Awareness Training 2026',          duration: '30:00', category: 'Compliance', thumbnail: '🔐', watched: false },
];

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER:     'bg-green-100 text-green-700',
  INTERMEDIATE: 'bg-amber-100 text-amber-700',
  ADVANCED:     'bg-red-100 text-red-700',
};

const DEPT_COLOR: Record<string, string> = {
  HR:          'bg-pink-100 text-pink-700',
  Engineering: 'bg-blue-100 text-blue-700',
  Operations:  'bg-emerald-100 text-emerald-700',
  Compliance:  'bg-purple-100 text-purple-700',
};

const VID_CATEGORY_COLOR: Record<string, string> = {
  Onboarding: 'bg-emerald-100 text-emerald-700',
  Tools:      'bg-blue-100 text-blue-700',
  HR:         'bg-pink-100 text-pink-700',
  Technical:  'bg-primary-100 text-primary-700',
  Compliance: 'bg-purple-100 text-purple-700',
  Skills:     'bg-amber-100 text-amber-700',
};

type Tab = 'courses' | 'sops' | 'videos';

const LearningPage: React.FC = () => {
  const [tab, setTab]         = useState<Tab>('courses');
  const [catFilter, setCat]   = useState('All');
  const [deptFilter, setDept] = useState('All');
  const [vidCat, setVidCat]   = useState('All');
  const [search, setSearch]   = useState('');
  const [watched, setWatched] = useState<Record<string, boolean>>(
    Object.fromEntries(VIDEOS.map(v => [v.id, v.watched]))
  );
  const [enrolling, setEnrolling]   = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [expandedCourse, setExpanded] = useState<string | null>(null);

  // ── Real LMS data ────────────────────────────────────────────────────────────
  const { data: coursesRes, loading: coursesLoading, refetch: refetchCourses } =
    useApi(() => lmsService.listCourses({ limit: 100 }), []);
  const { data: enrollmentsRaw, refetch: refetchEnrollments } =
    useApi(() => lmsService.myEnrollments(), []);

  const courses: LMSCourse[]     = coursesRes?.data || [];
  const enrollments: LMSEnrollment[] = Array.isArray(enrollmentsRaw) ? enrollmentsRaw : [];

  // Enrollment map: courseId → enrollment
  const enrollmentMap = useMemo(() =>
    Object.fromEntries(enrollments.map(e => [e.courseId, e])),
    [enrollments]
  );

  // ── Derived stats ────────────────────────────────────────────────────────────
  const enrolledCount   = enrollments.length;
  const inProgressCount = enrollments.filter(e => e.status === 'IN_PROGRESS').length;
  const completedCount  = enrollments.filter(e => e.status === 'COMPLETED').length;
  const watchedCount    = Object.values(watched).filter(Boolean).length;

  // ── Category list from real data ─────────────────────────────────────────────
  const categories = ['All', ...Array.from(new Set(courses.map(c => c.category))).sort()];
  const SOP_DEPTS  = ['All', 'HR', 'Engineering', 'Operations', 'Compliance'];
  const VID_CATS   = ['All', 'Onboarding', 'HR', 'Technical', 'Tools', 'Compliance', 'Skills'];

  // ── Filtered courses ─────────────────────────────────────────────────────────
  const filteredCourses = courses.filter(c =>
    (catFilter === 'All' || c.category === catFilter) &&
    (search === '' || c.title.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredSops = SOPS.filter(s =>
    (deptFilter === 'All' || s.dept === deptFilter) &&
    (search === '' || s.title.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredVids = VIDEOS.filter(v =>
    (vidCat === 'All' || v.category === vidCat) &&
    (search === '' || v.title.toLowerCase().includes(search.toLowerCase()))
  );

  // ── Enroll in a course ───────────────────────────────────────────────────────
  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await lmsService.enroll(courseId);
      toast.success('Enrolled successfully!');
      refetchEnrollments();
    } catch {
      toast.error('Failed to enroll');
    } finally {
      setEnrolling(null);
    }
  };

  // ── Mark course 100% complete — awards certificate ───────────────────────────
  // When progress hits 100 the backend sets LMSEnrollment.status = 'COMPLETED'
  // and records completedAt. The UI shows a certificate badge.
  const handleMarkComplete = async (courseId: string) => {
    setCompleting(courseId);
    try {
      await lmsService.updateProgress(courseId, 100);
      toast.success('🎉 Course completed! Certificate earned.');
      refetchCourses();
      refetchEnrollments();
    } catch {
      toast.error('Failed to update progress');
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Learning Center</h1>
        <p className="text-surface-500 text-sm mt-0.5">Courses, SOPs, and training resources to grow your skills.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{enrolledCount}</p>
          <p className="text-xs text-surface-500 mt-0.5">Courses Enrolled</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
          <p className="text-xs text-surface-500 mt-0.5">In Progress</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          <p className="text-xs text-surface-500 mt-0.5">Certified</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-600">{watchedCount}/{VIDEOS.length}</p>
          <p className="text-xs text-surface-500 mt-0.5">Videos Watched</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl w-fit">
        {([
          { key: 'courses', label: 'Courses',         icon: <BookOpen size={14} /> },
          { key: 'sops',    label: 'SOPs & Policies',  icon: <FileText size={14} /> },
          { key: 'videos',  label: 'Training Videos',  icon: <Video size={14} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-800'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── COURSES ── */}
      {tab === 'courses' && (
        <div className="space-y-4">
          {/* Search + category filter */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
              <Search size={15} className="text-surface-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search courses…"
                className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button key={c} onClick={() => setCat(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${catFilter === c ? 'bg-primary-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-primary-300'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {coursesLoading ? (
            <div className="card flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <BookOpen size={40} className="text-surface-300 mb-3" />
              <p className="text-surface-500">No courses available yet.</p>
              <p className="text-sm text-surface-400 mt-1">Check back soon — new courses are added regularly.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredCourses.map(course => {
                const enrollment = enrollmentMap[course.id];
                const progress   = enrollment?.progress ?? 0;
                const certified  = enrollment?.status === 'COMPLETED';
                const isEnrolled = !!enrollment;
                const isExpanded = expandedCourse === course.id;

                return (
                  <div key={course.id}
                    className={`card hover:shadow-md transition-all duration-200 group ${certified ? 'border-green-200 bg-green-50/30' : ''}`}>
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${certified ? 'bg-green-100' : 'bg-gradient-to-br from-primary-100 to-secondary-100'}`}>
                        {certified
                          ? <Award size={24} className="text-green-600" />
                          : <BookOpen size={24} className="text-primary-600" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-surface-800 text-sm leading-tight group-hover:text-primary-600 transition-colors">{course.title}</h3>
                          <span className={`badge text-xs flex-shrink-0 ${LEVEL_COLOR[course.level] || 'bg-surface-100 text-surface-600'}`}>
                            {course.level}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-surface-400 mb-3">
                          <Clock size={11} /> {Math.round(course.duration / 60)}h {course.duration % 60 > 0 ? `${course.duration % 60}m` : ''}
                          <span className="bg-surface-100 px-2 py-0.5 rounded text-surface-600">{course.category}</span>
                          {course._count && (
                            <span className="flex items-center gap-1"><Layers size={10} /> {course._count.lessons} lessons</span>
                          )}
                        </div>

                        {/* Progress / action area */}
                        {certified ? (
                          <div className="flex items-center gap-2">
                            <ProgressBar value={100} color="bg-green-500" className="flex-1" />
                            <div className="flex items-center gap-1 text-xs text-green-600 font-semibold whitespace-nowrap">
                              <Award size={12} /> Certified
                            </div>
                          </div>
                        ) : isEnrolled ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-surface-500 mb-0.5">
                              <span>{progress > 0 ? 'In progress' : 'Enrolled'}</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <ProgressBar value={progress} color="bg-primary-500" />
                            {/* Lessons preview */}
                            {course.lessons && course.lessons.length > 0 && (
                              <div>
                                <button onClick={() => setExpanded(isExpanded ? null : course.id)}
                                  className="flex items-center gap-1 text-xs text-surface-500 hover:text-primary-600 mt-1">
                                  <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                  {course.lessons.length} lesson{course.lessons.length !== 1 ? 's' : ''}
                                </button>
                                {isExpanded && (
                                  <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-surface-200">
                                    {course.lessons.map(lesson => (
                                      <div key={lesson.id} className="flex items-center gap-2 text-xs text-surface-600">
                                        <PlayCircle size={11} className="text-surface-400 flex-shrink-0" />
                                        <span className="truncate">{lesson.title}</span>
                                        <span className="text-surface-400 ml-auto flex-shrink-0">{lesson.duration}m</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => handleMarkComplete(course.id)}
                              disabled={completing === course.id}
                              className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle size={13} />
                              {completing === course.id ? 'Completing…' : 'Mark as Complete & Earn Certificate'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrolling === course.id}
                            className="flex items-center gap-2 text-sm text-primary-600 font-semibold hover:text-primary-700 mt-1 disabled:opacity-50 transition-colors"
                          >
                            <Plus size={15} />
                            {enrolling === course.id ? 'Enrolling…' : 'Enroll Now'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Certificate detail */}
                    {certified && enrollment?.completedAt && (
                      <div className="mt-4 pt-4 border-t border-green-200 flex items-center gap-2">
                        <Award size={14} className="text-green-600" />
                        <p className="text-xs text-green-700 font-medium">
                          Certificate earned on {new Date(enrollment.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* If no courses exist at all, show admin note */}
          {!coursesLoading && courses.length === 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              <AlertCircle size={16} className="flex-shrink-0" />
              No courses have been published yet. Ask your Admin to add courses in the LMS settings.
            </div>
          )}
        </div>
      )}

      {/* ── SOPs ── */}
      {tab === 'sops' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
              <Search size={15} className="text-surface-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SOPs…"
                className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {SOP_DEPTS.map(d => (
                <button key={d} onClick={() => setDept(d)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${deptFilter === d ? 'bg-primary-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-primary-300'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="divide-y divide-surface-100">
              {filteredSops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText size={40} className="text-surface-300 mb-3" />
                  <p className="text-surface-500">No SOPs found</p>
                </div>
              ) : filteredSops.map(sop => (
                <div key={sop.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50 transition-colors group">
                  <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-surface-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-800 truncate">{sop.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`badge text-xs ${DEPT_COLOR[sop.dept] || 'bg-surface-100 text-surface-600'}`}>{sop.dept}</span>
                      <span className="text-xs text-surface-400">{sop.version} · {sop.pages} pages</span>
                      <span className="text-xs text-surface-400">Updated {sop.updatedAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="flex items-center gap-1 text-xs text-primary-600 border border-primary-200 hover:bg-primary-50 px-2.5 py-1.5 rounded-lg transition-colors">
                      <ExternalLink size={12} /> View
                    </button>
                    <button className="flex items-center gap-1 text-xs text-surface-600 border border-surface-200 hover:bg-surface-50 px-2.5 py-1.5 rounded-lg transition-colors">
                      <Download size={12} /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TRAINING VIDEOS ── */}
      {tab === 'videos' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
              <Search size={15} className="text-surface-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos…"
                className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {VID_CATS.map(c => (
                <button key={c} onClick={() => setVidCat(c)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${vidCat === c ? 'bg-primary-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-primary-300'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {filteredVids.map(vid => (
              <div key={vid.id} className={`card hover:shadow-md transition-all duration-200 group ${watched[vid.id] ? 'opacity-80' : ''}`}>
                <div className="w-full h-36 bg-gradient-to-br from-surface-800 to-surface-900 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                  <span className="text-5xl">{vid.thumbnail}</span>
                  <button
                    onClick={() => { setWatched(p => ({ ...p, [vid.id]: true })); toast('Video player coming soon', { icon: '▶️' }); }}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors"
                  >
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <PlayCircle size={24} className="text-primary-600 fill-primary-600" />
                    </div>
                  </button>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{vid.duration}</div>
                  {watched[vid.id] && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Award size={10} /> Watched
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-surface-800 text-sm leading-tight group-hover:text-primary-600 transition-colors">{vid.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`badge text-xs ${VID_CATEGORY_COLOR[vid.category] || 'bg-surface-100 text-surface-600'}`}>{vid.category}</span>
                      <span className="flex items-center gap-1 text-xs text-surface-400"><Clock size={10} /> {vid.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredVids.length === 0 && (
              <div className="md:col-span-2 card flex flex-col items-center justify-center py-16 text-center">
                <Video size={40} className="text-surface-300 mb-3" />
                <p className="text-surface-500">No videos found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPage;
