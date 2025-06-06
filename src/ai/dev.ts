import { config } from 'dotenv';
config();

import '@/ai/flows/generate-captions.ts';
import '@/ai/flows/generate-edit-decision-list.ts';
import '@/ai/flows/generate-voiceover-script.ts';
import '@/ai/flows/generate-voiceover-audio.ts';