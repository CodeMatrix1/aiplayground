"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Mic, Upload, Play, Pause, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ConversationAnalysis() {
  const [audioFile, setAudioFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudio(new Audio(url));
      setResult(null);
      toast.success("Audio file uploaded successfully!");
    } else {
      toast.error("Please upload a valid audio file");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".flac", ".ogg"]
    },
    multiple: false
  });

  const handleProcess = async () => {
    if (!audioFile) {
      toast.error("Please upload an audio file first");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("audio", audioFile);

    try {
      const response = await fetch("/api/upload-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process audio");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Audio processed successfully!");
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error(error.message || "Failed to process audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayback = () => {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Audio File
          </h3>
          <p className="text-gray-600 text-sm">
            Upload an audio file (MP3, WAV, M4A, FLAC, OGG) for speech-to-text and speaker diarization.
            Supports up to 2 speakers.
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <Mic className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-blue-600">Drop the audio file here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop an audio file here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports: MP3, WAV, M4A, FLAC, OGG
              </p>
            </div>
          )}
        </div>

        {audioFile && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">{audioFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={togglePlayback}
                className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 text-blue-600" />
                ) : (
                  <Play className="h-4 w-4 text-blue-600" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleProcess}
            disabled={!audioFile || isProcessing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                Process Audio
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
                <h4 className="font-medium text-gray-900 mb-2">Transcription</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{result.transcription}</p>
              </div>

              {result.diarization && result.diarization.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Speaker Diarization</h4>
                  <div className="space-y-3">
                    {result.diarization.map((segment, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1 ${
                          segment.speaker === 0 ? 'bg-blue-500' : 'bg-green-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">
                            Speaker {segment.speaker + 1}
                          </p>
                          <p className="text-sm text-gray-600">
                            {segment.start}s - {segment.end}s
                          </p>
                          <p className="text-gray-800 mt-1">{segment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.summary && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <p className="text-gray-700">{result.summary}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
