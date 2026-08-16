import { CreateMLCEngine, MLCEngine, InitProgressReport, prebuiltAppConfig } from "@mlc-ai/web-llm";

export interface InBrowserModelOption {
  id: string;
  name: string;
  size: string;
  description: string;
  recommended?: boolean;
}

export const IN_BROWSER_MODELS: InBrowserModelOption[] = [
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 0.5B Instruct (Por Defecto)",
    size: "~350 MB",
    description: "Excelente comprensión de instrucciones, código y JSON en tiempo real.",
    recommended: true,
  },
  {
    id: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    name: "SmolLM2 360M (Ultra Rápido)",
    size: "~230 MB",
    description: "Ligero y ultra-veloz. Ideal para portátiles y GPU integrada.",
    recommended: true,
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B Instruct",
    size: "~880 MB",
    description: "Modelo potente de Meta optimizado para razonamiento y chat.",
  },
  {
    id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    name: "SmolLM2 1.7B Instruct",
    size: "~1.1 GB",
    description: "Alta precisión de HuggingFace para desarrollo y asistencia técnica.",
  },
  {
    id: "DeepSeek-R1-Distill-Qwen-1.5B-q4f16_1-MLC",
    name: "DeepSeek R1 Distill Qwen 1.5B",
    size: "~1.2 GB",
    description: "Razonamiento paso a paso directo en el navegador con WebGPU.",
  },
  {
    id: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
    name: "TinyLlama 1.1B Chat",
    size: "~670 MB",
    description: "Modelo clásico compacto y rápido.",
  }
];

class WebLLMManager {
  private engine: MLCEngine | null = null;
  private currentModelId: string | null = null;
  private isInitializing: boolean = false;

  public checkWebGPUSupport(): { supported: boolean; reason?: string } {
    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      return {
        supported: false,
        reason: "Tu navegador no tiene WebGPU activado o compatible. Usa Chrome 113+, Edge 113+ o Firefox Nightly con WebGPU habilitado."
      };
    }
    return { supported: true };
  }

  public async getOrInitEngine(
    modelId: string,
    onProgress?: (report: InitProgressReport) => void
  ): Promise<MLCEngine> {
    if (this.engine && this.currentModelId === modelId) {
      return this.engine;
    }

    if (this.isInitializing) {
      throw new Error("El motor WebLLM ya se está inicializando. Por favor espera.");
    }

    this.isInitializing = true;
    try {
      if (this.engine) {
        await this.engine.unload();
        this.engine = null;
      }

      const engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (report) => {
          if (onProgress) {
            onProgress(report);
          }
        },
        appConfig: prebuiltAppConfig,
      });

      this.engine = engine;
      this.currentModelId = modelId;
      return engine;
    } finally {
      this.isInitializing = false;
    }
  }

  public isLoaded(modelId?: string): boolean {
    if (!this.engine) return false;
    if (modelId) return this.currentModelId === modelId;
    return true;
  }

  public getCurrentModel(): string | null {
    return this.currentModelId;
  }

  public async unload(): Promise<void> {
    if (this.engine) {
      await this.engine.unload();
      this.engine = null;
      this.currentModelId = null;
    }
  }
}

export const webllmManager = new WebLLMManager();
