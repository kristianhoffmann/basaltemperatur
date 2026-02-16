'use client';

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X, File, Image, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void> | void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onUpload,
  accept = '*',
  multiple = false,
  maxSize = 10, // 10MB default
  maxFiles = 5,
  label,
  hint,
  error,
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFiles = (files: File[]): { valid: File[]; error: string | null } => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    const validFiles: File[] = [];
    let errorMessage: string | null = null;

    for (const file of files) {
      if (file.size > maxSizeBytes) {
        errorMessage = `Datei "${file.name}" ist zu groß. Maximale Größe: ${maxSize}MB`;
        continue;
      }
      validFiles.push(file);
    }

    if (!multiple && validFiles.length > 1) {
      validFiles.splice(1);
    }

    if (validFiles.length > maxFiles) {
      errorMessage = `Maximal ${maxFiles} Dateien erlaubt`;
      validFiles.splice(maxFiles);
    }

    return { valid: validFiles, error: errorMessage };
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const { valid, error: validationError } = validateFiles(files);

    if (validationError) {
      setUploadError(validationError);
    } else {
      setUploadError(null);
    }

    if (valid.length > 0) {
      try {
        setIsUploading(true);
        await onUpload(valid);
      } catch (err) {
        setUploadError('Fehler beim Hochladen');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const displayError = error || uploadError;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'px-6 py-10 rounded-xl border-2 border-dashed',
          'transition-colors cursor-pointer',
          isDragging && 'border-primary-500 bg-primary-50',
          !isDragging && !displayError && 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
          displayError && 'border-red-500 bg-red-50',
          disabled && 'opacity-50 cursor-not-allowed',
          isUploading && 'pointer-events-none'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled || isUploading}
          className="sr-only"
        />

        {isUploading ? (
          <>
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-700">Wird hochgeladen...</p>
          </>
        ) : (
          <>
            <Upload
              className={cn(
                'w-10 h-10 mb-3',
                isDragging ? 'text-primary-600' : 'text-gray-400'
              )}
            />
            <p className="text-sm font-medium text-gray-700">
              <span className="text-primary-600">Klicken zum Hochladen</span>
              {' oder Datei hierher ziehen'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {accept !== '*' ? `Erlaubt: ${accept}` : 'Alle Dateitypen erlaubt'}
              {' • Max. '}{maxSize}MB
              {multiple && ` • Max. ${maxFiles} Dateien`}
            </p>
          </>
        )}
      </div>

      {hint && !displayError && (
        <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
      )}
      {displayError && (
        <p className="mt-1.5 text-sm text-red-600">{displayError}</p>
      )}
    </div>
  );
}

// File Preview Component
interface FilePreviewProps {
  file: {
    name: string;
    size: number;
    type?: string;
    url?: string;
  };
  onRemove?: () => void;
  className?: string;
}

function getFileIcon(type?: string) {
  if (!type) return File;
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf') || type.includes('document')) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreview({ file, onRemove, className }: FilePreviewProps) {
  const Icon = getFileIcon(file.type);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200',
        className
      )}
    >
      {file.url && file.type?.startsWith('image/') ? (
        <img
          src={file.url}
          alt={file.name}
          className="w-10 h-10 rounded object-cover"
        />
      ) : (
        <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded">
          <Icon className="w-5 h-5 text-gray-500" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Entfernen"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// File List with previews
interface FileListProps {
  files: Array<{
    id: string;
    name: string;
    size: number;
    type?: string;
    url?: string;
  }>;
  onRemove?: (id: string) => void;
  className?: string;
}

export function FileList({ files, onRemove, className }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {files.map((file) => (
        <FilePreview
          key={file.id}
          file={file}
          onRemove={onRemove ? () => onRemove(file.id) : undefined}
        />
      ))}
    </div>
  );
}
