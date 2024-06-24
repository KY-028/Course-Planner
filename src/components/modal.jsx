import { useState } from "react";

export default function Modal({ isOpen, onClose, courseData, onAddCourse }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCourseSelect = (id) => {
        onAddCourse(id);  // Call the passed function with the selected course ID
        onClose();        // Optionally close the modal on selection
    };

    const searchResults = Object.keys(courseData)
        .filter(id => id.toLowerCase().includes(searchTerm.split(" ").join("").toLowerCase()))
        .map(id => (
            <div key={id} onClick={() => handleCourseSelect(id)} className="p-1.5 hover:bg-gray-200 cursor-pointer">
                {`${courseData[id][0]} ${courseData[id][1].split(",").reverse().join(" ")} `}
                <div className="ml-6 text-gray-600 text-sm">
                    {courseData[id].slice(2,).map((desc, i) => (
                        <div key={i}>
                            {`${desc.split(" ")[1].slice(0, 3).toUpperCase()} ${desc.split(" ")[2]}`}
                        </div>
                    ))
                    }
                </div>
            </div>
        ));

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 10000000 }}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Add a Course</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        &#x2715;
                    </button>
                </div>
                <input
                    type="text"
                    placeholder="Search courses..."
                    className="mt-4 p-2 w-full border-gray-400 border rounded"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <div className="mt-4 max-h-60 overflow-y-auto">
                    {searchResults}
                </div>
            </div>
        </div>
    );
}