import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Calendar from '/src/components/calendar';
import Selection from '/src/components/selections';
import ModelMetadataPanel from '/src/components/modelMetadataPanel';
import { generateNewCourse } from '/src/functions/courseFunctions';

// legacy: loading pre-scraped data
// import fallJSON from '/src/assets/fall_2025_0624.json';
// import winterJSON from '/src/assets/winter_2026_0625.json';
const fallJSON = {};
const winterJSON = {};

function parseTermPreferenceKey(key) {
    const match = key.match(/^prefer_(.+)_(fall|winter)$/);
    if (!match) return null;
    return { code: match[1], term: match[2] };
}

function ConstraintChecklist({ schedule, preferences, term }) {
    const { satisfied_constraints = {}, dropped_courses } = schedule;
    const fallIds = schedule.fall || [];
    const winterIds = schedule.winter || [];
    const termIds = term === 'fall' ? fallIds : winterIds;
    const termCount = termIds.length;

    const violations = [];
    const satisfactions = [];

    if (dropped_courses && dropped_courses.length > 0) {
        dropped_courses.forEach(code => {
            violations.push(`Dropped course: ${code}`);
        });
    } else {
        satisfactions.push('No dropped courses');
    }

    const maxPref = preferences.max_courses_per_term;
    if (termCount > maxPref) {
        violations.push(`Preferred load: ${maxPref}, Actual load: ${termCount}`);
    } else {
        satisfactions.push(`<= preferred load of ${maxPref}`);
    }

    const morningKey = `avoid_morning_${term}`;
    if (morningKey in satisfied_constraints) {
        if (satisfied_constraints[morningKey]) {
            satisfactions.push('No morning classes');
        } else {
            violations.push('Has morning classes (Does not count as a violation)');
        }
    }

    for (const [key, value] of Object.entries(satisfied_constraints)) {
        const parsed = parseTermPreferenceKey(key);
        if (!parsed) continue;
        const { code, term: prefTerm } = parsed;
        const label = `Prefer ${code} in ${prefTerm.charAt(0).toUpperCase() + prefTerm.slice(1)}`;

        if (value) {
            if (prefTerm === term) {
                satisfactions.push(label);
            }
        } else {
            violations.push(label);
        }
    }

    return (
        <div className="mt-3 space-y-1 text-sm">
            {violations.map((msg, i) => (
                <div key={`v-${i}`} className="flex items-start gap-1.5 text-red-600">
                    <span className="font-bold mt-px">&#x2717;</span>
                    <span>{msg}</span>
                </div>
            ))}
            {satisfactions.map((msg, i) => (
                <div key={`s-${i}`} className="flex items-start gap-1.5 text-green-600">
                    <span className="font-bold mt-px">&#x2713;</span>
                    <span>{msg}</span>
                </div>
            ))}
        </div>
    );
}

function TermColumn({ sectionIds, termData, termLabel, schedule, preferences }) {
    const [courses, setCourses] = useState(() =>
        (sectionIds || [])
            .filter(id => termData[id])
            .map(id => generateNewCourse(id, termData))
    );
    const [times, setTimes] = useState(() =>
        (sectionIds || []).flatMap(id => termData[id]?.slice(4) || [])
    );
    const [conflicts, setConflicts] = useState([]);
    const [courseData, setCourseData] = useState(() => ({ ...termData }));
    const courseDataRef = useRef(courseData);
    courseDataRef.current = courseData;

    const onUpdate = useCallback((course_ids) => {
        const newTimes = course_ids.flatMap(id => courseDataRef.current[id]?.slice(4) || []);
        setTimes(newTimes);
    }, []);

    return (
        <div>
            <div>
                <Selection
                    isLoading={false}
                    onUpdate={onUpdate}
                    courseData={courseData}
                    changeCourseData={setCourseData}
                    courses={courses}
                    setCourses={setCourses}
                    term={termLabel}
                    conflicts={conflicts}
                    original={termData}
                />
            </div>
            <div className="mt-3">
                <Calendar term={termLabel} times={times} setConflicts={setConflicts} />
            </div>
            <ConstraintChecklist schedule={schedule} preferences={preferences} term={termLabel.toLowerCase()} />
        </div>
    );
}

export default function ScheduleResults() {
    const [data, setData] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showMetadata, setShowMetadata] = useState(false);

    useEffect(() => {
        const raw = sessionStorage.getItem('scheduleResults');
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            setData(parsed);
        } catch {
            console.error('Failed to parse schedule results from sessionStorage');
        }
        sessionStorage.removeItem('scheduleResults');
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (!data) return;
        const total = data.response.schedules.length;
        if (e.key === 'ArrowLeft') {
            setCurrentIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
            setCurrentIndex(prev => Math.min(total - 1, prev + 1));
        }
    }, [data]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-700 mb-4">No schedule data found</h1>
                <p className="text-gray-500 mb-6">This page is meant to be opened from the Schedule Generator.</p>
                <Link to="/planner" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Go to Planner
                </Link>
            </div>
        );
    }

    const { response, preferences, customCourses = {}, customCourseTerms = {} } = data;
    const { schedules, violations } = response;
    const total = schedules.length;

    const fallCustom = {};
    const winterCustom = {};
    for (const [key, value] of Object.entries(customCourses)) {
        const code = value[0];
        const term = customCourseTerms[code] || 'fall';
        if (term === 'fall') fallCustom[key] = value;
        else winterCustom[key] = value;
    }
    const mergedFall = { ...fallJSON, ...fallCustom };
    const mergedWinter = { ...winterJSON, ...winterCustom };

    const schedule = schedules[currentIndex];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Status Banner */}
            {violations === 0 ? (
                <div className="bg-green-600 text-white text-center py-3 px-4 font-semibold">
                    There {total === 1 ? 'is' : 'are'} {total} plan{total !== 1 ? 's' : ''} that satisfy all requirements.
                </div>
            ) : (
                <div className="bg-amber-500 text-white text-center py-3 px-4 font-semibold">
                    <div>Unfortunately, we weren't able to find a plan that satisfies everything.</div>
                    <div className="text-sm font-normal mt-1">
                        Here are the top {total} result{total !== 1 ? 's' : ''} with {violations} violation{violations !== 1 ? 's' : ''}.
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 py-4 bg-white border-b border-gray-200 sticky top-0 z-[10000]">
                <button
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className={`px-3 py-1.5 rounded font-bold text-lg ${currentIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    &lt;
                </button>
                <span className="text-gray-700 font-semibold text-lg">
                    {currentIndex + 1} of {total}
                </span>
                <button
                    onClick={() => setCurrentIndex(prev => Math.min(total - 1, prev + 1))}
                    disabled={currentIndex === total - 1}
                    className={`px-3 py-1.5 rounded font-bold text-lg ${currentIndex === total - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                    &gt;
                </button>
                {schedule.score != null && (
                    <span className="ml-4 text-sm text-gray-400">Score: {schedule.score}</span>
                )}
                {response.model_metadata && (
                    <button
                        onClick={() => setShowMetadata(prev => !prev)}
                        className={`ml-4 text-lg ${showMetadata ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
                        title="Model metadata"
                    >
                        🔧
                    </button>
                )}
            </div>

            {showMetadata && response.model_metadata && (
                <div className="px-10 py-4 max-w-[1600px] mx-auto">
                    <ModelMetadataPanel metadata={response.model_metadata} />
                </div>
            )}

            {/* Two-column schedule display */}
            <div className="grid md-custom:grid-cols-2 grid-cols-1 gap-6 px-10 py-4 max-w-[1600px] mx-auto">
                <TermColumn
                    key={`fall-${currentIndex}`}
                    sectionIds={schedule.fall}
                    termData={mergedFall}
                    termLabel="Fall"
                    schedule={schedule}
                    preferences={preferences}
                />
                <TermColumn
                    key={`winter-${currentIndex}`}
                    sectionIds={schedule.winter}
                    termData={mergedWinter}
                    termLabel="Winter"
                    schedule={schedule}
                    preferences={preferences}
                />
            </div>
        </div>
    );
}
