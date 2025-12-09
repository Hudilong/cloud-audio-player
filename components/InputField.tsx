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
  const fieldId = `field-${name}`;

  return (
    <div className="mb-4">
      <label
        htmlFor={fieldId}
        className="block text-textLight dark:text-textDark font-medium mb-2 capitalize"
      >
        {name}
        <input
          id={fieldId}
          type="text"
          name={name}
          value={
            name === 'duration' ? formatTime(value as unknown as number) : value
          }
          onChange={onChange}
          readOnly={readOnly}
          className="w-full px-3 py-3 bg-white/80 dark:bg-backgroundDark/70 border border-white/70 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accentLight/40"
          required={!readOnly}
        />
      </label>
    </div>
  );
}
