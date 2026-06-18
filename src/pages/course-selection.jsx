import { useState, useEffect } from 'react';
import LeftMenu from '/src/components/leftMenu';
import Calendar from '/src/components/calendar';
import Nav from '/src/components/nav';
import DonateBanner from '/src/components/donatebanner'
import Selection from '/src/components/selections';
import fallJSON from '/src/assets/fall_2025_0624.json';
import winterJSON from '/src/assets/winter_2026_0625.json';
import axios from 'axios'
import { useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { generateNewCourse, generateOptions } from '/src/functions/courseFunctions';
import UpdateManager from '../components/updatemanager';
import LoadingModal from '../components/loadingModal';

// Loading Modal Component
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

    // Guard overlay redirecting users to QFlow. Shown by default.
    const [showOverlay, setShowOverlay] = useState(true);
    const [qflowLoading, setQflowLoading] = useState(false);

    // Trigger the secure backend transfer: the backend calls QFlow with the
    // bypass key and returns the redirect URL we then navigate to.
    const handleQflowTransfer = async () => {
        if (qflowLoading) return;
        if (!currentUser?.email) {
            alert("Please log in first so we can transfer your account to QFlow.");
            return;
        }
        try {
            setQflowLoading(true);
            const res = await axios.post(`${apiUrl}/backend/qflow/transfer`, {
                email: currentUser.email,
            });
            const redirectUrl = res.data?.redirectUrl;
            if (!redirectUrl) {
                alert("Could not start the QFlow transfer. Please try again later.");
                return;
            }
            window.location.href = redirectUrl;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Could not connect to QFlow right now. Please try again in a moment.";
            alert(message);
        } finally {
            setQflowLoading(false);
        }
    };

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

            // Courses are now stored as object snapshots ({ id, info }), so we
            // display them directly without resolving IDs against the bundled
            // JSON or round-tripping to the backend per custom course. We merge
            // each snapshot's info into the in-memory course map so the rest of
            // the pipeline (section options, calendar) keeps working.
            const toSnapshots = (arr) =>
                (Array.isArray(arr) ? arr : []).filter(
                    (c) => c && typeof c.id === 'string' && Array.isArray(c.info)
                );

            const fallSnaps = toSnapshots(fallCourses);
            const winterSnaps = toSnapshots(winterCourses);

            const fallMap = { ...fallData, ...Object.fromEntries(fallSnaps.map((s) => [s.id, s.info])) };
            const winterMap = { ...winterData, ...Object.fromEntries(winterSnaps.map((s) => [s.id, s.info])) };

            setFallData(fallMap);
            setWinterData(winterMap);

            setFallCourses(fallSnaps.flatMap((s) => s.info.slice(4)));
            setWinterCourses(winterSnaps.flatMap((s) => s.info.slice(4)));

            setFc(fallSnaps.map((s) => generateNewCourse(s.id, fallMap)));
            setWc(winterSnaps.map((s) => generateNewCourse(s.id, winterMap)));

        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred while fetching user courses";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const updateFallCourses = async (courses_ids) => {
        // Only keep ids we actually have info for, then snapshot them.
        const ids = courses_ids.filter((id) => Array.isArray(fallData[id]));

        // Prepare for Calendar Rendering
        setFallCourses(ids.flatMap((id) => fallData[id].slice(4)));

        if (!currentUser) {
            return;  // Early return if no user is logged in
        }

        const data = {
            userId: currentUser.id,
            courses: ids.map((id) => ({ id, info: fallData[id] })),
            term: "fall",
        };

        UpdateManager.addUpdate({
            endpoint: `${apiUrl}/backend/courseChange/`,
            data: data
        });
    };

    const updateWinterCourses = async (courses_ids) => {
        // Only keep ids we actually have info for, then snapshot them.
        const ids = courses_ids.filter((id) => Array.isArray(winterData[id]));

        // Prepare for Calendar Rendering
        setWinterCourses(ids.flatMap((id) => winterData[id].slice(4)));

        if (!currentUser) {
            return;  // Early return if no user is logged in
        }

        const data = {
            userId: currentUser.id,
            courses: ids.map((id) => ({ id, info: winterData[id] })),
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
            {showOverlay && (
                <div className='fixed top-0 bottom-0 right-0 left-0 lg:left-[20%] xl:left-64 z-[9999] flex items-center justify-center overflow-y-auto bg-white px-5 py-10 sm:px-8'>
                    <div className='mx-auto flex w-full max-w-2xl flex-col items-center text-center'>
                        <h1 className='text-xl font-bold leading-snug text-gray-900 sm:text-2xl md:text-3xl'>
                            Course Planner will not be offering timetable information this year.
                        </h1>
                        <p className='mt-5 text-sm leading-relaxed text-gray-700 sm:text-base md:text-lg'>
                            Due to the strenuous effort in extracting timetable data from SOLUS, Course Planner has
                            made the decision to partner with QFlow, which offers a more robust schedule visualization and generation tool! <br />
                            The developer of QFlow has successfully discovered an efficient way to extract the data for
                            ALL courses in SOLUS! <br /> You should check QFlow out at the following URL:
                        </p>
                        <button
                            type='button'
                            onClick={handleQflowTransfer}
                            disabled={qflowLoading}
                            className='mt-6 disabled:opacity-60'
                        >
                            <img
                                src='/qflow.png'
                                alt='QFlow'
                                className='mx-auto h-16 w-auto sm:h-20 md:h-24'
                            />
                        </button>
                        <button
                            type='button'
                            onClick={handleQflowTransfer}
                            disabled={qflowLoading}
                            className='mt-3 inline-block break-all text-base font-semibold text-teal underline hover:opacity-80 disabled:opacity-60 sm:text-lg md:text-xl'
                        >
                            {qflowLoading ? 'Connecting to QFlow…' : 'https://qflow.pooria.dev/'}
                        </button>
                        <button
                            type='button'
                            onClick={() => setShowOverlay(false)}
                            className='mt-8 rounded-lg bg-teal px-6 py-3 text-sm font-semibold leading-relaxed text-white transition hover:opacity-90 sm:text-base md:text-lg'
                        >
                            If you still prefer to use our calendar tool with the old UI via filling in Custom Courses, it is available here.
                        </button>
                    </div>
                </div>
            )}
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
