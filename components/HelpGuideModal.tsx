import React, { useState } from 'react';
import { XIcon, SparklesIcon, SearchIcon, RouteIcon, MapIcon, SaveIcon } from './icons';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tourSteps = [
  {
    icon: <SparklesIcon />,
    title: '1. Create Your List',
    color: 'text-green-600 dark:text-green-400',
    content: (
      <>
        <p className="text-gray-600 dark:text-gray-400">
          Start by creating your shopping list on the "List" tab. You have a few options:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-2 text-gray-600 dark:text-gray-400">
          <li><strong>Type directly:</strong> Just type your items one per line in the text area.</li>
          <li><strong>Generate from an idea:</strong> Type a concept like "Taco night for 4" and click <strong className="text-gray-800 dark:text-gray-200">Generate List</strong>. Our AI will create a detailed list for you.</li>
          <li><strong>Use an image:</strong> Click <strong className="text-gray-800 dark:text-gray-200">Upload an Image</strong> to use a photo of a recipe or a handwritten list, then click <strong className="text-gray-800 dark:text-gray-200">Generate List</strong> to extract the items.</li>
        </ul>
      </>
    )
  },
  {
    icon: <SearchIcon />,
    title: '2. Find Local Prices',
    color: 'text-blue-600 dark:text-blue-400',
    content: (
      <>
        <p className="text-gray-600 dark:text-gray-400">
          Once your list is ready, you can search for local options.
        </p>
        <ul className="list-disc list-inside mt-2 space-y-2 text-gray-600 dark:text-gray-400">
          <li>Click <strong className="text-gray-800 dark:text-gray-200">Find Shopping Prices</strong> to get a comparison of item prices across various local stores.</li>
          <li>Click <strong className="text-gray-800 dark:text-gray-200">Find Gas Prices</strong> to see current fuel prices at nearby gas stations.</li>
          <li>The app will ask for your location. If you deny access, you can manually type a starting location into the input field.</li>
        </ul>
      </>
    )
  },
  {
    icon: <RouteIcon />,
    title: '3. Plan Your Route',
    color: 'text-purple-600 dark:text-purple-400',
    content: (
      <>
        <p className="text-gray-600 dark:text-gray-400">
          After searching, head to the "Options" tab. Here you can:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-2 text-gray-600 dark:text-gray-400">
          <li><strong>Sort results:</strong> Organize stores by price, distance, or reviews.</li>
          <li><strong>Generate Optimal Route:</strong> Let the AI create the most cost-effective, multi-stop route to get all your items.</li>
          <li><strong>Create Custom Route:</strong> Build your own route by selecting which items to buy from each store.</li>
          <li><strong>Swap items:</strong> If an item is cheaper elsewhere, you can easily move it to a different store's list.</li>
        </ul>
      </>
    )
  },
  {
    icon: <MapIcon />,
    title: '4. Execute Your Run',
    color: 'text-orange-500 dark:text-orange-400',
    content: (
      <>
        <p className="text-gray-600 dark:text-gray-400">
          With a route generated, the "Run" tab becomes active. This is your command center for the shopping trip:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-2 text-gray-600 dark:text-gray-400">
          <li><strong>Track Progress:</strong> Use the interactive checklist to check off items as you shop at each location.</li>
          <li><strong>Visualize Route:</strong> Click <strong className="text-gray-800 dark:text-gray-200">Visualize</strong> to open the route in Google Maps, Apple Maps, or Waze for turn-by-turn navigation.</li>
          <li><strong>Share Your Plan:</strong> Click <strong className="text-gray-800 dark:text-gray-200">Share</strong> to send the route details to a friend or family member.</li>
        </ul>
      </>
    )
  },
  {
    icon: <SaveIcon />,
    title: '5. Save Your Work',
    color: 'text-indigo-500 dark:text-indigo-400',
    content: (
      <p className="text-gray-600 dark:text-gray-400">
        Don't lose your progress. You can save both your shopping lists (on the "List" tab) and your search results (on the "Options" tab) for future use.
      </p>
    )
  }
];

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleClose = () => {
    setCurrentStep(0); // Reset for next time
    onClose();
  };

  if (!isOpen) return null;
  
  const activeStep = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity" role="dialog" aria-modal="true" aria-labelledby="help-guide-title">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 border border-gray-300 dark:border-gray-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 id="help-guide-title" className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
            <span className={activeStep.color}>{activeStep.icon}</span>
            <span className="ml-3">{activeStep.title}</span>
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white" aria-label="Close">
            <XIcon />
          </button>
        </div>

        <div className="overflow-y-auto space-y-6 pr-2 flex-grow min-h-[200px]">
          {activeStep.content}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex space-x-2">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-colors ${index === currentStep ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'}`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentStep(s => s - 1)}
              disabled={currentStep === 0}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            {currentStep < tourSteps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(s => s + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Next
              </button>
            ) : (
              <button onClick={handleClose} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};