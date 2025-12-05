import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import EmailTemplates from './email-templates';
import {
  EmployeeCredentialsOptions,
  BusinessUserCredentialsOptions,
  RootUserCredentialsOptions,
  PasswordResetOptions,
  EmailVerificationOptions,
} from '../interface/auth.interface';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  private fromEmail = process.env.FROM_EMAIL;

  // GENERIC SEND EMAIL FUNCTION
  sendEmail(to: string, subject: string, text: string, html: string) {
    return this.transporter.sendMail({
      from: this.fromEmail,
      to,
      subject,
      text,
      html,
    });
  }

  // EMPLOYEE CREDENTIALS EMAIL
  sendEmployeeCredentialsEmail(options: EmployeeCredentialsOptions) {
    const template =
      EmailTemplates.generateEmployeeCredentialsTemplate(options);

    return this.sendEmail(
      options.email!,
      template.subject,
      template.text,
      template.html,
    );
  }

  // BUSINESS USER CREDENTIALS EMAIL
  sendBusinessUserCredentialsEmail(options: BusinessUserCredentialsOptions) {
    const template =
      EmailTemplates.generateBusinessUserCredentialsTemplate(options);

    return this.sendEmail(
      options.email!,
      template.subject,
      template.text,
      template.html,
    );
  }
  // ROOT USER CREDENTIALS EMAIL
  sendRootUserCredentialsEmail(options: RootUserCredentialsOptions) {
    const template =
      EmailTemplates.generateRootUserCredentialsTemplate(options);

    return this.sendEmail(
      options.email!,
      template.subject,
      template.text,
      template.html,
    );
  }

  // PASSWORD RESET EMAIL
  sendPasswordResetEmail(options: PasswordResetOptions) {
    const template = EmailTemplates.generatePasswordResetTemplate(options);

    return this.sendEmail(
      options.supportEmail || options.resetUrl, // fallback
      template.subject,
      template.text,
      template.html,
    );
  }
  // EMAIL VERIFICATION EMAIL
  sendEmailVerificationEmail(options: EmailVerificationOptions) {
    const template = EmailTemplates.generateEmailVerificationTemplate(options);

    return this.sendEmail(
      options.verifyUrl,
      template.subject,
      template.text,
      template.html,
    );
  }
}
