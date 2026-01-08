/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useCallback, useEffect, useState} from 'react';
import {GeneratedContent} from './components/GeneratedContent';
import {ParametersPanel} from './components/ParametersPanel';
import {Window} from './components/Window';
import {APP_DEFINITIONS_CONFIG, INITIAL_MAX_HISTORY_LENGTH} from './constants';
import {streamAppContent} from './services/geminiService';
import {AppDefinition, InteractionData} from './types';

const Dock: React.FC<{onAppOpen: (app: AppDefinition) => void; activeAppId?: string}> = ({onAppOpen, activeAppId}) => (
  <div className="dock">
    {APP_DEFINITIONS_CONFIG.map((app) => (
      <div 
        key={`dock-${app.id}`} 
        className={`dock-item group ${activeAppId === app.id ? 'after:content-[""] after:absolute after:-bottom-1.5 after:w-1 after:h-1 after:bg-white after:rounded-full' : ''}`}
        onClick={() => onAppOpen(app)}
      >
        <span className="text-3xl select-none">{app.icon}</span>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-[11px] font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
          {app.name}
        </div>
      </div>
    ))}
  </div>
);

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<AppDefinition | null>(null);
  const [llmContent, setLlmContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionHistory, setInteractionHistory] = useState<InteractionData[]>([]);
  const [isParametersOpen, setIsParametersOpen] = useState<boolean>(false);
  const [currentMaxHistoryLength, setCurrentMaxHistoryLength] = useState<number>(INITIAL_MAX_HISTORY_LENGTH);
  const [isStatefulnessEnabled, setIsStatefulnessEnabled] = useState<boolean>(true);
  const [appContentCache, setAppContentCache] = useState<Record<string, string>>({});
  const [currentAppPath, setCurrentAppPath] = useState<string[]>([]);

  const internalHandleLlmRequest = useCallback(
    async (historyForLlm: InteractionData[], maxHistoryLength: number) => {
      if (historyForLlm.length === 0) return;

      setIsLoading(true);
      setError(null);
      let accumulatedContent = '';

      try {
        const stream = streamAppContent(historyForLlm, maxHistoryLength);
        for await (const chunk of stream) {
          accumulatedContent += chunk;
          setLlmContent((prev) => prev + chunk);
        }
      } catch (e: any) {
        setError('System Panic: Synthesis failed.');
        console.error(e);
        setLlmContent(`<div class="p-10 text-center">
          <div class="text-4xl mb-4">⚠️</div>
          <h2 class="font-bold text-xl mb-2 text-black">System Rendering Error</h2>
          <p class="text-gray-600 text-sm mb-6">The Tahoe OS kernel could not generate this interface.</p>
          <button class="os-button" onclick="location.reload()">Reboot System</button>
        </div>`);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isLoading && currentAppPath.length > 0 && isStatefulnessEnabled && llmContent) {
      const cacheKey = currentAppPath.join('__');
      if (appContentCache[cacheKey] !== llmContent) {
        setAppContentCache((prevCache) => ({ ...prevCache, [cacheKey]: llmContent }));
      }
    }
  }, [llmContent, isLoading, currentAppPath, isStatefulnessEnabled, appContentCache]);

  const handleInteraction = useCallback(
    async (interactionData: InteractionData) => {
      const newHistory = [
        interactionData,
        ...interactionHistory.slice(0, currentMaxHistoryLength - 1),
      ];
      setInteractionHistory(newHistory);

      const newPath = activeApp ? [...currentAppPath, interactionData.id] : [interactionData.id];
      setCurrentAppPath(newPath);
      const cacheKey = newPath.join('__');

      setLlmContent('');
      setError(null);

      if (isStatefulnessEnabled && appContentCache[cacheKey]) {
        setLlmContent(appContentCache[cacheKey]);
        setIsLoading(false);
      } else {
        internalHandleLlmRequest(newHistory, currentMaxHistoryLength);
      }
    },
    [interactionHistory, internalHandleLlmRequest, activeApp, currentMaxHistoryLength, currentAppPath, isStatefulnessEnabled, appContentCache],
  );

  const handleAppOpen = (app: AppDefinition) => {
    const initialInteraction: InteractionData = {
      id: `app_launch_${app.id}`,
      type: 'app_open',
      elementText: app.name,
      elementType: 'icon',
      appContext: app.id,
    };

    setInteractionHistory([initialInteraction]);
    setCurrentAppPath([app.id]);
    
    if (isParametersOpen) setIsParametersOpen(false);
    setActiveApp(app);
    setLlmContent('');
    setError(null);

    const cacheKey = [app.id].join('__');
    if (isStatefulnessEnabled && appContentCache[cacheKey]) {
      setLlmContent(appContentCache[cacheKey]);
      setIsLoading(false);
    } else {
      internalHandleLlmRequest([initialInteraction], currentMaxHistoryLength);
    }
  };

  const handleCloseAppView = () => {
    setActiveApp(null);
    setLlmContent('');
    setError(null);
    setInteractionHistory([]);
    setCurrentAppPath([]);
    setIsParametersOpen(false);
  };

  const handleToggleParametersPanel = () => {
    setIsParametersOpen((prev) => !prev);
    if (!isParametersOpen) {
      setActiveApp(null);
      setLlmContent('');
    }
  };

  const windowTitle = isParametersOpen ? 'System Preferences' : activeApp ? activeApp.name : '';

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      {/* Background Graphic (The "Mac-like picture") is handled via body CSS */}
      
      {(activeApp || isParametersOpen) && (
        <Window
          title={windowTitle}
          onClose={handleCloseAppView}
          isAppOpen={!!activeApp && !isParametersOpen}
          appId={activeApp?.id}
          onToggleParameters={handleToggleParametersPanel}
          onExitToDesktop={handleCloseAppView}
          isParametersPanelOpen={isParametersOpen}>
          <div className="w-full h-full bg-white flex flex-col overflow-hidden">
            {isParametersOpen ? (
              <ParametersPanel
                currentLength={currentMaxHistoryLength}
                onUpdateHistoryLength={setCurrentMaxHistoryLength}
                onClosePanel={handleToggleParametersPanel}
                isStatefulnessEnabled={isStatefulnessEnabled}
                onSetStatefulness={setIsStatefulnessEnabled}
              />
            ) : (
              <div className="h-full w-full flex flex-col os-content-area">
                {isLoading && llmContent.length === 0 && (
                  <div className="flex flex-col justify-center items-center h-full gap-5">
                    <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-blue-500 border-t-transparent"></div>
                    <span className="text-sm font-semibold text-gray-400">Tahoe OS Loading...</span>
                  </div>
                )}
                {error && (
                  <div className="p-10 text-center">
                    <h2 className="font-bold text-xl mb-4 text-red-600">Kernel Error</h2>
                    <p className="text-gray-600">{error}</p>
                  </div>
                )}
                {(!isLoading || llmContent) && (
                  <GeneratedContent
                    htmlContent={llmContent}
                    onInteract={handleInteraction}
                    appContext={activeApp?.id || null}
                    isLoading={isLoading}
                  />
                )}
              </div>
            )}
          </div>
        </Window>
      )}
      
      <Dock onAppOpen={handleAppOpen} activeAppId={activeApp?.id} />
    </div>
  );
};

export default App;