import { useState } from "react";

export default function Modal({ isOpen, onClose, courseData, onAddCourse, onAddCustomCourse }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [courseName, setCourseName] = useState('');
    const [sectionNumber, setSectionNumber] = useState('');
    const [staffName, setStaffName] = useState('Staff');
    const [times, setTimes] = useState([{ day: 'Monday', time: '' }]);
    const [showCustomForm, setShowCustomForm] = useState(false);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCourseSelect = (id) => {
        onAddCourse(id);  // Call the passed function with the selected course ID
        onClose();        // Optionally close the modal on selection
    };

    const addTime = () => {
        if (times.length < 5) {
            setTimes([...times, { day: 'Monday', time: '' }]);
        }
    };

    const removeTime = (index) => {
        if (times.length > 1) {
            setTimes(times.filter((_, i) => i !== index));
        }
    };

    const handleTimeChange = (index, updatedTime) => {
        const newTimes = [...times];
        newTimes[index] = updatedTime;
        setTimes(newTimes);
    };

    const formatDays = (times) => {
        const daysSet = new Set();
        times.forEach(({ day }) => { // Access the 'day' property of each time object
            daysSet.add(day.startsWith('Th') ? 'Th' : day.charAt(0));
        });

        return Array.from(daysSet).join(''); // Sort and convert to string
    };
    const handleSubmit = () => {
        const formattedDays = formatDays(times); ''

        const formattedArray = [courseName, staffName];

        // Append each time formatted as "courseName day time"
        times.forEach(time => {
            formattedArray.push(`${courseName} ${time.day} ${time.time}`);
        });

        const courseDetails = {
            id: `${courseName}_${sectionNumber}`,
            name: courseName,
            options: [`Section ${sectionNumber}: ${formattedDays}`],
            correctformat: formattedArray,
        };
        console.log(courseDetails);
        onAddCustomCourse(courseDetails);
        onClose();
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
                    <div className="flex flex-row flex-start mb-2">
                        <h2 className="md-custom:text-xl sm:text-lg text-base font-bold text-nowrap flex items-center">{showCustomForm ? "Add Custom Course" : "Add a Course"}</h2>
                        <button onClick={() => setShowCustomForm(!showCustomForm)} className="ml-2 p-2 w-full sm:text-base text-sm bg-blue-500 text-white rounded">
                            {showCustomForm ? "Add a Course" : "Custom Course"}
                        </button>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&#x2715;</button>
                </div>
                {showCustomForm ? (
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <input
                                    type="text"
                                    id="course"
                                    maxLength={8}
                                    placeholder="Course name"
                                    className="mt-4 p-2 w-full border-gray-400 border rounded"
                                    value={courseName}
                                    onChange={e => setCourseName(e.target.value.toUpperCase())}
                                    required
                                />
                                <label htmlFor="course" className="lg:ml-2 ml-1 text-sm text-gray-500">e.g. MATH110 (no space)</label>
                            </div>
                            <div>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    id="section"
                                    placeholder="Section Number"
                                    className="mt-4 p-2 w-full border-gray-400 border rounded"
                                    value={sectionNumber}
                                    onChange={e => setSectionNumber(e.target.value)}
                                    required
                                />
                                <label htmlFor="section" className="ml-2 text-sm text-gray-500">(order on SOLUS)</label>
                            </div>

                        </div>
                        <input
                            type="text"
                            className="mt-2 p-2 w-full border-gray-400 border rounded"
                            value={staffName}
                            onChange={e => setStaffName(e.target.value)}
                            required
                        />
                        {times.map((time, index) => (
                            <div key={index} className="flex flex-row mt-3">
                                <select
                                    className="p-2 w-fit border-gray-400 border rounded"
                                    value={time.day || 'Monday'} // Default to Monday if day isn't selected
                                    onChange={e => handleTimeChange(index, { ...time, day: e.target.value })}
                                    required
                                >
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder={`Time ${index + 1} (e.g., 15:30-16:30)`}
                                    className="ml-1 p-2 w-full border-gray-400 border rounded"
                                    value={time.time || ''}
                                    pattern="\b([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]\b"
                                    onChange={e => handleTimeChange(index, { ...time, time: e.target.value })}
                                    required
                                />
                                {/* Add one more input for time must be in the format of 8:30-9:30*/}
                                {times.length > 1 && (
                                    <button
                                        onClick={() => removeTime(index)}
                                        className="ml-2 bg-red-500 text-white p-2 rounded"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        {times.length < 5 && (
                            <button type="button" onClick={addTime} className="mt-4 p-2 w-full bg-blue-500 text-white rounded">
                                Add Time
                            </button>
                        )}
                        <button className="mt-4 p-2 w-full bg-green-500 text-white rounded">
                            Submit
                        </button>
                    </form>
                ) : (
                    <div>
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
                )}
            </div>
        </div>
    );
}