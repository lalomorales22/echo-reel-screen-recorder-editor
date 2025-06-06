'use server';

/**
 * @fileOverview Generates voiceover audio from text using AI text-to-speech.
 *
 * - generateVoiceoverAudio - A function that generates audio from voiceover text.
 * - GenerateVoiceoverAudioInput - The input type for the generateVoiceoverAudio function.
 * - GenerateVoiceoverAudioOutput - The return type for the generateVoiceoverAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVoiceoverAudioInputSchema = z.object({
  text: z
    .string()
    .describe('The voiceover script text to convert to speech.'),
  voice: z
    .enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
    .optional()
    .describe('The voice to use for text-to-speech generation.')
    .default('alloy'),
  speed: z
    .number()
    .min(0.25)
    .max(4.0)
    .optional()
    .describe('The speed of the generated speech.')
    .default(1.0),
});

export type GenerateVoiceoverAudioInput = z.infer<typeof GenerateVoiceoverAudioInputSchema>;

const GenerateVoiceoverAudioOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe('The generated audio as a data URI with MIME type and Base64 encoding.'),
  duration: z
    .number()
    .describe('The duration of the generated audio in seconds.'),
});

export type GenerateVoiceoverAudioOutput = z.infer<typeof GenerateVoiceoverAudioOutputSchema>;

export async function generateVoiceoverAudio(
  input: GenerateVoiceoverAudioInput
): Promise<GenerateVoiceoverAudioOutput> {
  return generateVoiceoverAudioFlow(input);
}

// For now, we'll create a mock implementation since real TTS integration 
// would require OpenAI API keys or other TTS services
const generateVoiceoverAudioFlow = ai.defineFlow(
  {
    name: 'generateVoiceoverAudioFlow',
    inputSchema: GenerateVoiceoverAudioInputSchema,
    outputSchema: GenerateVoiceoverAudioOutputSchema,
  },
  async (input) => {
    // Mock implementation - in a real scenario, this would call:
    // - OpenAI's TTS API
    // - Google Cloud Text-to-Speech
    // - AWS Polly
    // - Azure Cognitive Services Speech
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Calculate estimated duration based on text length
    // Average speaking rate is about 150-200 words per minute
    const wordCount = input.text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 160) * 60; // 160 WPM average
    
    // Generate a simple beep tone as placeholder audio
    const sampleRate = 44100;
    const duration = Math.max(estimatedDuration, 1); // At least 1 second
    const samples = Math.floor(sampleRate * duration);
    const audioBuffer = new Float32Array(samples);
    
    // Generate a simple tone that varies with text content
    const frequency = 440 + (input.text.length % 200); // Vary frequency based on text
    for (let i = 0; i < samples; i++) {
      audioBuffer[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1;
    }
    
    // Convert to WAV format and then to base64
    const wavBuffer = createWavBuffer(audioBuffer, sampleRate);
    const base64Audio = arrayBufferToBase64(wavBuffer);
    const audioDataUri = `data:audio/wav;base64,${base64Audio}`;
    
    return {
      audioDataUri,
      duration: duration,
    };
  }
);

// Helper function to create WAV buffer
function createWavBuffer(audioBuffer: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + audioBuffer.length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + audioBuffer.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, audioBuffer.length * 2, true);
  
  // Convert float32 to int16
  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioBuffer[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return buffer;
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
} 