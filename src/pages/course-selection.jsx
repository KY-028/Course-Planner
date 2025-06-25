import { useState, useEffect } from 'react';
import LeftMenu from '/src/components/leftMenu';
import Calendar from '/src/components/calendar';
import Nav from '/src/components/nav';
import DonateBanner from '/src/components/donatebanner'
import Selection from '/src/components/selections';
import fallJSON from '/src/assets/fall_2025_0624.json';
import winterJSON from '/src/assets/winter_2025_0710.json';
import axios from 'axios'
import { useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { generateNewCourse, generateOptions } from '../components/courseFunctions';
import UpdateManager from '../components/updatemanager';

// Loading Modal Component
function LoadingModal() {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">Loading...</p>
            </div>
        </div>
    );
}

export default function Courses() {
    const { currentUser } = useContext(AuthContext);

    const apiUrl = import.meta.env.VITE_API_URL;

    // Imported JSON
    const [fallData, setFallData] = useState(fallJSON);
    const [winterData, setWinterData] = useState(winterJSON);
    const [fallOriginal] = useState(JSON.parse(JSON.stringify(fallJSON)));
    const [winterOriginal] = useState(JSON.parse(JSON.stringify(winterJSON)));

    /**
     * Courses to be displayed in <Calendar />
     * Desired format: one single list of 
     * ["CISC101 U Day Time Prof", "CISC101 U Day Time Prof", "CISC102 U Day Time Prof", ...]
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
            alert("You are not logged in. All data entered will not be remembered.");
            setIsLoading(false);  // Immediately allow interaction if not logged in
            return;
        }
        setIsLoading(true);
        fetchUserCourses()
    }, [currentUser]);

    useEffect(() => {
        if (err) {
            alert(err);
        }
    }, [err]);

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

            const response = await axios.get(`${apiUrl}/backend/users/courses/${userId}`);
            const { fallCourses, winterCourses } = response.data;

            let errorCourses = { fall: [], winter: [] };

            const fetchAndMergeCustomCourse = async (courseId, term) => {
                try {
                    const termData = term === 'fall' ? fallData : winterData;
                    if (!(courseId in termData)) {
                        const url = `${apiUrl}/backend/customCourses/${courseId}?userId=${userId}&term=${term}`;
                        const res = await axios.get(url);
                        termData[courseId] = res.data.courseInfo[courseId];
                        console.log(`Course ${courseId} fetched and merged for ${term}:`, termData[courseId]);
                    }
                } catch (error) {
                    console.error(`Failed to fetch course ${courseId} for term ${term}:`, error);
                    errorCourses[term].push(courseId);
                    return null;
                }
            };

            const processCourses = async (courseArray, term) => {
                const results = await Promise.allSettled(courseArray.map(id => fetchAndMergeCustomCourse(id, term)));
                const successfulCourses = results
                    .map((result, index) => result.status === 'fulfilled' ? courseArray[index] : null)
                    .filter(id => id !== null && !errorCourses[term].includes(id));
                const processedData = successfulCourses.map(id => (term === 'fall' ? fallData : winterData)[id].slice(4));
                return { full: successfulCourses, sliced: processedData.flat() };
            };

            const fallResults = await processCourses(fallCourses, 'fall');
            const winterResults = await processCourses(winterCourses, 'winter');

            setFallCourses(fallResults.sliced);
            setWinterCourses(winterResults.sliced);

            const processedFallCourses = fallResults.full.map(courseId => generateNewCourse(courseId, fallData));
            setFc(processedFallCourses);

            const processedWinterCourses = winterResults.full.map(courseId => generateNewCourse(courseId, winterData));
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
        const courses = courses_ids.flatMap(course => fallData[course].slice(4));
        setFallCourses(courses);

        if (!currentUser) {
            return;  // Early return if no user is logged in
        }

        const data = {
            userId: currentUser.id,
            courses_ids: courses_ids,
            term: "fall",
        };

        UpdateManager.addUpdate({
            endpoint: `${apiUrl}/backend/courseChange/`,
            data: data
        });
    };

    const updateWinterCourses = async (courses_ids) => {
        // Prepare for Calendar Rendering
        const courses = courses_ids.flatMap(course => winterData[course].slice(4));
        setWinterCourses(courses);

        if (!currentUser) {
            return;  // Early return if no user is logged in
        }

        const data = {
            userId: currentUser.id,
            courses_ids,
            term: "winter",
        };

        UpdateManager.addUpdate({
            endpoint: `${apiUrl}/backend/courseChange/`,
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
            {isLoading && <LoadingModal />}
            <div className='relative lg:block hidden '>
                <div className='absolute top-0 left-0'>
                    <LeftMenu activeTab="courses" />
                </div>
            </div>

            <div className='flex flex-col w-full'>
                <Nav activeTab="courses" />
                <DonateBanner />
                <div className='w-full grid md-custom:grid-cols-2 grid-cols md-custom:mx-0 m-0 p-0 gap-3' >
                    <div className='sm:m-0 m-1.5 p-0'>
                        <Selection isLoading={isLoading} onUpdate={updateFallCourses} courseData={fallData} changeCourseData={setFallData} courses={fc} setCourses={setFc} term={"Fall"} conflicts={fallConflicts} original={fallOriginal} />
                        <Calendar term="Fall" times={fallCourses} setConflicts={setFallConflicts} />

                    </div>
                    <div className='sm:m-0 m-1.5 p-0'>
                        <Selection isLoading={isLoading} onUpdate={updateWinterCourses} courseData={winterData} changeCourseData={setWinterData} courses={wc} setCourses={setWc} term={"Winter"} conflicts={winterConflicts} original={winterOriginal} />
                        <Calendar term="Winter" times={winterCourses} setConflicts={setWinterConflicts} />
                    </div>

                </div>
            </div>

        </div>

    );
}
