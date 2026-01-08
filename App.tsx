/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useCallback, useEffect, useState} from 'react';
import {GeneratedContent} from './components/GeneratedContent';
import {Icon} from './components/Icon';
import {ParametersPanel} from './components/ParametersPanel';
import {Window} from './components/Window';
import {APP_DEFINITIONS_CONFIG, INITIAL_MAX_HISTORY_LENGTH} from './constants';
import {streamAppContent} from './services/geminiService';
import {AppDefinition, InteractionData} from './types';

const DesktopView: React.FC<{onAppOpen: (app: AppDefinition) => void}> = ({
  onAppOpen,
}) => (
  <div className="grid grid-cols-6 content-start gap-4 p-8 w-full h-full overflow-y-auto">
    {APP_DEFINITIONS_CONFIG.map((app) => (
      <Icon key={app.id} app={app} onInteract={() => onAppOpen(app)} />
    ))}
  </div>
);

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<AppDefinition | null>(null);
  const [previousActiveApp, setPreviousActiveApp] =
    useState<AppDefinition | null>(null);
  const [llmContent, setLlmContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [interactionHistory, setInteractionHistory] = useState<
    InteractionData[]
  >([]);
  const [isParametersOpen, setIsParametersOpen] = useState<boolean>(false);
  const [currentMaxHistoryLength, setCurrentMaxHistoryLength] =
    useState<number>(INITIAL_MAX_HISTORY_LENGTH);

  const [isStatefulnessEnabled, setIsStatefulnessEnabled] =
    useState<boolean>(false);
  const [appContentCache, setAppContentCache] = useState<
    Record<string, string>
  >({});
  const [currentAppPath, setCurrentAppPath] = useState<string[]>([]);

  const internalHandleLlmRequest = useCallback(
    async (historyForLlm: InteractionData[], maxHistoryLength: number) => {
      if (historyForLlm.length === 0) {
        setError('No interaction data to process.');
        return;
      }

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
        setError('Kernel Panic: Failed to sync system content.');
        console.error(e);
        accumulatedContent = `<div class="p-6 text-red-600 bg-red-50 rounded-lg m-4 border border-red-200 shadow-sm">
          <h2 class="font-bold text-lg mb-2">Kernel Extension Error</h2>
          <p class="text-sm">The OS failed to render the application view. Please try again.</p>
        </div>`;
        setLlmContent(accumulatedContent);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (
      !isLoading &&
      currentAppPath.length > 0 &&
      isStatefulnessEnabled &&
      llmContent
    ) {
      const cacheKey = currentAppPath.join('__');
      if (appContentCache[cacheKey] !== llmContent) {
        setAppContentCache((prevCache) => ({
          ...prevCache,
          [cacheKey]: llmContent,
        }));
      }
    }
  }, [llmContent, isLoading, currentAppPath, isStatefulnessEnabled, appContentCache]);

  const handleInteraction = useCallback(
    async (interactionData: InteractionData) => {
      if (interactionData.id === 'app_close_button') {
        handleCloseAppView();
        return;
      }

      const newHistory = [
        interactionData,
        ...interactionHistory.slice(0, currentMaxHistoryLength - 1),
      ];
      setInteractionHistory(newHistory);

      const newPath = activeApp
        ? [...currentAppPath, interactionData.id]
        : [interactionData.id];
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
      id: app.id,
      type: 'app_open',
      elementText: app.name,
      elementType: 'icon',
      appContext: app.id,
    };

    const newHistory = [initialInteraction];
    setInteractionHistory(newHistory);

    const appPath = [app.id];
    setCurrentAppPath(appPath);
    const cacheKey = appPath.join('__');

    if (isParametersOpen) {
      setIsParametersOpen(false);
    }
    setActiveApp(app);
    setLlmContent('');
    setError(null);

    if (isStatefulnessEnabled && appContentCache[cacheKey]) {
      setLlmContent(appContentCache[cacheKey]);
      setIsLoading(false);
    } else {
      internalHandleLlmRequest(newHistory, currentMaxHistoryLength);
    }
  };

  const handleCloseAppView = () => {
    setActiveApp(null);
    setLlmContent('');
    setError(null);
    setInteractionHistory([]);
    setCurrentAppPath([]);
  };

  const handleToggleParametersPanel = () => {
    setIsParametersOpen((prevIsOpen) => {
      const nowOpeningParameters = !prevIsOpen;
      if (nowOpeningParameters) {
        setPreviousActiveApp(activeApp);
        setActiveApp(null);
        setLlmContent('');
        setError(null);
      } else {
        setPreviousActiveApp(null);
        setActiveApp(null);
        setLlmContent('');
        setError(null);
        setInteractionHistory([]);
        setCurrentAppPath([]);
      }
      return nowOpeningParameters;
    });
  };

  const handleUpdateHistoryLength = (newLength: number) => {
    setCurrentMaxHistoryLength(newLength);
    setInteractionHistory((prev) => prev.slice(0, newLength));
  };

  const handleSetStatefulness = (enabled: boolean) => {
    setIsStatefulnessEnabled(enabled);
    if (!enabled) {
      setAppContentCache({});
    }
  };

  const windowTitle = isParametersOpen
    ? 'System Settings'
    : activeApp
      ? activeApp.name
      : 'Tahoe Finder';

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Window
        title={windowTitle}
        onClose={handleCloseAppView}
        isAppOpen={!!activeApp && !isParametersOpen}
        appId={activeApp?.id}
        onToggleParameters={handleToggleParametersPanel}
        onExitToDesktop={handleCloseAppView}
        isParametersPanelOpen={isParametersOpen}>
        <div className="w-full h-full relative">
          {isParametersOpen ? (
            <ParametersPanel
              currentLength={currentMaxHistoryLength}
              onUpdateHistoryLength={handleUpdateHistoryLength}
              onClosePanel={handleToggleParametersPanel}
              isStatefulnessEnabled={isStatefulnessEnabled}
              onSetStatefulness={handleSetStatefulness}
            />
          ) : !activeApp ? (
            <DesktopView onAppOpen={handleAppOpen} />
          ) : (
            <div className="h-full w-full flex flex-col">
              {isLoading && llmContent.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                    <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                    <div className="h-3 w-3 bg-blue-300 rounded-full"></div>
                  </div>
                </div>
              )}
              {error && (
                <div className="p-6 text-red-600 bg-red-50 rounded-md m-4 border border-red-200">
                  {error}
                </div>
              )}
              {(!isLoading || llmContent) && (
                <GeneratedContent
                  htmlContent={llmContent}
                  onInteract={handleInteraction}
                  appContext={activeApp.id}
                  isLoading={isLoading}
                />
              )}
            </div>
          )}
        </div>
      </Window>
    </div>
  );
};

export default App;