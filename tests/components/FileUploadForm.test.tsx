import { render, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FileUploadForm from '../../components/FileUploadForm';
import type { TrackInfo } from '../../types';

const baseMetadata: TrackInfo = {
  title: '',
  artist: '',
  album: '',
  genre: '',
  duration: 180,
  imageURL: '',
};

describe('FileUploadForm', () => {
  const defaultHandlers = {
    onFileChange: vi.fn(),
    onInputChange: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('disables submit and hides metadata fields without a file', () => {
    render(
      <FileUploadForm
        selectedFile={null}
        metadata={baseMetadata}
        uploading={false}
        {...defaultHandlers}
      />,
    );

    expect(screen.getByRole('button', { name: /upload/i })).toBeDisabled();
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  it('renders metadata inputs and forwards events when a file is present', () => {
    const selectedFile = new File(['audio'], 'demo.mp3', {
      type: 'audio/mpeg',
    });
    const handlers = {
      onFileChange: vi.fn(),
      onInputChange: vi.fn(),
      onSubmit: vi.fn(),
    };

    render(
      <FileUploadForm
        selectedFile={selectedFile}
        metadata={{ ...baseMetadata, title: 'Demo', duration: 183 }}
        uploading={false}
        {...handlers}
      />,
    );

    expect(screen.getByText('demo.mp3')).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toHaveValue('3:03');

    fireEvent.change(screen.getByLabelText(/mp3, wav/i), {
      target: { files: [selectedFile] },
    });
    expect(handlers.onFileChange).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Updated title' },
    });
    expect(handlers.onInputChange).toHaveBeenCalled();

    const form = screen
      .getByRole('button', { name: /upload/i })
      .closest('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);
    expect(handlers.onSubmit).toHaveBeenCalled();
  });
});
