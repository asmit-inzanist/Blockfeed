export function getGeminiKey(): string {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return key;
}

export const PREDEFINED_INTERESTS = [
  'Technology',
  'Finance', 
  'Sports',
  'Politics',
  'Health',
  'Entertainment',
  'Science',
  'World News'
] as const;
