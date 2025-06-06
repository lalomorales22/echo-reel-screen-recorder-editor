import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function srtToVtt(srtText: string): string {
  if (!srtText) {
    return '';
  }
  let vttText = 'WEBVTT\n\n';
  vttText += srtText
    .replace(/\r/g, '')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2') // Replace comma with dot in timestamps
    .split('\n\n')
    .map(captionBlock => {
      // Remove the numeric index from each caption block
      const lines = captionBlock.split('\n');
      if (/^\d+$/.test(lines[0])) {
        return lines.slice(1).join('\n');
      }
      return captionBlock;
    })
    .join('\n\n');
  return vttText;
}
