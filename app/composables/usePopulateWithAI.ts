import { ref } from 'vue';
import axios from 'axios';

export interface LLMConfig {
  provider: string;
  config: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    endpoint?: string;
    deploymentName?: string;
    apiVersion?: string;
  };
  globalParams?: {
    temperature?: number;
    max_tokens?: number;
  };
}

export interface GenerateResponseParams {
  method: string;
  endpoint: string;
  statusCode: number;
  reason: string;
  existingResponse: string;
}

export function usePopulateWithAI() {
  const llmConfig = ref<LLMConfig | null>(null);
  const isLLMLoading = ref(false);
  const llmError = ref('');

  const fetchLLMConfig = async (): Promise<LLMConfig | null> => {
    try {
      llmConfig.value = await $fetch<LLMConfig>('/api/llm');
      return llmConfig.value;
    } catch {
      llmError.value = 'Failed to load LLM configuration.';
      return null;
    }
  };

  const getChatCompletionsUrl = (config: LLMConfig): string => {
    let baseUrl = config.config.baseUrl || '';
    baseUrl = baseUrl.replace(/\/+$/, '');
    if (!baseUrl.endsWith('/v1')) {
      baseUrl = `${baseUrl}/v1`;
    }
    return `${baseUrl}/chat/completions`;
  };

  const formatReason = (reason: string): string => {
    const trimmed = reason.trim();
    if (!trimmed) {
      return 'User expects a realistic response';
    }
    if (/^\d+$/.test(trimmed)) {
      return `User expects ${trimmed} number of real looking response(s) for the main object`;
    }
    return trimmed;
  };

  const generateResponse = async (params: GenerateResponseParams): Promise<string> => {
    if (!llmConfig.value) {
      throw new Error('No LLM provider configured.');
    }

    const config = llmConfig.value;
    const completionsUrl = getChatCompletionsUrl(config);
    const model = config.config.model || '';
    const apiKey = config.config.apiKey || '';
    const temperature = config.globalParams?.temperature ?? 0.7;
    const maxTokens = config.globalParams?.max_tokens ?? 4096;

    const formattedReason = formatReason(params.reason);
    let userPrompt = `${params.method} ${params.endpoint} — status ${params.statusCode}`;
    userPrompt += `\nRequirement: ${formattedReason}`;
    if (params.existingResponse) {
      userPrompt += `\n\nCurrent response:\n${params.existingResponse}\n\nGenerate a new response that STRICTLY matches the same JSON structure/type as above but with realistic data matching the requirement.`;
    }

    const response = await axios.post(completionsUrl, {
      model,
      messages: [
        {
          role: 'system',
          content: 'Return ONLY valid JSON. No markdown, no explanation, no wrapping. Match the exact structure/type of any provided existing response.'
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'text' },
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
      },
    });

    const content = response.data?.choices?.[0]?.message?.content || '';
    return parseAndRecoverResponse(content, params.existingResponse);
  };

  const parseAndRecoverResponse = (content: string, existingResponse: string): string => {
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      if (existingResponse) {
        try {
          const existingResponseAsJson = JSON.parse(existingResponse);
          const missingKeys = Object.keys(existingResponseAsJson).filter(
            (key: string) => !Object.keys(parsed).includes(key)
          );
          missingKeys.forEach((key: string) => {
            parsed[key] = existingResponseAsJson[key];
          });
        } catch {
          // existing response isn't valid JSON, skip recovery
        }
      }
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  };

  return {
    llmConfig,
    isLLMLoading,
    llmError,
    fetchLLMConfig,
    getChatCompletionsUrl,
    formatReason,
    generateResponse,
    parseAndRecoverResponse,
  };
}
