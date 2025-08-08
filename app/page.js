"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  Mic,
  Image as ImageIcon,
  FileText,
  Globe,
  LogIn,
  LogOut,
  User
} from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import ConversationAnalysis from "./components/ConversationAnalysis";
import ImageAnalysis from "./components/ImageAnalysis";
import DocumentSummarization from "./components/DocumentSummarization";
import UrlSummarization from "./components/UrlSummarization";
import TaskHistory from "./components/TaskHistory";

const skills = [
  {
    id: "conversation",
    name: "Conversation Analysis",
    description: "Upload audio files for speech-to-text and speaker diarization",
    icon: Mic,
    color: "bg-blue-500",
  },
  {
    id: "image",
    name: "Image Analysis",
    description: "Upload images for detailed textual descriptions",
    icon: ImageIcon,
    color: "bg-green-500",
  },
  {
    id: "document",
    name: "Document Summarization",
    description: "Upload PDF/DOC files for content summarization",
    icon: FileText,
    color: "bg-purple-500",
  },
  {
    id: "url",
    name: "URL Summarization",
    description: "Provide URLs for web content summarization",
    icon: Globe,
    color: "bg-orange-500",
  },
];

export default function Home() {
  const { data: session, status } = useSession();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Playground</h1>
            <p className="text-gray-600">
              Multi-modal AI-powered tasks for conversation analysis, image analysis, and document summarization
            </p>
          </div>
          
          <button
            onClick={() => signIn("google")}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Or continue with email/password
            </p>
            <button
              onClick={() => signIn()}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Sign in with credentials
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderSkillComponent = () => {
    switch (selectedSkill) {
      case "conversation":
        return <ConversationAnalysis />;
      case "image":
        return <ImageAnalysis />;
      case "document":
        return <DocumentSummarization />;
      case "url":
        return <UrlSummarization />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">AI Playground</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                History
              </button>
              
              <div className="flex items-center gap-2">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
                <span className="text-sm text-gray-700">{session.user.name}</span>
              </div>
              
              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedSkill && !showHistory ? (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome, {session.user.name}!
              </h2>
              <p className="text-gray-600">
                Choose a skill to start exploring AI-powered capabilities
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill.id)}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left group"
                >
                  <div className={`w-12 h-12 ${skill.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <skill.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {skill.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {skill.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : showHistory ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Task History</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Skills
              </button>
            </div>
            <TaskHistory />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {skills.find(s => s.id === selectedSkill)?.name}
              </h2>
              <button
                onClick={() => setSelectedSkill(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Skills
              </button>
            </div>
            {renderSkillComponent()}
          </div>
        )}
      </div>
    </div>
  );
}