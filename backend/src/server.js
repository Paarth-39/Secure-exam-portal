const app = require('./app');
const { logger } = require('./utils/logger');
const { startExamAutoCloseCron } = require('./utils/examCron');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  // Start the background cron job to close expired exams
  startExamAutoCloseCron();
});

