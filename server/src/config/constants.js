import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET
export const SUPABASE_URL = process.env.SUPABASE_URL
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY
export const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY
export const FRONTEND_URL = process.env.FRONTEND_URL
export const PORT = process.env.PORT || 5000
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
export const RESEND_API_KEY = process.env.RESEND_API_KEY
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL