import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (files: File[]) => void;
  selectedImages: File[];
  setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function ImageUpload({ onImageUpload, selectedImages, setSelectedImages }: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...selectedImages, ...acceptedFiles];
    setSelectedImages(newFiles);

    // Create previews for new files
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  }, [selectedImages, setSelectedImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: true
  });

  const removeImage = (index: number) => {
    const newFiles = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newFiles);

    // Remove preview
    URL.revokeObjectURL(previews[index]);
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
  };

  return (
    <div className="w-full space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive
            ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500'
          }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-green-600 dark:text-green-400">Drop the images here...</p>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Drag and drop images here, or click to select files
          </p>
        )}
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 