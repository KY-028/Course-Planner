import { useState, useEffect } from 'react';
import LeftMenu from '/src/components/leftMenu';
import Calendar from '/src/components/calendar';
import Nav from '/src/components/nav';
import Selection from '/src/components/selections';
import fallJSON from '/src/assets/fall_2024_0626.json';
import winterJSON from '/src/assets/winter_2025_0626.json';
import axios from 'axios'

const falltimes = [
    "CISC 322 Tuesday 8:30-9:30",
    "CISC 322 Wednesday 10:30-11:30",
    "CISC 322 Friday 9:30-10:30",
    "CISC 322 Monday 14:30-16:30",
    "CISC 324 Tuesday 9:30-10:30",
    "CISC 324 Thursday 8:30-9:30",
    "CISC 324 Friday 10:30-11:30",
    "CISC 327 Monday 9:30-10:30",
    "CISC 327 Wednesday 8:30-9:30",
    "CISC 327 Thursday 10:30-11:30",
    "CISC 360 Monday 11:30-12:30",
    "CISC 360 Tuesday 13:30-14:30",
    "CISC 360 Thursday 12:30-13:30",
    "CISC 371 Monday 13:30-14:30",
    "CISC 371 Wednesday 12:30-13:30",
    "CISC 371 Friday 11:30-12:30",
    "FREN 219 Monday 16:00-17:30",
    "FREN 219 Wednesday 12:30-14:30",
];

const wintertimes = [
    "CISC 332 Tuesday 8:30-9:30",
    "CISC 332 Wednesday 10:30-11:30",
    "CISC 332 Friday 9:30-10:30",
    "CISC 335 Monday 11:30-12:30",
    "CISC 335 Tuesday 13:30-14:30",
    "CISC 335 Thursday 12:30-13:30",
    "CISC 352 Tuesday 9:30-10:30",
    "CISC 352 Thursday 8:30-9:30",
    "CISC 352 Friday 10:30-11:30",
    "CISC 365 Tuesday 12:30-13:30",
    "CISC 365 Thursday 11:30-12:30",

    "CISC 365 Friday 13:30-14:30",
    "STAT 362 Monday 13:30-14:30",
    "STAT 362 Wednesday 12:30-13:30",
    "STAT 362 Friday 11:30-12:30",
    "FREN 219 Friday 10:30-12:00",
    "guess Friday 12:00-13:00",

]

export default function Courses() {

    const [fallCourses, setFallCourses] = useState([]);
    const [winterCourses, setWinterCourses] = useState([]);
    const [fallData, setFallData] = useState(fallJSON);
    const [winterData, setWinterData] = useState(winterJSON);

    const [fc, setFc] = useState([]);
    const [wc, setWc] = useState([]);
    const [err, setError] = useState(null);

    useEffect(() => {
        const fetchUserCourses = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const userId = user ? user.id : null;
                if (!userId) {
                    console.log("User has not logged in");
                    return;
                }

                const response = await axios.get(`https://cp-backend-psi.vercel.app/backend/users/courses/${userId}`);
                const { fallCourses, winterCourses } = response.data;

                const fall = fallCourses.flatMap(id => fallData[id].slice(2));
                console.log("Fall: " + fall);
                setFallCourses(fall);
                const winter = winterCourses.flatMap(id => fallData[id].slice(2));
                console.log("Winter: " + winter)
                setWinterCourses(winter);


                const generateOptions = (courseBaseId, coursemaster = courseData) => {
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
                        options: generateOptions(courseId, fallData),
                        selectedOption: `Section ${courseId.split('_')[1]}: ${formatDays(fallData[courseId].slice(2))}`,
                    };
                });

                console.log(processedFallCourses);
                setFc(processedFallCourses);

                const processedWinterCourses = winterCourses.map(courseId => {
                    const courseDetail = winterData[courseId]; // Assuming winterData is your course data object
                    return {
                        id: courseId,
                        name: courseDetail[0],
                        options: generateOptions(courseId, winterData),
                        selectedOption: `Section ${courseId.split('_')[1]}: ${formatDays(winterData[courseId].slice(2))}`,
                    };
                });

                console.log(processedWinterCourses);
                setWc(processedWinterCourses);
            } catch (err) {
                const errorMessage = err.response?.data?.message || "An unexpected error occurred while fetching user courses";
                setError(errorMessage);
            }
        };

        fetchUserCourses();
    }, []);

    const updateFallCourses = async (courses_ids) => {
        // Prepare for Calendar Rendering
        const courses = courses_ids.flatMap(course => fallData[course].slice(2));
        setFallCourses(courses);
        // Send data to backend
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user ? user.id : null;
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
        // Send data to backend
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user ? user.id : null;
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
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = ''; // Standard for most browsers
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup the event listener when the component unmounts
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return (

        <div className='grid xl:grid-cols-sidebar-lg lg:grid-cols-sidebar min-h-screen overflow-y-auto'>
            <div className='relative lg:block hidden'>
                <div className='absolute top-0 left-0'>
                    <LeftMenu activeTab="courses" />
                </div>
            </div>

            <div className='flex flex-col w-full'>
                <Nav activeTab="courses" />
                <div className='w-full grid md-custom:grid-cols-2 grid-cols md-custom:mx-0 m-0 p-0 gap-3'>
                    <div className='sm:m-0 m-1.5 p-0'>
                        <Calendar term="Fall" times={fallCourses} />
                        <Selection onUpdate={updateFallCourses} courseData={fallData} changeCourseData={setFallData} courses={fc} setCourses={setFc} />
                    </div>
                    <div className='sm:m-0 m-1.5 p-0'>
                        <Calendar term="Winter" times={winterCourses} />
                        <Selection onUpdate={updateWinterCourses} courseData={winterData} changeCourseData={setWinterData} courses={wc} setCourses={setWc} />
                    </div>

                </div>
            </div>

        </div>

    );
}