// Updated: 2025-01-08 18:45:00 - Created evaluation utilities for Pinecone Assistant answer quality assessment

export interface EvaluationMetrics {
  correctness: number;
  completeness: number;
  alignment: number;
}

export interface EvaluatedFact {
  fact: {
    content: string;
  };
  entailment: 'entailed' | 'contradicted' | 'neutral';
}

export interface EvaluationReasoning {
  evaluated_facts: EvaluatedFact[];
}

export interface EvaluationResponse {
  metrics: EvaluationMetrics;
  reasoning: EvaluationReasoning;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EvaluationRequest {
  question: string;
  answer: string;
  ground_truth_answer: string;
}

/**
 * Evaluate an answer using Pinecone's Evaluation API
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  groundTruthAnswer: string
): Promise<EvaluationResponse | null> {
  try {
    const response = await fetch('https://api.pinecone.io/assistant/evaluate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINECONE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        answer,
        ground_truth_answer: groundTruthAnswer,
      }),
    });

    if (!response.ok) {
      console.error('Evaluation API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling evaluation API:', error);
    return null;
  }
}

/**
 * Get context snippets with relevance scores
 */
export async function getContextSnippets(
  query: string,
  assistantName: string
): Promise<any> {
  try {
    const response = await fetch(`https://prod-1-data.ke.pinecone.io/assistant/context/${assistantName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINECONE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        include_values: true,
        top_k: 5,
      }),
    });

    if (!response.ok) {
      console.error('Context API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling context API:', error);
    return null;
  }
}

/**
 * Format evaluation metrics for display
 */
export function formatEvaluationMetrics(metrics: EvaluationMetrics): Array<{key: string, value: string, color: string}> {
  return [
    {
      key: 'Correctness',
      value: `${(metrics.correctness * 100).toFixed(1)}%`,
      color: metrics.correctness >= 0.8 ? 'text-green-600 dark:text-green-400' : 
             metrics.correctness >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' : 
             'text-red-600 dark:text-red-400'
    },
    {
      key: 'Completeness', 
      value: `${(metrics.completeness * 100).toFixed(1)}%`,
      color: metrics.completeness >= 0.8 ? 'text-green-600 dark:text-green-400' : 
             metrics.completeness >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' : 
             'text-red-600 dark:text-red-400'
    },
    {
      key: 'Alignment',
      value: `${(metrics.alignment * 100).toFixed(1)}%`,
      color: metrics.alignment >= 0.8 ? 'text-green-600 dark:text-green-400' : 
             metrics.alignment >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' : 
             'text-red-600 dark:text-red-400'
    }
  ];
}

/**
 * Get entailment icon and color
 */
export function getEntailmentDisplay(entailment: string): {icon: string, color: string, label: string} {
  switch (entailment) {
    case 'entailed':
      return {
        icon: '✅',
        color: 'text-green-600 dark:text-green-400',
        label: 'Supported'
      };
    case 'contradicted':
      return {
        icon: '❌', 
        color: 'text-red-600 dark:text-red-400',
        label: 'Contradicted'
      };
    case 'neutral':
      return {
        icon: '⚪',
        color: 'text-gray-600 dark:text-gray-400', 
        label: 'Neutral'
      };
    default:
      return {
        icon: '❓',
        color: 'text-gray-600 dark:text-gray-400',
        label: 'Unknown'
      };
  }
}