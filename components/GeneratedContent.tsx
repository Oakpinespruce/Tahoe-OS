/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useRef} from 'react';
import {InteractionData} from '../types';

interface GeneratedContentProps {
  htmlContent: string;
  onInteract: (data: InteractionData) => void;
  appContext: string | null;
  isLoading: boolean;
}

export const GeneratedContent: React.FC<GeneratedContentProps> = ({
  htmlContent,
  onInteract,
  appContext,
  isLoading,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const processedHtmlContentRef = useRef<string | null>(null);

  // Advanced sanitization to remove any markdown leakage
  const sanitizeHtml = (raw: string) => {
    let clean = raw.trim();
    
    // Remove all variations of markdown code blocks
    clean = clean.replace(/```html\s*/gi, '');
    clean = clean.replace(/```javascript\s*/gi, '');
    clean = clean.replace(/```\s*/g, '');
    
    // Sometimes the model might output text like "Here is the code:" at the start
    // We only want to start at the first HTML tag
    const firstTagIndex = clean.indexOf('<');
    if (firstTagIndex > 0) {
      clean = clean.substring(firstTagIndex);
    }
    
    return clean;
  };

  const cleanContent = sanitizeHtml(htmlContent);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      let targetElement = event.target as HTMLElement;

      while (
        targetElement &&
        targetElement !== container &&
        !targetElement.dataset.interactionId
      ) {
        targetElement = targetElement.parentElement as HTMLElement;
      }

      if (targetElement && targetElement.dataset.interactionId) {
        event.preventDefault();

        let interactionValue: string | undefined =
          targetElement.dataset.interactionValue;

        if (targetElement.dataset.valueFrom) {
          const inputElement = document.getElementById(
            targetElement.dataset.valueFrom,
          ) as HTMLInputElement | HTMLTextAreaElement;
          if (inputElement) {
            interactionValue = inputElement.value;
          }
        }

        const interactionData: InteractionData = {
          id: targetElement.dataset.interactionId,
          type: targetElement.dataset.interactionType || 'generic_click',
          value: interactionValue,
          elementType: targetElement.tagName.toLowerCase(),
          elementText: (
            targetElement.innerText ||
            (targetElement as HTMLInputElement).value ||
            ''
          )
            .trim()
            .substring(0, 75),
          appContext: appContext,
        };
        onInteract(interactionData);
      }
    };

    container.addEventListener('click', handleClick);

    if (!isLoading) {
      if (cleanContent !== processedHtmlContentRef.current) {
        const scripts = Array.from(container.getElementsByTagName('script'));
        scripts.forEach((oldScript) => {
          try {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) =>
              newScript.setAttribute(attr.name, attr.value),
            );
            newScript.text = oldScript.innerHTML;

            if (oldScript.parentNode) {
              oldScript.parentNode.replaceChild(newScript, oldScript);
            }
          } catch (e) {
            console.error('Error executing script tag:', e);
          }
        });
        processedHtmlContentRef.current = cleanContent;
      }
    } else {
      processedHtmlContentRef.current = null;
    }

    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [cleanContent, onInteract, appContext, isLoading]);

  return (
    <div
      ref={contentRef}
      className="w-full h-full overflow-y-auto"
      dangerouslySetInnerHTML={{__html: cleanContent}}
    />
  );
};