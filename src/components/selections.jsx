import React, { useState } from 'react';

function Selection({ onUpdate, courseData }) {
    const [inputValue, setInputValue] = useState('');
    const [notFound, setNotFound] = useState([]);  // State to track IDs not found


    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        if (notFound.length > 0) {
            setNotFound([]);  // Clear not found messages when user starts typing
        }
    };

    const handleSubmit = () => {
        const ids = inputValue.split('\n').map(id => id.trim().toUpperCase());  // Split input by new lines and trim
        const allCourseDetails = [];
        const notFoundIds = [];

        ids.forEach(id => {
            try {
                const courseDetails = courseData[id];
                allCourseDetails.push(...courseDetails.slice(2));  // Collect all times, assuming times start from index 2
                console.log("Found! " + courseDetails)
            } catch (TypeError) {
                notFoundIds.push(id);  // Collect IDs not found
            }
            // if (courseDetails) {
                
            // } else {
                
            // }
        });

        onUpdate(allCourseDetails);
        setNotFound(notFoundIds);  // Update not found IDs
    };

    return (
        <div>
        <textarea
            value={inputValue}
            onChange={handleInputChange}
            placeholder={`Enter courses as 'CISC121_1 separated by new lines'\nThe number after the underscore is the order they appear in on SOLUS\nIt is recommended you double check SOLUS for accuracy`}
            className="m-2 p-1 w-full h-32 border-gray-600 border-2 bg-gray-100 resize-none"
        />
        <button onClick={handleSubmit} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 mx-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Update Schedule</button>
        {notFound.length > 0 && (
            <div className="m-2 p-2 bg-red-100 border border-red-400 text-red-700">
                <p>Course ID(s) not found:</p>
                <ul>
                    {notFound.map(id => <li key={id}>{id}</li>)}
                </ul>
            </div>
        )}
        </div>
    );
}

export default Selection;
