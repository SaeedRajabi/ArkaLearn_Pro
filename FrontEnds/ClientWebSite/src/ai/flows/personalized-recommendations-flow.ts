'use server';
/**
 * @fileOverview A Genkit flow for generating personalized course and article recommendations.
 *
 * - personalizedRecommendations - A function that handles the personalized recommendation process.
 * - PersonalizedRecommendationsInput - The input type for the personalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the personalizedRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PersonalizedRecommendationsInputSchema = z.object({
  userId: z.string().describe('The ID of the logged-in user.'),
  viewingHistory: z.array(z.string()).describe('A list of titles of courses/articles the user has viewed.'),
  registeredCourses: z.array(z.string()).describe('A list of titles of courses the user is registered for.'),
  userInterests: z.array(z.string()).describe('A list of user-defined interests or skills.'),
  allAvailableCourses: z.array(z.string()).describe('A comprehensive list of all available course titles on the platform.'),
  allAvailableArticles: z.array(z.string()).describe('A comprehensive list of all available article titles on the platform.'),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendedCourses: z.array(z.string()).describe('A list of recommended course titles relevant to the user.'),
  recommendedArticles: z.array(z.string()).describe('A list of recommended article titles relevant to the user.'),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function personalizedRecommendations(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const recommendationPrompt = ai.definePrompt({
  name: 'personalizedRecommendationPrompt',
  input: { schema: PersonalizedRecommendationsInputSchema },
  output: { schema: PersonalizedRecommendationsOutputSchema },
  prompt: `You are an intelligent recommendation engine for an online learning platform called ArkaSoftware-Edu.
Your task is to suggest personalized courses and articles to a logged-in user based on their learning history and interests.

Here is the user's information:
- User ID: {{{userId}}}
- Viewing History (courses/articles viewed):
  {{#each viewingHistory}}
  - {{{this}}}
  {{/each}}
- Registered Courses:
  {{#each registeredCourses}}
  - {{{this}}}
  {{/each}]}
- User Interests:
  {{#each userInterests}}
  - {{{this}}}
  {{/each}}

Available courses on the platform:
{{#each allAvailableCourses}}
- {{{this}}}
{{/each}}

Available articles on the platform:
{{#each allAvailableArticles}}
- {{{this}}}
{{/each}}

Based on the information above, provide a list of recommended courses and articles from the 'Available courses' and 'Available articles' lists.
Ensure that you DO NOT recommend any courses or articles that are already in the user's 'Viewing History' or 'Registered Courses'.
Focus on relevance to their interests and past interactions. Aim to provide 3-5 recommendations for each category if sufficient unique items are available.

Provide your recommendations in the following JSON format:
\`\`\`json
{{json .}}
\`\`\``,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await recommendationPrompt(input);
    if (!output) {
      throw new Error('No recommendations generated.');
    }
    return output;
  }
);
