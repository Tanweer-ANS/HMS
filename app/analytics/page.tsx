"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { FaFileMedical, FaSpinner, FaCloudUploadAlt } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

export default function AnalyticsPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] || null);
        setResult(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        setFile(e.dataTransfer.files[0] || null);
        setResult(null);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/analytics", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setResult(res.data.summary);
        } catch (err) {
            console.error(err);
            setResult("Error analyzing report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-3xl w-full">
                <div className="flex items-center space-x-4 mb-6 border-b pb-4">
                    <FaFileMedical className="text-4xl text-blue-600" />
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Medical Report Analysis
                    </h1>
                </div>

                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
                        }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-input")?.click()}
                >
                    <input
                        id="file-input"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <FaCloudUploadAlt
                        className={`mx-auto text-5xl mb-4 transition-colors duration-200 ${isDragOver ? "text-blue-600" : "text-gray-400"
                            }`}
                    />
                    <p className="text-gray-600 font-medium">
                        {file ? (
                            <span className="text-blue-700">{file.name} selected</span>
                        ) : (
                            "Drag and drop your medical report here, or click to browse"
                        )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        (Accepted formats: images and PDF)
                    </p>
                </div>

                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className={`w-full md:w-auto px-6 py-3 font-semibold text-white rounded-lg transition-colors duration-200 ${!file || loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <FaSpinner className="animate-spin mr-2" /> Analyzing...
                            </span>
                        ) : (
                            "Upload & Analyze Report"
                        )}
                    </button>
                </div>

                {result && (
                    <div className="mt-8 border-t pt-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">
                            Analysis Results
                        </h2>
                        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 prose max-w-none text-gray-700">
                            <ReactMarkdown>
                                {result}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}