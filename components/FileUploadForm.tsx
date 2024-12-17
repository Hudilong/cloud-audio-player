import { ChangeEvent, FormEvent } from 'react';
import { TrackInfo } from '../types';
import InputField from './InputField';

interface FileUploadFormProps {
  selectedFile: File | null;
  metadata: TrackInfo;
  uploading: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
}

const trackInfoKeys: (keyof TrackInfo)[] = [
  'title',
  'artist',
  'album',
  'genre',
  'duration',
];

function FileUploadForm({
  selectedFile,
  metadata,
  uploading,
  onFileChange,
  onInputChange,
  onSubmit,
}: FileUploadFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* File Input */}
      <div>
        <label
          htmlFor="file"
          className="block text-sm sm:text-base text-textLight dark:text-textDark font-medium mb-2"
        >
          Select Audio File
          <input
            id="file"
            type="file"
            accept="audio/mpeg, audio/wav, audio/ogg"
            onChange={onFileChange}
            className="w-full p-2 sm:p-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accentLight dark:focus:ring-accentDark"
            required
          />
        </label>
      </div>

      {/* Input Fields */}
      {selectedFile &&
        trackInfoKeys.map((field) => (
          <InputField
            key={field}
            name={field}
            value={metadata[field] as string}
            onChange={onInputChange}
            readOnly={field === 'duration'}
          />
        ))}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-2 sm:py-3 px-4 bg-accentLight dark:bg-accentDark text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-accentLight dark:focus:ring-accentDark transition-all duration-300"
        disabled={!selectedFile || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}

export default FileUploadForm;
