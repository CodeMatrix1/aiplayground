"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, Loader2, Eye } from "lucide-react";
import toast from "react-hot-toast";

export default function DocumentSummarization() {
  const [documentFile, setDocumentFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && (file.type === "application/pdf" || file.name.endsWith('.doc') || file.name.endsWith('.docx'))) {
      setDocumentFile(file);
      setResult(null);
      toast.success("Document uploaded successfully!");
    } else {
      toast.error("Please upload a valid PDF or DOC file");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
    },
    multiple: false
  });

  const handleProcess = async () => {
    if (!documentFile) {
      toast.error("Please upload a document first");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("document", documentFile);

    try {
      const response = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process document");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Document summarized successfully!");
    } catch (error) {
      console.error("Error processing document:", error);
      toast.error(error.message || "Failed to summarize document. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Document
          </h3>
          <p className="text-gray-600 text-sm">
            Upload a PDF or DOC file for AI-powered content summarization and analysis.
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-purple-400 bg-purple-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-purple-600">Drop the document here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop a document here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports: PDF, DOC, DOCX
              </p>
            </div>
          )}
        </div>

        {documentFile && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{documentFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleProcess}
            disabled={!documentFile || isProcessing}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                Summarize Document
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Summary Results
            </h3>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{result.summary}</p>
              </div>

              {result.keyPoints && result.keyPoints.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Key Points</h4>
                  <ul className="space-y-2">
                    {result.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.topics && result.topics.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Main Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.metadata && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Document Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {result.metadata.pages && (
                      <div>
                        <span className="text-gray-600">Pages:</span>
                        <span className="ml-2 text-gray-900">{result.metadata.pages}</span>
                      </div>
                    )}
                    {result.metadata.wordCount && (
                      <div>
                        <span className="text-gray-600">Word Count:</span>
                        <span className="ml-2 text-gray-900">{result.metadata.wordCount}</span>
                      </div>
                    )}
                    {result.metadata.title && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Title:</span>
                        <span className="ml-2 text-gray-900">{result.metadata.title}</span>
                      </div>
                    )}
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
