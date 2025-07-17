import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { User, IUser } from '../models/User';

export class ReminderService {
    private static transporter: nodemailer.Transporter;

    static initialize() {
        // Initialize email transporter
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Schedule daily reminder check at 9 AM
        cron.schedule('0 9 * * *', () => {
            this.checkAndSendReminders();
        }, {
            timezone: 'UTC'
        });

        console.log('✅ Reminder service initialized');
    }

    static async sendReminder(userId: string, message: string): Promise<void> {
        try {
            // TODO: Implement actual email sending logic
            // For now, just log the reminder
            console.log(`Reminder sent to user ${userId}: ${message}`);

            // Update user's last reminder timestamp
            await User.findByIdAndUpdate(userId, {
                lastReminder: new Date()
            });
        } catch (error) {
            console.error('Error sending reminder:', error);
        }
    }

    static async sendCustomReminder(userId: string, message: string): Promise<void> {
        try {
            // TODO: Implement actual email sending logic
            console.log(`Custom reminder sent to user ${userId}: ${message}`);

            // Update user's last reminder timestamp
            await User.findByIdAndUpdate(userId, {
                lastReminder: new Date()
            });
        } catch (error) {
            console.error('Error sending custom reminder:', error);
        }
    }

    static async checkAndSendReminders(): Promise<void> {
        try {
            // Get users with enabled reminders
            const users = await User.find({
                'reminderSettings.enabled': true
            }) as unknown as IUser[];

            const now = new Date();

            for (const user of users) {
                const u = user as IUser;
                const settings = u.reminderSettings;
                if (!settings) continue;

                // Check if it's time to send reminder
                const [hours, minutes] = settings.time.split(':');
                const reminderTime = new Date();
                reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                // Check if reminder is due (within 1 minute)
                const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
                if (timeDiff <= 60000) { // Within 1 minute
                    await this.sendReminder(
                        u._id.toString(),
                        'Time for your daily practice session!'
                    );
                }
            }
        } catch (error) {
            console.error('Error checking reminders:', error);
        }
    }
}

export const initializeReminderService = () => {
    ReminderService.initialize();
};

export default ReminderService; 