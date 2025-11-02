import React from 'react';
import { HistoryIcon, XIcon } from './icons';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const changelogData = [
  {
    version: '1.1.1',
    date: 'Current Version',
    changes: {
      'Bug Fixes': [
        'Resolved an issue preventing the theme (dark/light mode) from switching correctly due to a script loading order problem.',
      ],
    }
  },
  {
    version: '1.1.0',
    date: 'September 8, 2023',
    changes: {
      'New Features': [
        'Added a Changelog modal to view version history.',
      ],
      'Bug Fixes': [
        'Fixed an issue where the "Send Feedback" link may not work on all devices by opening it in a new tab.',
      ],
    }
  },
  {
    version: '1.0.0',
    date: 'September 1, 2023',
    changes: {
      'New Features': [
        'Initial release of Near Buy!',
        'Generate shopping lists from ideas or text.',
        'Find local store options and prices for your shopping list.',
        'Find local gas prices.',
        'Generate optimal, cost-effective shopping routes.',
        'Create and manage custom shopping routes.',
        'Save and load shopping lists for future use.',
        'Shopping Run mode to track items as you shop.',
        'Light and Dark theme support.',
      ],
    }
  }
];

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity" role="dialog" aria-modal="true" aria-labelledby="changelog-title">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 border border-gray-300 dark:border-gray-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="changelog-title" className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
            <HistoryIcon />
            <span className="ml-2">Version History</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white" aria-label="Close">
            <XIcon />
          </button>
        </div>
        <div className="overflow-y-auto space-y-8 pr-2">
          {changelogData.map(entry => (
            <div key={entry.version}>
              <div className="flex items-baseline space-x-3">
                <span className="text-xl font-bold text-green-600 dark:text-green-400">v{entry.version}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{entry.date}</span>
              </div>
              <div className="mt-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                {Object.entries(entry.changes).map(([category, items]) => (
                  <div key={category} className="mt-3">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">{category}</h4>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600 dark:text-gray-400">
                      {(items as string[]).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};