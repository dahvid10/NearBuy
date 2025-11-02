import { GoogleGenAI } from "@google/genai";
import type { Store, Coordinates, Item, OptimalRoute, GasStation, GasPrice, SearchResult } from '../types';

const cleanShoppingList = (rawText: string): string => {
  const lines = rawText.trim().split('\n');
  
  const cleanedLines = lines
    .map(line => line.trim())
    // Remove list markers like '-', '*', or '1. '
    .map(line => line.replace(/^(-\s*|\*\s*|\d+\.\s*)/, '').trim())
    .filter(line => {
      const lowerLine = line.toLowerCase();
      if (lowerLine.length === 0) return false;
      // Filter out common introductory/concluding phrases and markdown headers.
      if (lowerLine.startsWith('#')) return false;
      if (lowerLine.startsWith('here is your')) return false;
      if (lowerLine.startsWith('here is the')) return false;
      if (lowerLine.startsWith('sure, here is')) return false;
      if (lowerLine.startsWith('sure thing')) return false;
      if (lowerLine.startsWith('i have created')) return false;
      if (lowerLine.startsWith('based on your')) return false;
      if (lowerLine.startsWith('i hope this helps')) return false;
      if (lowerLine.startsWith('shopping list:')) return false;
      if (lowerLine.startsWith('```')) return false; // remove markdown code fences
      return true;
    });
  
  return cleanedLines.join('\n');
};

function parseSingleStoreBlock(block: string): Store | null {
  try {
    const lines = block.trim().split('\n');
    const name = lines[0]?.trim();
    if (!name) return null;

    const store: Partial<Store> = { name, items: [], type: 'store' };

    let addressMatch = block.match(/\*\*Address:\*\*\s*(.*)/);
    store.address = addressMatch ? addressMatch[1].trim() : "Address not found";
    
    let distanceMatch = block.match(/\*\*Distance:\*\*\s*(.*)/);
    store.distance = distanceMatch ? distanceMatch[1].trim() : "0 miles";

    let reviewsMatch = block.match(/\*\*Reviews:\*\*\s*(.*)/);
    store.reviews = reviewsMatch ? reviewsMatch[1].trim() : "No reviews";

    let subtotalMatch = block.match(/\*\*Subtotal:\*\*\s*\$?([\d,]+\.\d{2})/);
    store.subtotal = subtotalMatch ? parseFloat(subtotalMatch[1].replace(/,/g, '')) : 0;
    
    const itemLines = lines.filter(line => line.trim().startsWith('-'));
    for (const itemLine of itemLines) {
      const itemMatch = itemLine.match(/-\s*(.*?):\s*\$?([\d,]+\.\d{2})/);
      if (itemMatch) {
        const itemName = itemMatch[1].trim();
        const itemPrice = parseFloat(itemMatch[2].replace(/,/g, ''));
        (store.items as Item[]).push({ name: itemName, price: itemPrice });
      }
    }

    if (store.name && store.address && store.distance && store.reviews && store.items && store.items.length > 0) {
      return store as Store;
    }
    return null;
  } catch (e) {
      console.error("Error parsing single store block:", e);
      return null;
  }
}

function parseSingleGasStationBlock(block: string): GasStation | null {
    try {
        const lines = block.trim().split('\n');
        const name = lines[0]?.trim();
        if (!name) return null;

        const station: Partial<GasStation> = { name, type: 'gas', prices: [] };

        let addressMatch = block.match(/\*\*Address:\*\*\s*(.*)/);
        station.address = addressMatch ? addressMatch[1].trim() : "Address not found";
        
        let distanceMatch = block.match(/\*\*Distance:\*\*\s*(.*)/);
        station.distance = distanceMatch ? distanceMatch[1].trim() : "0 miles";

        let reviewsMatch = block.match(/\*\*Reviews:\*\*\s*(.*)/);
        station.reviews = reviewsMatch ? reviewsMatch[1].trim() : "No reviews";
        
        const priceLines = lines.filter(line => line.trim().startsWith('-'));
        for (const priceLine of priceLines) {
            const priceMatch = priceLine.match(/-\s*(.*?):\s*\$?([\d,]+\.\d{2,3})/);
            if (priceMatch) {
                const grade = priceMatch[1].trim();
                const price = parseFloat(priceMatch[2].replace(/,/g, ''));
                (station.prices as GasPrice[]).push({ grade, price });
            }
        }

        if (station.name && station.address && station.distance && station.reviews && station.prices && station.prices.length > 0) {
            return station as GasStation;
        }
        return null;
    } catch(e) {
        console.error("Error parsing gas station block:", e);
        return null;
    }
}

export const findShoppingOptionsStream = async (
  shoppingList: string,
  location: Coordinates | string,
  onResultFound: (result: SearchResult) => void,
  onStreamEnd: (groundingChunks: any[]) => void
): Promise<void> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const locationPreamble = typeof location === 'string'
    ? `at stores near "${location}"`
    : `at nearby stores`;

  const prompt = `You are an expert local shopping assistant. Your goal is to find items from the user's shopping list ${locationPreamble}, providing a rich set of options.

  User's Shopping List:
  ${shoppingList}

  Instructions:
  1.  For **each individual item** on the user's shopping list, you **must find at least three different local store options**.
  2.  The selection of stores should provide the user with meaningful choices based on a balance of price, distance, and store quality/reputation.
  3.  Crucially, ensure you include a mix of store types. This includes large "big-box" retailers like Walmart Supercenter and Target, as well as traditional grocery stores and smaller specialty shops, to provide a comprehensive range of choices.
  4.  Consolidate all findings into a list of stores. If an item is found at a store, list its realistic, estimated price.
  5.  For each store, provide its name, full address, estimated distance from the user's location, and its Google Maps review rating (e.g., '4.5 stars (1,234 reviews)').
  6.  Calculate a subtotal for all the found items at each store.
  7.  Format your entire response *only* using the following markdown structure. Do not add any introductory or concluding text outside of this format. Ensure every item from the original list is present in at least three of the store blocks combined. Stream each store block as soon as you find it.

  ### [Store Name 1]
  **Address:** [Full Store Address]
  **Distance:** [e.g., 1.2 miles]
  **Reviews:** [e.g., 4.5 stars (1,234 reviews)]
  - [Item Name 1]: $[Price]
  - [Item Name 2]: $[Price]
  **Subtotal:** $[Total Price]

  ### [Store Name 2]
  **Address:** [Full Store Address]
  **Distance:** [e.g., 3.5 miles]
  **Reviews:** [e.g., 4.2 stars (876 reviews)]
  - [Item Name 1]: $[Price]
  - [Item Name 3]: $[Price]
  **Subtotal:** $[Total Price]
  `;

  try {
    const modelParams: {
        model: string;
        contents: string;
        config: {
            tools: { googleMaps: {} }[];
            toolConfig?: any;
        }
    } = {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
        }
    };

    if (typeof location !== 'string' && location) {
        modelParams.config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                }
            }
        };
    }
    
    const responseStream = await ai.models.generateContentStream(modelParams);

    let buffer = '';
    let allGroundingChunks: any[] = [];
    
    for await (const chunk of responseStream) {
        buffer += chunk.text;
        
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
            allGroundingChunks.push(...groundingMetadata.groundingChunks);
        }

        const blocks = buffer.split('###');
        if (blocks.length > 1) {
            for (let i = 0; i < blocks.length - 1; i++) {
                const block = blocks[i].trim();
                if (block) {
                    const parsedStore = parseSingleStoreBlock(block);
                    if (parsedStore) onResultFound(parsedStore);
                }
            }
            buffer = blocks[blocks.length - 1];
        }
    }

    if (buffer.trim()) {
        const parsedStore = parseSingleStoreBlock(buffer.trim());
        if (parsedStore) onResultFound(parsedStore);
    }
    
    const uniqueChunks = Array.from(new Map(allGroundingChunks.map(item => [item.maps?.uri, item])).values());
    onStreamEnd(uniqueChunks);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to fetch shopping options from the AI model.");
  }
};

export const findGasPricesStream = async (
  location: Coordinates | string,
  onResultFound: (result: SearchResult) => void,
  onStreamEnd: (groundingChunks: any[]) => void
): Promise<void> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const locationPreamble = typeof location === 'string'
        ? `near "${location}"`
        : `nearby`;
        
    const prompt = `You are an expert local gas price assistant. Your goal is to find current gas prices for several stations within a 15-mile radius ${locationPreamble}.

    Instructions:
    1.  Find at least 5 different gas stations within a 15-mile radius.
    2.  For each station, provide its name, full address, estimated distance from the user's location, and its Google Maps review rating (e.g., '4.5 stars (1,234 reviews)').
    3.  For each station, find the current price per gallon for Regular, Mid-grade, and Premium gasoline. If Diesel prices are available, include them as well. The prices should be realistic and as up-to-date as possible.
    4.  Format your entire response *only* using the following markdown structure. Do not add any introductory or concluding text. Stream each gas station block as soon as you find it.

    ### [Gas Station Name 1]
    **Address:** [Full Store Address]
    **Distance:** [e.g., 1.2 miles]
    **Reviews:** [e.g., 4.5 stars (1,234 reviews)]
    - Regular: $[Price]
    - Mid-grade: $[Price]
    - Premium: $[Price]

    ### [Gas Station Name 2]
    **Address:** [Full Store Address]
    **Distance:** [e.g., 3.5 miles]
    **Reviews:** [e.g., 4.2 stars (876 reviews)]
    - Regular: $[Price]
    - Mid-grade: $[Price]
    - Premium: $[Price]
    - Diesel: $[Price]
    `;

    try {
        const modelParams: {
            model: string;
            contents: string;
            config: {
                tools: { googleMaps: {} }[];
                toolConfig?: any;
            }
        } = {
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
            }
        };

        if (typeof location !== 'string' && location) {
            modelParams.config.toolConfig = {
                retrievalConfig: {
                    latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                    }
                }
            };
        }
        
        const responseStream = await ai.models.generateContentStream(modelParams);

        let buffer = '';
        let allGroundingChunks: any[] = [];
        
        for await (const chunk of responseStream) {
            buffer += chunk.text;
            
            const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
                allGroundingChunks.push(...groundingMetadata.groundingChunks);
            }

            const blocks = buffer.split('###');
            if (blocks.length > 1) {
                for (let i = 0; i < blocks.length - 1; i++) {
                    const block = blocks[i].trim();
                    if (block) {
                        const parsedStation = parseSingleGasStationBlock(block);
                        if (parsedStation) onResultFound(parsedStation);
                    }
                }
                buffer = blocks[blocks.length - 1];
            }
        }

        if (buffer.trim()) {
            const parsedStation = parseSingleGasStationBlock(buffer.trim());
            if (parsedStation) onResultFound(parsedStation);
        }
        
        const uniqueChunks = Array.from(new Map(allGroundingChunks.map(item => [item.maps?.uri, item])).values());
        onStreamEnd(uniqueChunks);

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to fetch gas prices from the AI model.");
  }
};


export const generateOptimalRoute = async (
  stores: Store[],
  shoppingList: string
): Promise<OptimalRoute> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const storeData = stores.map(store => 
    `Store: ${store.name}\nItems:\n${store.items.map(item => `- ${item.name}: $${item.price.toFixed(2)}`).join('\n')}`
  ).join('\n\n');

  const prompt = `You are an expert shopping route optimizer. Given the user's shopping list and a list of nearby stores with available items and prices, create the most efficient multi-stop shopping trip. The goal is to get all items on the list for the lowest possible total cost.

User's Full Shopping List:
${shoppingList}

Available Stores and Items:
${storeData}

Instructions:
1.  Analyze the items available at each store and their prices.
2.  Determine the best combination of stores to visit to acquire all items on the user's list for the minimum total cost. A user might not need to visit every store.
3.  Create a step-by-step route. For each stop, list the store name and exactly which items the user should buy there from their original list.
4.  Calculate the total cost for all items purchased across all stops.
5.  Provide an estimated total travel distance for the complete route (e.g., "4.8 miles").
6.  Format your response *only* as a single, valid JSON object following this exact structure. Do not include markdown formatting, code fences (\`\`\`), or any text outside of the JSON object.

{
  "stops": [
    { "storeName": "Store A", "itemsToBuy": ["1 gallon of milk", "Whole wheat bread"] },
    { "storeName": "Store C", "itemsToBuy": ["A dozen eggs"] }
  ],
  "totalCost": 15.75,
  "totalDistance": "4.8 miles"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Using a more powerful model for better reasoning
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonText = response.text;

    // Sanitize the response: Gemini can sometimes wrap JSON in markdown.
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    
    try {
        const parsedRoute = JSON.parse(jsonText) as OptimalRoute;
        return parsedRoute;
    } catch (parseError) {
        console.error("Failed to parse JSON from Gemini:", jsonText, parseError);
        throw new Error("The AI returned an invalid route format. Please try again.");
    }

  } catch (error) {
    console.error("Error calling Gemini API for route generation:", error);
    throw new Error("Failed to generate an optimal route from the AI model.");
  }
};

export const generateListFromMedia = async (
  text: string,
  image?: { mimeType: string; data: string }
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const contents = image
    ? { parts: [{ inlineData: image }, { text: text }] }
    : text;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });
    return cleanShoppingList(response.text);
  } catch (error) {
    console.error("Error calling Gemini API for list generation:", error);
    throw new Error("Failed to generate a shopping list from the provided media.");
  }
};