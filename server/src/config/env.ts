import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'flowledger_jwt_super_secret_production_key_2026_operations',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  COMPANY: {
    NAME: process.env.COMPANY_NAME || 'FlowLedger Technologies India Pvt Ltd',
    GST: process.env.COMPANY_GST || '27AABCU9603R1ZM',
    ADDRESS: process.env.COMPANY_ADDRESS || 'Plot 42, Sector 18, Udyog Vihar, Gurugram, Haryana - 122015',
    PHONE: process.env.COMPANY_PHONE || '+91 124 489 7700',
    EMAIL: process.env.COMPANY_EMAIL || 'operations@flowledger.io',
  },
};
