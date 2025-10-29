import React, { useState, useRef } from 'react';
import { Mail, Send, AlertCircle, ExternalLink, CheckCircle, Copy, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { createPortInvitation } from '../services/api';
import { sendPortInvitation, validateEmail } from '../utils/emailService';
import Card from './ui/Card';
import Button from './ui/Button';
import FormField from './ui/FormField';

const InvitePortForm: React.FC = () => {
  const [portName, setPortName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setShowLinkCopied(true);
        toast.success('Registration link copied to clipboard!');
        setTimeout(() => setShowLinkCopied(false), 3000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast.error('Failed to copy link');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the current value from the input field to ensure we have the latest
    const currentEmail = emailRef.current?.value || email;
    
    // Validate inputs before proceeding
    if (!validateEmail(currentEmail)) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (portName.trim().length < 3) {
      setError('Port name must be at least 3 characters long');
      toast.error('Port name must be at least 3 characters long');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    setRegistrationLink('');
    setEmailSent(false);
    setInvitedEmail(currentEmail);

    try {
      // Create port invitation in Firestore
      const portId = await createPortInvitation(portName, currentEmail);
      
      // Set the registration link for display
      const link = `${window.location.origin}/port-registration/${portId}`;
      setRegistrationLink(link);
      
      // Send invitation email with robust error handling
      try {
        await sendPortInvitation(portId, portName, currentEmail);
        toast.success(`Invitation sent successfully to ${currentEmail}!`);
        setEmailSent(true);
      } catch (emailError: any) {
        console.error('Email sending error:', emailError);
        toast.warning(`Invitation created, but email delivery failed. Please use the registration link.`);
        setError(`Email delivery failed. Please use the registration link below to share with the port.`);
      }
      
      // Always show success and registration link, even if email fails
      setSuccess(true);
      setPortName('');
      setEmail('');
    } catch (err: any) {
      console.error('Error inviting port:', err);
      setError(`Failed to create invitation: ${err.message || 'Unknown error'}`);
      toast.error(`Failed to create invitation. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Invite New Port" icon={<Mail className="h-6 w-6 text-seagreen-600" />}>
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">Port invitation created successfully!</p>
              <p className="mt-1 text-sm">
                {emailSent 
                  ? `An email with registration instructions has been sent to ${invitedEmail}.`
                  : "Please share the registration link with the port administrator."}
              </p>
              
              {registrationLink && (
                <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-800 mb-1">Registration Link:</p>
                  <div className="flex items-center">
                    <input 
                      type="text" 
                      value={registrationLink} 
                      readOnly 
                      className="flex-1 text-sm p-2 border border-gray-300 rounded-l-md focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(registrationLink)}
                      className="bg-gray-200 text-gray-700 p-2 hover:bg-gray-300"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                    <a 
                      href={registrationLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-seagreen-600 text-white p-2 rounded-r-md hover:bg-seagreen-700"
                      title="Open link"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                  {showLinkCopied && (
                    <p className="text-xs text-green-600 mt-1">Link copied to clipboard!</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    This link will be valid for 7 days. The port administrator can use it to complete registration.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <FormField
            id="portName"
            label="Port Name"
            required
          >
            <input
              type="text"
              id="portName"
              value={portName}
              onChange={(e) => setPortName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
            />
          </FormField>
        </div>

        <div className="mb-6">
          <FormField
            id="email"
            label="Port Email"
            required
            helpText="The invitation will be sent to this email address"
            icon={<Info className="h-3 w-3 text-seagreen-600" />}
          >
            <input
              type="email"
              id="email"
              ref={emailRef}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
              placeholder="Enter port administrator's email"
            />
          </FormField>
        </div>

        <Button
          type="submit"
          loading={loading}
          icon={<Send className="h-5 w-5" />}
          fullWidth
        >
          Send Invite
        </Button>
      </form>
    </Card>
  );
};

export default InvitePortForm;