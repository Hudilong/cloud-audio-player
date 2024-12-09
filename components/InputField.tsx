import { ChangeEvent } from 'react';
import { formatTime } from '../utils/formatTime';

interface InputProps {
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}

export default function InputField({
  name,
  value,
  onChange,
  readOnly = false,
}: InputProps) {
  return (
    <div className="mb-4">
      <label
        htmlFor="name"
        className="block text-textLight dark:text-textDark font-medium mb-2 capitalize"
      >
        {name}
        <input
          id="name"
          type="text"
          name={name}
          value={
            name === 'duration' ? formatTime(value as unknown as number) : value
          }
          onChange={onChange}
          readOnly={readOnly}
          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accentLight dark:focus:ring-accentDark"
          required={!readOnly}
        />
      </label>
    </div>
  );
}
