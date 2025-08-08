"use client";

import { useState } from "react";
import { Globe, Loader2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function UrlSummarization() {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/summarize-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Failed to summarize URL");
      }

      const data = await response.json();
      setResult(data);
      toast.success("URL summarized successfully!");
    } catch (error) {
      console.error("Error summarizing URL:", error);
      toast.error("Failed to summarize URL. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            URL Summarization
          </h3>
          <p className="text-gray-600 text-sm">
            Enter a URL to get an AI-powered summary of the web content.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!url.trim() || isProcessing}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" />
                    Summarize
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {result && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Summary Results
            </h3>
            
            <div className="space-y-6">
              {result.originalUrl && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 mb-2">Source URL</h4>
                    <a
                      href={result.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 flex items-center gap-1 text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Visit
                    </a>
                  </div>
                  <p className="text-gray-700 break-all">{result.originalUrl}</p>
                </div>
              )}

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
                        <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
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
                        className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.metadata && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Page Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {result.metadata.title && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Title:</span>
                        <span className="ml-2 text-gray-900">{result.metadata.title}</span>
                      </div>
                    )}
                    {result.metadata.author && (
                      <div>
                        <span className="text-gray-600">Author:</span>
                        <span className="ml-2 text-gray-900">{result.metadata.author}</span>
                      </div>
                    )}
                    {result.metadata.wordCount && (
                      <div>
                        <span className="text-gray-600">Word Count:</span>
                        <span className="ml-2 text-gray-900">{result.metadata.wordCount}</span>
                      </div>
                    )}
                    {result.metadata.readingTime && (
                      <div>
                        <span className="text-gray-600">Reading Time:</span>
                        <span className="ml-2 text-gray-900">{result.metadata.readingTime}</span>
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
