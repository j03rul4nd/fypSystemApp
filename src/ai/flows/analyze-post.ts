'use server';
/**
 * @fileOverview AI-powered post analysis for topic, sentiment, and tone extraction.
 *
 * - analyzePost - Analyzes post content and extracts topics, sentiment, and tone.
 * - AnalyzePostInput - Input type for the analyzePost function.
 * - AnalyzePostOutput - Return type for the analyzePost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePostInputSchema = z.object({
  content: z.string().describe('The text content of the post.'),
});
export type AnalyzePostInput = z.infer<typeof AnalyzePostInputSchema>;

const AnalyzePostOutputSchema = z.object({
  topics: z.array(z.string()).describe('The main topics discussed in the post.'),
  sentiment: z
    .string()
    .describe('The overall sentiment of the post (e.g., positive, negative, neutral).'),
  tone: z.string().describe('The tone of the post (e.g., formal, informal, humorous).'),
});
export type AnalyzePostOutput = z.infer<typeof AnalyzePostOutputSchema>;

export async function analyzePost(input: AnalyzePostInput): Promise<AnalyzePostOutput> {
  return analyzePostFlow(input);
}

const analyzePostPrompt = ai.definePrompt({
  name: 'analyzePostPrompt',
  input: {schema: AnalyzePostInputSchema},
  output: {schema: AnalyzePostOutputSchema},
  prompt: `Analyze the following post content to extract key topics, overall sentiment, and tone.\n\nPost Content: {{{content}}}\n\nTopics: (a comma separated list of topics)\nSentiment: (positive, negative, or neutral)\nTone: (formal, informal, humorous, etc.)\n\nOutput the results in JSON format.`,
});

const analyzePostFlow = ai.defineFlow(
  {
    name: 'analyzePostFlow',
    inputSchema: AnalyzePostInputSchema,
    outputSchema: AnalyzePostOutputSchema,
  },
  async input => {
    const {output} = await analyzePostPrompt(input);
    return output!;
  }
);
