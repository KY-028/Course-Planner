import { useState, useEffect } from 'react';
import LeftMenu from '/src/components/leftMenu';
import Calendar from '/src/components/calendar';
import Nav from '/src/components/nav';
import DonateBanner from '/src/components/donatebanner'
import Selection from '/src/components/selections';
import axios from 'axios'
import { useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { generateNewCourse, generateOptions } from '/src/functions/courseFunctions';
import UpdateManager from '../components/updatemanager';
import LoadingModal from '../components/loadingModal';
import { fetchCustomCourseMismatches } from '../functions/customCoursesApi';
import CustomCourseMismatchModal from '../components/customCourseMismatchModal';
import { useSingleTabWarning } from '../functions/useSingleTabWarning';
import { authRequestConfig } from '../functions/authToken';

// legacy: loading pre-scraped data
// import fallJSON from '/src/assets/fall_2025_0624.json';
// import winterJSON from '/src/assets/winter_2026_0625.json';
const fallJSON = {};
const winterJSON = {};

// Loading Modal Component
export default function Courses() {
    const { currentUser } = useContext(AuthContext);

    const apiUrl = import.meta.env.VITE_API_URL;
    useSingleTabWarning();

    // legacy: loading pre-scraped data (fall_2025 / winter_2026 JSON)
    const [fallData, setFallData] = useState(fallJSON);
    const [winterData, setWinterData] = useState(winterJSON);

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
    const [customCourseMismatches, setCustomCourseMismatches] = useState(null);
    const [isUpdatingMismatches, setIsUpdatingMismatches] = useState(false);

    // Guard overlay redirecting users to QFlow. Loaded from the user's saved preference.
    const [showOverlay, setShowOverlay] = useState(false);
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

    const handleDismissOverlay = () => {
        setShowOverlay(false);
    };

    const handleDoNotRemindAgain = async () => {
        setShowOverlay(false);
        if (!currentUser?.id) return;

        try {
            await axios.post(
                `${apiUrl}/backend/users/qflow-overlay/${currentUser.id}`,
                { dismissed: true },
                authRequestConfig()
            );
        } catch (error) {
            console.error("Failed to save QFlow overlay preference:", error);
            setError("Could not save your reminder preference. Please try again later.");
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
            setShowOverlay(true);
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

            const response = await axios.get(`${apiUrl}/backend/users/courses/${userId}`, authRequestConfig());
            const { fallCourses, winterCourses, qflowOverlayDismissed } = response.data;
            setShowOverlay(!qflowOverlayDismissed);

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

            await runCustomCourseMismatchCheck(userId);

        } catch (err) {
            const errorMessage = err.response?.data?.message || "An unexpected error occurred while fetching user courses";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const runCustomCourseMismatchCheck = async (userId) => {
        try {
            const mismatches = await fetchCustomCourseMismatches(apiUrl, userId);
            setCustomCourseMismatches(mismatches.length > 0 ? mismatches : null);
        } catch (error) {
            console.error("Custom course mismatch check failed:", error);
            const status = error.response?.status;
            if (status === 401 || status === 403) {
                setError("Could not check for custom course updates. Try logging out and back in.");
            }
        }
    };

    const handleUpdateMismatches = async () => {
        if (!customCourseMismatches?.length || !currentUser) return;

        setIsUpdatingMismatches(true);
        try {
            const newFallData = { ...fallData };
            const newWinterData = { ...winterData };

            for (const item of customCourseMismatches) {
                if (item.term === "Fall") {
                    newFallData[item.courseId] = item.catalog;
                } else {
                    newWinterData[item.courseId] = item.catalog;
                }
            }

            const fallIds = fc.map((course) => course.id);
            const winterIds = wc.map((course) => course.id);

            setFallData(newFallData);
            setWinterData(newWinterData);
            setFc(fallIds.map((id) => generateNewCourse(id, newFallData)));
            setWc(winterIds.map((id) => generateNewCourse(id, newWinterData)));
            setFallCourses(fallIds.flatMap((id) => newFallData[id]?.slice(4) || []));
            setWinterCourses(winterIds.flatMap((id) => newWinterData[id]?.slice(4) || []));

            await Promise.all([
                UpdateManager.addUpdate({
                    endpoint: `${apiUrl}/backend/courseChange/`,
                    data: {
                        userId: currentUser.id,
                        courses: fallIds.map((id) => ({ id, info: newFallData[id] })),
                        term: "fall",
                    },
                    withCredentials: true,
                }),
                UpdateManager.addUpdate({
                    endpoint: `${apiUrl}/backend/courseChange/`,
                    data: {
                        userId: currentUser.id,
                        courses: winterIds.map((id) => ({ id, info: newWinterData[id] })),
                        term: "winter",
                    },
                    withCredentials: true,
                }),
            ]);

            setCustomCourseMismatches(null);
        } catch (error) {
            console.error("Failed to update custom course snapshots:", error);
            alert("Could not update your saved courses. Please try again.");
        } finally {
            setIsUpdatingMismatches(false);
        }
    };

    const updateFallCourses = async (courses_ids, dataOverride) => {
        const dataMap = dataOverride ?? fallData;
        const ids = courses_ids.filter((id) => Array.isArray(dataMap[id]));

        setFallCourses(ids.flatMap((id) => dataMap[id].slice(4)));

        if (!currentUser) {
            return;
        }

        UpdateManager.addUpdate({
            endpoint: `${apiUrl}/backend/courseChange/`,
            data: {
                userId: currentUser.id,
                courses: ids.map((id) => ({ id, info: dataMap[id] })),
                term: "fall",
            },
            withCredentials: true,
        });
    };

    const updateWinterCourses = async (courses_ids, dataOverride) => {
        const dataMap = dataOverride ?? winterData;
        const ids = courses_ids.filter((id) => Array.isArray(dataMap[id]));

        setWinterCourses(ids.flatMap((id) => dataMap[id].slice(4)));

        if (!currentUser) {
            return;
        }

        UpdateManager.addUpdate({
            endpoint: `${apiUrl}/backend/courseChange/`,
            data: {
                userId: currentUser.id,
                courses: ids.map((id) => ({ id, info: dataMap[id] })),
                term: "winter",
            },
            withCredentials: true,
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
                            onClick={handleDismissOverlay}
                            className='mt-8 rounded-lg bg-teal px-6 py-3 text-sm font-semibold leading-relaxed text-white transition hover:opacity-90 sm:text-base md:text-lg'
                        >
                            If you still prefer to use our calendar tool with the old UI via filling in Custom Courses, it is available here.
                        </button>
                        <button
                            type='button'
                            onClick={handleDoNotRemindAgain}
                            className='mt-3 text-sm font-semibold text-gray-600 underline transition hover:text-gray-900 sm:text-base'
                        >
                            Do Not Remind Again
                        </button>
                    </div>
                </div>
            )}
            {isLoading && <LoadingModal />}
            {!showOverlay && (
                <CustomCourseMismatchModal
                    mismatches={customCourseMismatches}
                    onUpdate={handleUpdateMismatches}
                    onDisregard={() => setCustomCourseMismatches(null)}
                    isUpdating={isUpdatingMismatches}
                />
            )}
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
