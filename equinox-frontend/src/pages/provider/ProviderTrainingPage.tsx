import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen, Play, CheckCircle, Lock, Award, Clock, ChevronRight,
  X, AlertTriangle, Trophy, ChevronLeft, Loader2,
} from 'lucide-react';
import { lmsService, type LMSCourse, type LMSQuiz, type QuizSubmitResult, type LMSCertification } from '../../services/lms.service';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const levelColor: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700',
  INTERMEDIATE: 'bg-amber-100 text-amber-700',
  ADVANCED: 'bg-red-100 text-red-700',
};

function fmtDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim();
}

// ─── VIDEO MODAL ─────────────────────────────────────────────────────────────

function VideoModal({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const isEmbed = url.includes('youtube') || url.includes('vimeo') || url.includes('youtu.be');
  let embedUrl = url;
  if (url.includes('youtu.be/')) {
    embedUrl = `https://www.youtube.com/embed/${url.split('youtu.be/')[1].split('?')[0]}`;
  } else if (url.includes('youtube.com/watch')) {
    const v = new URL(url).searchParams.get('v');
    embedUrl = `https://www.youtube.com/embed/${v}`;
  } else if (url.includes('vimeo.com/')) {
    const id = url.split('vimeo.com/')[1].split('?')[0];
    embedUrl = `https://player.vimeo.com/video/${id}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white hover:text-gray-300">
          <X size={24} />
        </button>
        <div className="text-white text-sm mb-2 font-medium">{title}</div>
        {isEmbed ? (
          <iframe
            src={embedUrl}
            className="w-full aspect-video rounded-xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video src={url} controls className="w-full aspect-video rounded-xl bg-black" />
        )}
      </div>
    </div>
  );
}

// ─── QUIZ ENGINE ─────────────────────────────────────────────────────────────

function QuizEngine({
  courseId, quiz, onClose, onPassed,
}: {
  courseId: string;
  quiz: LMSQuiz;
  onClose: () => void;
  onPassed: (result: QuizSubmitResult) => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(quiz.questions.length).fill(null));
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimitMins * 60);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !result && !submitting) { handleSubmit(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const handleSubmit = useCallback(async () => {
    clearInterval(timerRef.current);
    const filled = answers.map(a => a ?? 0);
    setSubmitting(true);
    try {
      const res = await lmsService.submitQuiz(courseId, filled);
      setResult(res);
      if (res.passed) onPassed(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }, [answers, courseId, onPassed]);

  const q = quiz.questions[current];
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const isLow = timeLeft < 120;

  // Results screen
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          {result.passed ? (
            <>
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy size={36} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
              <p className="text-gray-500 mb-4">You passed with {result.score}%</p>
              <div className="bg-emerald-50 rounded-xl p-4 mb-6">
                <p className="text-emerald-800 font-semibold text-sm">🎓 Certificate Issued</p>
                <p className="text-emerald-600 text-xs mt-1">Your certification has been recorded and is available on your profile.</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={36} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Passed</h2>
              <p className="text-gray-500 mb-4">You scored {result.score}% — need {quiz.passingScore}% to pass</p>
              <div className="bg-amber-50 rounded-xl p-4 mb-6">
                <p className="text-amber-800 text-sm">Review the lesson materials and try again. You can retake the quiz anytime.</p>
              </div>
            </>
          )}

          <div className="space-y-2 text-sm text-left mb-6">
            {result.correctAnswers.map((correct, i) => {
              const userAnswer = result.attempt.answers[i];
              const isCorrect = userAnswer === correct;
              return (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${isCorrect ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {isCorrect
                    ? <CheckCircle size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                    : <X size={14} className="text-red-500 mt-0.5 shrink-0" />
                  }
                  <span className={`text-xs ${isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
                    Q{i + 1}: {isCorrect ? 'Correct' : `Your answer: "${quiz.questions[i].options[userAnswer]}" — Correct: "${quiz.questions[i].options[correct]}"`}
                  </span>
                </div>
              );
            })}
          </div>

          <button onClick={onClose} className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition">
            {result.passed ? 'View My Certifications' : 'Back to Course'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="text-sm text-gray-500">
            Question <span className="font-bold text-gray-900">{current + 1}</span> of {quiz.questions.length}
          </div>
          <div className={`flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1 rounded-full ${isLow ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
            <Clock size={13} />
            {mins}:{secs}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-lg font-semibold text-gray-900 mb-6">{q.question}</p>
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const selected = answers[current] === i;
              return (
                <button
                  key={i}
                  onClick={() => setAnswers(prev => { const a = [...prev]; a[current] = i; return a; })}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition
                    ${selected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs mr-3 font-bold
                    ${selected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex items-center justify-between">
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span className="text-xs text-gray-400">
            {answers.filter(a => a !== null).length}/{quiz.questions.length} answered
          </span>

          {current < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrent(c => c + 1)}
              disabled={answers[current] === null}
              className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-30"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || answers.some(a => a === null)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COURSE CARD ─────────────────────────────────────────────────────────────

function CourseCard({
  course,
  certifiedCourseIds,
  lockedCourseIds,
  onStart,
}: {
  course: LMSCourse;
  certifiedCourseIds: Set<string>;
  lockedCourseIds: Set<string>;
  onStart: (course: LMSCourse) => void;
}) {
  const certified = certifiedCourseIds.has(course.id);
  const locked = lockedCourseIds.has(course.id);
  const enrolled = !!course.enrollment;
  const progress = course.enrollment?.progress ?? 0;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition hover:shadow-md
      ${locked ? 'opacity-60' : ''}`}>
      {/* Emoji header */}
      <div className={`flex items-center justify-center text-5xl py-8
        ${certified ? 'bg-gradient-to-br from-emerald-50 to-teal-100' : 'bg-gradient-to-br from-indigo-50 to-purple-100'}`}>
        {course.thumbnailEmoji || '📚'}
        {certified && (
          <span className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full p-1">
            <CheckCircle size={14} />
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelColor[course.level] ?? 'bg-gray-100 text-gray-600'}`}>
            {course.level}
          </span>
          {course.requiredForTier && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              Unlocks {course.requiredForTier}
            </span>
          )}
          {certified && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
              <Award size={9} /> Certified
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 text-sm mb-1 leading-snug">{course.title}</h3>
        {course.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{course.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 mt-auto">
          <span className="flex items-center gap-1"><Clock size={11} /> {fmtDuration(course.duration)}</span>
          <span className="flex items-center gap-1"><BookOpen size={11} /> {course._count?.lessons ?? 0} lessons</span>
        </div>

        {enrolled && !certified && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
              <span>Progress</span><span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {locked ? (
          <button disabled className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold cursor-not-allowed">
            <Lock size={14} /> Prerequisite Required
          </button>
        ) : certified ? (
          <button onClick={() => onStart(course)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition">
            <Award size={14} /> Review Course
          </button>
        ) : (
          <button onClick={() => onStart(course)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
            {enrolled ? <><Play size={14} /> Continue</> : <><Play size={14} /> Start Course</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── COURSE DETAIL MODAL ──────────────────────────────────────────────────────

function CourseDetailModal({
  course,
  certifiedCourseIds,
  onClose,
  onQuizStart,
  onEnroll,
  onVideoPlay,
}: {
  course: LMSCourse;
  certifiedCourseIds: Set<string>;
  onClose: () => void;
  onQuizStart: () => void;
  onEnroll: () => void;
  onVideoPlay: (url: string, title: string) => void;
}) {
  const certified = certifiedCourseIds.has(course.id);
  const enrolled = !!course.enrollment;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{course.thumbnailEmoji || '📚'}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${levelColor[course.level] ?? 'bg-gray-100 text-gray-600'}`}>
                  {course.level}
                </span>
                <span className="text-xs text-gray-400">{fmtDuration(course.duration)}</span>
                {course.requiredForTier && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    Unlocks {course.requiredForTier} Tasks
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {course.description && (
            <p className="text-sm text-gray-600">{course.description}</p>
          )}

          {/* Promo video */}
          {course.videoUrl && (
            <button
              onClick={() => onVideoPlay(course.videoUrl!, course.title)}
              className="w-full flex items-center gap-3 p-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                <Play size={18} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Watch Intro Video</p>
                <p className="text-xs text-gray-400">Preview what you'll learn</p>
              </div>
            </button>
          )}

          {/* Lessons */}
          {course.lessons && course.lessons.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Lessons ({course.lessons.length})</h3>
              <div className="space-y-2">
                {course.lessons.map((lesson, i) => (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
                      <p className="text-xs text-gray-400">{fmtDuration(lesson.duration)}</p>
                    </div>
                    {lesson.videoUrl && (
                      <button
                        onClick={() => onVideoPlay(lesson.videoUrl!, lesson.title)}
                        className="text-indigo-500 hover:text-indigo-700"
                      >
                        <Play size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {course.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t flex gap-3">
          {!enrolled && !certified && (
            <button onClick={onEnroll} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition">
              Enroll Now
            </button>
          )}
          {enrolled && !certified && (
            <button onClick={onQuizStart} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2">
              <Trophy size={16} /> Take Assessment
            </button>
          )}
          {certified && (
            <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-3 rounded-xl font-semibold text-sm">
              <Award size={16} /> Certified ✓
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ProviderTrainingPage() {
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [certifications, setCertifications] = useState<LMSCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'catalog' | 'certs'>('catalog');
  const [selectedCourse, setSelectedCourse] = useState<LMSCourse | null>(null);
  const [quizData, setQuizData] = useState<LMSQuiz | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);
  const [enrolling, _setEnrolling] = useState(false);
  const [search, setSearch] = useState('');

  const certifiedCourseIds = new Set(certifications.map(c => c.courseId));

  // Build locked set: a course is locked if its prerequisite isn't certified
  const lockedCourseIds = new Set(
    courses
      .filter(c => c.prerequisiteId && !certifiedCourseIds.has(c.prerequisiteId))
      .map(c => c.id),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, certsRes] = await Promise.all([
        lmsService.listCourses({ limit: 50 }),
        lmsService.myCertifications(),
      ]);
      // Attach enrollment data
      const enrollments = await lmsService.myEnrollments();
      const enrollMap = new Map(enrollments.map(e => [e.courseId, e]));
      const enriched = (coursesRes.data ?? coursesRes).map((c: LMSCourse) => ({
        ...c,
        enrollment: enrollMap.get(c.id) ?? null,
      }));
      setCourses(enriched);
      setCertifications(certsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStart = async (course: LMSCourse) => {
    const fresh = await lmsService.getCourse(course.id);
    setSelectedCourse({ ...fresh, enrollment: course.enrollment });
  };

  const handleEnroll = async () => {
    if (!selectedCourse) return;
    _setEnrolling(true);
    try {
      await lmsService.enroll(selectedCourse.id);
      await load();
      const updated = courses.find(c => c.id === selectedCourse.id);
      if (updated) setSelectedCourse(prev => prev ? { ...prev, enrollment: updated.enrollment } : null);
    } finally {
      _setEnrolling(false);
    }
  };

  const handleQuizStart = async () => {
    if (!selectedCourse) return;
    try {
      const quiz = await lmsService.getQuiz(selectedCourse.id);
      setQuizData(quiz);
      setShowQuiz(true);
    } catch {
      alert('No quiz available for this course yet. Check back soon.');
    }
  };

  const handleQuizPassed = () => {
    // Refresh data after passing
    load();
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
    setQuizData(null);
    setSelectedCourse(null);
    load();
  };

  const filtered = courses.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-600" /> Provider Training
          </h1>
          <p className="text-gray-500 text-sm mt-1">Complete courses, pass assessments, and earn certifications to unlock higher-tier tasks.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Courses Available</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-indigo-600">{courses.filter(c => c.enrollment).length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Enrolled</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{certifications.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Certifications Earned</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {(['catalog', 'certs'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'catalog' ? 'Course Catalog' : `My Certifications (${certifications.length})`}
            </button>
          ))}
        </div>

        {/* Catalog tab */}
        {tab === 'catalog' && (
          <>
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin text-indigo-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No courses available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    certifiedCourseIds={certifiedCourseIds}
                    lockedCourseIds={lockedCourseIds}
                    onStart={handleStart}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Certifications tab */}
        {tab === 'certs' && (
          <div>
            {certifications.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                <Award size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No certifications yet</p>
                <p className="text-sm mt-1">Complete a course assessment to earn your first certificate.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {certifications.map(cert => (
                  <div key={cert.id} className="bg-white rounded-2xl border shadow-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-bl-full opacity-60" />
                    <div className="relative">
                      <span className="text-3xl mb-3 block">{cert.course?.thumbnailEmoji || '🎓'}</span>
                      <h3 className="font-bold text-gray-900 mb-1">{cert.course?.title}</h3>
                      <p className="text-xs text-gray-500 mb-3">{cert.course?.category} · {cert.course?.level}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                          <Trophy size={14} /> {cert.score}% Score
                        </div>
                        <span className="text-xs text-gray-400">{new Date(cert.issuedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                        <Award size={12} /> Certificate Verified
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course detail modal */}
      {selectedCourse && !showQuiz && (
        <CourseDetailModal
          course={selectedCourse}
          certifiedCourseIds={certifiedCourseIds}
          onClose={() => setSelectedCourse(null)}
          onQuizStart={handleQuizStart}
          onEnroll={handleEnroll}
          onVideoPlay={(url, title) => setVideoModal({ url, title })}
        />
      )}

      {/* Quiz engine */}
      {showQuiz && quizData && selectedCourse && (
        <QuizEngine
          courseId={selectedCourse.id}
          quiz={quizData}
          onClose={handleQuizClose}
          onPassed={handleQuizPassed}
        />
      )}

      {/* Video modal */}
      {videoModal && (
        <VideoModal
          url={videoModal.url}
          title={videoModal.title}
          onClose={() => setVideoModal(null)}
        />
      )}
    </div>
  );
}
