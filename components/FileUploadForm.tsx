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
    <form onSubmit={onSubmit}>
      <div className="mb-4">
        <label
          htmlFor="file"
          className="block text-textLight dark:text-textDark font-medium mb-2"
        >
          Select Audio File
          <input
            id="file"
            type="file"
            accept="audio/*"
            onChange={onFileChange}
            className="w-full text-textLight dark:text-textDark"
            required
          />
        </label>
      </div>
      {selectedFile && (
        <>
          {trackInfoKeys.map((field) => (
            <InputField
              key={field as string}
              name={field as string}
              value={metadata[field] as string}
              onChange={onInputChange}
              readOnly={field === 'duration'}
            />
          ))}
        </>
      )}
      <button
        type="submit"
        className="w-full py-2 px-4 bg-accentLight dark:bg-accentDark text-white rounded-md hover:bg-opacity-90 focus:outline-none"
        disabled={!selectedFile || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}

export default FileUploadForm;
