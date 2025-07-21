import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../ui/Button';
import { PortDocument } from '../../types';

interface DocumentUploadProps {
  onUpload: (file: File, message: string) => Promise<void>;
  documents: PortDocument[];
  onDelete?: (documentId: string) => Promise<void>;
  readOnly?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  documents,
  onDelete,
  readOnly = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, JPEG, PNG, or DOC files.');
      return;
    }

    try {
      setUploading(true);
      await onUpload(file, message);
      setMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!onDelete) return;
    
    try {
      await onDelete(documentId);
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Document</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Document Description
              </label>
              <input
                type="text"
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-seagreen-500 focus:ring-seagreen-500 sm:text-sm"
                placeholder="Enter a brief description for this document"
                maxLength={100}
              />
            </div>

            <div className="flex items-center space-x-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                loading={uploading}
                icon={<Upload className="h-4 w-4" />}
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
              <p className="text-sm text-gray-500">
                Max file size: 5MB. Supported formats: PDF, DOC, JPEG, PNG
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Uploaded Documents</h3>
          <p className="mt-1 text-sm text-gray-500">
            List of all documents uploaded for this port
          </p>
        </div>

        {documents.length === 0 ? (
          <div className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              {readOnly 
                ? 'No documents have been uploaded yet.' 
                : 'Get started by uploading your first document.'}
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <li key={doc.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <FileText className="h-8 w-8 text-seagreen-600 flex-shrink-0" />
                    <div className="ml-4 min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-sm text-gray-500">{doc.message}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Uploaded on {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-seagreen-700 bg-seagreen-100 hover:bg-seagreen-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-seagreen-500"
                    >
                      View
                    </a>
                    {!readOnly && onDelete && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;