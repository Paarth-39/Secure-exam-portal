const { prisma } = require('../config/db');
const { logger } = require('./logger');

/**
 * Starts a periodic background cron job (running every 60 seconds)
 * to automatically close expired exams and transition active attempts to TIMED_OUT status.
 */
function startExamAutoCloseCron() {
  setInterval(async () => {
    try {
      const now = new Date();

      // Find all published exams where end time has passed
      const expiredExams = await prisma.exam.findMany({
        where: {
          status: 'PUBLISHED',
          endTime: { lt: now }
        },
        select: { id: true, title: true }
      });

      if (expiredExams.length === 0) {
        return;
      }

      const expiredExamIds = expiredExams.map((e) => e.id);

      // Perform updates inside a transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Close Exams
        const examUpdate = await tx.exam.updateMany({
          where: {
            id: { in: expiredExamIds }
          },
          data: {
            status: 'CLOSED'
          }
        });

        // 2. Mark IN_PROGRESS attempts for these closed exams as TIMED_OUT
        const attemptUpdate = await tx.attempt.updateMany({
          where: {
            examId: { in: expiredExamIds },
            status: 'IN_PROGRESS'
          },
          data: {
            status: 'TIMED_OUT',
            submitTime: now
          }
        });

        return {
          examsClosed: examUpdate.count,
          attemptsTimedOut: attemptUpdate.count
        };
      });

      logger.info(
        `[Exam Cron] Closed ${result.examsClosed} expired exams. Marked ${result.attemptsTimedOut} in-progress attempts as TIMED_OUT.`
      );
    } catch (error) {
      logger.error(`[Exam Cron Error]: ${error.message}`);
    }
  }, 60000); // Run every 60 seconds
}

module.exports = {
  startExamAutoCloseCron
};
