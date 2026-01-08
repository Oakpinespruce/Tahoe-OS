/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React from 'react';

interface WindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  isAppOpen: boolean;
  appId?: string | null;
  onToggleParameters: () => void;
  onExitToDesktop: () => void;
  isParametersPanelOpen?: boolean;
}

const MenuItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({children, onClick, className}) => (
  <span
    className={`px-3 py-1 cursor-pointer hover:bg-black/10 rounded-md transition-colors ${className}`}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onClick?.();
    }}
    tabIndex={0}
    role="button">
    {children}
  </span>
);

export const Window: React.FC<WindowProps> = ({
  title,
  children,
  isAppOpen,
  onToggleParameters,
  onExitToDesktop,
  isParametersPanelOpen,
}) => {
  return (
    <div className="w-[900px] h-[680px] glass rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.4)] flex flex-col relative overflow-hidden font-sans border border-white/50">
      {/* Title Bar */}
      <div className="bg-white/60 h-11 px-4 flex justify-between items-center select-none cursor-default border-b border-black/10 flex-shrink-0">
        <div className="flex gap-2 items-center w-24">
          <div className="traffic-light traffic-red cursor-pointer" onClick={onExitToDesktop}></div>
          <div className="traffic-light traffic-yellow"></div>
          <div className="traffic-light traffic-green"></div>
        </div>
        
        <span className="text-[14px] font-bold text-gray-900 absolute left-1/2 -translate-x-1/2 drop-shadow-sm">
          {title}
        </span>
        
        <div className="w-24"></div>
      </div>

      {/* Menu Bar */}
      <div className="bg-white/30 py-1.5 px-4 border-b border-black/10 select-none flex gap-2 flex-shrink-0 text-[13px] text-gray-800 items-center font-semibold">
        {!isParametersPanelOpen && (
          <MenuItem onClick={onToggleParameters}>
            Parameters
          </MenuItem>
        )}
        <MenuItem>Edit</MenuItem>
        <MenuItem>View</MenuItem>
        <MenuItem>Window</MenuItem>
        <MenuItem>Help</MenuItem>
        
        {isAppOpen && (
          <MenuItem onClick={onExitToDesktop} className="ml-auto text-blue-700 font-bold hover:bg-blue-50">
            Done
          </MenuItem>
        )}
      </div>

      {/* Content Container - Higher contrast background */}
      <div className="flex-grow overflow-hidden bg-white/95">
        {children}
      </div>
    </div>
  );
};