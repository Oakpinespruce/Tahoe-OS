/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useState} from 'react';

interface ParametersPanelProps {
  currentLength: number;
  onUpdateHistoryLength: (newLength: number) => void;
  onClosePanel: () => void;
  isStatefulnessEnabled: boolean;
  onSetStatefulness: (enabled: boolean) => void;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  currentLength,
  onUpdateHistoryLength,
  onClosePanel,
  isStatefulnessEnabled,
  onSetStatefulness,
}) => {
  const [localHistoryLengthInput, setLocalHistoryLengthInput] =
    useState<string>(currentLength.toString());
  const [localStatefulnessChecked, setLocalStatefulnessChecked] =
    useState<boolean>(isStatefulnessEnabled);

  useEffect(() => {
    setLocalHistoryLengthInput(currentLength.toString());
  }, [currentLength]);

  useEffect(() => {
    setLocalStatefulnessChecked(isStatefulnessEnabled);
  }, [isStatefulnessEnabled]);

  const handleHistoryLengthInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setLocalHistoryLengthInput(event.target.value);
  };

  const handleStatefulnessCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setLocalStatefulnessChecked(event.target.checked);
  };

  const handleApplyParameters = () => {
    const newLength = parseInt(localHistoryLengthInput, 10);
    if (!isNaN(newLength) && newLength >= 0 && newLength <= 10) {
      onUpdateHistoryLength(newLength);
    } else {
      alert('Please enter a number between 0 and 10 for memory depth.');
      setLocalHistoryLengthInput(currentLength.toString());
      return;
    }

    if (localStatefulnessChecked !== isStatefulnessEnabled) {
      onSetStatefulness(localStatefulnessChecked);
    }

    onClosePanel();
  };

  const handleClose = () => {
    setLocalHistoryLengthInput(currentLength.toString());
    setLocalStatefulnessChecked(isStatefulnessEnabled);
    onClosePanel();
  };

  return (
    <div className="p-6 bg-gray-50 h-full flex flex-col items-start pt-8">
      <div className="w-full max-w-md mb-6">
        <div className="os-row items-center">
          <label
            htmlFor="maxHistoryLengthInput"
            className="os-label whitespace-nowrap mr-3 flex-shrink-0"
            style={{minWidth: '150px'}}>
            Interaction Memory:
          </label>
          <input
            type="number"
            id="maxHistoryLengthInput"
            value={localHistoryLengthInput}
            onChange={handleHistoryLengthInputChange}
            min="0"
            max="10"
            className="os-input flex-grow"
          />
        </div>
      </div>

      <div className="w-full max-w-md mb-4">
        <div className="os-row items-center">
          <label
            htmlFor="statefulnessCheckbox"
            className="os-label whitespace-nowrap mr-3 flex-shrink-0"
            style={{minWidth: '150px'}}>
            Persistent Session:
          </label>
          <input
            type="checkbox"
            id="statefulnessCheckbox"
            checked={localStatefulnessChecked}
            onChange={handleStatefulnessCheckboxChange}
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-6 w-full max-w-md flex justify-start gap-3">
        <button
          onClick={handleApplyParameters}
          className="os-button"
          aria-label="Save changes">
          Save Settings
        </button>
        <button
          onClick={handleClose}
          className="os-button bg-gray-500 hover:bg-gray-600 active:bg-gray-700"
          aria-label="Discard changes">
          Discard
        </button>
      </div>
    </div>
  );
};