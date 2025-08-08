"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, Loader2, FileText, Mic, Image as ImageIcon, Globe } from "lucide-react";

const taskTypeIcons = {
  CONVERSATION_ANALYSIS: Mic,
  IMAGE_ANALYSIS: ImageIcon,
  DOCUMENT_SUMMARIZATION: FileText,
  URL_SUMMARIZATION: Globe,
};

const taskTypeColors = {
  CONVERSATION_ANALYSIS: "bg-blue-100 text-blue-800",
  IMAGE_ANALYSIS: "bg-green-100 text-green-800",
  DOCUMENT_SUMMARIZATION: "bg-purple-100 text-purple-800",
  URL_SUMMARIZATION: "bg-orange-100 text-orange-800",
};

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const statusIcons = {
  PENDING: Clock,
  PROCESSING: Loader2,
  COMPLETED: CheckCircle,
  FAILED: XCircle,
};

export default function TaskHistory() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "all") return true;
    return task.type === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTaskTypeName = (type) => {
    return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Tasks
        </button>
        {Object.keys(taskTypeIcons).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === type
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {getTaskTypeName(type)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            {filter === "all" 
              ? "You haven't created any tasks yet." 
              : `No ${getTaskTypeName(filter).toLowerCase()} tasks found.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const IconComponent = taskTypeIcons[task.type];
            const StatusIcon = statusIcons[task.status];
            
            return (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${taskTypeColors[task.type]}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {getTaskTypeName(task.type)}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                          <div className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {task.status}
                          </div>
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {task.input ? (
                          <span className="truncate block max-w-md">
                            Input: {task.input}
                          </span>
                        ) : (
                          "No input provided"
                        )}
                      </p>
                      
                      <p className="text-xs text-gray-500">
                        Created: {formatDate(task.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {task.output && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Result:</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {task.output}
                      </p>
                    </div>
                  </div>
                )}

                {task.metadata && Object.keys(task.metadata).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Details:</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {Object.entries(task.metadata).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                          </span>
                          <span className="ml-2 text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
