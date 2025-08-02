import { NextResponse } from 'next/server';
import { checkAssistantPrerequisites } from '../../utils/assistantUtils';

export async function POST(request: Request) {
  const { apiKey, assistantName } = await checkAssistantPrerequisites();

  if (!apiKey || !assistantName) {
    return NextResponse.json({
      status: "error",
      message: "PINECONE_API_KEY and PINECONE_ASSISTANT_NAME are required.",
    }, { status: 400 });
  }

  try {
    const { fileId, metadata } = await request.json();

    if (!fileId) {
      return NextResponse.json({ 
        status: "error", 
        message: "File ID is required." 
      }, { status: 400 });
    }

    console.log('Attempting to update metadata for file:', fileId, 'with metadata:', metadata);

    const response = await fetch(`https://prod-1-data.ke.pinecone.io/assistant/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Api-Key': apiKey,
        'X-Pinecone-Assistant-Name': assistantName,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: {
          ...metadata,
          last_updated: new Date().toISOString(),
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update metadata error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const updatedFile = await response.json();

    return NextResponse.json({
      status: "success",
      message: "File metadata updated successfully",
      file: updatedFile
    }, { status: 200 });

  } catch (error) {
    console.error(`Error updating file metadata: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      status: "error",
      message: `Failed to update file metadata: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}