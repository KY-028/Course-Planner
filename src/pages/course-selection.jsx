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
import { useNavigate } from 'react-router-dom'

export default function Courses() {
    const { currentUser } = useContext(AuthContext);
    const [fallCourses, setFallCourses] = useState([]);
    const [winterCourses, setWinterCourses] = useState([]);
    const [fallData, setFallData] = useState(fallJSON);
    const [winterData, setWinterData] = useState(winterJSON);
    const [isLoading, setIsLoading] = useState(true);  // New state to manage loading
    const [fc, setFc] = useState([]);
    const [wc, setWc] = useState([]);
    const [err, setError] = useState(null);

    // const navigate = useNavigate();
    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);  // Immediately allow interaction if not logged in
            return;  // Exit if no user is logged in
        }

        // If a user exists, proceed to fetch data
        setIsLoading(true);
        fetchUserCourses()
    }, [currentUser]);

    const fetchUserCourses = async () => {
        try {
            const userId = currentUser ? currentUser.id : null;
            if (!userId) {
                console.log("User has not logged in");
                return;
            }

            const response = await axios.get(`https://cp-backend-psi.vercel.app/backend/users/courses/${userId}`);
            const { fallCourses, winterCourses } = response.data;

            const fall = fallCourses.flatMap(id => fallData[id].slice(2));
            setFallCourses(fall);
            const winter = winterCourses.flatMap(id => winterData[id].slice(2));
            setWinterCourses(winter);


            const generateOptions = (courseBaseId, coursemaster) => {
                const sectionKeys = Object.keys(coursemaster).filter(key => key.startsWith(courseBaseId));
                return sectionKeys.map(key => {
                    return `Section ${key.split('_')[1]}: ${formatDays(coursemaster[key].slice(2))}`;
                }).sort();
            };

            const formatDays = (sessions) => {
                const daysSet = new Set();
                sessions.forEach(session => {
                    session.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g).forEach(day => {
                        daysSet.add(day.startsWith('Th') ? 'Th' : day.charAt(0));
                    });
                });
                return Array.from(daysSet).join('');
            };


            const processedFallCourses = fallCourses.map(courseId => {
                const courseDetail = fallData[courseId];
                return {
                    id: courseId,
                    name: courseDetail[0],
                    options: generateOptions(courseDetail[0], fallData),
                    selectedOption: `Section ${courseId.split('_')[1]}: ${formatDays(fallData[courseId].slice(2))}`,
                };
            });

            setFc(processedFallCourses);

            const processedWinterCourses = winterCourses.map(courseId => {
                const courseDetail = winterData[courseId]; // Assuming winterData is your course data object
                return {
                    id: courseId,
                    name: courseDetail[0],
                    options: generateOptions(courseDetail[0], winterData),
                    selectedOption: `Section ${courseId.split('_')[1]}: ${formatDays(winterData[courseId].slice(2))}`,
                };
            });

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
        const courses = courses_ids.flatMap(course => fallData[course].slice(1));
        setFallCourses(courses);  // Update local state regardless of login

        // Check if user is logged in
        console.log(courses_ids)
        console.log(currentUser)
        if (!currentUser) {
            return;  // Early return if no user is logged in
        }
        // User is logged in, send data to backend
        const userId = currentUser.id;
        const term = "fall";
        try {
            await axios.post('https://cp-backend-psi.vercel.app/backend/courseChange/', {
                userId,
                courses_ids,
                term,
            });
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred";
            setError(errorMessage);
        }
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
        const userId = currentUser.id;
        const term = "winter"
        try {
            await axios.post('https://cp-backend-psi.vercel.app/backend/courseChange/', {
                userId,
                courses_ids,
                term,
            });
        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred";
            setError(errorMessage);
        }

    };


    useEffect(() => {
        if (!currentUser) {
            const handleBeforeUnload = (e) => {
                e.preventDefault();
                e.returnValue = ''; // Standard for most browsers
            };

            window.addEventListener('beforeunload', handleBeforeUnload);

            // Cleanup the event listener when the component unmounts or the user signs in
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, [currentUser]);


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
                        <Selection isLoading={isLoading} onUpdate={updateFallCourses} courseData={fallData} changeCourseData={setFallData} courses={fc} setCourses={setFc} />
                        <Calendar term="Fall" times={fallCourses} />

                    </div>
                    <div className='sm:m-0 m-1.5 p-0'>
                        <Selection isLoading={isLoading} onUpdate={updateWinterCourses} courseData={winterData} changeCourseData={setWinterData} courses={wc} setCourses={setWc} />
                        <Calendar term="Winter" times={winterCourses} />
                    </div>

                </div>
            </div>

        </div>

    );
}
