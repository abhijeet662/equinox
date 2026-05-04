import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';
import type { CourseStatus, EnrollmentStatus } from '@prisma/client';

// ─── NOTIFICATIONS HELPER ─────────────────────────────────────────────────────

async function notify(userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO') {
  await prisma.notification.create({ data: { userId, title, message, type } });
}

// ─── LIST COURSES ─────────────────────────────────────────────────────────────

export const listCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', category, status, search } = req.query as {
    page?: string; limit?: string; category?: string; status?: CourseStatus; search?: string;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));

  const where = {
    // Non-admins see only published courses
    ...(req.user!.role !== 'ADMIN' && { status: 'PUBLISHED' as CourseStatus }),
    ...(status && req.user!.role === 'ADMIN' && { status }),
    ...(category && { category }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { tags: { has: search } },
      ],
    }),
  };

  try {
    const [courses, total] = await Promise.all([
      prisma.lMSCourse.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, avatar: true } },
          _count: { select: { lessons: true, enrollments: true } },
        },
      }),
      prisma.lMSCourse.count({ where }),
    ]);

    sendSuccess(res, courses, 'Courses fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listCourses error:', err);
    sendError(res, 'Failed to fetch courses', 500);
  }
};

// ─── GET COURSE BY ID ─────────────────────────────────────────────────────────

export const getCourseById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const course = await prisma.lMSCourse.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        lessons: { orderBy: { order: 'asc' } },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      sendError(res, 'Course not found', 404);
      return;
    }

    // Check if current user is enrolled
    const enrollment = await prisma.lMSEnrollment.findUnique({
      where: { courseId_userId: { courseId: id, userId: req.user!.id } },
    });

    sendSuccess(res, { ...course, enrollment: enrollment || null });
  } catch {
    sendError(res, 'Failed to fetch course', 500);
  }
};

// ─── CREATE COURSE (ADMIN) ────────────────────────────────────────────────────

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, category, level, duration, tags, requiredForTier, prerequisiteId, thumbnailEmoji, videoUrl } = req.body as {
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
  };

  const createdById = req.user!.id;

  try {
    const course = await prisma.lMSCourse.create({
      data: {
        title,
        description,
        category,
        level: level || 'BEGINNER',
        duration: duration || 60,
        tags: tags || [],
        status: 'DRAFT',
        createdById,
        requiredForTier,
        prerequisiteId,
        thumbnailEmoji,
        videoUrl,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    sendSuccess(res, course, 'Course created', 201);
  } catch (err) {
    console.error('createCourse error:', err);
    sendError(res, 'Failed to create course', 500);
  }
};

// ─── UPDATE COURSE (ADMIN) ────────────────────────────────────────────────────

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { title, description, category, level, duration, tags, status, requiredForTier, prerequisiteId, thumbnailEmoji, videoUrl } = req.body as {
    title?: string;
    description?: string;
    category?: string;
    level?: string;
    duration?: number;
    tags?: string[];
    status?: CourseStatus;
    requiredForTier?: string;
    prerequisiteId?: string;
    thumbnailEmoji?: string;
    videoUrl?: string;
  };

  try {
    const course = await prisma.lMSCourse.update({
      where: { id },
      data: { title, description, category, level, duration, tags, status, requiredForTier, prerequisiteId, thumbnailEmoji, videoUrl },
    });

    sendSuccess(res, course, 'Course updated');
  } catch {
    sendError(res, 'Failed to update course', 500);
  }
};

// ─── DELETE COURSE (ADMIN) ────────────────────────────────────────────────────

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    await prisma.lMSCourse.delete({ where: { id } });
    sendSuccess(res, null, 'Course deleted');
  } catch {
    sendError(res, 'Failed to delete course', 500);
  }
};

// ─── ADD LESSON (ADMIN) ───────────────────────────────────────────────────────

export const addLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: courseId } = req.params as Record<string, string>;
  const { title, content, videoUrl, order, duration } = req.body as {
    title: string;
    content?: string;
    videoUrl?: string;
    order?: number;
    duration?: number;
  };

  try {
    // Auto-assign order if not provided
    let lessonOrder = order;
    if (lessonOrder === undefined) {
      const count = await prisma.lMSLesson.count({ where: { courseId } });
      lessonOrder = count + 1;
    }

    const lesson = await prisma.lMSLesson.create({
      data: { courseId, title, content, videoUrl, order: lessonOrder, duration: duration || 10 },
    });

    sendSuccess(res, lesson, 'Lesson added', 201);
  } catch (err) {
    console.error('addLesson error:', err);
    sendError(res, 'Failed to add lesson', 500);
  }
};

// ─── UPDATE LESSON ────────────────────────────────────────────────────────────

export const updateLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const { lessonId } = req.params as Record<string, string>;
  const { title, content, videoUrl, order, duration } = req.body as {
    title?: string;
    content?: string;
    videoUrl?: string;
    order?: number;
    duration?: number;
  };

  try {
    const lesson = await prisma.lMSLesson.update({
      where: { id: lessonId },
      data: { title, content, videoUrl, order, duration },
    });

    sendSuccess(res, lesson, 'Lesson updated');
  } catch {
    sendError(res, 'Failed to update lesson', 500);
  }
};

// ─── DELETE LESSON ────────────────────────────────────────────────────────────

export const deleteLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const { lessonId } = req.params as Record<string, string>;

  try {
    await prisma.lMSLesson.delete({ where: { id: lessonId } });
    sendSuccess(res, null, 'Lesson deleted');
  } catch {
    sendError(res, 'Failed to delete lesson', 500);
  }
};

// ─── ENROLL IN COURSE ─────────────────────────────────────────────────────────

export const enrollCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: courseId } = req.params as Record<string, string>;
  const userId = req.user!.id;

  try {
    const course = await prisma.lMSCourse.findUnique({ where: { id: courseId } });
    if (!course || course.status !== 'PUBLISHED') {
      sendError(res, 'Course not available for enrollment', 404);
      return;
    }

    const enrollment = await prisma.lMSEnrollment.upsert({
      where: { courseId_userId: { courseId, userId } },
      update: {},
      create: { courseId, userId, status: 'ENROLLED', progress: 0 },
    });

    sendSuccess(res, enrollment, 'Enrolled successfully', 201);
  } catch (err) {
    console.error('enrollCourse error:', err);
    sendError(res, 'Failed to enroll in course', 500);
  }
};

// ─── UPDATE PROGRESS ──────────────────────────────────────────────────────────

export const updateProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: courseId } = req.params as Record<string, string>;
  const { progress } = req.body as { progress: number };
  const userId = req.user!.id;

  if (progress < 0 || progress > 100) {
    sendError(res, 'Progress must be between 0 and 100', 400);
    return;
  }

  try {
    const enrollment = await prisma.lMSEnrollment.update({
      where: { courseId_userId: { courseId, userId } },
      data: {
        progress,
        status: progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'ENROLLED',
        ...(progress >= 100 && { completedAt: new Date() }),
      },
    });

    sendSuccess(res, enrollment, 'Progress updated');
  } catch {
    sendError(res, 'Failed to update progress', 500);
  }
};

// ─── LIST MY ENROLLMENTS ──────────────────────────────────────────────────────

export const listMyEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const enrollments = await prisma.lMSEnrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          include: {
            createdBy: { select: { id: true, name: true } },
            _count: { select: { lessons: true } },
          },
        },
      },
    });

    sendSuccess(res, enrollments, 'Enrollments fetched');
  } catch {
    sendError(res, 'Failed to fetch enrollments', 500);
  }
};

// ─── ADMIN: LIST ALL ENROLLMENTS ──────────────────────────────────────────────

export const listAllEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId, status } = req.query as { courseId?: string; status?: EnrollmentStatus };

  try {
    const enrollments = await prisma.lMSEnrollment.findMany({
      where: {
        ...(courseId && { courseId }),
        ...(status && { status }),
      },
      orderBy: { enrolledAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, category: true } },
      },
    });

    sendSuccess(res, enrollments, 'All enrollments fetched');
  } catch {
    sendError(res, 'Failed to fetch enrollments', 500);
  }
};

// ─── QUIZ: CREATE (ADMIN) ─────────────────────────────────────────────────────

export const createQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: courseId } = req.params as Record<string, string>;
  const { passingScore, timeLimitMins } = req.body as { passingScore?: number; timeLimitMins?: number };

  try {
    const course = await prisma.lMSCourse.findUnique({ where: { id: courseId } });
    if (!course) { sendError(res, 'Course not found', 404); return; }

    const existing = await prisma.lMSQuiz.findUnique({ where: { courseId } });
    if (existing) { sendError(res, 'Quiz already exists for this course', 400); return; }

    const quiz = await prisma.lMSQuiz.create({
      data: { courseId, passingScore: passingScore ?? 80, timeLimitMins: timeLimitMins ?? 30 },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    sendSuccess(res, quiz, 'Quiz created', 201);
  } catch (err) {
    console.error('createQuiz error:', err);
    sendError(res, 'Failed to create quiz', 500);
  }
};

// ─── QUIZ: UPDATE (ADMIN) ─────────────────────────────────────────────────────

export const updateQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: courseId } = req.params as Record<string, string>;
  const { passingScore, timeLimitMins } = req.body as { passingScore?: number; timeLimitMins?: number };

  try {
    const quiz = await prisma.lMSQuiz.update({
      where: { courseId },
      data: { passingScore, timeLimitMins },
    });
    sendSuccess(res, quiz, 'Quiz updated');
  } catch {
    sendError(res, 'Failed to update quiz', 500);
  }
};

// ─── QUIZ: ADD QUESTION (ADMIN) ───────────────────────────────────────────────

export const addQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: courseId } = req.params as Record<string, string>;
  const { question, options, correctIndex, order } = req.body as {
    question: string;
    options: string[];
    correctIndex: number;
    order?: number;
  };

  try {
    const quiz = await prisma.lMSQuiz.findUnique({ where: { courseId } });
    if (!quiz) { sendError(res, 'Quiz not found for this course', 404); return; }

    let qOrder = order;
    if (qOrder === undefined) {
      const count = await prisma.lMSQuizQuestion.count({ where: { quizId: quiz.id } });
      qOrder = count + 1;
    }

    const q = await prisma.lMSQuizQuestion.create({
      data: { quizId: quiz.id, question, options, correctIndex, order: qOrder },
    });

    sendSuccess(res, q, 'Question added', 201);
  } catch (err) {
    console.error('addQuestion error:', err);
    sendError(res, 'Failed to add question', 500);
  }
};

// ─── QUIZ: DELETE QUESTION (ADMIN) ────────────────────────────────────────────

export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  const { questionId } = req.params as Record<string, string>;

  try {
    await prisma.lMSQuizQuestion.delete({ where: { id: questionId } });
    sendSuccess(res, null, 'Question deleted');
  } catch {
    sendError(res, 'Failed to delete question', 500);
  }
};

// ─── QUIZ: GET FOR PROVIDER (no correct answers exposed) ─────────────────────

export const getQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: courseId } = req.params as Record<string, string>;
  const userId = req.user!.id;

  try {
    const quiz = await prisma.lMSQuiz.findUnique({
      where: { courseId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: { id: true, question: true, options: true, order: true },
          // correctIndex intentionally omitted for provider-facing endpoint
        },
      },
    });

    if (!quiz) { sendError(res, 'No quiz for this course', 404); return; }

    // Include previous attempt info for the user
    const lastAttempt = await prisma.lMSQuizAttempt.findFirst({
      where: { quizId: quiz.id, userId },
      orderBy: { completedAt: 'desc' },
    });

    const attemptCount = await prisma.lMSQuizAttempt.count({ where: { quizId: quiz.id, userId } });

    sendSuccess(res, {
      id: quiz.id,
      courseId: quiz.courseId,
      passingScore: quiz.passingScore,
      timeLimitMins: quiz.timeLimitMins,
      questions: quiz.questions,
      lastAttempt,
      attemptCount,
    });
  } catch (err) {
    console.error('getQuiz error:', err);
    sendError(res, 'Failed to fetch quiz', 500);
  }
};

// ─── QUIZ: SUBMIT (server-side scoring) ──────────────────────────────────────

export const submitQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id: courseId } = req.params as Record<string, string>;
  const { answers } = req.body as { answers: number[] };
  const userId = req.user!.id;

  try {
    const quiz = await prisma.lMSQuiz.findUnique({
      where: { courseId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    if (!quiz) { sendError(res, 'No quiz for this course', 404); return; }
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      sendError(res, `Expected ${quiz.questions.length} answers`, 400);
      return;
    }

    // Score
    let correct = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      if (answers[i] === quiz.questions[i].correctIndex) correct++;
    }
    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    const attemptCount = await prisma.lMSQuizAttempt.count({ where: { quizId: quiz.id, userId } });

    const attempt = await prisma.lMSQuizAttempt.create({
      data: {
        quizId: quiz.id,
        userId,
        answers,
        score,
        passed,
        attemptNo: attemptCount + 1,
      },
    });

    // If passed — issue certification and mark enrollment complete
    let certification = null;
    if (passed) {
      certification = await prisma.lMSCertification.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: { score, issuedAt: new Date() },
        create: { userId, courseId, score },
      });

      // Mark enrollment complete
      await prisma.lMSEnrollment.updateMany({
        where: { courseId, userId },
        data: { status: 'COMPLETED', progress: 100, completedAt: new Date() },
      });

      // Notify provider
      const course = await prisma.lMSCourse.findUnique({ where: { id: courseId }, select: { title: true, requiredForTier: true } });
      await notify(
        userId,
        'Certification Earned!',
        `Congratulations! You passed "${course?.title}" with ${score}% and earned your certificate.${course?.requiredForTier ? ` You can now access ${course.requiredForTier} tasks.` : ''}`,
        'SUCCESS',
      );
    } else {
      await notify(
        userId,
        'Quiz Not Passed',
        `You scored ${score}% on this quiz. The passing score is ${quiz.passingScore}%. Review the material and try again.`,
        'WARNING',
      );
    }

    sendSuccess(res, { attempt, certification, score, passed, correctAnswers: quiz.questions.map(q => q.correctIndex) });
  } catch (err) {
    console.error('submitQuiz error:', err);
    sendError(res, 'Failed to submit quiz', 500);
  }
};

// ─── CERTIFICATIONS: MY CERTS ─────────────────────────────────────────────────

export const myCertifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const certs = await prisma.lMSCertification.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      include: {
        course: { select: { id: true, title: true, category: true, level: true, thumbnailEmoji: true } },
      },
    });

    sendSuccess(res, certs, 'Certifications fetched');
  } catch {
    sendError(res, 'Failed to fetch certifications', 500);
  }
};

// ─── ADMIN: TRAINING ANALYTICS ────────────────────────────────────────────────

export const trainingAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [courses, recentAttempts, certCount] = await Promise.all([
      prisma.lMSCourse.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          _count: { select: { enrollments: true, certifications: true } },
          quiz: {
            include: {
              _count: { select: { attempts: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lMSQuizAttempt.findMany({
        orderBy: { completedAt: 'desc' },
        take: 50,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          quiz: { include: { course: { select: { id: true, title: true } } } },
        },
      }),
      prisma.lMSCertification.count(),
    ]);

    const analytics = courses.map(c => {
      const totalAttempts = c.quiz?._count.attempts ?? 0;
      return {
        id: c.id,
        title: c.title,
        category: c.category,
        level: c.level,
        thumbnailEmoji: c.thumbnailEmoji,
        requiredForTier: c.requiredForTier,
        enrollments: c._count.enrollments,
        certifications: c._count.certifications,
        quizAttempts: totalAttempts,
        passRate: totalAttempts > 0
          ? Math.round((c._count.certifications / totalAttempts) * 100)
          : null,
      };
    });

    sendSuccess(res, { courses: analytics, recentAttempts, totalCertifications: certCount });
  } catch (err) {
    console.error('trainingAnalytics error:', err);
    sendError(res, 'Failed to fetch analytics', 500);
  }
};

// ─── ADMIN: ASSIGN MANDATORY TRAINING ────────────────────────────────────────

export const assignTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  const { courseId, userIds } = req.body as { courseId: string; userIds: string[] };

  if (!courseId || !Array.isArray(userIds) || userIds.length === 0) {
    sendError(res, 'courseId and userIds[] are required', 400);
    return;
  }

  try {
    const course = await prisma.lMSCourse.findUnique({ where: { id: courseId }, select: { title: true } });
    if (!course) { sendError(res, 'Course not found', 404); return; }

    const results = await Promise.allSettled(
      userIds.map(async (userId) => {
        await prisma.lMSEnrollment.upsert({
          where: { courseId_userId: { courseId, userId } },
          update: {},
          create: { courseId, userId, status: 'ENROLLED', progress: 0 },
        });
        await notify(userId, 'Mandatory Training Assigned', `You have been enrolled in "${course.title}". Please complete it at your earliest convenience.`, 'WARNING');
      }),
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    sendSuccess(res, { enrolled: succeeded, total: userIds.length }, `Training assigned to ${succeeded} provider(s)`);
  } catch (err) {
    console.error('assignTraining error:', err);
    sendError(res, 'Failed to assign training', 500);
  }
};
