import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import emailjs from 'emailjs-com';
import { getEmailConfig, getInvitationExpiryDays } from './emailConfig';

// Get email configuration
const emailConfig = getEmailConfig();

// EmailJS configuration with the provided credentials
const EMAILJS_SERVICE_ID = emailConfig.emailjsServiceId;
const EMAILJS_PORT_TEMPLATE_ID = emailConfig.emailjsPortTemplateId;
const EMAILJS_HOD_TEMPLATE_ID = emailConfig.emailjsHodTemplateId;
const EMAILJS_PUBLIC_KEY = emailConfig.emailjsPublicKey;

// Initialize email service
export const initEmailService = () => {
  try {
    // Initialize EmailJS with the public key
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log("EmailJS service initialized successfully");
  } catch (error) {
    console.error("Failed to initialize EmailJS:", error);
  }
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Send port invitation
export const sendPortInvitation = async (
  portId: string,
  portName: string,
  email: string
): Promise<boolean> => {
  try {
    // Validate email before sending
    if (!validateEmail(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    
    if (!email || email.trim() === '') {
      throw new Error('Email address cannot be empty');
    }
    
    // Generate a unique registration token
    const registrationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);
    
    // Store the token in the port document for verification
    await updateDoc(doc(db, 'ports', portId), {
      registrationToken,
      invitationSentAt: new Date()
    });
    
    // Create the registration link
    const registrationLink = `${window.location.origin}/port-registration/${portId}`;
    
    // Prepare template parameters for EmailJS
    const templateParams = {
      to_email: email,
      to_name: portName,
      registration_link: registrationLink,
      port_name: portName,
      // Add a subject to make it clear this is a port invitation
      subject: `Invitation to Register ${portName} Port`,
      expiry_days: getInvitationExpiryDays()
    };
    
    console.log(`Sending port invitation to: ${email}`);
    
    // Send email using EmailJS with the provided public key
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_PORT_TEMPLATE_ID,
      templateParams
    );
    
    console.log("Invitation email sent successfully to:", email);
    console.log("EmailJS response:", response);
    console.log("Registration link:", registrationLink);
    return true;
  } catch (error) {
    console.error(`Error sending invitation to ${email}:`, error);
    
    // For demo purposes, log the registration link even if EmailJS fails
    console.log("Email sending failed, but registration link was created:", 
      `${window.location.origin}/port-registration/${portId}`);
    
    // Re-throw the error to be handled by the calling function
    throw error;
  }
};

// Send HOD invitation
export const sendHodInvitation = async (
  hodId: string,
  email: string
): Promise<boolean> => {
  try {
    // Validate email before sending
    if (!validateEmail(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    
    if (!email || email.trim() === '') {
      throw new Error('Email address cannot be empty');
    }
    
    // Generate a unique registration token
    const registrationToken = Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);
    
    // Store the token in the HOD document for verification
    await updateDoc(doc(db, 'hods', hodId), {
      registrationToken,
      invitationSentAt: new Date()
    });
    
    // Create the registration link
    const registrationLink = `${window.location.origin}/hod-registration/${hodId}`;
    
    // Prepare template parameters for EmailJS
    const templateParams = {
      to_hod_email: email, // Using to_hod_email as specified
      to_name: "Head of Department",
      registration_link: registrationLink,
      subject: "Invitation to Register as Head of Department",
      expiry_days: getInvitationExpiryDays()
    };
    
    console.log(`Sending HOD invitation to: ${email}`);
    
    // Send email using EmailJS with the provided public key
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_HOD_TEMPLATE_ID,
      templateParams
    );
    
    console.log("HOD invitation email sent successfully to:", email);
    console.log("EmailJS response:", response);
    console.log("HOD registration link:", registrationLink);
    return true;
  } catch (error) {
    console.error(`Error sending HOD invitation to ${email}:`, error);
    
    // For demo purposes, log the registration link even if EmailJS fails
    console.log("Email sending failed, but HOD registration link was created:", 
      `${window.location.origin}/hod-registration/${hodId}`);
    
    // Re-throw the error to be handled by the calling function
    throw error;
  }
};