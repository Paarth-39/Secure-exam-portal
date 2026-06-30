const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// Setup transporter from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Sends an email using a specified HTML template.
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.templateName - Name of the template (without .html extension)
 * @param {object} params.variables - Object of variable substitutions
 */
async function sendEmail({ to, subject, templateName, variables }) {
  try {
    const templatePath = path.join(__dirname, '../../email/templates', `${templateName}.html`);
    
    // Ensure template directory and file exist. Create a simple default if missing to avoid crashes.
    if (!fs.existsSync(templatePath)) {
      const templateDir = path.dirname(templatePath);
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
      }
      // Create a default placeholder template
      const fallbackContent = `<html><body><h1>Notification</h1><p>Message details matching template: ${templateName}</p></body></html>`;
      fs.writeFileSync(templatePath, fallbackContent, 'utf-8');
    }

    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Replace {{VARIABLE}} placeholders
    if (variables && typeof variables === 'object') {
      Object.keys(variables).forEach((key) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(placeholder, variables[key] || '');
      });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@secureexam.dev',
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}: MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    // Do not throw the error to prevent caller requests from crashing.
    return null;
  }
}

module.exports = {
  sendEmail,
  transporter
};
