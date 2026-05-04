import api from './api';

export interface LMSCourse {
  id: string;
  title: string;
  description?: string;
  category: string;
  level: string;
  duration: number;
  tags: string[];
  status: string;
  requiredForTier?: string;
  prerequisiteId?: string;
  thumbnailEmoji?: string;
  videoUrl?: string;
  createdById: string;
  createdBy?: { id: string; name: string; avatar?: string };
  lessons?: LMSLesson[];
  enrollment?: LMSEnrollment | null;
  _count?: { lessons: number; enrollments: number };
  createdAt: string;
  updatedAt: string;
}

export interface LMSLesson {
  id: string;
  courseId: string;
  title: string;
  content?: string;
  videoUrl?: string;
  order: number;
  duration: number;
  createdAt: string;
}

export interface LMSEnrollment {
  id: string;
  courseId: string;
  userId: string;
  status: string;
  progress: number;
  completedAt?: string;
  enrolledAt: string;
  updatedAt: string;
  course?: LMSCourse;
}

export interface LMSQuizQuestion {
  id: string;
  question: string;
  options: string[];
  order: number;
  // correctIndex is NOT included in provider-facing responses
}

export interface LMSQuiz {
  id: string;
  courseId: string;
  passingScore: number;
  timeLimitMins: number;
  questions: LMSQuizQuestion[];
  lastAttempt: LMSQuizAttempt | null;
  attemptCount: number;
}

export interface LMSQuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: number[];
  score: number;
  passed: boolean;
  attemptNo: number;
  completedAt: string;
}

export interface LMSCertification {
  id: string;
  userId: string;
  courseId: string;
  score: number;
  issuedAt: string;
  course?: { id: string; title: string; category: string; level: string; thumbnailEmoji?: string };
}

export interface QuizSubmitResult {
  attempt: LMSQuizAttempt;
  certification: LMSCertification | null;
  score: number;
  passed: boolean;
  correctAnswers: number[];
}

export interface TrainingAnalytics {
  courses: {
    id: string;
    title: string;
    category: string;
    level: string;
    thumbnailEmoji?: string;
    requiredForTier?: string;
    enrollments: number;
    certifications: number;
    quizAttempts: number;
    passRate: number | null;
  }[];
  recentAttempts: (LMSQuizAttempt & {
    user: { id: string; name: string; email: string; avatar?: string };
    quiz: { course: { id: string; title: string } };
  })[];
  totalCertifications: number;
}

export const lmsService = {
  async listCourses(params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    search?: string;
  }): Promise<{ data: LMSCourse[]; meta?: unknown }> {
    const { data } = await api.get('/lms', { params });
    return data;
  },

  async getCourse(id: string): Promise<LMSCourse> {
    const { data } = await api.get(`/lms/${id}`);
    return data.data;
  },

  async createCourse(payload: {
    title: string;
    description?: string;
    category: string;
    level?: string;
    duration?: number;
    tags?: string[];
    requiredForTier?: string;
    prerequisiteId?: string;
    thumbnailEmoji?: string;
    videoUrl?: string;
  }): Promise<LMSCourse> {
    const { data } = await api.post('/lms', payload);
    return data.data;
  },

  async updateCourse(id: string, payload: Partial<{
    title: string;
    description: string;
    category: string;
    level: string;
    duration: number;
    tags: string[];
    status: string;
    requiredForTier: string;
    prerequisiteId: string;
    thumbnailEmoji: string;
    videoUrl: string;
  }>): Promise<LMSCourse> {
    const { data } = await api.put(`/lms/${id}`, payload);
    return data.data;
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(`/lms/${id}`);
  },

  async addLesson(courseId: string, payload: {
    title: string;
    content?: string;
    videoUrl?: string;
    order?: number;
    duration?: number;
  }): Promise<LMSLesson> {
    const { data } = await api.post(`/lms/${courseId}/lessons`, payload);
    return data.data;
  },

  async updateLesson(courseId: string, lessonId: string, payload: Partial<{
    title: string;
    content: string;
    videoUrl: string;
    order: number;
    duration: number;
  }>): Promise<LMSLesson> {
    const { data } = await api.put(`/lms/${courseId}/lessons/${lessonId}`, payload);
    return data.data;
  },

  async deleteLesson(courseId: string, lessonId: string): Promise<void> {
    await api.delete(`/lms/${courseId}/lessons/${lessonId}`);
  },

  async enroll(courseId: string): Promise<LMSEnrollment> {
    const { data } = await api.post(`/lms/${courseId}/enroll`);
    return data.data;
  },

  async updateProgress(courseId: string, progress: number): Promise<LMSEnrollment> {
    const { data } = await api.patch(`/lms/${courseId}/progress`, { progress });
    return data.data;
  },

  async myEnrollments(): Promise<LMSEnrollment[]> {
    const { data } = await api.get('/lms/my-enrollments');
    return data.data;
  },

  async allEnrollments(params?: { courseId?: string; status?: string }): Promise<LMSEnrollment[]> {
    const { data } = await api.get('/lms/enrollments', { params });
    return data.data;
  },

  // ── Quiz ──────────────────────────────────────────────────────────────────

  async getQuiz(courseId: string): Promise<LMSQuiz> {
    const { data } = await api.get(`/lms/${courseId}/quiz`);
    return data.data;
  },

  async createQuiz(courseId: string, payload: { passingScore?: number; timeLimitMins?: number }): Promise<LMSQuiz> {
    const { data } = await api.post(`/lms/${courseId}/quiz`, payload);
    return data.data;
  },

  async updateQuiz(courseId: string, payload: { passingScore?: number; timeLimitMins?: number }): Promise<LMSQuiz> {
    const { data } = await api.put(`/lms/${courseId}/quiz`, payload);
    return data.data;
  },

  async addQuestion(courseId: string, payload: {
    question: string;
    options: string[];
    correctIndex: number;
    order?: number;
  }): Promise<LMSQuizQuestion> {
    const { data } = await api.post(`/lms/${courseId}/quiz/questions`, payload);
    return data.data;
  },

  async deleteQuestion(courseId: string, questionId: string): Promise<void> {
    await api.delete(`/lms/${courseId}/quiz/questions/${questionId}`);
  },

  async submitQuiz(courseId: string, answers: number[]): Promise<QuizSubmitResult> {
    const { data } = await api.post(`/lms/${courseId}/quiz/submit`, { answers });
    return data.data;
  },

  // ── Certifications ────────────────────────────────────────────────────────

  async myCertifications(): Promise<LMSCertification[]> {
    const { data } = await api.get('/lms/my-certifications');
    return data.data;
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  async trainingAnalytics(): Promise<TrainingAnalytics> {
    const { data } = await api.get('/lms/admin/analytics');
    return data.data;
  },

  async assignTraining(courseId: string, userIds: string[]): Promise<{ enrolled: number; total: number }> {
    const { data } = await api.post('/lms/admin/assign', { courseId, userIds });
    return data.data;
  },
};
