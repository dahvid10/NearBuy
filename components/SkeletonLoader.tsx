
import React from 'react';

const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-md">
    <div className="flex justify-between items-start">
      <div>
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="text-right">
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
    <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
    <div>
      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-3/5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-1/5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-1/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);


export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
};
