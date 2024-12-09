import { TrackInfo } from '@/types';
import { ChangeEvent } from 'react';
import { formatTime } from '../utils/formatTime';

const InputField = ({
  name,
  value,
  onChange,
  readOnly = false,
}: {
  name: string;
  value: keyof TrackInfo;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}) => (
  <div className="mb-4">
    <label className="block text-textLight dark:text-textDark font-medium mb-2 capitalize">
      {name}
    </label>
    <input
      type="text"
      name={name}
      value={name === 'duration' ? formatTime(value) : value}
      onChange={onChange}
      readOnly={readOnly}
      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accentLight dark:focus:ring-accentDark"
      required={!readOnly}
    />
  </div>
);

export default InputField;
