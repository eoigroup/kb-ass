import { NextResponse } from 'next/server';
import { checkAssistantPrerequisites } from '../../utils/assistantUtils';

// Updated: 2024-12-19 15:30:00 - Added pagination support and debugging for file count issue

export async function GET() {
  const { apiKey, assistantName } = await checkAssistantPrerequisites();
  
  if (!apiKey || !assistantName) {
    return NextResponse.json({
      status: "error",
      message: "PINECONE_API_KEY and PINECONE_ASSISTANT_NAME are required.",
      files: []
    }, { status: 400 });
  }

  try {
    // Try with pagination parameters to get all files
    const response = await fetch(`https://prod-1-data.ke.pinecone.io/assistant/files/${assistantName}?limit=100&offset=0`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Add debugging to see what we're getting from Pinecone
    console.log('Pinecone API response:', JSON.stringify(data, null, 2));
    console.log('Number of files returned:', data.files ? data.files.length : 'No files array');
    
    if (!data.files || !Array.isArray(data.files)) {
      throw new Error('Unexpected response format: files is not an array');
    }

    // If we have pagination info, try to get more files
    let allFiles = [...data.files];
    if (data.total && data.files.length < data.total) {
      console.log(`Found ${data.files.length} files, but total is ${data.total}. Attempting to fetch more...`);
      
      // Try to fetch remaining files with higher limit
      const remainingResponse = await fetch(`https://prod-1-data.ke.pinecone.io/assistant/files/${assistantName}?limit=${data.total}&offset=0`, {
        method: 'GET',
        headers: {
          'Api-Key': apiKey,
        },
      });
      
      if (remainingResponse.ok) {
        const remainingData = await remainingResponse.json();
        if (remainingData.files && Array.isArray(remainingData.files)) {
          allFiles = remainingData.files;
          console.log(`Successfully fetched ${allFiles.length} files`);
        }
      }
    }

    const fileData = allFiles.map((file: any) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      created_at: file.created_on,
      updated_at: file.updated_on,
      status: file.status,
      metadata: file.metadata
    }));

    return NextResponse.json({
      status: "success",
      message: `Files for assistant '${assistantName}' retrieved successfully.`,
      files: fileData
    }, { status: 200 });

  } catch (error) {
    console.error(`Error listing assistant files: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      status: "error",
      message: `Failed to list assistant files: ${error instanceof Error ? error.message : String(error)}`,
      files: []
    }, { status: 500 });
  }
}