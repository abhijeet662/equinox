import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listCourses, getCourseById, createCourse, updateCourse, deleteCourse,
  addLesson, updateLesson, deleteLesson,
  enrollCourse, updateProgress, listMyEnrollments, listAllEnrollments,
  createQuiz, updateQuiz, addQuestion, deleteQuestion, getQuiz, submitQuiz,
  myCertifications, trainingAnalytics, assignTraining,
} from '../controllers/lms.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// ── Admin analytics & assignment (static — must be before /:id) ───────────────
router.get('/admin/analytics', authorize('ADMIN'), trainingAnalytics);
router.post('/admin/assign', authorize('ADMIN'), [
  body('courseId').notEmpty(),
  body('userIds').isArray({ min: 1 }),
], validate, assignTraining);

// ── My data ───────────────────────────────────────────────────────────────────
router.get('/my-enrollments', listMyEnrollments);
router.get('/my-certifications', myCertifications);
router.get('/enrollments', authorize('ADMIN'), listAllEnrollments);

// ── Courses ───────────────────────────────────────────────────────────────────
router.get('/', listCourses);
router.get('/:id', [param('id').notEmpty()], validate, getCourseById);

router.post(
  '/',
  authorize('ADMIN'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('level').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    body('duration').optional().isInt({ min: 1 }),
    body('tags').optional().isArray(),
  ],
  validate,
  createCourse,
);

router.put(
  '/:id',
  authorize('ADMIN'),
  [
    param('id').notEmpty(),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    body('level').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  ],
  validate,
  updateCourse,
);

router.delete('/:id', authorize('ADMIN'), [param('id').notEmpty()], validate, deleteCourse);

// ── Lessons ───────────────────────────────────────────────────────────────────
router.post(
  '/:id/lessons',
  authorize('ADMIN'),
  [
    param('id').notEmpty(),
    body('title').trim().notEmpty().withMessage('Lesson title is required'),
    body('order').optional().isInt({ min: 1 }),
    body('duration').optional().isInt({ min: 1 }),
  ],
  validate,
  addLesson,
);

router.put(
  '/:id/lessons/:lessonId',
  authorize('ADMIN'),
  [param('id').notEmpty(), param('lessonId').notEmpty()],
  validate,
  updateLesson,
);

router.delete(
  '/:id/lessons/:lessonId',
  authorize('ADMIN'),
  [param('id').notEmpty(), param('lessonId').notEmpty()],
  validate,
  deleteLesson,
);

// ── Enrollment & progress ─────────────────────────────────────────────────────
router.post('/:id/enroll', [param('id').notEmpty()], validate, enrollCourse);

router.patch(
  '/:id/progress',
  [
    param('id').notEmpty(),
    body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be 0–100'),
  ],
  validate,
  updateProgress,
);

// ── Quiz ──────────────────────────────────────────────────────────────────────
router.get('/:id/quiz', [param('id').notEmpty()], validate, getQuiz);

router.post('/:id/quiz', authorize('ADMIN'), [
  param('id').notEmpty(),
  body('passingScore').optional().isInt({ min: 1, max: 100 }),
  body('timeLimitMins').optional().isInt({ min: 1 }),
], validate, createQuiz);

router.put('/:id/quiz', authorize('ADMIN'), [param('id').notEmpty()], validate, updateQuiz);

router.post('/:id/quiz/questions', authorize('ADMIN'), [
  param('id').notEmpty(),
  body('question').trim().notEmpty(),
  body('options').isArray({ min: 2 }),
  body('correctIndex').isInt({ min: 0 }),
], validate, addQuestion);

router.delete('/:id/quiz/questions/:questionId', authorize('ADMIN'), [
  param('id').notEmpty(),
  param('questionId').notEmpty(),
], validate, deleteQuestion);

router.post('/:id/quiz/submit', [
  param('id').notEmpty(),
  body('answers').isArray({ min: 1 }),
], validate, submitQuiz);

export default router;
