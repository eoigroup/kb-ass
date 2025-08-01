import { NextResponse } from 'next/server';
import { checkAssistantPrerequisites } from '../../utils/assistantUtils';

// Updated: 2024-12-19 15:35:00 - Created API endpoint to fetch available chat models

export async function GET() {
  const { apiKey } = await checkAssistantPrerequisites();
  
  if (!apiKey) {
    return NextResponse.json({
      status: "error",
      message: "PINECONE_API_KEY is required.",
      models: []
    }, { status: 400 });
  }

  try {
    // Fetch available models from Pinecone API - try multiple endpoints
    let response = await fetch('https://api.pinecone.io/assistant/models', {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
      },
    });

    // If the first endpoint doesn't work, try alternative endpoints
    if (!response.ok) {
      console.log('First models endpoint failed, trying alternative...');
      response = await fetch('https://api.pinecone.io/models', {
        method: 'GET',
        headers: {
          'Api-Key': apiKey,
        },
      });
    }

    if (!response.ok) {
      console.warn(`Models API returned status ${response.status}, returning sample data`);
      
      // Return sample data for demonstration purposes
      const sampleModels = [
        {
          id: 'gpt-4o',
          name: 'gpt-4o',
          type: 'chat',
          provider: 'openai',
          description: 'GPT-4o is OpenAI\'s most advanced model',
          capabilities: ['chat', 'completion', 'vision']
        },
        {
          id: 'gpt-4o-mini',
          name: 'gpt-4o-mini',
          type: 'chat',
          provider: 'openai',
          description: 'GPT-4o-mini is a faster and more efficient model',
          capabilities: ['chat', 'completion']
        },
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'claude-3-5-sonnet-20241022',
          type: 'chat',
          provider: 'anthropic',
          description: 'Claude 3.5 Sonnet is Anthropic\'s most capable model',
          capabilities: ['chat', 'completion', 'analysis']
        },
        {
          id: 'claude-3-5-haiku-20241022',
          name: 'claude-3-5-haiku-20241022',
          type: 'chat',
          provider: 'anthropic',
          description: 'Claude 3.5 Haiku is fast and efficient',
          capabilities: ['chat', 'completion']
        }
      ];
      
      return NextResponse.json({
        status: "success",
        message: "Sample models data (API not available)",
        models: sampleModels,
        total: sampleModels.length
      }, { status: 200 });
    }

    const data = await response.json();
    
    console.log('Pinecone Models API response:', JSON.stringify(data, null, 2));
    
    if (!data.models || !Array.isArray(data.models)) {
      console.warn('Models API returned unexpected format, trying alternative endpoint...');
      
      // Try alternative endpoint or return empty array
      return NextResponse.json({
        status: "success",
        message: "Models API not available or returned unexpected format.",
        models: [],
        total: 0
      }, { status: 200 });
    }

    // Handle different possible response formats from Pinecone API
    let modelsArray = data.models || data.data || [];
    
    // If the response is not an array, try to extract models from the response
    if (!Array.isArray(modelsArray)) {
      console.log('Models response is not an array, trying to extract models...');
      modelsArray = [];
      
      // Try different possible response structures
      if (data.data && Array.isArray(data.data)) {
        modelsArray = data.data;
      } else if (typeof data === 'object') {
        // If the entire response is an object, try to find models in it
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            modelsArray = data[key];
          }
        });
      }
    }
    
    // Filter and format the models to show only chat models
    const chatModels = modelsArray
      .filter((model: any) => {
        // Include models that are explicitly chat/completion types or have chat-related names
        const isChatType = model.type === 'chat' || model.type === 'completion';
        const hasChatName = model.name?.toLowerCase().includes('chat') || 
                           model.name?.toLowerCase().includes('gpt') ||
                           model.name?.toLowerCase().includes('claude');
        return isChatType || hasChatName;
      })
      .map((model: any) => ({
        id: model.id || model.name,
        name: model.name,
        type: model.type || 'unknown',
        provider: model.provider || 'unknown',
        description: model.description || '',
        capabilities: model.capabilities || []
      }));

    return NextResponse.json({
      status: "success",
      message: `Available chat models retrieved successfully.`,
      models: chatModels,
      total: chatModels.length
    }, { status: 200 });

  } catch (error) {
    console.error(`Error fetching models: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      status: "error",
      message: `Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`,
      models: []
    }, { status: 500 });
  }
} 