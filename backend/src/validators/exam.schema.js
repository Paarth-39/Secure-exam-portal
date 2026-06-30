const { z } = require('zod');

const createExamSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
  subjectId: z.number().int().positive('Subject ID must be a positive integer'),
  duration: z.number().int().min(5, 'Duration must be at least 5 minutes').max(300, 'Duration cannot exceed 300 minutes'),
  totalMarks: z.number().int().positive('Total marks must be positive'),
  startTime: z.string().datetime({ message: 'Invalid start time date-time format' }),
  endTime: z.string().datetime({ message: 'Invalid end time date-time format' })
});

const updateExamSchema = createExamSchema.partial();

const publishExamSchema = z.object({
  examId: z.string().uuid('Invalid exam UUID')
});

const createQuestionSchema = z.object({
  examId: z.string().uuid('Invalid exam UUID'),
  question: z.string().min(5, 'Question text must be at least 5 characters'),
  optionA: z.string().min(1, 'Option A cannot be empty'),
  optionB: z.string().min(1, 'Option B cannot be empty'),
  optionC: z.string().min(1, 'Option C cannot be empty'),
  optionD: z.string().min(1, 'Option D cannot be empty'),
  correctOption: z.enum(['A', 'B', 'C', 'D'], { errorMap: () => ({ message: 'Correct option must be A, B, C, or D' }) }),
  marks: z.number().int().min(1, 'Question marks must be at least 1').default(1)
});

module.exports = {
  createExamSchema,
  updateExamSchema,
  publishExamSchema,
  createQuestionSchema
};
