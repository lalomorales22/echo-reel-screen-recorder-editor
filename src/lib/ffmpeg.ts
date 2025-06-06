// Completely dynamic FFmpeg loader that avoids static imports

declare global {
  interface Window {
    FFmpeg?: any;
    FFmpegUtil?: any;
    createFFmpegCore?: any;
  }
}

interface FFmpegInstance {
  load: (config: any) => Promise<void>;
  writeFile: (name: string, data: any) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array>;
  exec: (args: string[]) => Promise<void>;
  on: (event: string, callback: (data: any) => void) => void;
}

class FFmpegManager {
  private ffmpeg: FFmpegInstance | null = null;
  private isLoading = false;
  private isLoaded = false;
  private loadError: string | null = null;

  private async loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  private async loadFFmpegScripts(): Promise<void> {
    const cdnOptions = [
      // Primary CDN with stable versions
      {
        util: 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js',
        ffmpeg: 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/index.js'
      },
      // Fallback to jsdelivr
      {
        util: 'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/index.js',
        ffmpeg: 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/index.js'
      },
      // Alternative versions as backup
      {
        util: 'https://unpkg.com/@ffmpeg/util@0.12.0/dist/umd/index.js',
        ffmpeg: 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.8/dist/umd/index.js'
      },
      // Last resort with older stable version
      {
        util: 'https://unpkg.com/@ffmpeg/util@0.11.0/dist/umd/index.js',
        ffmpeg: 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/umd/index.js'
      }
    ];

    let lastError: Error | null = null;

    for (const [index, cdn] of cdnOptions.entries()) {
      try {
        console.log(`[FFmpeg] Attempting to load from CDN option ${index + 1}`);
        await this.loadScript(cdn.util);
        await this.loadScript(cdn.ffmpeg);
        console.log(`[FFmpeg] Successfully loaded from CDN option ${index + 1}`);
        return; // Success, exit the function
      } catch (error) {
        lastError = error as Error;
        console.warn(`[FFmpeg] CDN option ${index + 1} failed:`, error);
        
        // Clean up any partially loaded scripts
        const utilScript = document.querySelector(`script[src="${cdn.util}"]`);
        const ffmpegScript = document.querySelector(`script[src="${cdn.ffmpeg}"]`);
        utilScript?.remove();
        ffmpegScript?.remove();
        
        // Clear any window objects that might have been partially set
        if (window.FFmpegUtil) delete window.FFmpegUtil;
        if (window.FFmpeg) delete window.FFmpeg;
      }
    }

    // If we get here, all CDN options failed
    throw new Error(`Failed to load FFmpeg from all available CDNs. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  async loadFFmpeg(): Promise<{ success: boolean; error?: string }> {
    if (this.isLoaded && this.ffmpeg) {
      return { success: true };
    }

    if (this.isLoading) {
      // Wait for current loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.isLoaded ? { success: true } : { success: false, error: this.loadError || 'Failed to load' };
    }

    this.isLoading = true;
    this.loadError = null;

    try {
      // Only load FFmpeg on the client side
      if (typeof window === 'undefined') {
        throw new Error('FFmpeg can only be loaded on the client side');
      }

      // Load FFmpeg scripts dynamically
      await this.loadFFmpegScripts();

      // Wait for FFmpeg to be available on window
      let attempts = 0;
      while (!window.FFmpeg && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.FFmpeg) {
        throw new Error('FFmpeg failed to load from CDN');
      }

      // Create FFmpeg instance
      this.ffmpeg = new window.FFmpeg.FFmpeg();

      // Set up logging
      this.ffmpeg!.on('log', ({ message }: { message: string }) => {
        console.log('[FFmpeg]', message);
      });

      // Load FFmpeg core using compatible versions
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      const toBlobURL = window.FFmpegUtil?.toBlobURL;
      if (!toBlobURL) {
        throw new Error('FFmpeg utilities not available');
      }

      try {
        const [coreURL, wasmURL] = await Promise.all([
          toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        ]);

        await this.ffmpeg!.load({
          coreURL,
          wasmURL,
        });
      } catch (coreError) {
        // Fallback to alternative core version
        const fallbackBaseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
        const [coreURL, wasmURL] = await Promise.all([
          toBlobURL(`${fallbackBaseURL}/ffmpeg-core.js`, 'text/javascript'),
          toBlobURL(`${fallbackBaseURL}/ffmpeg-core.wasm`, 'application/wasm')
        ]);

        await this.ffmpeg!.load({
          coreURL,
          wasmURL,
        });
      }

      this.isLoaded = true;
      return { success: true };

    } catch (error) {
      console.error('FFmpeg loading error:', error);
      this.loadError = error instanceof Error ? error.message : 'Unknown error';
      this.ffmpeg = null;
      return { success: false, error: this.loadError };
    } finally {
      this.isLoading = false;
    }
  }

  getFFmpeg(): FFmpegInstance | null {
    return this.isLoaded ? this.ffmpeg : null;
  }

  isFFmpegLoaded(): boolean {
    return this.isLoaded;
  }

  getLoadError(): string | null {
    return this.loadError;
  }

  reset(): void {
    this.ffmpeg = null;
    this.isLoading = false;
    this.isLoaded = false;
    this.loadError = null;
  }
}

// Create a singleton instance
const ffmpegManager = new FFmpegManager();

export default ffmpegManager;

// Additional utility functions
export const loadFFmpegUtil = async () => {
  try {
    // Only load on client side
    if (typeof window === 'undefined') {
      throw new Error('FFmpeg utilities can only be loaded on the client side');
    }

    // Ensure FFmpeg utilities are loaded
    if (!window.FFmpegUtil) {
      throw new Error('FFmpeg utilities not available');
    }
    
    const { fetchFile } = window.FFmpegUtil;
    return { fetchFile };
  } catch (error) {
    console.error('Failed to load FFmpeg utilities:', error);
    throw new Error('Failed to load FFmpeg utilities');
  }
}; 