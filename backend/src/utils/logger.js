import winston from "winston";

// Write to the process streams so serverless and read-only deployments don't
// need a local logs directory. The hosting platform can collect these records.
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
