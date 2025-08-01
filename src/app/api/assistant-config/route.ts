import { NextResponse } from 'next/server';
import { checkAssistantPrerequisites } from '../../utils/assistantUtils';

// Updated: 2024-12-19 15:40:00 - Created API endpoint to fetch assistant configuration

export async function GET() {
  const { apiKey, assistantName } = await checkAssistantPrerequisites();
  
  if (!apiKey || !assistantName) {
    return NextResponse.json({
      status: "error",
      message: "PINECONE_API_KEY and PINECONE_ASSISTANT_NAME are required.",
      config: null
    }, { status: 400 });
  }

  try {
    // Fetch assistant configuration
    const response = await fetch(`https://api.pinecone.io/assistant/assistants/${assistantName}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('Assistant config response:', JSON.stringify(data, null, 2));
    
    return NextResponse.json({
      status: "success",
      message: `Assistant configuration retrieved successfully.`,
      config: data
    }, { status: 200 });

  } catch (error) {
    console.error(`Error fetching assistant config: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      status: "error",
      message: `Failed to fetch assistant config: ${error instanceof Error ? error.message : String(error)}`,
      config: null
    }, { status: 500 });
  }
} 