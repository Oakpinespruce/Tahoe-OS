/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {GoogleGenAI} from '@google/genai';
import {APP_DEFINITIONS_CONFIG, getSystemPrompt} from '../constants';
import {InteractionData} from '../types';

if (!process.env.API_KEY) {
  console.error(
    'API_KEY environment variable is not set. The application will not be able to connect to the Gemini API.',
  );
}

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

export async function* streamAppContent(
  interactionHistory: InteractionData[],
  currentMaxHistoryLength: number,
): AsyncGenerator<string, void, void> {
  const model = 'gemini-3-flash-preview'; 

  if (!process.env.API_KEY) {
    yield `<div class="p-6 text-red-700 bg-red-100 rounded-lg m-4 border border-red-300 shadow-sm">
      <p class="font-bold text-xl">System Configuration Error</p>
      <p class="mt-2">The kernel requires an API_KEY to initialize this module.</p>
    </div>`;
    return;
  }

  if (interactionHistory.length === 0) {
    yield `<div class="p-4 text-orange-700 bg-orange-100 rounded-lg">
      <p class="font-bold">No interaction data provided.</p>
    </div>`;
    return;
  }

  const systemPrompt = getSystemPrompt(currentMaxHistoryLength);

  const currentInteraction = interactionHistory[0];
  const pastInteractions = interactionHistory.slice(1);

  const currentElementName =
    currentInteraction.elementText ||
    currentInteraction.id ||
    'Unknown Element';
  
  let currentInteractionSummary = `Current User Interaction: Clicked on '${currentElementName}' (Type: ${currentInteraction.type || 'N/A'}, ID: ${currentInteraction.id || 'N/A'}).`;
  if (currentInteraction.value) {
    currentInteractionSummary += ` Associated value entered: '${currentInteraction.value}'.`;
  }

  const currentAppDef = APP_DEFINITIONS_CONFIG.find(
    (app) => app.id === currentInteraction.appContext,
  );
  
  const currentAppContext = currentInteraction.appContext
    ? `Current App Context: '${currentAppDef?.name || currentInteraction.appContext}'.`
    : 'No specific app context for current interaction.';

  let historyPromptSegment = '';
  if (pastInteractions.length > 0) {
    const numPrevInteractionsToMention =
      currentMaxHistoryLength - 1 > 0 ? currentMaxHistoryLength - 1 : 0;
    historyPromptSegment = `\n\nPrevious User Interactions (up to ${numPrevInteractionsToMention} most recent):`;

    pastInteractions.forEach((interaction, index) => {
      const pastElementName =
        interaction.elementText || interaction.id || 'Unknown Element';
      const appDef = APP_DEFINITIONS_CONFIG.find(
        (app) => app.id === interaction.appContext,
      );
      const appName = interaction.appContext
        ? appDef?.name || interaction.appContext
        : 'N/A';
      historyPromptSegment += `\n${index + 1}. (App: ${appName}) Clicked '${pastElementName}' (Type: ${interaction.type || 'N/A'}, ID: ${interaction.id || 'N/A'})`;
      if (interaction.value) {
        historyPromptSegment += ` with value '${interaction.value.substring(0, 50)}'`;
      }
      historyPromptSegment += '.';
    });
  }

  const isBrowser = currentInteraction.appContext === 'web_browser_app';

  const fullPrompt = `${systemPrompt}

${currentInteractionSummary}
${currentAppContext}
${historyPromptSegment}

${isBrowser ? "You are Safari. If the user provided a search query or URL in the interaction value, use the Google Search tool to find real-time information and display it as a functional web page with actual sources and links." : ""}

Generate the high-contrast HTML content for the window's content area:`;

  try {
    const config: any = {};
    if (isBrowser) {
      config.tools = [{googleSearch: {}}];
    }

    const response = await ai.models.generateContentStream({
      model: model,
      contents: fullPrompt,
      config: config
    });

    let hasGroundingMetadata = false;

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
      
      // In a stream, grounding metadata might arrive at the end
      if (chunk.candidates?.[0]?.groundingMetadata && !hasGroundingMetadata) {
        const metadata = chunk.candidates[0].groundingMetadata;
        if (metadata.groundingChunks && metadata.groundingChunks.length > 0) {
          hasGroundingMetadata = true;
          const links = metadata.groundingChunks
            .filter((c: any) => c.web)
            .map((c: any) => `<a href="${c.web.uri}" target="_blank" class="text-blue-600 underline block text-xs mt-1">${c.web.title || c.web.uri}</a>`)
            .join('');
          
          if (links) {
            yield `<div class="mt-8 p-4 bg-gray-50 border-t border-gray-200"><p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sources from the web</p>${links}</div>`;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error streaming from Gemini:', error);
    yield `<div class="p-6 text-red-700 bg-red-100 rounded-lg m-4 border border-red-300">
      <p class="font-bold text-lg">Kernel Execution Fault</p>
      <p class="mt-2">The system encountered an error during UI synthesis. Please check your network connection.</p>
    </div>`;
  }
}