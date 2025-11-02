import React, { useState } from 'react';
import { XIcon, MailIcon } from './icons';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, email }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500); // Reset after 2.5 seconds
    } catch (err) {
      console.error('Failed to copy email: ', err);
      // In a real app, you might show an error toast here.
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity" role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-gray-300 dark:border-gray-700 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 id="feedback-modal-title" className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
            <MailIcon />
            <span className="ml-2">Send Feedback</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white" aria-label="Close">
            <XIcon />
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We'd love to hear your thoughts! Please copy our email address and send us your feedback.
        </p>
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3">
          <span className="flex-grow text-gray-700 dark:text-gray-300 truncate font-mono">{email}</span>
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 w-28 text-center ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? 'Copied!' : 'Copy Email'}
          </button>
        </div>
        <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              Close
            </button>
        </div>
      </div>
    </div>
  );
};
