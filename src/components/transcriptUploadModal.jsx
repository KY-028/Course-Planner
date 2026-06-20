import { useState, useRef } from 'react';
import {
    processTranscriptToCoursesTaken,
    processCsvToCoursesTaken,
    csvHasCourseColumn,
} from '../functions/transcriptProcessing';
import { enrichCoursesTakenWithDetails } from '../functions/courseDetailsApi';

const FILE_INPUT_ACCEPT = '.pdf,.csv,application/pdf,text/csv';
const QFLOW_API_URL = import.meta.env.VITE_QFLOW_API_URL || 'https://qflow-api.pooria.dev';

function getFileKind(file) {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();

    if (name.endsWith('.pdf') || type === 'application/pdf') return 'pdf';
    if (
        name.endsWith('.csv') ||
        type === 'text/csv' ||
        type === 'application/csv' ||
        type === 'application/vnd.ms-excel'
    ) {
        return 'csv';
    }
    return null;
}

async function scrapeTranscriptPdf(file) {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const response = await fetch(`${QFLOW_API_URL}/scrape/transcript`, {
        method: 'POST',
        headers: {
            accept: 'application/json',
        },
        body: formData,
    });

    if (!response.ok) {
        let message = `Upload failed (${response.status})`;
        try {
            const errorBody = await response.json();
            message = errorBody.message || errorBody.detail || errorBody.error || message;
        } catch {
            // keep default message
        }
        throw new Error(message);
    }

    return response.json();
}

export default function TranscriptUploadModal({ isOpen, onClose, setCoursesTaken, setIsLoading, apiUrl }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const processFile = async (file) => {
        if (!file) return;

        setErrorMessage('');
        setIsProcessing(true);
        let importStarted = false;

        try {
            const fileKind = getFileKind(file);
            if (!fileKind) {
                setErrorMessage('Only PDF and CSV files are supported.');
                return;
            }

            let coursesTaken;

            if (fileKind === 'csv') {
                const text = await file.text();
                if (!csvHasCourseColumn(text)) {
                    setErrorMessage('CSV must include a column header named "Course".');
                    return;
                }
                coursesTaken = processCsvToCoursesTaken(text);
            } else {
                setIsLoading(true);
                onClose();
                importStarted = true;

                const result = await scrapeTranscriptPdf(file);
                coursesTaken = processTranscriptToCoursesTaken(result);
            }

            if (!importStarted) {
                setIsLoading(true);
                onClose();
                importStarted = true;
            }

            const enriched = await enrichCoursesTakenWithDetails(coursesTaken, apiUrl);
            setCoursesTaken(enriched);
        } catch (error) {
            console.error('Transcript upload failed:', error);
            const message = error.message || 'Upload failed. Please try again.';
            if (importStarted) {
                alert(message);
            } else {
                setErrorMessage(message);
            }
        } finally {
            setIsProcessing(false);
            setIsLoading(false);
        }
    };

    const handleFiles = (files) => {
        const file = files?.[0];
        if (file) processFile(file);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    return (
        <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
            style={{ zIndex: 1000000 }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Upload Transcript</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                    Drag and drop your transcript here, or tap to choose a file from your device.
                </p>

                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }
                    }}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 sm:p-10 text-center cursor-pointer transition-colors ${
                        isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    } ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={FILE_INPUT_ACCEPT}
                        className="hidden"
                        onChange={(e) => {
                            handleFiles(e.target.files);
                            e.target.value = '';
                        }}
                    />
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    <p className="text-sm sm:text-base font-medium text-gray-700">
                        {isProcessing ? 'Processing transcript…' : 'Drop your transcript here'}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm text-gray-500">
                        PDF or CSV (CSV must include a &quot;Course&quot; column)
                    </p>
                </div>

                {errorMessage && (
                    <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-800">
                        {errorMessage}
                    </div>
                )}

                <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-3 text-sm text-blue-800">
                    We do not collect your GPA information. We only store the courses you&apos;ve taken,
                    and we automatically exclude courses you&apos;ve failed or retaken.
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
