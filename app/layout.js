import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthProvider from "./components/AuthProvider";

export const metadata = {
  title: "AI Playground - Multi-Modal AI Tasks",
  description: "Upload audio, images, documents and URLs for AI-powered analysis and summarization",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
