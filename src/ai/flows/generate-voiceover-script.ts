// 'use server';

/**
 * @fileOverview Generates a voiceover script based on the content of a screen recording.
 *
 * - generateVoiceoverScript - A function that generates a voiceover script from video content.
 * - GenerateVoiceoverScriptInput - The input type for the generateVoiceoverScript function.
 * - GenerateVoiceoverScriptOutput - The return type for the generateVoiceoverScript function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVoiceoverScriptInputSchema = z.object({
  videoContentDescription: z
    .string()
    .describe(
      'A description of the content of the screen recording, including key actions and on-screen elements.'
    ),
});

export type GenerateVoiceoverScriptInput = z.infer<
  typeof GenerateVoiceoverScriptInputSchema
>;

const GenerateVoiceoverScriptOutputSchema = z.object({
  voiceoverScript: z
    .string()
    .describe('The generated voiceover script for the video content.'),
});

export type GenerateVoiceoverScriptOutput = z.infer<
  typeof GenerateVoiceoverScriptOutputSchema
>;

export async function generateVoiceoverScript(
  input: GenerateVoiceoverScriptInput
): Promise<GenerateVoiceoverScriptOutput> {
  return generateVoiceoverScriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVoiceoverScriptPrompt',
  input: {schema: GenerateVoiceoverScriptInputSchema},
  output: {schema: GenerateVoiceoverScriptOutputSchema},
  prompt: `You are an AI expert in generating compelling voiceover scripts for screen recordings.

  Based on the description of the screen recording provided, create a voiceover script that enhances the video and engages the audience.

  Description of screen recording: {{{videoContentDescription}}}

  Voiceover Script:`,
});

const generateVoiceoverScriptFlow = ai.defineFlow(
  {
    name: 'generateVoiceoverScriptFlow',
    inputSchema: GenerateVoiceoverScriptInputSchema,
    outputSchema: GenerateVoiceoverScriptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
