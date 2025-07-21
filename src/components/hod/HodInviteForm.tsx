import React from 'react';
import { createHodInvitation } from '../../services/api';
import { sendHodInvitation } from '../../utils/emailService';
import InviteForm from '../forms/InviteForm';

const HodInviteForm: React.FC = () => {
  const handleSubmit = async (data: { email: string }) => {
    // Create HOD invitation in Firestore
    const hodId = await createHodInvitation(data.email);
    
    // Set the registration link for display
    const link = `${window.location.origin}/hod-registration/${hodId}`;
    
    let emailSent = false;
    
    // Send invitation email with robust error handling
    try {
      await sendHodInvitation(hodId, data.email);
      emailSent = true;
    } catch (emailError: any) {
      console.error('Email sending error:', emailError);
      // We'll handle this in the UI by showing the manual link
    }
    
    return { id: hodId, link, emailSent };
  };

  return (
    <InviteForm
      title="Invite Head of Department (HOD)"
      onSubmit={handleSubmit}
      fields={[
        {
          name: 'email',
          label: 'HOD Email',
          type: 'email',
          required: true,
          helpText: 'The invitation will be sent to this email address'
        }
      ]}
      successMessage="HOD invitation created successfully!"
      emailSentMessage="An email with registration instructions has been sent to"
    />
  );
};

export default HodInviteForm;