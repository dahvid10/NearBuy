import React, { useState, useCallback, ChangeEvent, useMemo } from 'react';
import { SearchIcon, SaveIcon, FolderOpenIcon, TrashIcon, SparklesIcon, UploadIcon, GasPumpIcon, ShareIcon, CheckCircleIcon } from './icons';
import type { SavedList } from '../types';
import { generateListFromMedia } from '../services/geminiService';

interface ShoppingListInputProps {
  shoppingList: string;
  setShoppingList: (list: string) => void;
  onSearch: () => void;
  onGasSearch: () => void;
  isLoading: boolean;
  savedLists: SavedList[];
  onSave: (name: string, content: string) => void;
  onDelete: (id: string) => void;
  isOnline: boolean;
  isLocationDenied: boolean;
  startLocation: string;
  setStartLocation: (location: string) => void;
}

const fileToBase64 = (file: File): Promise<{ mimeType: string, data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve({ mimeType: file.type, data: base64Data });
    };
    reader.onerror = error => reject(error);
  });
};

export const ShoppingListInput: React.FC<ShoppingListInputProps> = ({
  shoppingList,
  setShoppingList,
  onSearch,
  onGasSearch,
  isLoading,
  savedLists,
  onSave,
  onDelete,
  isOnline,
  isLocationDenied,
  startLocation,
  setStartLocation,
}) => {
  const [listName, setListName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [copiedListId, setCopiedListId] = useState<string | null>(null);

  const handleSave = () => {
    onSave(listName, shoppingList);
    setListName('');
  };
  
  const handleShareList = async (list: SavedList) => {
    const shareText = `Shopping List: ${list.name}\n\n${list.content}`;
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Shopping List: ${list.name}`,
                text: shareText,
            });
        } catch (error) {
            console.error('Error sharing list:', error);
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            setCopiedListId(list.id);
            setTimeout(() => setCopiedListId(null), 2000);
        } catch (err) {
            console.error('Failed to copy list to clipboard:', err);
            alert('Failed to copy list to clipboard.');
        }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateList = useCallback(async () => {
    setIsExtracting(true);
    setExtractionError(null);
    try {
      let prompt = '';
      let image;
      const sourceText = shoppingList.trim();

      if (imageFile) {
        prompt = `You are an expert at optical character recognition (OCR) and analyzing images. From the provided image, extract all grocery items. Use the user's text as additional context: "${sourceText}".\n\nFormat the output as a simple, one-item-per-line shopping list. IMPORTANT: Your entire response must contain *only* the list items, one per line. Do not add any headers, introductory text, markdown formatting, or concluding remarks.`;
        image = await fileToBase64(imageFile);
      } else if (sourceText) {
        prompt = `You are an intelligent shopping assistant. The user has provided an idea. Generate a comprehensive shopping list of all the items needed. Include realistic quantities where helpful. User Input:\n\n${sourceText}\n\nFormat the output as a simple, one-item-per-line list. IMPORTANT: Your entire response must contain *only* the list items, one per line. Do not add any headers, introductory text, markdown formatting, or concluding remarks.`;
      } else {
         setExtractionError("Please provide some text or an image to generate a list from.");
         setIsExtracting(false);
        return;
      }
      
      const extractedList = await generateListFromMedia(prompt, image);
      setShoppingList(extractedList);
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      if (err instanceof Error) {
        setExtractionError(err.message);
      } else {
        setExtractionError('An unknown error occurred during extraction.');
      }
    } finally {
      setIsExtracting(false);
    }
  }, [shoppingList, imageFile, setShoppingList]);

  const searchButtonTitle = () => {
    if (!isOnline) return "You must be online to search for stores.";
    if (isLocationDenied && !startLocation.trim()) return "Location access is denied. Enter a location manually or enable browser permissions.";
    if (!shoppingList.trim()) return "Enter items in your shopping list to search.";
    return "Find best prices for your list";
  }
  
  const isActionable = !isLoading && !isExtracting;
  
  const listItems = useMemo(() => shoppingList.split('\n').filter(line => line.trim() !== ''), [shoppingList]);

  const handleRemoveItem = (indexToRemove: number) => {
    const newList = shoppingList.split('\n').filter((_, index) => index !== indexToRemove).join('\n');
    setShoppingList(newList);
  };
  
  const isSearchDisabled = isLoading || isExtracting || !shoppingList.trim() || !isOnline || (isLocationDenied && !startLocation.trim());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2 text-green-600 dark:text-green-400">Your Shopping List</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">Type your list directly, or describe an idea to generate one with AI.</p>
        
        <textarea
            className="w-full h-48 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md p-3 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition duration-200 resize-none"
            placeholder="e.g.&#10;1 gallon of milk&#10;...or an idea like:&#10;'Host a backyard BBQ for 10 people'&#10;'Set up a home office'"
            value={shoppingList}
            onChange={(e) => setShoppingList(e.target.value)}
            disabled={!isActionable}
        />
        
        {listItems.length > 0 && (
            <div className="mt-4">
                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Edit Items</h3>
                <div className="bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                    {listItems.map((item, index) => (
                        <li key={index} className="flex items-center justify-between text-gray-800 dark:text-gray-300 p-2 rounded-md group hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors list-none">
                            <span className="flex-grow pr-2 break-words">{item}</span>
                            <button 
                                onClick={() => handleRemoveItem(index)}
                                className="opacity-0 group-hover:opacity-100 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-opacity flex-shrink-0"
                                aria-label={`Remove ${item}`}
                                title="Remove Item"
                            >
                                <TrashIcon />
                            </button>
                        </li>
                    ))}
                </div>
            </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold text-center text-gray-700 dark:text-gray-300 mb-3">Generate with AI</h3>
        <div className="space-y-3">
          <div>
              <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={!isActionable} />
              <label htmlFor="image-upload" className="cursor-pointer w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 px-4 rounded-lg transition duration-300">
                  <UploadIcon />
                  <span className="ml-2">{imageFile ? imageFile.name : 'Upload an Image (Optional)'}</span>
              </label>
              {imagePreview && <img src={imagePreview} alt="Preview" className="mt-4 rounded-lg max-h-40 w-auto mx-auto" />}
          </div>
          
          <button
              onClick={handleGenerateList}
              disabled={!isActionable || (!shoppingList.trim() && !imageFile)}
              className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
          >
              {isExtracting ? (
                  <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Generating...
                  </>
              ) : (
                  <>
                      <SparklesIcon />
                      <span className="ml-2">Generate List</span>
                  </>
              )}
          </button>
          {extractionError && <p className="text-sm text-red-500 dark:text-red-400 mt-2 text-center">{extractionError}</p>}
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="location-input" className="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Starting Location <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(Optional)</span>
        </label>
        <p className="text-gray-500 dark:text-gray-400 mb-2 text-xs">
            Enter a location to search from there. If left empty, we'll use your browser's location.
        </p>
        <input
            id="location-input"
            type="text"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            placeholder="e.g., 1 Infinite Loop, Cupertino, or 'Statue of Liberty'"
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md p-3 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            disabled={!isActionable}
            aria-describedby="location-help"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onSearch}
          disabled={isSearchDisabled}
          title={searchButtonTitle()}
          className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </>
          ) : (
            <>
              <SearchIcon />
              <span className="ml-2">Find Shopping Prices</span>
            </>
          )}
        </button>
        <button
          onClick={onGasSearch}
          disabled={isLoading || isExtracting || !isOnline}
          title={!isOnline ? "You must be online to search." : "Find best gas prices nearby"}
          className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
        >
           {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </>
          ) : (
            <>
              <GasPumpIcon />
              <span className="ml-2">Find Gas Prices</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">Manage Lists</h3>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="Name current list to save..."
            className="flex-grow bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!isActionable || !shoppingList.trim()}
          />
          <button
            onClick={handleSave}
            disabled={!isActionable || !shoppingList.trim() || !listName.trim()}
            className="flex-shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            title="Save list"
          >
            <SaveIcon />
          </button>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          {savedLists.length > 0 ? (
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {savedLists.map((list) => (
                <li key={list.id} className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded-md group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-gray-800 dark:text-gray-300 truncate pr-2">{list.name}</span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => setShoppingList(list.content)}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition"
                      aria-label={`Load list ${list.name}`}
                      title="Load List"
                    >
                      <FolderOpenIcon />
                    </button>
                    <button
                      onClick={() => handleShareList(list)}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition"
                      aria-label={`Share list ${list.name}`}
                      title={copiedListId === list.id ? 'Copied!' : (navigator.share ? 'Share List' : 'Copy List')}
                    >
                      {copiedListId === list.id ? <CheckCircleIcon className="h-5 w-5 text-green-500" /> : <ShareIcon />}
                    </button>
                    <button
                      onClick={() => onDelete(list.id)}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition"
                      aria-label={`Delete list ${list.name}`}
                      title="Delete List"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-500 text-sm text-center py-2">You have no saved lists.</p>
          )}
        </div>
      </div>
    </div>
  );
};