// Updated: 2025-01-08 19:00:00 - Added complete advanced features: metadata filtering, context controls, temperature, highlights, auto-categorization

'use server'

import { createStreamableValue } from 'ai/rsc'
import { evaluateAnswer, getContextSnippets, EvaluationResponse } from './utils/evaluationUtils'

type Message = {
  role: string;
  content: string;
}

export async function chat(
  messages: Message[], 
  showCitationsInChat = false, 
  enableEvaluation = false, 
  groundTruthAnswer = '',
  filterOptions: {
    specialty?: string;
    documentType?: string;
    userRole?: string;
    resource?: string;
    department?: string;
    document_type?: string;
    priority?: string;
    date_range?: string;
  } = {},
  contextOptions: {
    snippetSize?: number;
    topK?: number;
  } = {},
  temperature = 0.3,
  includeHighlights = true,
  includeMessageHistory = false
) {
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
    // Build request body with all new features
    const requestBody: any = {
      model: 'gpt-4o',
      messages: includeMessageHistory ? messages : [messages[messages.length - 1]], // Only send last message unless history is requested
      stream: false,
      temperature,
      include_highlights: includeHighlights,
    };

    // Add context options if provided
    if (contextOptions.snippetSize || contextOptions.topK) {
      requestBody.context_options = {};
      if (contextOptions.snippetSize) requestBody.context_options.snippet_size = contextOptions.snippetSize;
      if (contextOptions.topK) requestBody.context_options.top_k = contextOptions.topK;
    }

    // Add metadata filtering if provided
    const filters: any = {};
    if (filterOptions.specialty) filters.specialty = filterOptions.specialty;
    if (filterOptions.documentType) filters.document_type = filterOptions.documentType;
    if (filterOptions.userRole) filters.user_role = filterOptions.userRole;
    if (filterOptions.resource) filters.resource = filterOptions.resource;
    
    // Add new file metadata filters
    if (filterOptions.department) filters.department = filterOptions.department;
    if (filterOptions.document_type) filters.document_type = filterOptions.document_type;
    if (filterOptions.priority) filters.priority = filterOptions.priority;
    if (filterOptions.date_range) filters.date_range = filterOptions.date_range;
    
    // Auto-categorize based on filename patterns if no explicit filters
    if (Object.keys(filters).length === 0 && messages.length > 0) {
      const userMessage = messages[messages.length - 1].content.toLowerCase();
      
      // Auto-detect specialty from content
      if (userMessage.includes('diagnostic') || userMessage.includes('test') || userMessage.includes('screening')) {
        filters.resource = 'diagnostics';
      } else if (userMessage.includes('private') || userMessage.includes('acute')) {
        filters.resource = 'private_healthcare';
      } else if (userMessage.includes('market') || userMessage.includes('business')) {
        filters.resource = 'market_analysis';
      } else if (userMessage.includes('digital') || userMessage.includes('technology')) {
        filters.resource = 'digital_health';
      }
    }
    
    if (Object.keys(filters).length > 0) {
      requestBody.filter = filters;
    }

    console.log('Request body with filters and options:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINECONE_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Pinecone-API-Version': '2025-04', // Use latest API version for new features
      },
      body: JSON.stringify(requestBody),
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
    
    // Get context snippets for additional relevance scores
    let contextData = null;
    if (messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        contextData = await getContextSnippets(lastUserMessage.content, process.env.PINECONE_ASSISTANT_NAME || '');
        console.log('Context snippets with scores:', contextData);
      }
    }
    
    // Perform evaluation if enabled and ground truth is provided
    let evaluationData: EvaluationResponse | null = null;
    if (enableEvaluation && groundTruthAnswer && content && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        evaluationData = await evaluateAnswer(
          lastUserMessage.content,
          content,
          groundTruthAnswer
        );
        console.log('Evaluation results:', evaluationData);
      }
    }
    
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
          scores,
          contextData,
          evaluationData,
          highlights: data.citations?.map((citation: any) => citation.references?.map((ref: any) => ref.highlight)).flat().filter(Boolean),
          requestParams: {
            temperature,
            filterOptions,
            contextOptions,
            includeHighlights
          }
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