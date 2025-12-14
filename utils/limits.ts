const MB = 1024 * 1024;

const parseEnvInt = (value: string | undefined, fallback: number) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const AUDIO_UPLOAD_LIMIT_BYTES = parseEnvInt(
  process.env.MAX_AUDIO_UPLOAD_BYTES,
  25 * MB,
);

export const COVER_UPLOAD_LIMIT_BYTES = parseEnvInt(
  process.env.MAX_COVER_UPLOAD_BYTES,
  8 * MB,
);

export const DAILY_TRACK_UPLOAD_LIMIT = parseEnvInt(
  process.env.DAILY_TRACK_UPLOAD_LIMIT,
  25,
);

export const TOTAL_TRACK_UPLOAD_LIMIT = parseEnvInt(
  process.env.TOTAL_TRACK_UPLOAD_LIMIT,
  250,
);

export const MAX_TRACK_DURATION_SECONDS = parseEnvInt(
  process.env.MAX_TRACK_DURATION_SECONDS,
  15 * 60,
);

export const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
};
