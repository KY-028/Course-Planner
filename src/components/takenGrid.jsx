import { useState, useEffect } from 'react';
import plusIcon from '/plus_icon.svg';
import penIcon from '/pen.svg';
import axios from 'axios';

export default function TakenGrid({ coursesTaken, setCoursesTaken }) {
    const headers = ["1st Year", "2nd Year", "3rd Year", "4th+ Year", "Transfer Credits"];
    const [editingIndex, setEditingIndex] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [loadingIndices, setLoadingIndices] = useState(new Set());
    const apiUrl = import.meta.env.VITE_API_URL;

    // Function to find duplicate courses
    const findDuplicates = (courses) => {
        const duplicates = new Set();
        const seen = new Set();

        courses.forEach((course, index) => {
            if (course && course.code) {
                if (seen.has(course.code)) {
                    duplicates.add(index);
                }
                seen.add(course.code);
            }
        });

        return duplicates;
    };

    const fetchCourseDetails = async (courseCode, index) => {
        setLoadingIndices(prev => new Set([...prev, index]));
        try {
            const formattedCode = courseCode.replace(/\s+/g, '%20');
            const response = await axios.get(`${apiUrl}/backend/courseDetails?courseCode=${formattedCode}`);
            const details = response.data; // { title, units }

            setCoursesTaken(prevCourses => {
                const newCourses = [...prevCourses];
                const currentCourse = newCourses[index] || {};
                newCourses[index] = {
                    ...currentCourse, // Keep existing code
                    title: details?.title || null,
                    units: details?.units || 3.0, // Default to 3.0 if not provided
                };

                return newCourses;
            });
        } catch (error) {
            console.error(`Error fetching details for ${courseCode}:`, error);
            setCoursesTaken(prevCourses => {
                const newCourses = [...prevCourses];
                const currentCourse = newCourses[index] || {};
                newCourses[index] = {
                    ...currentCourse, // Keep existing code
                    title: null,
                    units: null
                };
                return newCourses;
            });
        } finally {
            setLoadingIndices(prev => {
                const newSet = new Set(prev);
                newSet.delete(index);
                return newSet;
            });
        }
    };

    // Load course details for existing courses on mount
    useEffect(() => {
        const loadExistingCourseDetails = async () => {
            for (let i = 0; i < coursesTaken.length; i++) {
                // Only fetch if course object exists and details are missing
                if (coursesTaken[i] && (!coursesTaken[i].title || !coursesTaken[i].units)) {
                    await fetchCourseDetails(coursesTaken[i].code, i);
                }
            }
        };

        loadExistingCourseDetails();
    }, []);

    const formatCourseCode = (code) => {
        // Remove any existing spaces
        code = code.replace(/\s+/g, '');

        // Find where the numbers start
        const numberIndex = code.search(/\d/);
        if (numberIndex === -1) return code.toUpperCase();

        // Insert space before the numbers
        return (code.slice(0, numberIndex) + ' ' + code.slice(numberIndex)).toUpperCase();
    };

    const handleInputChange = (e) => {
        const input = e.target;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = e.target.value.toUpperCase();

        if (value.length <= 8) {
            setInputValue(value);
            // Restore cursor position after state update
            requestAnimationFrame(() => {
                input.setSelectionRange(start, end);
            });
        }
    };

    const handleSubmit = async (index) => {
        if (inputValue.trim()) {
            const formattedCode = formatCourseCode(inputValue);
            // Update the coursesTaken with the code immediately, details will be fetched
            setCoursesTaken(prevCourses => {
                const newCourses = [...prevCourses];
                newCourses[index] = { code: formattedCode, title: null, units: null, planreq: null }; // Initialize with null details
                return newCourses;
            });

            // Fetch course details after setting the basic course info
            await fetchCourseDetails(formattedCode, index);
        } else {
            // If input is empty, clear the course by setting it to null
            setCoursesTaken(prevCourses => {
                const newCourses = [...prevCourses];
                newCourses[index] = null;
                return newCourses;
            });
        }
        setEditingIndex(null);
        setInputValue('');
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            handleSubmit(index);
        } else if (e.key === 'Escape') {
            setEditingIndex(null);
            setInputValue('');
        }
    };

    const startEditing = (index) => {
        setEditingIndex(index);
        // Set inputValue from the existing course code if available
        setInputValue(coursesTaken[index]?.code || '');
    };

    const duplicates = findDuplicates(coursesTaken);

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="text-center sm:text-sm text-xxs text-gray-600 mb-1">Only include courses that you earned credit for, no duplicates, no exclusions, etc.</div>
            <div className="text-center sm:text-sm text-xxs text-gray-600 mb-4">For year courses, do not enter A or B, simply enter the course code.</div>
            {/* Headers */}
            <div className="grid grid-cols-5 rounded-t-lg overflow-hidden border border-gray-200">
                {headers.map((header, index) => (
                    <div
                        key={index}
                        className="p-2 text-center font-medium border-l border-r border-gray-200 border-t border-b-0 border-solid sm:text-base text-xxs"
                    >
                        {header}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="w-full grid grid-cols-5 rounded-b-lg overflow-hidden border border-gray-200">
                {[...Array(60)].map((_, index) => (
                    <div
                        key={index}
                        className={`bg-gray-100 hover:bg-gray-200 cursor-pointer xl-custom:px-2 lg:px-1 sm:px-2 px-1 xl:h-18 md-custom:h-16 sm:h-14 h-14 flex items-center justify-center border-l border-r border-gray-200 border-t border-b-0 border-solid relative ${duplicates.has(index) ? 'bg-red-100 hover:bg-red-200' : ''}`}
                    >
                        {editingIndex === index ? (
                            <div className="flex items-center w-full">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className="w-full bg-white border border-gray-300 rounded sm:px-2 pl-1 sm:py-1 py-0.5 sm:text-sm text-xxs focus:outline-none focus:border-blue-500"
                                    placeholder="Enter course code"
                                    autoFocus
                                />
                                <button
                                    onClick={() => handleSubmit(index)}
                                    className="sm:ml-2 ml-1 bg-green-500 hover:bg-green-600 text-white rounded flex items-center justify-center transition-colors duration-150"
                                    style={{ width: 32, height: 32 }}
                                >
                                    <svg className="sm:w-4 sm:h-4 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                            </div>
                        ) : coursesTaken[index] ? (
                            <div
                                className="flex flex-col w-full cursor-pointer"
                                onClick={() => startEditing(index)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="xl:text-base lg:text-small sm:text-sm text-xxs">{coursesTaken[index].code}</span>
                                    <div className="flex items-center">
                                        {coursesTaken[index]?.units && (
                                            <>
                                                <span className="xl:text-base lg:text-small sm:text-sm text-xxs xl:mr-2 mr-0.5">{parseFloat(coursesTaken[index].units).toFixed(1)}</span>
                                            </>
                                        )}
                                        <img
                                            src={penIcon}
                                            alt="edit"
                                            className="xl:w-4 xl:h-4 lg:w-3 lg:h-3 sm:w-4 sm:h-4 w-3 h-3"
                                        />
                                    </div>
                                </div>
                                {coursesTaken[index]?.title && (
                                    <div className="lg:text-xs sm:text-xxs text-xxxs text-gray-600 truncate">
                                        {loadingIndices.has(index) ? 'Loading...' : coursesTaken[index].title}
                                    </div>
                                )}
                                {coursesTaken[index]?.planreq && (
                                    <div className="lg:text-xs sm:text-xxs text-xxxs text-blue-600 truncate">
                                        {/* Shorten planreq display: e.g., major-1. CoreA => major-1A */}
                                        {coursesTaken[index].planreq.split(',').map((req, i) => {
                                            // Match pattern like 'major-3. SupportingA' or 'major-1. CoreB'
                                            const match = req.trim().match(/^(.*?-)([0-9]+)\.\s*[A-Za-z\-]+([A-Z])([\-\.].*)?/);

                                            if (match) {
                                                // e.g., major-3. SupportingA => major-3A
                                                return (
                                                    <span key={i}>
                                                        {match[1]}{match[2]}{match[3]}{match[4] || ''}
                                                        {i < coursesTaken[index].planreq.split(',').length - 1 ? ', ' : ''}
                                                    </span>
                                                );
                                            } else {
                                                // fallback: just show the trimmed req
                                                return (
                                                    <span key={i}>{req.trim()}{i < coursesTaken[index].planreq.split(',').length - 1 ? ', ' : ''}</span>
                                                );
                                            }
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className="flex items-center justify-center w-full cursor-pointer"
                                onClick={() => startEditing(index)}
                            >
                                <img src={plusIcon} alt="plus" className="sm:w-4 sm:h-4 w-3 h-3 md:mr-2 sm:mr-1 mr-0.5" />
                                <span className="w-full lg:text-base sm:text-sm text-xs">Course</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}