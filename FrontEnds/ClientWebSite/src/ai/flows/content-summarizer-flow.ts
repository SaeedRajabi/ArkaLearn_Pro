'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating concise summaries of given content.
 *
 * - summarizeContent - A function that handles the content summarization process.
 * - ContentSummarizerInput - The input type for the summarizeContent function.
 * - ContentSummarizerOutput - The return type for the summarizeContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ContentSummarizerInputSchema = z.object({
  content: z.string().describe('The full text content of the course or article to be summarized.'),
});
export type ContentSummarizerInput = z.infer<typeof ContentSummarizerInputSchema>;

const ContentSummarizerOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the provided content.'),
});
export type ContentSummarizerOutput = z.infer<typeof ContentSummarizerOutputSchema>;

export async function summarizeContent(input: ContentSummarizerInput): Promise<ContentSummarizerOutput> {
  return contentSummarizerFlow(input);
}

const contentSummarizerPrompt = ai.definePrompt({
  name: 'contentSummarizerPrompt',
  input: { schema: ContentSummarizerInputSchema },
  output: { schema: ContentSummarizerOutputSchema },
  prompt: `You are an expert summarizer. Your task is to provide a concise and accurate summary of the following content. Focus on the main points and key takeaways. The summary should be easy to understand and brief.

Content: {{{content}}}`,
});

const contentSummarizerFlow = ai.defineFlow(
  {
    name: 'contentSummarizerFlow',
    inputSchema: ContentSummarizerInputSchema,
    outputSchema: ContentSummarizerOutputSchema,
  },
  async (input) => {
    const { output } = await contentSummarizerPrompt(input);
    return output!;
  }
);
