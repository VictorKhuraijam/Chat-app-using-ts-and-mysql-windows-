import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?:  'default';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',

}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Title */}
        <h3 className="text-lg font-medium text-gray-900 mb-4 pr-8">
          {title}
        </h3>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant='primary'
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Usage example:
// <ConfirmationDialog
//   isOpen={showDeleteConfirm}
//   onClose={() => setShowDeleteConfirm(false)}
//   onConfirm={handleDeleteConversation}
//   title="Delete Conversation"
//   message={`Are you sure you want to delete this entire conversation with ${selectedUser?.username}? This action cannot be undone.`}
//   confirmText="Delete Conversation"
//   cancelText="Cancel"
//   variant="destructive"
// />
