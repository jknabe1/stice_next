"use client";

import { useState } from "react";

export default function FileUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [response, setResponse] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/analyze-file", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.analysis);
      } else {
        setResponse("Error analyzing file.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setResponse("Error uploading file.");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button  onClick={handleUpload} type="button" className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-[#5c7cf4] border-input shadow-sm hover:bg-accent hover:text-accent-foreground absolute left-0 top-4 size-8 rounded-full bg-background p-0 sm:left-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className="size-4">
            <path d="M224 128a8 8 0 0 1-8 8h-80v80a8 8 0 0 1-16 0v-80H40a8 8 0 0 1 0-16h80V40a8 8 0 0 1 16 0v80h80a8 8 0 0 1 8 8Z"></path>
        </svg>
        <span className="sr-only">Upload file</span>
    </button>
    </div>
  );
}
