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
  const hasFile = Boolean(selectedFile);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm sm:text-base text-textLight dark:text-textDark font-medium">
          Select audio file
        </p>
        <label
          htmlFor="file"
          className="group relative block w-full rounded-2xl border border-dashed border-borderLight dark:border-borderDark bg-panelLightAlt dark:bg-panelDark px-4 py-6 text-center cursor-pointer hover:border-accentLight/70 hover:shadow-glass transition-all"
        >
          <input
            id="file"
            type="file"
            accept="audio/mpeg, audio/wav, audio/ogg"
            onChange={onFileChange}
            className="hidden"
            required
          />
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pastelPurple to-accentLight text-white flex items-center justify-center shadow-soft">
              <span className="text-lg font-semibold">+</span>
            </div>
            <p className="text-sm text-ink dark:text-textDark font-semibold">
              {hasFile ? selectedFile?.name : 'Drop or browse your track'}
            </p>
            <p className="text-xs text-muted">
              MP3, WAV, or OGG • 100MB max • keep your cover art
            </p>
          </div>
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
        className="w-full py-3 px-4 bg-gradient-to-r from-pastelPurple to-accentLight text-white text-sm sm:text-base font-semibold rounded-full shadow-soft hover:shadow-glass focus:outline-none focus:ring-2 focus:ring-accentLight/40 transition-all duration-300"
        disabled={!selectedFile || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}

export default FileUploadForm;
