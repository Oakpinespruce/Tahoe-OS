/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';
import {AppDefinition} from '../types';

interface IconProps {
  app: AppDefinition;
  onInteract: () => void;
}

export const Icon: React.FC<IconProps> = ({app, onInteract}) => {
  return (
    <div
      className="flex flex-col items-center justify-start text-center p-2 cursor-pointer select-none rounded-xl transition-all hover:bg-white/20 active:scale-95 group"
      onClick={onInteract}
      onKeyDown={(e) => e.key === 'Enter' && onInteract()}
      tabIndex={0}
      role="button"
      aria-label={`Open ${app.name}`}>
      <div className="w-16 h-16 bg-white rounded-[14px] flex items-center justify-center shadow-md mb-2 border border-white/50 overflow-hidden group-hover:shadow-lg transition-shadow">
        <div className="text-4xl">{app.icon}</div>
      </div>
      <div className="text-[12px] text-white font-bold drop-shadow-md break-words max-w-full leading-tight">
        {app.name}
      </div>
    </div>
  );
};