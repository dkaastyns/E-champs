import { queryClient } from '@/lib/query-client';

export interface GenerateBracketInput {
  categoryId: number;
}

export interface GenerateBracketResponse {
  message: string;
  bracketGenerated: boolean;
  totalMatches: number;
}

export async function generateBracket(input: GenerateBracketInput): Promise<GenerateBracketResponse> {
  const response = await fetch('/api/brackets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate bracket');
  }
  
  const data = await response.json();

  queryClient.invalidateQueries({ queryKey: ['brackets'] });
  queryClient.invalidateQueries({ queryKey: ['matches'] });

  return data;
}
