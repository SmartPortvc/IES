import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, Download, Eye, Trash2, File, Calendar } from 'lucide-react';
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
        <div className="bg-gradient-to-br from-seagreen-50 to-emerald-50 rounded-xl p-6 border-2 border-dashed border-seagreen-300">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-seagreen-100 rounded-lg">
              <Upload className="h-6 w-6 text-seagreen-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload New Document</h3>
              <p className="text-sm text-gray-600">Add important documents related to port operations</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                Document Description
              </label>
              <input
                type="text"
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="block w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-seagreen-500 focus:ring-2 focus:ring-seagreen-200 transition-all sm:text-sm placeholder:text-gray-400"
                placeholder="e.g., Port License Certificate, Safety Compliance Document"
                maxLength={100}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                {uploading ? 'Uploading...' : 'Select & Upload File'}
              </Button>
              <div className="flex items-start gap-2 text-sm text-gray-600 bg-white/60 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                <span>Max 5MB • PDF, DOC, JPEG, PNG supported</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Uploaded Documents</h3>
            <p className="text-sm text-gray-500 mt-1">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'} available
            </p>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No documents yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {readOnly
                ? 'No documents have been uploaded for this port.'
                : 'Upload your first document to get started. All documents are securely stored.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group bg-white rounded-xl border border-gray-200 hover:border-seagreen-300 hover:shadow-md transition-all duration-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-gradient-to-br from-seagreen-50 to-emerald-50 rounded-lg group-hover:from-seagreen-100 group-hover:to-emerald-100 transition-colors">
                        <File className="h-6 w-6 text-seagreen-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                        {doc.fileName}
                      </h4>
                      {doc.message && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{doc.message}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-seagreen-50 hover:bg-seagreen-100 text-seagreen-700 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-seagreen-500 focus:ring-offset-2"
                      title="View document"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">View</span>
                    </a>
                    {!readOnly && onDelete && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        title="Delete document"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;