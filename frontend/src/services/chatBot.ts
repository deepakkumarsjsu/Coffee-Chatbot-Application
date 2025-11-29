import axios from 'axios';
import { MessageInterface } from '../types/types';
import { API_KEY, API_URL } from '../config/runpodConfigs';

/**
 * Poll RunPod job status until completion
 */
async function pollJobStatus(jobId: string, maxAttempts: number = 150, pollInterval: number = 2000): Promise<any> {
    // Extract base URL and construct status endpoint
    // If using proxy, the URL will be like /api/runpod/v2/...
    // We need to construct the status endpoint: /api/runpod/v2/{endpoint_id}/status/{jobId}
    let statusUrl: string;
    
    if (API_URL.startsWith('/api/runpod')) {
        // Extract the endpoint ID from the original API URL
        // e.g., /api/runpod/v2/7npr6mt7n0ulbp/runsync -> /api/runpod/v2/7npr6mt7n0ulbp/status/{jobId}
        const urlParts = API_URL.split('/');
        const endpointIdIndex = urlParts.findIndex(part => part === 'v2') + 1;
        if (endpointIdIndex > 0 && endpointIdIndex < urlParts.length) {
            const endpointId = urlParts[endpointIdIndex];
            statusUrl = `/api/runpod/v2/${endpointId}/status/${jobId}`;
        } else {
            throw new Error('Could not determine endpoint ID from API URL');
        }
    } else {
        // Direct API URL (shouldn't happen with proxy, but handle it)
        const urlObj = new URL(API_URL);
        const pathParts = urlObj.pathname.split('/');
        const endpointIdIndex = pathParts.findIndex(part => part === 'v2') + 1;
        if (endpointIdIndex > 0 && endpointIdIndex < pathParts.length) {
            const endpointId = pathParts[endpointIdIndex];
            statusUrl = `https://api.runpod.ai/v2/${endpointId}/status/${jobId}`;
        } else {
            throw new Error('Could not determine endpoint ID from API URL');
        }
    }
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const statusResponse = await axios.get(statusUrl, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                },
                timeout: 10000
            });
            
            const statusData = statusResponse.data;
            
            if (statusData.status === 'COMPLETED') {
                return statusData;
            } else if (statusData.status === 'FAILED') {
                throw new Error(`Job failed: ${statusData.error || 'Unknown error'}`);
            } else if (statusData.status === 'IN_PROGRESS' || statusData.status === 'IN_QUEUE') {
                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } else {
                // Unknown status, wait and retry
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                // Job might not be ready yet, continue polling
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } else {
                throw error;
            }
        }
    }
    
    throw new Error(`Job did not complete within ${maxAttempts * pollInterval / 1000} seconds`);
}

async function callChatBotAPI(messages: MessageInterface[]): Promise<{ message: MessageInterface; fullResponse?: any }> {
    try {
        if (!API_URL || !API_KEY) {
            throw new Error('RunPod API URL or API Key is missing. Please check your .env file.');
        }
        
        const response = await axios.post(
            API_URL, 
            {
                input: { messages }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                timeout: 300000 // 300 second timeout (5 minutes) - LLM inference can take time, especially for complex requests
            }
        );
        
        // Handle async job status (IN_PROGRESS)
        let responseData = response.data;
        if (responseData.status === 'IN_PROGRESS' && responseData.id) {
            responseData = await pollJobStatus(responseData.id);
        }
        
        // Handle different RunPod response formats
        let outputMessage: MessageInterface | null = null;
        
        if (responseData) {
            // Format 1: { output: MessageInterface }
            if (responseData.output) {
                // Check if output is an array
                if (Array.isArray(responseData.output)) {
                    // If it's an array, take the first element or last element
                    const outputArray = responseData.output;
                    if (outputArray.length > 0) {
                        outputMessage = outputArray[outputArray.length - 1];
                    }
                } else {
                    // If it's a direct object
                    outputMessage = responseData.output;
                }
            }
            // Format 2: Direct response (responseData is the message itself)
            else if (responseData.role && responseData.content !== undefined && responseData.content !== null) {
                outputMessage = responseData;
            }
            // Format 3: Nested in responseData.data
            else if (responseData.data) {
                if (responseData.data.role && responseData.data.content) {
                    outputMessage = responseData.data;
                } else if (responseData.data.output) {
                    outputMessage = responseData.data.output;
                }
            }
        }
        
        if (!outputMessage) {
            throw new Error(`Invalid response format from API. Received: ${JSON.stringify(responseData)}`);
        }
        
        // Validate response structure - check if role exists and content is not undefined/null
        if (!outputMessage.role || outputMessage.content === undefined || outputMessage.content === null) {
            throw new Error('Invalid message format in API response. Missing role or content.');
        }
        
        // Handle empty content - check if orders were added to memory first
        if (outputMessage.content.trim() === '') {
            // Check if there are orders in memory
            // The ChatRoom component will handle generating appropriate responses for both
            // order-related queries and informational queries (recommendations, prices, etc.)
            const hasOrdersInMemory = 
                (responseData?.output?.memory?.order && Array.isArray(responseData.output.memory.order) && responseData.output.memory.order.length > 0) ||
                (responseData?.memory?.order && Array.isArray(responseData.memory.order) && responseData.memory.order.length > 0) ||
                (responseData?.data?.memory?.order && Array.isArray(responseData.data.memory.order) && responseData.data.memory.order.length > 0);
            
            // Leave content empty - ChatRoom will handle generating appropriate responses
            // for both orders and informational queries (recommendations, prices, etc.)
            // Only set fallback if we really can't handle it (this should rarely happen)
            if (!hasOrdersInMemory) {
                // Leave empty for ChatRoom to handle informational queries
                // ChatRoom will set fallback only if it can't handle the query
                outputMessage.content = '';
            }
            // If orders exist, leave content empty - ChatRoom will generate appropriate message
        }
        
        // Return both the message and full response data for order extraction
        return { 
            message: outputMessage,
            fullResponse: responseData 
        };
    } catch (error: any) {
        // Provide user-friendly error messages
        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout. The API is taking longer than expected. This might happen if the server is starting up. Please try again in a moment.');
        } else if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            
            if (status === 401) {
                throw new Error('Authentication failed. Please check your API key.');
            } else if (status === 404) {
                throw new Error('API endpoint not found. Please check your API URL.');
            } else if (status === 500) {
                throw new Error('Server error. Please try again later.');
            } else if (errorData?.error) {
                throw new Error(errorData.error);
            } else {
                throw new Error(`API error (${status}): ${errorData?.message || 'Unknown error'}`);
            }
        } else if (error.request) {
            throw new Error('Network error. Please check your internet connection.');
        } else {
            throw error;
        }
    }
}

export { callChatBotAPI };

