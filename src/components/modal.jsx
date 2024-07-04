import { useState } from "react";

export default function Modal({ isOpen, onClose, courseData, onAddCourse, onAddCustomCourse }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [courseName, setCourseName] = useState('');
    const [courseTitle, setCourseTitle] = useState('Custom Course Title');
    const [isCourseTitleFocused, setIsCourseTitleFocused] = useState(false);
    const [sectionNumber, setSectionNumber] = useState('');
    const [staffName, setStaffName] = useState('Staff');
    const [times, setTimes] = useState([{ day: 'Monday', time: '' }]);
    const [showCustomForm, setShowCustomForm] = useState(false);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCourseSelect = (id) => {
        onAddCourse(id);  // Call the passed function with the selected course ID
        setSearchTerm('');  // Reset the search term to an empty string
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
        const daysOrder = ["M", "T", "W", "Th", "F"];
        const daysSet = new Set();

        times.forEach(({ day }) => { // Access the 'day' property of each time object
            daysSet.add(day.startsWith('Th') ? 'Th' : day.charAt(0));
        });

        return Array.from(daysSet).sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b)).join('');
    };

    function convertTo24Hour(timeStr) {
        let [begin, end] = timeStr.split('-');
        let [bhr, bmin] = begin.split(":");
        let starthour = parseInt(bhr);
        let [ehr, emin] = end.split(":");
        let endhour = parseInt(ehr);

        if (1 <= starthour && starthour <= 6) { // if the hour is 1, 2, 3, 4, 5, or 6
            starthour += 12;
        }
        if ((1 <= endhour && endhour <= 6) || endhour == 8) {
            endhour += 12;
        }
        if (starthour === 18 && endhour === 9) {
            endhour += 12;
        }

        return `${starthour}:${bmin}-${endhour}:${emin}`;
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        const id = `${courseName}_${sectionNumber}`;

        // Check if the course ID is already in courseData
        if (id in courseData) {
            alert("This class was found in our system!");
            onAddCourse(id);
            return;
        }

        const formattedDays = formatDays(times);

        const locations = [];

        const formattedArray = [courseName, courseTitle, staffName, locations];
        times.forEach(time => {
            const time_str = convertTo24Hour(time.time);
            formattedArray.push(`${courseName} U ${time.day} ${time_str} ${staffName}`);
            locations.push("");
        });

        const courseDetails = {
            id: id,
            name: courseName,
            title: courseTitle,
            options: [`Section ${sectionNumber}: ${formattedDays}`],
            selectedOption: `Section ${sectionNumber}: ${formattedDays}`,
            correctformat: formattedArray,
        };

        onAddCustomCourse(courseDetails);
        onClose();

        // Reset all form fields and close custom form
        setCourseName('');
        setCourseTitle('Custom Course Name');
        setSectionNumber('');
        setStaffName('Staff');
        setTimes([{ day: 'Monday', time: '' }]);
        setShowCustomForm(false);
    };

    const searchResults = Object.keys(courseData)
        .filter(id => id.toLowerCase().includes(searchTerm.split(" ").join("").toLowerCase()))
        .map(id => (
            <div key={id} onClick={() => handleCourseSelect(id)} className="p-1.5 hover:bg-gray-200 cursor-pointer">
                {`${courseData[id][0]} ${courseData[id][2].split(",").reverse().join(" ")} `}
                <div className="text-gray-700 text-sm -mt-1">
                    {courseData[id][1]}
                </div>
                <div className="ml-6 text-gray-600 text-sm">
                    {courseData[id].slice(4,).map((desc, i) => (
                        <div key={i}>
                            {`${desc.split(" ")[2].slice(0, 3).toUpperCase()} ${desc.split(" ")[3]}`}
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
                        <button onClick={() => setShowCustomForm(!showCustomForm)} className="ml-5 p-2 w-full sm:text-base text-sm bg-blue-500 text-white rounded">
                            {showCustomForm ? "Regular Course" : "Custom Course"}
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
                                    placeholder="Course Code"
                                    className="mt-4 p-2 w-full border-gray-400 border rounded"
                                    value={courseName}
                                    onChange={e => setCourseName(e.target.value.split(" ").join("").toUpperCase())}
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
                            value={courseTitle}
                            onFocus={() => {
                                if (!isCourseTitleFocused) {
                                    setCourseTitle('');
                                    setIsCourseTitleFocused(true);
                                }
                            }}
                            onBlur={() => {
                                if (courseTitle === '') {
                                    setCourseTitle('Custom Course');
                                    setIsCourseTitleFocused(false);
                                }
                            }}
                            onChange={e => setCourseTitle(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            className="mt-2 p-2 w-full border-gray-400 border rounded"
                            placeholder="Professor"
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
                        <button type="submit" className="mt-4 p-2 w-full bg-green-500 text-white rounded">
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
