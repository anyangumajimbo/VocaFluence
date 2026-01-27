import nodemailer from 'nodemailer';
import logger from '../utils/logger';

export class EmailService {
    private static transporter: nodemailer.Transporter;

    static initialize() {
        // Initialize email transporter
        const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
        const port = parseInt(process.env.EMAIL_PORT || '587', 10);
        const secure = (process.env.EMAIL_SECURE === 'true') || port === 465;
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user,
                pass
            }
        });

        // Log non-sensitive transport details and verify connectivity
        const maskedUser = user ? `${user.slice(0, 2)}***@${user.split('@')[1]}` : 'undefined';
        logger.info(`📧 Email service initializing (host=${host}, port=${port}, secure=${secure}, user=${maskedUser})`);

        // Verify connection (non-blocking)
        this.transporter.verify()
            .then(() => logger.info('✅ Email transporter verified and ready to send'))
            .catch((err) => {
                logger.error('❌ Email transporter verification failed:', err);
                logger.warn('⚠️  Check EMAIL_HOST/PORT/USER/PASS in server/.env and ensure App Password is used.');
            });

        logger.info('✅ Email service initialized');
    }

    /**
     * Send password reset email
     */
    static async sendPasswordResetEmail(
        email: string,
        resetToken: string,
        firstName?: string
    ): Promise<boolean> {
        try {
            // Determine the base URL
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

            const mailOptions = {
                from: `"VocaFluence" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Password Reset Request - VocaFluence',
                html: this.getPasswordResetEmailTemplate(firstName || 'User', resetUrl)
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info('Password reset email sent: %s', info.messageId);
            return true;
        } catch (error) {
            logger.error('Error sending password reset email:', error);
            return false;
        }
    }

    /**
     * Send welcome email
     */
    static async sendWelcomeEmail(
        email: string,
        firstName: string,
        lastName: string
    ): Promise<boolean> {
        try {
            const mailOptions = {
                from: `"VocaFluence" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Welcome to VocaFluence!',
                html: this.getWelcomeEmailTemplate(firstName, lastName)
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info('Welcome email sent: %s', info.messageId);
            return true;
        } catch (error) {
            logger.error('Error sending welcome email:', error);
            return false;
        }
    }

    /**
     * Send practice reminder email
     */
    static async sendPracticeReminder(
        email: string,
        firstName: string
    ): Promise<boolean> {
        try {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

            const mailOptions = {
                from: `"VocaFluence" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Time to Practice! - VocaFluence',
                html: this.getPracticeReminderTemplate(firstName, frontendUrl)
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info('Practice reminder sent: %s', info.messageId);
            return true;
        } catch (error) {
            logger.error('Error sending practice reminder:', error);
            return false;
        }
    }

    /**
     * HTML template for password reset email
     */
    private static getPasswordResetEmailTemplate(firstName: string, resetUrl: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">VocaFluence</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Hi ${firstName},
                            </p>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                We received a request to reset your password for your VocaFluence account. Click the button below to create a new password:
                            </p>
                            
                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 0 0 20px 0;">
                                ${resetUrl}
                            </p>
                            
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                                <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.6;">
                                    <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                                </p>
                            </div>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0;">
                                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                                Best regards,<br>The VocaFluence Team
                            </p>
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                This is an automated email, please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * HTML template for welcome email
     */
    private static getWelcomeEmailTemplate(firstName: string, lastName: string): string {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to VocaFluence</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0;">Welcome to VocaFluence!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0;">Hello ${firstName} ${lastName}!</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                                Thank you for joining VocaFluence. We're excited to help you improve your language fluency!
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${frontendUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Get Started</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * HTML template for practice reminder
     */
    private static getPracticeReminderTemplate(firstName: string, dashboardUrl: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Practice Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="padding: 40px 30px; text-align: center;">
                            <h2 style="color: #333333; margin: 0 0 20px 0;">Hi ${firstName}!</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                                It's time for your daily practice session. Keep your streak going!
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${dashboardUrl}/practice" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Start Practicing</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }
}

export default EmailService;
