import { useState, useEffect } from 'react';
import LeftMenu from '/src/components/leftMenu';
import Calendar from '/src/components/calendar';
import Nav from '/src/components/nav';
import Selection from '/src/components/selections';
import fallJSON from '/src/assets/fall_2024_0626.json';
import winterJSON from '/src/assets/winter_2025_0626.json';

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



    const updateFallCourses = (courses_ids) => {
        // Write your DB lines here


        // Prepare for Calendar Rendering
        const courses = courses_ids.flatMap(course => fallData[course].slice(2));

        setFallCourses(courses);
    };

    const updateWinterCourses = (courses_ids) => {
        // Write your DB lines here


        // Prepare for Calendar Rendering
        console.log(courses_ids)
        const courses = courses_ids.flatMap(course => winterData[course].slice(2));
        setWinterCourses(courses);

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
                        <Selection onUpdate={updateFallCourses} courseData={fallData} changeCourseData={setFallData} />
                    </div>
                    <div className='sm:m-0 m-1.5 p-0'>
                        <Calendar term="Winter" times={winterCourses} />
                        <Selection onUpdate={updateWinterCourses} courseData={winterData} changeCourseData={setWinterData} />
                    </div>

                </div>
            </div>

        </div>

    );
}