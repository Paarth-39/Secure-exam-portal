const isProduction = process.env.NODE_ENV === 'production';

function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
}

const logger = {
  info: (message) => {
    console.log(formatMessage('info', message));
  },
  error: (message) => {
    console.error(formatMessage('error', message));
  },
  warn: (message) => {
    console.warn(formatMessage('warn', message));
  },
  debug: (message) => {
    if (!isProduction) {
      console.log(formatMessage('debug', message));
    }
  }
};

module.exports = { logger };
