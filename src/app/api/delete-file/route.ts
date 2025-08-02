import { NextResponse } from 'next/server';
import { checkAssistantPrerequisites } from '../../utils/assistantUtils';

export async function DELETE(request: Request) {
  const { apiKey, assistantName } = await checkAssistantPrerequisites();

  if (!apiKey || !assistantName) {
    return NextResponse.json({
      status: "error",
      message: "PINECONE_API_KEY and PINECONE_ASSISTANT_NAME are required.",
    }, { status: 400 });
  }

  try {
    // For DELETE method, get fileId from request body
    const body = await request.json();
    const fileId = body.fileId;

    if (!fileId) {
      return NextResponse.json({ 
        status: "error", 
        message: "File ID is required." 
      }, { status: 400 });
    }

    console.log('Attempting to delete file with ID:', fileId);

    const response = await fetch(`https://prod-1-data.ke.pinecone.io/assistant/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Api-Key': apiKey,
        'X-Pinecone-Assistant-Name': assistantName,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Delete file error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return NextResponse.json({
      status: "success",
      message: "File deleted successfully"
    }, { status: 200 });

  } catch (error) {
    console.error(`Error deleting file: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      status: "error",
      message: `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}