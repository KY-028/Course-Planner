import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { generateNewCourse, generateOptions } from './courseFunctions';
import Modal from './modal';
import UpdateManager from './updatemanager'

function Toggle({ message, isToggled, toggleSwitch }) {
    return (
        <label className="flex items-center cursor-pointer">
            <div className="relative">
                <input type="checkbox" className="sr-only" checked={isToggled} onChange={toggleSwitch} />
                <div className={`block ${isToggled ? 'bg-blue-600' : 'bg-gray-600'} lg:w-14 w-10 lg:h-8 h-6 rounded-full hover:bg-blue-600 transition duration-300`}></div>
                <div className={`dot absolute left-1 top-1 bg-white lg:w-6 lg:h-6 w-4 h-4 rounded-full transition-transform ${isToggled ? 'translate-x-full' : ''}`}></div>
            </div>
            <span className="ml-3 text-gray-900 font-medium">{message}</span>
        </label>
    );
}

function Course({ id, name, title, options, selectedOption, onSelectChange, onRemove, term }) {
    return (
        <div className="relative bg-white rounded-lg xl:h-20 lg:h-[4.25rem] md-custom:h-14 sm:h-[4.25rem] h-14 xl:pt-1 lg:pt-1.5 mx-0.5 lg:px-2 md-custom:px-1 sm:px-2 px-1 overflow-hidden">
            <button
                className=" rounded-xl  absolute top-0 right-0 p-1 px-2 lg:pt-1 md-custom:pt-0.5 lg:text-xxs text-xxxs font-extrabold text-black hover:text-red-500"
                onClick={() => onRemove(id)}
            >
                &#x2715;
            </button>
            <div className="w-full font-semibold xl:text-base lg:text-xs md-custom:text-xs sm:text-sm text-xs lg:mb-0.25 lg:mt-0.5 md-custom:mt-1 sm:-mb-0 mt-1">{name}</div>
            <div className="w-full text-gray-600 xl:text-xs lg:text-xxs md-custom:text-xxs sm:text-xs text-xxs xl:mb-0.5 lg:-mb-1 md-custom:-mb-1.5 sm:-mb-0.5 -mb-1.5 text-nowrap whitespace-nowrap overflow-hidden">{title}</div>
            <select
                id={`${term}-${id}`}
                className="w-full bg-gray-100 border-gray-300 rounded xl:text-xs md-custom:text-xxs sm:text-small text-xxs"
                value={selectedOption}
                onChange={(e) => onSelectChange(id, e.target.value)}
            >
                {options.map((option, index) => (
                    <option key={index} id={`${name}_${option}`} value={option}>{option}</option>
                ))}
            </select>
        </div>
    );
}

function CourseGrid({ courseData, changeCourseData, courses, setCourses, setChangeCounter, term, original, setInputValue }) {

    const apiUrl = import.meta.env.VITE_API_URL;

    const { currentUser } = useContext(AuthContext);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const addCourse = (id) => {
        // Check if the course with the given id is already in the courses list
        const isAlreadyAdded = courses.some(course => course.id === id);
        if (isAlreadyAdded) {
            alert("This course is already in the list!");
            setIsModalOpen(true);
            return;
        }
        // Generate the appropriate format to add to our list of courses for <Selection />
        const newCourse = generateNewCourse(id, courseData);
        setCourses([...courses, newCourse]);
        setInputValue(prev => (prev + "\n" + id).trim());
        setIsModalOpen(false);
    };

    const addCustomCourse = async (newCourse) => {
        const newData = { ...courseData, [newCourse.id]: newCourse.correctformat };
        changeCourseData(newData);
        setCourses([...courses, newCourse]);
        setInputValue(prev => (prev + "\n" + newCourse.id).trim());

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

        // Send a POST request to add a custom course into the database

        if (currentUser) {
            const data = {
                "user_id": currentUser.id,
                "term": term,
                "course_id": newCourse.id,
                "course_info": { [newCourse.id]: newCourse.correctformat }
            }

            UpdateManager.addUpdate({
                endpoint: `${apiUrl}/backend/customCourses/`,
                data: data
            });
        } else {
            console.warn("Cannot add custom course: User not logged in.");
        }


    }

    const handleSelectChange = (courseId, newSelection) => {

        const match = newSelection.match(/\d+/);
        const number = match ? match[0] : null;

        const isAlreadySelected = courses.some(course => course.id === `${courseId.split("_")[0]}_${number}`);

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

    const removeCourse = async id => {

        const newCourseData = { ...courseData };
        if (!(id in original)) {
            // Prompt the user to confirm the removal of a custom course
            const confirmRemoval = confirm("Removing a custom course will require you to reenter it. Do you want to proceed?");

            if (!confirmRemoval) {
                // If the user cancels, do not proceed with removal
                return;

            } else {
                // Because it's a custom course it must be removed from the library
                delete newCourseData[id];
                changeCourseData(newCourseData);

                if (currentUser) {
                    const data = {
                        user_id: currentUser.id,
                        term: term,
                        course_id: id
                    }
    
                    UpdateManager.addUpdate({
                        endpoint: `${apiUrl}/backend/customCourses/delete`,
                        data: data
                    });
                } else {
                    console.warn("Cannot remove custom course: User not logged in.");
                }

            }
        }

        // Remove options from related courses
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
        <div className=" bg-slate-200 rounded-2xl mt-3 grid grid-cols-4 gap-1 xl:p-4 sm:p-2 p-3">
            {courses.map((course) => (
                <Course
                    key={course.id}
                    id={course.id}
                    name={course.name}
                    title={course.title}
                    options={course.options}
                    selectedOption={course.selectedOption}
                    onSelectChange={handleSelectChange}
                    onRemove={removeCourse}
                    term={term}
                />
            ))}
            {courses.length < 15 &&
                <button className="flex justify-center items-center xl:h-20 lg:h-[4.25rem] md-custom:h-14 sm:h-[4.25rem] h-14 border-2 border-dashed border-gray-400 rounded-lg transition duration-200 bg-white hover:bg-sky-100 mx-0.5"
                    onClick={() => setIsModalOpen(true)}>
                    <span className="text-xl">+</span>
                </button>
            }
            <Modal isOpen={isModalOpen} onClose={closeModal} courseData={courseData} onAddCourse={addCourse} onAddCustomCourse={addCustomCourse} />
        </div>
    );
}


function Selection({ isLoading, onUpdate, courseData, changeCourseData, courses, setCourses, term, conflicts, original }) {
    const [inputValue, setInputValue] = useState('');
    const [notFound, setNotFound] = useState([]);  // State to track IDs not found
    const [isToggled, setIsToggled] = useState(false); // Manage toggle state here
    const [changeCounter, setChangeCounter] = useState(0);
    const [courseCount, setCourseCount] = useState(courses.length);

    // Update course count whenever courses change
    useEffect(() => {
        setCourseCount(courses.length);
    }, [courses.length]);

    useEffect(() => {
        if (!isLoading) {
            const course_ids = courses.flatMap(course => course.id);
            onUpdate(course_ids);
        }
    }, [changeCounter, isLoading]);  // Depend directly on changeCounter

    // Effect to run onUpdate when courseCount changes
    useEffect(() => {
        if (!isLoading) {
            const course_ids = courses.flatMap(course => course.id);
            onUpdate(course_ids);
        }
    }, [courseCount, isLoading]);  // Dependency on courseCount only

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
        // First, remove any courses that are no longer in the input
        setCourses(prevCourses => prevCourses.filter(course => ids.includes(course.id)));

        ids.forEach(id => {
            if (id in courseData) {
                allCourseDetails.push(id);
                if (!courses.some(course => course.id === id)) {
                    setCourses(prevCourses => [...prevCourses, generateNewCourse(id, courseData)]);
                }
            } else {
                notFoundIds.push(id);  // Collect IDs not found
            }
        });

        onUpdate(allCourseDetails);
        setNotFound(notFoundIds);  // Update not found IDs
    };

    return (
        <div className='ml-6 m-4 mt-0 mb-8'>
            <div className='text-center text-2xl font-bold mb-2 lg:mt-0 mt-2'>{term} Term</div>
            {!isToggled && <>
                <div className='w-full h-full flex items-center justify-begin'>
                    <Toggle message="Entry Mode" isToggled={isToggled} toggleSwitch={toggleSwitch} />
                </div>
                <CourseGrid courseData={courseData} courses={courses} setCourses={setCourses} setChangeCounter={setChangeCounter} changeCourseData={changeCourseData} term={term} original={original} setInputValue={setInputValue}/>
                {conflicts.length > 0 && (
                    <div className="mt-1 p-2 mx-1 bg-red-100 border border-red-400 text-red-700">
                        <p>The following Courses have Conflicts:</p>
                        <ul>
                            {conflicts.map(id => <li key={id}>{id}</li>)}
                        </ul>
                    </div>
                )}
            </>}

            {/* Entry Mode */}
            {isToggled && (<div>
                <div className='w-full h-full flex items-center justify-between'>
                    <Toggle message="Entry Mode" isToggled={isToggled} toggleSwitch={toggleSwitch} />
                    <button onClick={handleSubmit} className=" text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Update Schedule</button>
                </div>

                <textarea
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={`Enter courses as 'CISC121_1 separated by new lines\nThe number after the underscore is the order they appear in on SOLUS\nIt is recommended you double check SOLUS for accuracy`}
                    className="sm:text-base text-sm w-full p-1 h-32 border-gray-400 border-2 rounded-lg p-3 mt-5 bg-gray-200 resize-none"
                />

                {notFound.length > 0 && (
                    <div className="p-2 mx-1 bg-red-100 border border-red-400 text-red-700">
                        <p>Course ID(s) not found:</p>
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
