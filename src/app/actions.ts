// Updated: 2025-01-08 18:35:00 - Added comprehensive score detection and logging to debug missing scores

'use server'

import { createStreamableValue } from 'ai/rsc'

type Message = {
  role: string;
  content: string;
}

export async function chat(messages: Message[], showCitationsInChat = false) {
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
    
    // Debug: Check for all possible score fields
    console.log('Checking for scores in response:');
    console.log('data.scores:', data.scores);
    console.log('data.relevance_scores:', data.relevance_scores);
    console.log('data.snippet_scores:', data.snippet_scores);
    console.log('data.confidence:', data.confidence);
    console.log('data.metadata:', data.metadata);
    console.log('Citations with potential scores:', data.citations?.map((c: any) => ({
      score: c.score,
      confidence: c.confidence,
      relevance: c.relevance,
      references: c.references?.map((r: any) => ({
        score: r.score,
        confidence: r.confidence,
        relevance: r.relevance
      }))
    })));
    
    //  Assistant returns data.message.content, not data.choices[0].message.content
    const content = data.message?.content;
    const model = data.model;
    const usage = data.usage;
    const citations = data.citations || [];
    
    // Look for scores in multiple possible locations
    let scores = null;
    if (data.scores) {
      scores = data.scores;
    } else if (data.relevance_scores) {
      scores = data.relevance_scores;
    } else if (data.confidence) {
      scores = { confidence: data.confidence };
    } else if (data.citations && data.citations.length > 0) {
      // Check if citations have scores
      const citationScores: any = {};
      data.citations.forEach((citation: any, index: number) => {
        if (citation.score !== undefined) {
          citationScores[`citation_${index + 1}_score`] = citation.score;
        }
        if (citation.confidence !== undefined) {
          citationScores[`citation_${index + 1}_confidence`] = citation.confidence;
        }
        if (citation.references) {
          citation.references.forEach((ref: any, refIndex: number) => {
            if (ref.score !== undefined) {
              citationScores[`citation_${index + 1}_ref_${refIndex + 1}_score`] = ref.score;
            }
          });
        }
      });
      if (Object.keys(citationScores).length > 0) {
        scores = citationScores;
      }
    }
    
    console.log('Final extracted scores:', scores);
    
    if (content) {
      let finalContent = content;
      
      // Add citations to the chat response if enabled
      if (showCitationsInChat && citations && citations.length > 0) {
        finalContent += "\n\n**Sources & Citations:**\n";
        citations.forEach((citation: any, index: number) => {
          citation.references?.forEach((ref: any, refIndex: number) => {
            const citationNumber = index + 1;
            finalContent += `${citationNumber}. **${ref.file.name}** (Pages: ${ref.pages?.join(', ') || 'N/A'})\n`;
            if (ref.file.signed_url) {
              finalContent += `   - [View Document](${ref.file.signed_url})\n`;
            }
          });
        });
      }
      
      // Send content and metadata separately so UI can decide what to show
      const streamChunk = {
        choices: [{
          delta: {
            content: finalContent
          }
        }],
        // Include metadata for the showcase panel
        metadata: {
          model,
          usage,
          citations,
          scores
        }
      };
      stream.update(JSON.stringify(streamChunk));
    }
    
    stream.done();

  } catch (error) {
    console.error('Error in chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    stream.update(`Error: ${errorMessage}`);
    stream.done();
  }

  return { object: stream.value }
}