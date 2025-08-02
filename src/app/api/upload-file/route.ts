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
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const metadataString = formData.get('metadata') as string | null;

    if (!file) {
      return NextResponse.json({ status: "error", message: "No file uploaded." }, { status: 400 });
    }

    let metadata: any = {};
    if (metadataString) {
      try {
        metadata = JSON.parse(metadataString);
      } catch (parseError) {
        console.error("Error parsing metadata:", parseError);
        return NextResponse.json({ status: "error", message: "Invalid metadata format." }, { status: 400 });
      }
    }

    // Convert File to ArrayBuffer then to Buffer for Pinecone SDK
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    console.log('Attempting to upload file:', file.name, 'with metadata:', metadata);

    // Use Pinecone Assistant Files API
    const uploadResponse = await fetch('https://prod-1-data.ke.pinecone.io/assistant/files', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'X-Pinecone-Assistant-Name': assistantName,
      },
      body: (() => {
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer]), file.name);
        if (Object.keys(metadata).length > 0) {
          formData.append('metadata', JSON.stringify({
            ...metadata,
            file_size_mb: file.size / (1024 * 1024),
            created_date: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          }));
        }
        return formData;
      })(),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload error:', uploadResponse.status, errorText);
      throw new Error(`HTTP error! status: ${uploadResponse.status}, message: ${errorText}`);
    }

    const result = await uploadResponse.json();

    return NextResponse.json({
      status: "success",
      message: `File '${file.name}' uploaded successfully.`,
      fileId: result.id,
      metadata: result.metadata,
    }, { status: 200 });

  } catch (error) {
    console.error(`Error uploading file: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      status: "error",
      message: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}