-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('STANDUP', 'PLANNING', 'REVIEW', 'RETROSPECTIVE', 'CLIENT', 'ONE_ON_ONE', 'OTHER');

-- CreateEnum
CREATE TYPE "MandateStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfaSecret" TEXT;

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MeetingType" NOT NULL DEFAULT 'OTHER',
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "location" TEXT,
    "agenda" TEXT,
    "mom" TEXT,
    "momGeneratedAt" TIMESTAMP(3),
    "contractId" TEXT,
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendee" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingActionItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMandate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "nextDebitDate" TIMESTAMP(3),
    "status" "MandateStatus" NOT NULL DEFAULT 'PENDING',
    "mandateRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMandate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSCourse" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'BEGINNER',
    "duration" INTEGER NOT NULL DEFAULT 60,
    "tags" TEXT[],
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSLesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "videoUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LMSLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSEnrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Meeting_organizerId_idx" ON "Meeting"("organizerId");

-- CreateIndex
CREATE INDEX "Meeting_status_idx" ON "Meeting"("status");

-- CreateIndex
CREATE INDEX "Meeting_scheduledAt_idx" ON "Meeting"("scheduledAt");

-- CreateIndex
CREATE INDEX "MeetingAttendee_meetingId_idx" ON "MeetingAttendee"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingAttendee_userId_idx" ON "MeetingAttendee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingAttendee_meetingId_userId_key" ON "MeetingAttendee"("meetingId", "userId");

-- CreateIndex
CREATE INDEX "MeetingActionItem_meetingId_idx" ON "MeetingActionItem"("meetingId");

-- CreateIndex
CREATE INDEX "PaymentMandate_userId_idx" ON "PaymentMandate"("userId");

-- CreateIndex
CREATE INDEX "PaymentMandate_status_idx" ON "PaymentMandate"("status");

-- CreateIndex
CREATE INDEX "LMSCourse_category_idx" ON "LMSCourse"("category");

-- CreateIndex
CREATE INDEX "LMSCourse_status_idx" ON "LMSCourse"("status");

-- CreateIndex
CREATE INDEX "LMSLesson_courseId_idx" ON "LMSLesson"("courseId");

-- CreateIndex
CREATE INDEX "LMSEnrollment_userId_idx" ON "LMSEnrollment"("userId");

-- CreateIndex
CREATE INDEX "LMSEnrollment_courseId_idx" ON "LMSEnrollment"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "LMSEnrollment_courseId_userId_key" ON "LMSEnrollment"("courseId", "userId");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendee" ADD CONSTRAINT "MeetingAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActionItem" ADD CONSTRAINT "MeetingActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMandate" ADD CONSTRAINT "PaymentMandate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSCourse" ADD CONSTRAINT "LMSCourse_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSLesson" ADD CONSTRAINT "LMSLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LMSCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSEnrollment" ADD CONSTRAINT "LMSEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "LMSCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSEnrollment" ADD CONSTRAINT "LMSEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
