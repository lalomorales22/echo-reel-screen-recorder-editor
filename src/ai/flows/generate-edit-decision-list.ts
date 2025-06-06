// use server'

/**
 * @fileOverview Generates an Edit Decision List (EDL) from a screen recording.
 *
 * - generateEditDecisionList - A function that generates an EDL from a screen recording.
 * - GenerateEditDecisionListInput - The input type for the generateEditDecisionList function.
 * - GenerateEditDecisionListOutput - The return type for the generateEditDecisionList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEditDecisionListInputSchema = z.object({
  screenRecordingDataUri: z
    .string()
    .describe(
      "A screen recording, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateEditDecisionListInput = z.infer<typeof GenerateEditDecisionListInputSchema>;

const EditDecisionSchema = z.object({
  startTime: z.number().describe('The start time of the edit in seconds.'),
  endTime: z.number().describe('The end time of the edit in seconds.'),
  action: z
    .enum(['cut', 'zoom', 'highlight'])
    .describe('The action to perform on the video segment.'),
  details: z.string().optional().describe('Additional details about the edit.'),
});

const GenerateEditDecisionListOutputSchema = z.object({
  edl: z.array(EditDecisionSchema).describe('The Edit Decision List (EDL).'),
});
export type GenerateEditDecisionListOutput = z.infer<typeof GenerateEditDecisionListOutputSchema>;

export async function generateEditDecisionList(
  input: GenerateEditDecisionListInput
): Promise<GenerateEditDecisionListOutput> {
  return generateEditDecisionListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEditDecisionListPrompt',
  input: {schema: GenerateEditDecisionListInputSchema},
  output: {schema: GenerateEditDecisionListOutputSchema},
  prompt: `You are an AI video editor that analyzes screen recordings and generates Edit Decision Lists (EDL).

  Analyze the following screen recording and generate an EDL suggesting where to cut out dead space, apply zooms, and highlight key on-screen actions.
  Return the EDL as a JSON array of edit decisions. Each edit decision should include the start time, end time, action (cut, zoom, highlight), and optional details.

  Screen Recording: {{media url=screenRecordingDataUri}}

  Here's the schema for each edit decision:
  ${EditDecisionSchema.description}

  Example EDL:
  [
    {
      "startTime": 10,
      "endTime": 15,
      "action": "cut",
      "details": "Remove dead space"
    },
    {
      "startTime": 20,
      "endTime": 25,
      "action": "zoom",
      "details": "Zoom in on the button click"
    },
  ]
  `,
});

const generateEditDecisionListFlow = ai.defineFlow(
  {
    name: 'generateEditDecisionListFlow',
    inputSchema: GenerateEditDecisionListInputSchema,
    outputSchema: GenerateEditDecisionListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
