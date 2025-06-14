import { useState, useEffect } from 'react';
import plusIcon from '/plus_icon.svg';
import penIcon from '/pen.svg';
import axios from 'axios';

export default function TakenGrid({ coursesTaken, setCoursesTaken }) {
    const headers = ["1st Year", "2nd Year", "3rd Year", "4th+ Year", "Transfer Credits"];
    const [editingIndex, setEditingIndex] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [courseDetails, setCourseDetails] = useState(Array(60).fill(null));
    const [isLoading, setIsLoading] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;

    const fetchCourseDetails = async (courseCode) => {
        try {
            const formattedCode = courseCode.replace(/\s+/g, '%20');
            const response = await axios.get(`${apiUrl}/backend/courseDetails?courseCode=${formattedCode}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching details for ${courseCode}:`, error);
            return null;
        }
    };

    // Load course details for existing courses on mount
    useEffect(() => {
        const loadExistingCourseDetails = async () => {
            setIsLoading(true);
            const newDetails = [...courseDetails];
            
            for (let i = 0; i < coursesTaken.length; i++) {
                if (coursesTaken[i] && !courseDetails[i]) {
                    const details = await fetchCourseDetails(coursesTaken[i]);
                    newDetails[i] = details;
                }
            }
            
            setCourseDetails(newDetails);
            setIsLoading(false);
        };

        loadExistingCourseDetails();
    }, [coursesTaken]);

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
        const value = e.target.value.toUpperCase();
        if (value.length <= 8) {
            setInputValue(value);
        }
    };

    const handleSubmit = async (index) => {
        if (inputValue.trim()) {
            const formattedCode = formatCourseCode(inputValue);
            const newCourses = [...coursesTaken];
            newCourses[index] = formattedCode;
            setCoursesTaken(newCourses);

            // Fetch course details
            setIsLoading(true);
            const details = await fetchCourseDetails(formattedCode);
            const newDetails = [...courseDetails];
            newDetails[index] = details;
            setCourseDetails(newDetails);
            setIsLoading(false);
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
        setInputValue(coursesTaken[index] || '');
    };

    return (
        <div className="w-full">
            {/* Headers */}
            <div className="grid grid-cols-5 rounded-t-lg overflow-hidden border border-gray-200">
                {headers.map((header, index) => (
                    <div 
                        key={index}
                        className="p-2 text-center font-medium border-l border-r border-gray-200 border-t border-b-0 border-solid"
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
                        className="bg-gray-100 hover:bg-gray-200 cursor-pointer px-2 xl:h-18 md-custom:h-16 sm:h-14 h-14 flex items-center justify-center border-l border-r border-gray-200 border-t border-b-0 border-solid relative"
                    >
                        {editingIndex === index ? (
                            <div className="flex items-center w-full">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="Enter course code"
                                    autoFocus
                                />
                                <button
                                    onClick={() => handleSubmit(index)}
                                    className="ml-2 bg-green-500 hover:bg-green-600 text-white rounded flex items-center justify-center transition-colors duration-150"
                                    style={{ width: 32, height: 32 }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    <span className="lg:text-base sm:text-sm text-xs">{coursesTaken[index]}</span>
                                    <div className="flex items-center">
                                        {courseDetails[index]?.units && (
                                            <span className="lg:text-base sm:text-sm text-xs mr-2">{courseDetails[index].units}</span>
                                        )}
                                        <img 
                                            src={penIcon} 
                                            alt="edit" 
                                            className="w-4 h-4"
                                        />
                                    </div>
                                </div>
                                {courseDetails[index]?.title && (
                                    <div className="lg:text-xs sm:text-xxs text-xxxs text-gray-600 truncate">
                                        {isLoading ? 'Loading...' : courseDetails[index].title}
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