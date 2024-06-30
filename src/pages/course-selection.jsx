import { useState, useEffect } from 'react';
import LeftMenu from '/src/components/leftMenu';
import Calendar from '/src/components/calendar';
import Nav from '/src/components/nav';
import Selection from '/src/components/selections';
import fallJSON from '/src/assets/fall_2024_0629.json';
import winterJSON from '/src/assets/winter_2025_0629.json';
import axios from 'axios'
import { useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { generateNewCourse, generateOptions } from '../components/courseFunctions';
import UpdateManager from '../components/updatemanager';

export default function Courses() {
    const { currentUser } = useContext(AuthContext);
    // Imported JSON
    const [fallData, setFallData] = useState(fallJSON);
    const [winterData, setWinterData] = useState(winterJSON);

    /**
     * Courses to be displayed in <Calendar />
     * Desired format: one single list of 
     * ["CISC101 Day Time Prof", "CISC101 Day Time Prof", "CISC102 Day Time Prof", ...]
     */

    const [fallCourses, setFallCourses] = useState([]);
    const [winterCourses, setWinterCourses] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    /**
     * Courses to be displayed in <Selection />
     * Desired format: an array of object like
     * [{id: CISC101_1, name: "CISC101", options: ["Section 1: MWF", "Section 2: TThF"], selectedOption: "Section 1: MWF"}, {...}]
     */
    const [fc, setFc] = useState([]);
    const [wc, setWc] = useState([]);
    const [err, setError] = useState(null);

    const [fallConflicts, setFallConflicts] = useState([]);
    const [winterConflicts, setWinterConflicts] = useState([]);

    /**
    * Upon arriving on /course-selection
    * - Check if user is logged in
    * - If logged in, fetch the courses and render
    * - If not, the user will use the functions without saving their results
    */
    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);  // Immediately allow interaction if not logged in
            return;
        }
        setIsLoading(true);
        fetchUserCourses()
    }, [currentUser]);


    /**
     * try to obtain the user ID, if not found, stop the function
     * the fetching consists of these steps:
     * 1. GET the current list of courses from backend
     * 2. 
     * @returns 
     */
    const fetchUserCourses = async () => {
        try {
            const userId = currentUser ? currentUser.id : null;
            if (!userId) {
                console.log("User has not logged in");
                return;
            }

            const response = await axios.get(`https://cp-backend-psi.vercel.app/backend/users/courses/${userId}`);
            const { fallCourses, winterCourses } = response.data;

            // 如果这个CourseID，不在我们的JSON里面(fallData),发出一个GET请求，去找database里的custom课（写好GET了）
            // localhost:8800/backend/customCourses/FREN219_1?userId=6
            // 把这个得到的数据，加到JSON里面，记住这个JSON要检查是否已经有个custom课，有的话就替换/不动

            const fall = fallCourses.flatMap(id => fallData[id].slice(2));
            setFallCourses(fall);
            const winter = winterCourses.flatMap(id => winterData[id].slice(2));
            setWinterCourses(winter);

            const processedFallCourses = fallCourses.map(courseId => generateNewCourse(courseId, fallData));
            setFc(processedFallCourses);

            const processedWinterCourses = winterCourses.map(courseId => generateNewCourse(courseId, winterData));
            setWc(processedWinterCourses);

        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred while fetching user courses";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const updateFallCourses = async (courses_ids) => {
        // Prepare for Calendar Rendering
        const courses = courses_ids.flatMap(course => fallData[course].slice(2));
        setFallCourses(courses);

        // Check if user is logged in
        console.log(courses_ids)
        console.log(currentUser)
        if (!currentUser) {
            return;  // Early return if no user is logged in
        }

        const data = {
            userId: currentUser.id,
            courses_ids: courses_ids,
            term: "fall",
        };

        UpdateManager.addUpdate({
            endpoint: 'https://cp-backend-psi.vercel.app/backend/courseChange/',
            data: data
        });
    };

    const updateWinterCourses = async (courses_ids) => {
        // Prepare for Calendar Rendering
        const courses = courses_ids.flatMap(course => winterData[course].slice(2));
        setWinterCourses(courses);

        // Check if user is logged in
        console.log(courses_ids)
        console.log(currentUser)
        if (!currentUser) {
            return;  // Early return if no user is logged in
        }

        const data = {
            userId: currentUser.id,
            courses_ids,
            term: "winter",
        };

        UpdateManager.addUpdate({
            endpoint: 'https://cp-backend-psi.vercel.app/backend/courseChange/',
            data: data
        });
    };

    // useEffect for handling beforeunload event based on user login status and unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (!currentUser && (fallCourses.length > 1 || winterCourses.length > 1)) {
                event.preventDefault();
                event.returnValue = "You have unsaved changes that may not be saved. Are you sure you want to leave?";
            } else if (UpdateManager.queue.length > 0) {
                event.preventDefault();
                event.returnValue = "You have unsaved changes. Are you sure you want to leave?";
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentUser, fallCourses, winterCourses]);


    return (

        <div className='grid xl:grid-cols-sidebar-lg lg:grid-cols-sidebar min-h-screen overflow-y-auto'>
            <div className='relative lg:block hidden '>
                <div className='absolute top-0 left-0'>
                    <LeftMenu activeTab="courses" />
                </div>
            </div>

            <div className='flex flex-col w-full'>
                <Nav activeTab="courses" />
                <div className='w-full grid md-custom:grid-cols-2 grid-cols md-custom:mx-0 m-0 p-0 gap-3' >
                    <div className='sm:m-0 m-1.5 p-0'>
                        <Selection isLoading={isLoading} onUpdate={updateFallCourses} courseData={fallData} changeCourseData={setFallData} courses={fc} setCourses={setFc} term={"Fall"} conflicts={fallConflicts} />
                        <Calendar term="Fall" times={fallCourses} setConflicts={setFallConflicts} />

                    </div>
                    <div className='sm:m-0 m-1.5 p-0'>
                        <Selection isLoading={isLoading} onUpdate={updateWinterCourses} courseData={winterData} changeCourseData={setWinterData} courses={wc} setCourses={setWc} term={"Winter"} conflicts={winterConflicts} />
                        <Calendar term="Winter" times={winterCourses} setConflicts={setWinterConflicts} />
                    </div>

                </div>
            </div>

        </div>

    );
}
