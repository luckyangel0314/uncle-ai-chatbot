import * as React from "react";
import { useCallback, useRef, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import ScreenCapture from "../ScreenCapture";

interface ImageUploadProps {
  onImageUpload: (files: File[]) => void;
  selectedImages: File[];
  setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>;
  className?: string;
}

export function ImageUpload({ onImageUpload, selectedImages, setSelectedImages, className }: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [showScreenCapture, setShowScreenCapture] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update previews when selectedImages changes
  useEffect(() => {
    const newPreviews = selectedImages.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  }, [selectedImages]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log("These are selected files", acceptedFiles);
    const newFiles = [...selectedImages, ...acceptedFiles];
    setSelectedImages(newFiles);
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

  const handleUpload = () => {
    if (selectedImages.length > 0) {
      onImageUpload(selectedImages);
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {showScreenCapture && (
        <ScreenCapture
          setSelectedImages={setSelectedImages}
          setImagePreviews={setPreviews}
        />
      )}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-green-500 bg-green-50/50 dark:bg-green-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500"
        )}
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

      <Button
        ref={buttonRef}
        onClick={handleUpload}
        className="w-full"
        disabled={selectedImages.length === 0}
        style={{ display: "none" }}
      >
        Upload {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
      </Button>
    </div>
  );
} 