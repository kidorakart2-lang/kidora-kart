import nodemailer, { type Transporter } from "nodemailer";
import path from "path";
import ejs from "ejs";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const renderFile = promisify(ejs.renderFile) as (
  path: string,
  data: Record<string, unknown>,
) => Promise<string>;

interface EmailTemplateConfig {
  subject: string;
  template: string;
}

const templates: Record<string, EmailTemplateConfig> = {
  passwordReset: {
    subject: "Password Reset OTP",
    template: "password-reset-otp.ejs",
  },
  verifyEmail: {
    subject: "Verify Your Email",
    template: "verify-email.ejs",
  },
  contactEmail: {
    subject: `New Contact Form Submission - ${env.APP_NAME}`,
    template: "contact-email.ejs",
  },
  orderConfirmed: {
    subject: `Your Order is Confirmed! - ${env.APP_NAME}`,
    template: "order-confirmed.ejs",
  },
  paymentFailed: {
    subject: `Payment Failed for Order - ${env.APP_NAME}`,
    template: "payment-failed.ejs",
  },
  orderShipped: {
    subject: `Your Order Has Been Shipped! - ${env.APP_NAME}`,
    template: "order-shipped.ejs",
  },
  orderDelivered: {
    subject: `Your Order Has Been Delivered! - ${env.APP_NAME}`,
    template: "order-delivered.ejs",
  },
  orderCancelled: {
    subject: `Order Cancellation Confirmation - ${env.APP_NAME}`,
    template: "order-cancelled.ejs",
  },
  orderDeliveryOTP: {
    subject: `Your Delivery OTP - ${env.APP_NAME}`,
    template: "order-delivery-otp.ejs",
  },
  refundProcessed: {
    subject: `Refund Processed - ${env.APP_NAME}`,
    template: "refund-processed.ejs",
  },
};

// --- Create Gmail transporter ---
const createTransporter = async (): Promise<Transporter> => {
  if (!env.MY_GMAIL || !env.MY_GMAIL_PASSWORD) {
    throw new Error("Missing Gmail credentials in environment variables");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: env.MY_GMAIL,
      pass: env.MY_GMAIL_PASSWORD,
    },
    connectionTimeout: 20000,
  });

  await transporter.verify();
  return transporter;
};

const renderTemplate = async (
  templateName: string,
  data: Record<string, unknown>,
): Promise<{ subject: string; html: string }> => {
  const template = templates[templateName];
  if (!template) throw new Error(`Template ${templateName} not found`);

  const templatePath = path.join(
    __dirname,
    "..",
    "views",
    "emails",
    template.template,
  );

  const html = await renderFile(templatePath, {
    ...data,
    year: new Date().getFullYear(),
    appName: env.APP_NAME,
    appUrl: env.APP_URL,
  });

  return { subject: template.subject, html };
};

export const sendEmail = async (
  to: string,
  templateName: string,
  data: Record<string, unknown> = {},
): Promise<unknown> => {
  try {
    const transporter = await createTransporter();
    const { subject, html } = await renderTemplate(templateName, data);

    const mailOptions = {
      from: `"${env.APP_NAME}" <${env.MY_GMAIL}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId }, "Email sent");
    return info;
  } catch (error) {
    logger.error({ err: error }, "Error sending email");
    throw error;
  }
};

export const availableTemplates = Object.keys(templates);