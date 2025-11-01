const rawApiUrl = import.meta.env.VITE_RUNPOD_API_URL as string;
const API_KEY = import.meta.env.VITE_RUNPOD_API_KEY as string; 

// Convert RunPod API URL to use Vite proxy to avoid CORS issues
// Replace https://api.runpod.ai with /api/runpod (proxy endpoint)
let API_URL = rawApiUrl;
if (rawApiUrl && rawApiUrl.includes('api.runpod.ai')) {
  // Extract the path from the original URL (e.g., /v2/7npr6mt7n0ulbp/runsync)
  const urlObj = new URL(rawApiUrl);
  API_URL = `/api/runpod${urlObj.pathname}${urlObj.search}`;
}

// Validate RunPod config
if (!API_URL || !API_KEY) {
  // RunPod API configuration is missing - chatbot features will not work
}

export { API_URL, API_KEY };

