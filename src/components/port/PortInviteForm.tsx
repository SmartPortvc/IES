import React from 'react';
import { createPortInvitation } from '../../services/api';
import { sendPortInvitation } from '../../utils/emailService';
import InviteForm from '../forms/InviteForm';

const PortInviteForm: React.FC = () => {
  const handleSubmit = async (data: { portName: string; email: string }) => {
    // Create port invitation in Firestore
    const portId = await createPortInvitation(data.portName, data.email);
    
    // Set the registration link for display
    const link = `${window.location.origin}/port-registration/${portId}`;
    
    let emailSent = false;
    
    // Send invitation email with robust error handling
    try {
      await sendPortInvitation(portId, data.portName, data.email);
      emailSent = true;
    } catch (emailError: any) {
      console.error('Email sending error:', emailError);
      // We'll handle this in the UI by showing the manual link
    }
    
    return { id: portId, link, emailSent };
  };

  return (
    <InviteForm
      title="Invite New Port"
      onSubmit={handleSubmit}
      fields={[
        {
          name: 'portName',
          label: 'Port Name',
          type: 'text',
          required: true
        },
        {
          name: 'email',
          label: 'Port Email',
          type: 'email',
          required: true,
          helpText: 'The invitation will be sent to this email address'
        }
      ]}
      successMessage="Port invitation created successfully!"
      emailSentMessage="An email with registration instructions has been sent to"
    />
  );
};

export default PortInviteForm;