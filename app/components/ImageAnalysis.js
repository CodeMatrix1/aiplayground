"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, Upload, Loader2, Eye } from "lucide-react";
import toast from "react-hot-toast";

export default function ImageAnalysis() {
  const [imageFile, setImageFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setResult(null);
      toast.success("Image uploaded successfully!");
    } else {
      toast.error("Please upload a valid image file");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".webp"]
    },
    multiple: false
  });

  const handleProcess = async () => {
    if (!imageFile) {
      toast.error("Please upload an image first");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Image analyzed successfully!");
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to analyze image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Image
          </h3>
          <p className="text-gray-600 text-sm">
            Upload an image (JPEG, PNG, GIF, BMP, WebP) for detailed AI-powered description and analysis.
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-green-400 bg-green-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-green-600">Drop the image here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop an image here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports: JPEG, PNG, GIF, BMP, WebP
              </p>
            </div>
          )}
        </div>

        {imageFile && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{imageFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.open(imageUrl, '_blank')}
                className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors"
              >
                <Eye className="h-4 w-4 text-green-600" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleProcess}
            disabled={!imageFile || isProcessing}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5" />
                Analyze Image
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Analysis Results
            </h3>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{result.description}</p>
              </div>

              {result.objects && result.objects.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Detected Objects</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.objects.map((object, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {object}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.colors && result.colors.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Dominant Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.colors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-sm text-gray-700">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.tags && result.tags.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
