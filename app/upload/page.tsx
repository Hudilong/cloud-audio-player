"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { parseBlob } from "music-metadata-browser";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FileUploadForm from "../../components/FileUploadForm";
import { TrackInfo } from "@/types";

const UploadPage = () => {
  const { status } = useSession();
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [trackInfo, setTrackInfo] = useState<TrackInfo>({
    title: "",
    artist: "",
    album: "",
    duration: 0,
    genre: "",
    imageURL: "",
  });
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try {
        const metadata = await extractMetadata(file);
        setTrackInfo(metadata);
      } catch (err) {
        setError("Failed to extract metadata.");
        console.error(err);
      }
    }
  };

  const extractMetadata = async (file: File): Promise<TrackInfo> => {
    try {
      const metadataResult = await parseBlob(file);

      // Extract metadata fields
      const durationInSeconds = metadataResult.format.duration || 0;

      return {
        title: metadataResult.common.title || "",
        artist: metadataResult.common.artist || "",
        album: metadataResult.common.album || "",
        imageURL: null,
        genre: metadataResult.common.genre?.[0] || "", // Optional genre handling
        duration: Math.floor(durationInSeconds), // Return duration as a number
      };
    } catch (error) {
      console.error("Error extracting metadata:", error);
      throw error;
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setTrackInfo({ ...trackInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("No file selected");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch("/api/tracks/upload-url", {
        method: "POST",
        body: JSON.stringify({
          name: selectedFile.name,
          type: selectedFile.type,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const { uploadURL, key, error } = await response.json();
      if (error) throw new Error(error);

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });
      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      const saveResponse = await fetch("/api/tracks", {
        method: "POST",
        body: JSON.stringify({
          ...trackInfo,
          s3Key: key,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (!saveResponse.ok) throw new Error("Failed to save metadata");

      resetForm();
      router.push("/library");
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTrackInfo({
      title: "",
      artist: "",
      album: "",
      duration: 0,
      genre: "",
    });
  };

  return (
    <div className="h-full bg-backgroundLight dark:bg-backgroundDark flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft">
        <h1 className="text-2xl font-bold text-center text-textLight dark:text-textDark mb-4">
          Upload Track
        </h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <FileUploadForm
          selectedFile={selectedFile}
          metadata={trackInfo}
          uploading={uploading}
          onFileChange={handleFileChange}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default UploadPage;
