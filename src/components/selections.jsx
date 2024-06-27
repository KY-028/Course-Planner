import React, { useState, useEffect } from 'react';
import Modal from './modal';

function Toggle({ message, isToggled, toggleSwitch }) {
    return (
        <label className="flex items-center cursor-pointer">
            <div className="relative">
                <input type="checkbox" id="toggle" className="sr-only" checked={isToggled} onChange={toggleSwitch} />
                <div className={`block ${isToggled ? 'bg-blue-600' : 'bg-gray-600'} lg:w-14 w-10 lg:h-8 h-6 rounded-full`}></div>
                <div className={`dot absolute left-1 top-1 bg-white lg:w-6 lg:h-6 w-4 h-4 rounded-full transition-transform ${isToggled ? 'translate-x-full' : ''}`}></div>
            </div>
            <span className="ml-3 text-gray-900 font-medium">{message}</span>
        </label>
    );
}

function Course({ id, name, options, selectedOption, onSelectChange, onRemove }) {
    return (
        <div className="relative border border-dark-blue rounded xl:h-16 lg:h-14 md-custom:h-12 sm:h-14 h-12 xl:pt-1 lg:pt-1.5 mx-0.5 px-1">
            <button
                className="absolute top-0 right-0 p-1 lg:pt-1 md-custom:pt-0.5 lg:text-xs text-xxs font-bold text-gray-700 hover:text-red-500"
                onClick={() => onRemove(id)}
            >
                &#x2715;
            </button>
            <div className="w-full font-semibold xl:text-base lg:text-xs md-custom:text-xs sm:text-sm text-xs xl:mb-0.5 lg:m-0 md-custom:mt-1 md-custom:-mb-0.5 mt-1">{name}</div>
            <select
                className="w-full border-gray-300 rounded xl:text-xs md-custom:text-xxs sm:text-sm text-xs"
                value={selectedOption}
                onChange={(e) => onSelectChange(id, e.target.value)}
            >
                {options.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                ))}
            </select>
        </div>
    );
}




function CourseGrid({ courseData, courses, setCourses, setChangeCounter, changeCourseData }) {

    const [isModalOpen, setIsModalOpen] = useState(false);


    const generateOptions = (courseBaseId, coursemaster = courseData) => {
        const sectionKeys = Object.keys(coursemaster).filter(key => key.startsWith(courseBaseId));
        return sectionKeys.map(key => {
            return `Section ${key.split('_')[1]}: ${formatDays(coursemaster[key].slice(2))}`;
        }).sort();
    };

    const addCourse = (id) => {
        // Check if the course with the given id is already in the courses list
        const isAlreadyAdded = courses.some(course => course.id === id);

        if (isAlreadyAdded) {
            alert("This course is already in the list!");
            setIsModalOpen(true);
            return;
        }

        const courseDetail = courseData[id];
        const newCourse = {
            id: id,
            name: courseDetail[0],
            options: generateOptions(courseDetail[0]),
            selectedOption: `Section ${id.split('_')[1]}: ${formatDays(courseData[id].slice(2))}`,
        };
        setCourses([...courses, newCourse]);
        setIsModalOpen(false);
    };

    const addCustomCourse = (newCourse) => {
        const newData = { ...courseData, [newCourse.id]: newCourse.correctformat };
        changeCourseData(newData); // This might needs change once database is set up

        setCourses([...courses, newCourse]);

        // Update the options for all related courses
        const baseCourseName = newCourse.id.split('_')[0];
        setCourses(prevCourses => prevCourses.map(course => {
            if (course.id.startsWith(baseCourseName)) {
                const updatedOptions = generateOptions(baseCourseName, newData);
                return { ...course, options: updatedOptions };
            }
            return course;
        }));

        setIsModalOpen(false);
    }

    const formatDays = (sessions) => {
        const daysSet = new Set();
        sessions.forEach(session => {
            session.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g).forEach(day => {
                daysSet.add(day.startsWith('Th') ? 'Th' : day.charAt(0));
            });
        });
        return Array.from(daysSet).join('');
    };

    const handleSelectChange = (courseId, newSelection) => {
        console.log(courseId, newSelection);
        const isAlreadySelected = courses.some(course => course.selectedOption === newSelection);

        if (isAlreadySelected) {
            alert("The new section you selected is already in the list!");
            // Revert the selection back to the previous value
            setCourses(courses.map(course => {
                if (course.id === courseId) {
                    return { ...course, selectedOption: course.selectedOption };
                }
                return course;
            }));
            return;
        }

        setCourses(courses.map(course => {
            if (course.id === courseId) {
                const newId = `${course.name}_${newSelection.split(' ')[1].replace(':', '')}`;
                setChangeCounter(prev => prev + 1);  // Increment change counter to indicate a change
                return { ...course, id: newId, selectedOption: newSelection };
            }
            return course;
        }));
    };

    const closeModal = () => {
        setIsModalOpen(false);
    }

    const removeCourse = id => {
        // Check if the course ID does not start with any of the specified prefixes

        const newCourseData = { ...courseData };
        if (!id.startsWith("CISC") && !id.startsWith("MATH") && !id.startsWith("STAT") && !id.startsWith("COGS")) {
            // Prompt the user to confirm the removal of a custom course
            const confirmRemoval = confirm("Removing a custom course will require you to reenter it. Do you want to proceed?");

            if (!confirmRemoval) {
                // If the user cancels, do not proceed with removal
                return;

            } else {
                // Because it's a custom course it must be removed from the library
                delete newCourseData[id];
                changeCourseData(newCourseData);

            }
        }

        const filteredCourses = courses.filter(course => course.id !== id);


        setCourses(
            filteredCourses.map(course => {
                if (course.id.startsWith(id.split("_")[0])) {
                    const updatedOptions = generateOptions(id.split("_")[0], newCourseData);
                    return { ...course, options: updatedOptions };
                }
                return course;
            })
        );

    };


    return (
        <div className="bg-gray-200 rounded-2xl mb-3 grid grid-cols-4 gap-1 p-2">
            {courses.map((course) => (
                <Course
                    key={course.id}
                    id={course.id}
                    name={course.name}
                    options={course.options}
                    selectedOption={course.selectedOption}
                    onSelectChange={handleSelectChange}
                    onRemove={removeCourse}
                />
            ))}
            <button className="flex justify-center items-center  xl:h-16 lg:h-14 md-custom:h-12 sm:h-14 h-12 border-2 border-dashed border-gray-400 rounded bg-white hover:bg-gray-100 mx-0.5"
                onClick={() => setIsModalOpen(true)}>
                <span className="text-xl">+</span>
            </button>
            <Modal isOpen={isModalOpen} onClose={closeModal} courseData={courseData} onAddCourse={addCourse} onAddCustomCourse={addCustomCourse} />
        </div>
    );
}


function Selection({ onUpdate, courseData, changeCourseData }) {
    const [inputValue, setInputValue] = useState('');
    const [notFound, setNotFound] = useState([]);  // State to track IDs not found
    const [isToggled, setIsToggled] = useState(false); // Manage toggle state here
    const [courses, setCourses] = useState([]);
    const [changeCounter, setChangeCounter] = useState(0);
    const [courseCount, setCourseCount] = useState(courses.length);

    // Update course count whenever courses change
    useEffect(() => {
        setCourseCount(courses.length);
    }, [courses.length]);

    useEffect(() => {
        const course_ids = courses.flatMap(course => course.id);
        onUpdate(course_ids);
    }, [changeCounter]);  // Depend directly on changeCounter

    // Effect to run onUpdate when courseCount changes
    useEffect(() => {
        const course_ids = courses.flatMap(course => course.id);
        onUpdate(course_ids);
    }, [courseCount]);  // Dependency on courseCount only

    const toggleSwitch = () => {
        setIsToggled(!isToggled);
    };


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
            if (id in courseData) {
                allCourseDetails.push(id);  // Collect all times, assuming times start from index 2
            } else {
                notFoundIds.push(id);  // Collect IDs not found
            }
        });

        onUpdate(allCourseDetails);
        setNotFound(notFoundIds);  // Update not found IDs
    };

    return (
        <div className='m-4 mb-12'>
            {!isToggled && <>
                <CourseGrid courseData={courseData} courses={courses} setCourses={setCourses} setChangeCounter={setChangeCounter} changeCourseData={changeCourseData} />
                <div className='w-full h-full flex items-center justify-end'>
                    <Toggle message="Entry Mode" isToggled={isToggled} toggleSwitch={toggleSwitch} />
                </div>
            </>}

            {/* Entry Mode */}
            {isToggled && (<div>
                <textarea
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={`Enter courses as 'CISC121_1 separated by new lines\nThe number after the underscore is the order they appear in on SOLUS\nIt is recommended you double check SOLUS for accuracy`}
                    className="sm:text-base text-sm w-full p-1 h-32 border-gray-600 border-2 bg-gray-100 resize-none"
                />
                <div className='w-full h-full flex items-center justify-between'>
                    <button onClick={handleSubmit} className=" text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Update Schedule</button>
                    <Toggle message="Entry Mode" isToggled={isToggled} toggleSwitch={toggleSwitch} />
                </div>
                {notFound.length > 0 && (
                    <div className="p-2 mx-2 bg-red-100 border border-red-400 text-red-700">
                        <p>Course ID(s) not found (check your format!):</p>
                        <ul>
                            {notFound.map(id => <li key={id}>{id}</li>)}
                        </ul>
                    </div>
                )}
            </div>)}
        </div>
    );
}

export default Selection;