// Email configuration settings
// This file centralizes all email-related configuration

// Default email configuration
const DEFAULT_EMAIL_CONFIG = {
  fromEmail: 'noreply@portmanagementsystem.com',
  adminEmail: 'admin@portmanagementsystem.com',
  supportEmail: 'support@portmanagementsystem.com'
};

// Get email configuration from environment variables with fallbacks
export const getEmailConfig = () => {
  return {
    fromEmail: import.meta.env.VITE_FROM_EMAIL || DEFAULT_EMAIL_CONFIG.fromEmail,
    adminEmail: import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_EMAIL_CONFIG.adminEmail,
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || DEFAULT_EMAIL_CONFIG.supportEmail,
    
    // EmailJS configuration
    emailjsServiceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_1vlur9e',
    emailjsPortTemplateId: import.meta.env.VITE_EMAILJS_PORT_TEMPLATE_ID || 'template_nbrzfkw',
    emailjsHodTemplateId: import.meta.env.VITE_EMAILJS_HOD_TEMPLATE_ID || 'template_hok5oeg',
    emailjsPublicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '_73a1tNBXF5YSuwzh'
  };
};

// Get invitation link expiration in days
export const getInvitationExpiryDays = (): number => {
  return parseInt(import.meta.env.VITE_INVITATION_EXPIRY_DAYS || '7', 10);
};