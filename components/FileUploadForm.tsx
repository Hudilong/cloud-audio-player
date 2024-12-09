import { ChangeEvent, FormEvent } from "react";
import InputField from "./InputField";
import { TrackInfo } from "@/types";

const trackInfoKeys: (keyof TrackInfo)[] = [
  "title",
  "artist",
  "album",
  "genre",
  "duration",
];

const FileUploadForm = ({
  selectedFile,
  metadata,
  uploading,
  onFileChange,
  onInputChange,
  onSubmit,
}: {
  selectedFile: File | null;
  metadata: TrackInfo;
  uploading: boolean;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
}) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="mb-4">
        <label className="block text-textLight dark:text-textDark font-medium mb-2">
          Select Audio File
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={onFileChange}
          className="w-full text-textLight dark:text-textDark"
          required
        />
      </div>
      {selectedFile && (
        <>
          {trackInfoKeys.map((field) => (
            <InputField
              key={field}
              name={field}
              value={metadata[field] as keyof TrackInfo}
              onChange={onInputChange}
              readOnly={field === "duration"}
            />
          ))}
        </>
      )}
      <button
        type="submit"
        className="w-full py-2 px-4 bg-accentLight dark:bg-accentDark text-white rounded-md hover:bg-opacity-90 focus:outline-none"
        disabled={!selectedFile || uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
};

export default FileUploadForm;
