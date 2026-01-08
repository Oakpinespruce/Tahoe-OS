/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {GoogleGenAI} from '@google/genai';
import {APP_DEFINITIONS_CONFIG, getSystemPrompt} from '../constants';
import {InteractionData} from '../types';

if (!process.env.API_KEY) {
  console.error('API_KEY not found. OS kernel restricted.');
}

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

export async function* streamAppContent(
  interactionHistory: InteractionData[],
  currentMaxHistoryLength: number,
): AsyncGenerator<string, void, void> {
  const model = 'gemini-3-flash-preview'; 

  if (!process.env.API_KEY) {
    yield `<div class="p-8 text-red-700 bg-red-50 rounded-2xl m-6 border border-red-200">
      <h2 class="font-bold text-xl mb-3">Authentication Failure</h2>
      <p>The OS kernel requires a valid API key to synthesize application views.</p>
    </div>`;
    return;
  }

  const systemPrompt = getSystemPrompt(currentMaxHistoryLength);
  const currentInteraction = interactionHistory[0];
  const isSafari = currentInteraction.appContext === 'web_browser_app';

  let contextSummary = `Action: ${currentInteraction.type} on "${currentInteraction.elementText || currentInteraction.id}".`;
  if (currentInteraction.value) contextSummary += ` Input: "${currentInteraction.value}".`;
  
  const prompt = `${systemPrompt}
  
Current Interaction: ${contextSummary}
App Context: ${currentInteraction.appContext}

${isSafari ? "If the user entered a search query, use Google Search to provide up-to-date information and grounded links." : ""}

Generate the HTML view for the application:`;

  try {
    const config: any = {
      temperature: 0.7,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 0 } // Flash doesn't need high budget for UI rendering
    };
    
    if (isSafari) {
      config.tools = [{googleSearch: {}}];
    }

    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: prompt,
      config: config
    });

    let groundingSent = false;

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }

      // Handle grounding metadata at the end of the stream
      if (chunk.candidates?.[0]?.groundingMetadata && !groundingSent) {
        const metadata = chunk.candidates[0].groundingMetadata;
        const chunks = metadata.groundingChunks || [];
        const webLinks = chunks.filter((c: any) => c.web).map((c: any) => c.web);
        
        if (webLinks.length > 0) {
          groundingSent = true;
          const linksHtml = webLinks.map((link: any) => 
            `<a href="${link.uri}" target="_blank" class="block p-3 hover:bg-black/5 rounded-lg border border-black/5 transition-colors no-underline">
              <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">${new URL(link.uri).hostname}</div>
              <div class="text-sm font-semibold text-blue-600">${link.title || 'Source'}</div>
            </a>`
          ).join('');
          
          yield `<div class="mt-12 p-6 bg-gray-50 border-t border-black/5">
            <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Verified Sources</h3>
            <div class="grid grid-cols-1 gap-2">${linksHtml}</div>
          </div>`;
        }
      }
    }
  } catch (error: any) {
    console.error('Synthesis Error:', error);
    yield `<div class="p-8 text-red-700 bg-red-50 rounded-2xl m-6 border border-red-200">
      <h2 class="font-bold text-xl mb-3">Kernel Runtime Error</h2>
      <p>${error.message || 'The system failed to render this application state.'}</p>
      <button class="os-button mt-4" onclick="location.reload()">Retry Connection</button>
    </div>`;
  }
}