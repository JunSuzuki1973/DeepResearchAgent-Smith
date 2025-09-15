import { apiClient } from './api';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class LLMService {
  private getApiKey(model: string): string {
    // Try to get from localStorage first (for immediate access)
    const localSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    const apiSettings = localSettings.api || {};
    
    let apiKey = '';
    
    if (model.startsWith('gpt-')) {
      apiKey = apiSettings.openaiKey || '';
    } else if (model.startsWith('claude-')) {
      apiKey = apiSettings.anthropicKey || '';
    } else if (model.startsWith('gemini-')) {
      apiKey = apiSettings.googleKey || '';
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
    
    if (!apiKey) {
      throw new Error(`API key not found for model: ${model}`);
    }
    
    return apiKey;
  }

  private getProvider(model: string): 'openai' | 'anthropic' | 'google' {
    if (model.startsWith('gpt-')) {
      return 'openai';
    } else if (model.startsWith('claude-')) {
      return 'anthropic';
    } else if (model.startsWith('gemini-')) {
      return 'google';
    }
    
    throw new Error(`Unsupported model: ${model}`);
  }

  async validateApiKey(provider: 'openai' | 'anthropic' | 'google', apiKey: string): Promise<boolean> {
    try {
      switch (provider) {
        case 'openai':
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          });
          return openaiResponse.ok;

        case 'anthropic':
          // Use the models endpoint for validation (lighter than sending messages)
          const anthropicResponse = await fetch('https://api.anthropic.com/v1/models', {
            method: 'GET',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01',
            },
          });
          
          // If models endpoint is not available, try a minimal message
          if (anthropicResponse.status === 404) {
            const messageResponse = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'Hi' }],
              }),
            });
            
            // Check for authentication errors
            if (messageResponse.status === 401 || messageResponse.status === 403) {
              return false;
            }
            
            // If we get any response (including rate limits), the key is valid
            return messageResponse.status < 500;
          }
          
          // Check response for authentication errors
          if (anthropicResponse.status === 401 || anthropicResponse.status === 403) {
            return false;
          }
          
          // If we get any response (including rate limits), the key is valid
          return anthropicResponse.status < 500;

        case 'google':
          const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          return googleResponse.ok;

        default:
          return false;
      }
    } catch (error) {
      console.error(`API key validation failed for ${provider}:`, error);
      return false;
    }
  }

  async sendMessage(
    messages: LLMMessage[],
    settings: LLMSettings,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const apiKey = this.getApiKey(settings.model);
      if (!apiKey) {
        throw new Error(`API key not found for model: ${settings.model}`);
      }

      if (settings.model.startsWith('gpt-')) {
        return await this.callOpenAI(messages, settings, apiKey, onChunk);
      } else if (settings.model.startsWith('claude-')) {
        return await this.callAnthropic(messages, settings, apiKey, onChunk);
      } else if (settings.model.startsWith('gemini-')) {
        return await this.callGoogle(messages, settings, apiKey, onChunk);
      } else {
        throw new Error(`Unsupported model: ${settings.model}`);
      }
    } catch (error) {
      console.error('LLM Service Error:', error);
      
      if (error instanceof Error) {
        // Re-throw with more context if it's a network error
        if (error.message.includes('fetch')) {
          throw new Error(`Network error: Failed to connect to API. Please check your internet connection.`);
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred in LLM service');
    }
  }

  private async callOpenAI(
    messages: LLMMessage[],
    settings: LLMSettings,
    apiKey: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.model,
          messages: messages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          top_p: settings.topP,
          stream: !!onChunk,
        }),
      });

      if (!response.ok) {
        let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = `OpenAI API error: ${errorData.error.message}`;
          }
        } catch {
          // Use default error message if JSON parsing fails
        }
        
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded for OpenAI API');
        }
        
        throw new Error(errorMessage);
      }

      if (onChunk) {
        return await this.handleOpenAIStream(response, onChunk);
      } else {
        const data = await response.json();
        return data.choices[0].message.content;
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to fetch: Network connection error');
      }
      throw error;
    }
  }

  private async callAnthropic(
    messages: LLMMessage[],
    settings: LLMSettings,
    apiKey: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const anthropicMessages = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content,
      }));

      const systemMessage = messages.find(m => m.role === 'system')?.content;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.model,
          messages: anthropicMessages,
          system: systemMessage,
          max_tokens: settings.maxTokens,
          temperature: settings.temperature,
          top_p: settings.topP,
          stream: !!onChunk,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Anthropic API error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = `Anthropic API error: ${errorData.error.message}`;
          }
        } catch {
          // Use default error message if JSON parsing fails
        }
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid Anthropic API key');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded for Anthropic API');
        }
        
        throw new Error(errorMessage);
      }

      if (onChunk) {
        return await this.handleAnthropicStream(response, onChunk);
      } else {
        const data = await response.json();
        return data.content[0].text;
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to fetch: Network connection error');
      }
      throw error;
    }
  }

  private async callGoogle(
    messages: LLMMessage[],
    settings: LLMSettings,
    apiKey: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:${onChunk ? 'streamGenerateContent' : 'generateContent'}?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: settings.temperature,
              maxOutputTokens: settings.maxTokens,
              topP: settings.topP,
            },
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = `Google API error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = `Google API error: ${errorData.error.message}`;
          }
        } catch {
          // Use default error message if JSON parsing fails
        }
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid Google API key');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded for Google API');
        }
        
        throw new Error(errorMessage);
      }

      if (onChunk) {
        return await this.handleGoogleStream(response, onChunk);
      } else {
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to fetch: Network connection error');
      }
      throw error;
    }
  }

  private async handleOpenAIStream(
    response: Response,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  private async handleAnthropicStream(
    response: Response,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text;
                if (content) {
                  fullContent += content;
                  onChunk(content);
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  private async handleGoogleStream(
    response: Response,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() && !line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line);
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

}

export const llmService = new LLMService();