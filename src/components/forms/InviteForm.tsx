import React, { useState, useRef } from 'react';
import { Mail, Send, AlertCircle, ExternalLink, CheckCircle, Copy, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../ui/Card';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import { validateEmail } from '../../utils/emailService';

interface InviteFormProps {
  title: string;
  onSubmit: (data: any) => Promise<{ id: string; link: string; emailSent: boolean }>;
  fields: {
    name: string;
    label: string;
    type: string;
    required?: boolean;
    helpText?: string;
  }[];
  successMessage: string;
  emailSentMessage: string;
  linkValidityDays?: number;
}

const InviteForm: React.FC<InviteFormProps> = ({
  title,
  onSubmit,
  fields,
  successMessage,
  emailSentMessage,
  linkValidityDays = 7
}) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [registrationLink, setRegistrationLink] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState('');
  const formRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleInputChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

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

  const validateForm = () => {
    // Check required fields
    for (const field of fields) {
      if (field.required && !formValues[field.name]) {
        setError(`${field.label} is required`);
        toast.error(`${field.label} is required`);
        return false;
      }
    }

    // Validate email if present
    const emailField = fields.find(f => f.type === 'email');
    if (emailField && formValues[emailField.name]) {
      if (!validateEmail(formValues[emailField.name])) {
        setError('Please enter a valid email address');
        toast.error('Please enter a valid email address');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    setRegistrationLink('');
    setEmailSent(false);

    // Find email field
    const emailField = fields.find(f => f.type === 'email');
    if (emailField) {
      setInvitedEmail(formValues[emailField.name]);
    }

    try {
      // Submit form data
      const result = await onSubmit(formValues);
      
      // Set the registration link for display
      setRegistrationLink(result.link);
      setEmailSent(result.emailSent);
      
      // Always show success and registration link, even if email fails
      setSuccess(true);
      
      // Reset form
      setFormValues({});
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(`Failed: ${err.message || 'Unknown error'}`);
      toast.error(`Failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={title} icon={<Mail className="h-6 w-6 text-seagreen-600" />}>
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
            <div>
              <p className="font-medium">{successMessage}</p>
              <p className="mt-1 text-sm">
                {emailSent 
                  ? `${emailSentMessage} ${invitedEmail}.`
                  : "Please share the registration link."}
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
                    This link will be valid for {linkValidityDays} days.
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
        <div className="space-y-4">
          {fields.map((field) => (
            <FormField
              key={field.name}
              id={field.name}
              label={field.label}
              required={field.required}
              helpText={field.helpText}
              icon={field.helpText ? <Info className="h-3 w-3 text-seagreen-600" /> : undefined}
            >
              <input
                type={field.type}
                id={field.name}
                ref={(el) => formRefs.current[field.name] = el}
                value={formValues[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                required={field.required}
              />
            </FormField>
          ))}
        </div>

        <div className="mt-6">
          <Button
            type="submit"
            loading={loading}
            icon={<Send className="h-5 w-5" />}
            fullWidth
          >
            Send Invite
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default InviteForm;