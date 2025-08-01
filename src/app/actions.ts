// Updated: 2025-01-08 16:45:00 - Fixed Pinecone Assistant integration using Chat Completions API

'use server'

import { createStreamableValue } from 'ai/rsc'

type Message = {
  role: string;
  content: string;
}

export async function chat(messages: Message[]) {
  // Create an initial stream, which we'll populate with events from the Pinecone Assistant API
  const stream = createStreamableValue()

  // Use the Chat Completions API endpoint as documented in Pinecone Assistant docs
  // This is OpenAI-compatible and supports streaming
  // Based on documentation: https://host/assistant/chat/assistant_name
  const assistantHost = 'https://prod-1-data.ke.pinecone.io'
  const url = `${assistantHost}/assistant/chat/${process.env.PINECONE_ASSISTANT_NAME}`

  console.log('Attempting to call Pinecone Assistant at:', url);
  console.log('Messages:', JSON.stringify(messages, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINECONE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Default model for Pinecone Assistant
        messages,
        stream: false, // Let's test non-streaming first
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! status: ${response.status}, body:`, errorText);
      stream.update(`Error: ${response.status} - ${errorText}`);
      stream.done();
      return { object: stream.value };
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    // Pinecone Assistant returns data.message.content, not data.choices[0].message.content
    const content = data.message?.content;
    const model = data.model;
    const usage = data.usage;
    const citations = data.citations || [];
    
    if (content) {
      // Build the complete response with metadata
      let fullResponse = content;
      
      // Add model and usage information
      if (model || usage) {
        fullResponse += "\n\n---\n**Response Metadata:**\n";
        if (model) {
          fullResponse += `- **Model**: ${model}\n`;
        }
        if (usage) {
          fullResponse += `- **Token Usage**: ${usage.total_tokens} total (${usage.prompt_tokens} prompt + ${usage.completion_tokens} completion)\n`;
        }
      }
      
      // Add citations if available
      if (citations && citations.length > 0) {
        fullResponse += "\n**Sources & Citations:**\n";
        citations.forEach((citation, index) => {
          citation.references?.forEach((ref, refIndex) => {
            const citationNumber = index + 1;
            fullResponse += `${citationNumber}. **${ref.file.name}** (Pages: ${ref.pages?.join(', ') || 'N/A'})\n`;
            if (ref.file.signed_url) {
              fullResponse += `   - [View Document](${ref.file.signed_url})\n`;
            }
          });
        });
      }
      
      // Send the complete response as a single chunk
      const streamChunk = {
        choices: [{
          delta: {
            content: fullResponse
          }
        }]
      };
      stream.update(JSON.stringify(streamChunk));
    }
    
    stream.done();

  } catch (error) {
    console.error('Error in chat function:', error);
    stream.update(`Error: ${error.message}`);
    stream.done();
  }

  return { object: stream.value }
}