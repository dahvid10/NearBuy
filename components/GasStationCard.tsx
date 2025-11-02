import React from 'react';
import type { GasStation } from '../types';
import { MapPinIcon, ExternalLinkIcon, StarIcon, GasPumpIcon } from './icons';

interface GasStationCardProps {
  station: GasStation;
}

export const GasStationCard: React.FC<GasStationCardProps> = ({ station }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-md transition-all duration-300 hover:border-orange-500 hover:scale-105">
      <div className="flex justify-between items-start w-full text-left">
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-orange-600 dark:text-orange-400">{station.name}</h3>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
            <MapPinIcon />
            <span className="ml-2">{station.address} - <span className="font-semibold">{station.distance}</span></span>
          </div>
          <div className="flex items-center text-sm text-yellow-500 dark:text-yellow-400 mt-1">
            <StarIcon />
            <span className="ml-2 font-semibold">{station.reviews}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
      
      <div>
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
          <GasPumpIcon />
          <span className="ml-2">Fuel Prices</span>
        </h4>
        <ul className="space-y-2">
          {station.prices.map((p, index) => (
            <li key={index} className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-900/50">
              <span className="font-medium text-gray-800 dark:text-gray-200">{p.grade}</span>
              <span className="font-mono text-lg font-bold text-green-600 dark:text-green-400">${p.price.toFixed(3)}</span>
            </li>
          ))}
        </ul>
      </div>

      {station.url && (
         <div className="mt-6 text-right">
            <a
            href={station.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
            <ExternalLinkIcon />
            <span className="ml-2">View on Map</span>
            </a>
        </div>
      )}
    </div>
  );
};
