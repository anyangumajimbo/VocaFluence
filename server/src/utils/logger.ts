import { createLogger, format, transports } from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.printf(({ level, message, timestamp, stack, requestId, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            const reqId = requestId ? ` [${requestId}]` : '';
            return `${timestamp} [${level.toUpperCase()}]${reqId} ${message} ${metaStr} ${stack || ''}`.trim();
        })
    ),
    defaultMeta: { service: 'vocafluence-api' },
});

// Error logs (file transport)
logger.add(
    new transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        format: format.json(),
    })
);

// Combined logs with daily rotation (keeps 7 days)
logger.add(
    new (transports.File as any)({
        filename: path.join('logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: format.json(),
    })
);

// HTTP request logs with daily rotation (keeps 14 days)
logger.add(
    new (transports.File as any)({
        filename: path.join('logs', 'http-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: format.combine(
            format.timestamp(),
            format.json()
        ),
    })
);

// Console output for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(({ level, message, timestamp, requestId, ...meta }) => {
                    const reqId = requestId ? ` [${requestId}]` : '';
                    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                    return `${timestamp} ${level}${reqId}: ${message}${metaStr}`;
                })
            ),
        })
    );
}

export default logger; 