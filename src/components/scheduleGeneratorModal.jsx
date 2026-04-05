import { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { AuthContext } from '../context/authContext';
import UpdateManager from './updatemanager';
import axios from 'axios';

const PLAN_METADATA_KEYS = ['title', 'year', 'electives', 'units'];

const DAY_ABBR = {
    Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
    Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

function extractCourseItems(courses) {
    const items = [];
    if (!Array.isArray(courses)) return items;
    for (const course of courses) {
        if (!course || !course.code) continue;
        if (course.code === 'Combination' || course.code === 'One of') {
            items.push(...extractCourseItems(course.courses));
        } else {
            items.push({ code: course.code, units: course.units || 3 });
        }
    }
    return items;
}

function extractAllItemsFromPlan(planData, selectedSubPlan) {
    if (!planData || typeof planData !== 'object') return [];
    const allItems = [];
    for (const [sectionKey, sectionData] of Object.entries(planData)) {
        if (PLAN_METADATA_KEYS.includes(sectionKey)) continue;
        if (!sectionData?.subsections) continue;
        for (const subsection of sectionData.subsections) {
            if (subsection.courses) {
                allItems.push(...extractCourseItems(subsection.courses));
            }
            if (subsection.plan && selectedSubPlan && subsection.plan[selectedSubPlan]) {
                const subPlanData = subsection.plan[selectedSubPlan];
                if (subPlanData.subsections) {
                    for (const sub of subPlanData.subsections) {
                        if (sub.courses) allItems.push(...extractCourseItems(sub.courses));
                    }
                } else {
                    allItems.push(...extractAllItemsFromPlan(subPlanData, null));
                }
            }
        }
    }
    return allItems;
}

function getCourseLevel(code) {
    const match = code.match(/(\d+)/);
    if (!match) return 0;
    return Math.floor(parseInt(match[1], 10) / 100);
}

function determineYear(totalUnits) {
    if (totalUnits < 18) return 1;
    if (totalUnits < 39) return 2;
    if (totalUnits < 66) return 3;
    return 4;
}

const YEAR_LABEL = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };

function parseSessionString(sessionStr) {
    const parts = sessionStr.split(' ');
    const dayWord = parts[2];
    const timeRange = parts[3];
    if (!dayWord || !timeRange) return null;
    const day = DAY_ABBR[dayWord] || dayWord.slice(0, 3);
    const [start, end] = timeRange.split('-');
    if (!start || !end) return null;
    return { day, start, end };
}

function buildSectionsForTerm(courseCode, termJSON) {
    const normalizedCode = courseCode.replace(/\s/g, '');
    const sections = {};
    for (const [key, value] of Object.entries(termJSON)) {
        if (value[0].replace(/\s/g, '') !== normalizedCode) continue;
        const times = [];
        for (let i = 4; i < value.length; i++) {
            const parsed = parseSessionString(value[i]);
            if (parsed) times.push(parsed);
        }
        sections[key] = { times };
    }
    return sections;
}

function buildMergedCourseIndex(fallJSON, winterJSON) {
    const index = {};
    for (const [key, value] of Object.entries(fallJSON)) {
        const code = value[0];
        if (!index[code]) {
            index[code] = { code, title: value[1], key };
        }
    }
    for (const [key, value] of Object.entries(winterJSON)) {
        const code = value[0];
        if (!index[code]) {
            index[code] = { code, title: value[1], key };
        }
    }
    return index;
}

function isCourseInBothTerms(courseCode, fallJSON, winterJSON) {
    const normalized = courseCode.replace(/\s/g, '');
    let inFall = false, inWinter = false;
    for (const value of Object.values(fallJSON)) {
        if (value[0].replace(/\s/g, '') === normalized) { inFall = true; break; }
    }
    for (const value of Object.values(winterJSON)) {
        if (value[0].replace(/\s/g, '') === normalized) { inWinter = true; break; }
    }
    return inFall && inWinter;
}

function convertTo24Hour(timeStr) {
    let [begin, end] = timeStr.split('-');
    let [bhr, bmin] = begin.split(':');
    let starthour = parseInt(bhr);
    let [ehr, emin] = end.split(':');
    let endhour = parseInt(ehr);
    if (1 <= starthour && starthour <= 6) starthour += 12;
    if (1 <= endhour && endhour <= 8) endhour += 12;
    if (starthour === 18 && endhour === 9) endhour += 12;
    return `${starthour}:${bmin}-${endhour}:${emin}`;
}

export default function ScheduleGeneratorModal({
    isOpen, onClose,
    coursesTaken, plansFilling, responses, selectedSubPlans, selectedPlanCombo,
    fallJSON, winterJSON,
}) {
    const apiUrl = import.meta.env.VITE_API_URL;
    const { currentUser } = useContext(AuthContext);

    const [checkedCourses, setCheckedCourses] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [showCustomForm, setShowCustomForm] = useState(false);
    const [customTerm, setCustomTerm] = useState('fall');
    const [courseName, setCourseName] = useState('');
    const [courseTitle, setCourseTitle] = useState('Custom Course Title');
    const [isCourseTitleFocused, setIsCourseTitleFocused] = useState(false);
    const [sectionNumber, setSectionNumber] = useState('');
    const [staffName, setStaffName] = useState('Staff');
    const [times, setTimes] = useState([{ day: 'Monday', time: '' }]);
    const [isOnlineCourse, setIsOnlineCourse] = useState(false);
    const [customCourses, setCustomCourses] = useState({});
    const [customCourseTerms, setCustomCourseTerms] = useState({});

    const [maxPerTerm, setMaxPerTerm] = useState(5);
    const [avoidMorning, setAvoidMorning] = useState(false);
    const [termPreferences, setTermPreferences] = useState({});

    const [payload, setPayload] = useState(null);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleError, setScheduleError] = useState(null);

    const searchInputRef = useRef(null);
    const courseNameInputRef = useRef(null);

    const totalUnits = useMemo(() =>
        coursesTaken.filter(Boolean).reduce((sum, c) => sum + (parseFloat(c.units) || 0), 0),
        [coursesTaken]
    );
    const planningYear = useMemo(() => determineYear(totalUnits), [totalUnits]);

    const takenCodes = useMemo(() => {
        const set = new Set();
        coursesTaken.filter(Boolean).forEach(c => set.add(c.code.replace(/\s/g, '')));
        return set;
    }, [coursesTaken]);

    const suggestedCourses = useMemo(() => {
        const codeMap = new Map();
        if (!responses) return [];
        responses.forEach((planData, idx) => {
            if (!planData) return;
            const items = extractAllItemsFromPlan(planData, selectedSubPlans?.[idx]);
            items.forEach(({ code, units }) => {
                if (!codeMap.has(code)) codeMap.set(code, units);
            });
        });
        return [...codeMap.entries()]
            .filter(([code]) => {
                const level = getCourseLevel(code);
                return level >= 1 && level <= planningYear;
            })
            .filter(([code]) => !takenCodes.has(code.replace(/\s/g, '')))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([code, units]) => ({ code, units }));
    }, [responses, selectedSubPlans, planningYear, takenCodes]);

    const courseUnitsMap = useMemo(() => {
        const map = new Map();
        if (!responses) return map;
        responses.forEach((planData, idx) => {
            if (!planData) return;
            const items = extractAllItemsFromPlan(planData, selectedSubPlans?.[idx]);
            items.forEach(({ code, units }) => {
                const normalized = code.replace(/\s/g, '');
                if (!map.has(normalized) || units > map.get(normalized)) {
                    map.set(normalized, units);
                }
            });
        });
        return map;
    }, [responses, selectedSubPlans]);

    const mergedIndex = useMemo(
        () => buildMergedCourseIndex(fallJSON, winterJSON),
        [fallJSON, winterJSON]
    );

    const dualTermCourses = useMemo(() => {
        const result = [];
        for (const code of checkedCourses) {
            const normalized = code.replace(/\s/g, '');
            if (normalized.endsWith('A') || normalized.endsWith('B')) {
                const base = normalized.slice(0, -1);
                if (courseUnitsMap.get(base) === 6) continue;
            }
            if (isCourseInBothTerms(code, fallJSON, winterJSON)) {
                result.push(code);
            }
        }
        return result.sort();
    }, [checkedCourses, fallJSON, winterJSON, courseUnitsMap]);

    useEffect(() => {
        if (isOnlineCourse) {
            setTimes([]);
        } else {
            setTimes([{ day: 'Monday', time: '' }]);
        }
    }, [isOnlineCourse]);

    useEffect(() => {
        if (isOpen) {
            setPayload(null);
        }
    }, [isOpen]);

    useEffect(() => {
        setTermPreferences(prev => {
            const next = {};
            for (const code of dualTermCourses) {
                const key = code.replace(/\s/g, '');
                if (prev[key]) next[key] = prev[key];
            }
            return next;
        });
    }, [dualTermCourses]);

    const toggleCourse = (code) => {
        setCheckedCourses(prev => {
            const next = new Set(prev);
            const normalized = code.replace(/\s/g, '');

            if (courseUnitsMap.get(normalized) === 6) {
                const hasA = [...next].some(c => c.replace(/\s/g, '') === normalized + 'A');
                if (hasA) {
                    for (const c of [...next]) {
                        const n = c.replace(/\s/g, '');
                        if (n === normalized + 'A' || n === normalized + 'B') next.delete(c);
                    }
                } else {
                    next.add(normalized + 'A');
                    next.add(normalized + 'B');
                }
                return next;
            }

            const hasNormalized = [...next].some(c => c.replace(/\s/g, '') === normalized);
            if (hasNormalized) {
                for (const c of next) {
                    if (c.replace(/\s/g, '') === normalized) { next.delete(c); break; }
                }
            } else {
                next.add(code);
            }
            return next;
        });
    };

    const handleRemoveSelected = (code) => {
        const normalized = code.replace(/\s/g, '');
        if (normalized.endsWith('A') || normalized.endsWith('B')) {
            const base = normalized.slice(0, -1);
            if (courseUnitsMap.get(base) === 6) {
                setCheckedCourses(prev => {
                    const next = new Set(prev);
                    for (const c of [...next]) {
                        const n = c.replace(/\s/g, '');
                        if (n === base + 'A' || n === base + 'B') next.delete(c);
                    }
                    return next;
                });
                return;
            }
        }
        toggleCourse(code);
    };

    const isCourseChecked = (code) => {
        const normalized = code.replace(/\s/g, '');
        if ([...checkedCourses].some(c => c.replace(/\s/g, '') === normalized)) return true;
        if (courseUnitsMap.get(normalized) === 6) {
            return [...checkedCourses].some(c => c.replace(/\s/g, '') === normalized + 'A');
        }
        return false;
    };

    const searchResults = useMemo(() => {
        if (!searchTerm || searchTerm.length < 2) return [];
        const normalizedSearch = searchTerm.replace(/\s/g, '').toLowerCase();
        const results = [];
        const seenCodes = new Set();
        const allData = { ...fallJSON, ...winterJSON, ...customCourses };
        for (const [id, value] of Object.entries(allData)) {
            const code = value[0];
            const normalizedCode = code.replace(/\s/g, '').toLowerCase();
            if (seenCodes.has(normalizedCode)) continue;
            const normalizedTitle = value[1].replace(/\s/g, '').toLowerCase();
            if (normalizedCode.includes(normalizedSearch) || normalizedTitle.includes(normalizedSearch)) {
                seenCodes.add(normalizedCode);
                results.push({ code, title: value[1], id });
                if (results.length >= 20) break;
            }
        }
        return results;
    }, [searchTerm, fallJSON, winterJSON, customCourses]);

    const formatDays = (timesArr) => {
        const daysOrder = ['M', 'T', 'W', 'Th', 'F'];
        const daysSet = new Set();
        if (!timesArr || timesArr.length === 0) return 'Online';
        timesArr.forEach(({ day }) => {
            daysSet.add(day.startsWith('Th') ? 'Th' : day.charAt(0));
        });
        return Array.from(daysSet).sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b)).join('');
    };

    const handleCustomSubmit = (e) => {
        e.preventDefault();
        const id = `${courseName}_${sectionNumber}`;
        const locations = [];
        const formattedArray = [courseName, courseTitle, staffName, locations];
        times.forEach(time => {
            const time_str = convertTo24Hour(time.time);
            formattedArray.push(`${courseName} U ${time.day} ${time_str} ${staffName}`);
            locations.push('');
        });

        setCustomCourses(prev => ({ ...prev, [id]: formattedArray }));
        setCustomCourseTerms(prev => ({ ...prev, [courseName]: customTerm }));
        toggleCourse(courseName);

        if (currentUser) {
            UpdateManager.addUpdate({
                endpoint: `${apiUrl}/backend/customCourses/`,
                data: {
                    user_id: currentUser.id,
                    term: customTerm === 'fall' ? 'Fall' : 'Winter',
                    course_id: id,
                    course_info: { [id]: formattedArray },
                },
            });
        }

        setCourseName('');
        setCourseTitle('Custom Course Title');
        setSectionNumber('');
        setStaffName('Staff');
        setTimes([{ day: 'Monday', time: '' }]);
        setIsOnlineCourse(false);
        setShowCustomForm(false);
    };

    const addTime = () => {
        if (times.length < 5) setTimes([...times, { day: 'Monday', time: '' }]);
    };
    const removeTime = (index) => {
        if (times.length > 1) setTimes(times.filter((_, i) => i !== index));
    };
    const handleTimeChange = (index, updatedTime) => {
        const newTimes = [...times];
        newTimes[index] = updatedTime;
        setTimes(newTimes);
    };

    const handleFindSchedule = async () => {
        const completedCourses = coursesTaken.filter(Boolean).map(c => ({
            code: c.code.replace(/\s/g, ''),
            title: c.title || null,
            units: c.units || 3.0,
        }));

        const fallCustom = {};
        const winterCustom = {};
        for (const [key, value] of Object.entries(customCourses)) {
            const code = value[0];
            const term = customCourseTerms[code] || 'fall';
            if (term === 'fall') fallCustom[key] = value;
            else winterCustom[key] = value;
        }

        const courses = [...checkedCourses].map(code => {
            const normalized = code.replace(/\s/g, '');
            const isA = normalized.endsWith('A');
            const isB = normalized.endsWith('B');
            const base = (isA || isB) ? normalized.slice(0, -1) : null;
            const isSplit = base && courseUnitsMap.get(base) === 6;

            if (isSplit && isA) {
                return {
                    code: normalized,
                    fall_sections: buildSectionsForTerm(base, { ...fallJSON, ...fallCustom }),
                    winter_sections: {},
                };
            }
            if (isSplit && isB) {
                return {
                    code: normalized,
                    fall_sections: {},
                    winter_sections: buildSectionsForTerm(base, { ...winterJSON, ...winterCustom }),
                };
            }
            return {
                code: normalized,
                fall_sections: buildSectionsForTerm(code, { ...fallJSON, ...fallCustom }),
                winter_sections: buildSectionsForTerm(code, { ...winterJSON, ...winterCustom }),
            };
        });

        const prefs = {
            max_courses_per_term: maxPerTerm,
            preferred_term: { ...termPreferences },
        };
        if (avoidMorning) prefs.avoid_morning = true;

        const builtPayload = {
            completed_courses: completedCourses,
            courses,
            preferences: prefs,
        };

        console.log('[ScheduleGenerator] Sending payload:', builtPayload);
        setScheduleLoading(true);
        setScheduleError(null);
        setPayload(null);
        try {
            const response = await axios.post(`${apiUrl}/api/schedule`, builtPayload, {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = response.data;
            console.log('[ScheduleGenerator] Received response:', data);

            if (data.status === 'infeasible') {
                setScheduleError(
                    (data.message || 'No valid schedule exists.') +
                    '\nConsider loosening some constraints or courses.'
                );
                return;
            }

            sessionStorage.setItem('scheduleResults', JSON.stringify({
                response: data,
                preferences: { max_courses_per_term: maxPerTerm, avoid_morning: avoidMorning },
                customCourses,
                customCourseTerms,
            }));
            window.open('/schedule-results', '_blank');
            setPayload(data);
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Request failed';
            setScheduleError(msg);
        } finally {
            setScheduleLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 10000000 }}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Schedule Generator</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&#x2715;</button>
                </div>

                {/* Year Detection */}
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-gray-700">
                        Based on the number of units you have ({totalUnits.toFixed(1)}), we think you're planning for{' '}
                        <span className="font-bold">{YEAR_LABEL[planningYear]} Year</span>.
                    </p>
                </div>

                {/* Suggested Courses */}
                {suggestedCourses.length > 0 && (
                    <div className="mb-6">
                        <p className="text-gray-700 mb-2 font-semibold">You might want to take:</p>
                        <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto border border-gray-200 rounded p-3">
                            {suggestedCourses.map(({ code, units }) => (
                                <label key={code} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-1">
                                    <input
                                        type="checkbox"
                                        checked={isCourseChecked(code)}
                                        onChange={() => toggleCourse(code)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-800">
                                        {code}{units === 6 && <span className="text-xs text-gray-500 ml-1">(6.0u, year)</span>}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-6">
                    <p className="text-gray-700 mb-2 font-semibold">Or, search for another course:</p>
                    <input
                        type="text"
                        placeholder="Search by course code or name..."
                        className="w-full p-2 border border-gray-400 rounded"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        ref={searchInputRef}
                    />
                    {searchResults.length > 0 && (
                        <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded">
                            {searchResults.map(result => (
                                <div
                                    key={result.code}
                                    onClick={() => { toggleCourse(result.code); setSearchTerm(''); }}
                                    className={`p-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 ${isCourseChecked(result.code) ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="font-medium text-sm">{result.code}</div>
                                    <div className="text-gray-600 text-xs">{result.title}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Custom Course */}
                <div className="mb-6">
                    <p className="text-gray-700 mb-2 font-semibold">Or, add a custom course:</p>
                    {!showCustomForm ? (
                        <button
                            onClick={() => setShowCustomForm(true)}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                            Custom Course
                        </button>
                    ) : (
                        <form onSubmit={handleCustomSubmit} className="border border-gray-200 rounded p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-gray-800">Add Custom Course</h3>
                                <button type="button" onClick={() => setShowCustomForm(false)} className="text-gray-500 hover:text-gray-800">&#x2715;</button>
                            </div>

                            {/* Term selector */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Term:</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCustomTerm('fall')}
                                        className={`px-4 py-1.5 rounded text-sm font-medium ${customTerm === 'fall' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        Fall
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomTerm('winter')}
                                        className={`px-4 py-1.5 rounded text-sm font-medium ${customTerm === 'winter' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        Winter
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <input
                                        type="text"
                                        maxLength={8}
                                        placeholder="Course Code"
                                        className="p-2 w-full border-gray-400 border rounded"
                                        value={courseName}
                                        onChange={e => setCourseName(e.target.value.replace(/\s/g, '').toUpperCase())}
                                        ref={courseNameInputRef}
                                        required
                                    />
                                    <label className="ml-1 text-xs text-gray-500">e.g. MATH110 (no space)</label>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        min={1} max={120}
                                        placeholder="Section Number"
                                        className="p-2 w-full border-gray-400 border rounded"
                                        value={sectionNumber}
                                        onChange={e => setSectionNumber(e.target.value)}
                                        required
                                    />
                                    <label className="ml-1 text-xs text-gray-500">(order on SOLUS)</label>
                                </div>
                            </div>
                            <input
                                type="text"
                                className="mt-2 p-2 w-full border-gray-400 border rounded"
                                value={courseTitle}
                                onFocus={() => { if (!isCourseTitleFocused) { setCourseTitle(''); setIsCourseTitleFocused(true); } }}
                                onBlur={() => { if (courseTitle === '') { setCourseTitle('Custom Course'); setIsCourseTitleFocused(false); } }}
                                onChange={e => setCourseTitle(e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                className="mt-2 p-2 w-full border-gray-400 border rounded"
                                placeholder="Professor"
                                value={staffName}
                                onChange={e => setStaffName(e.target.value)}
                                required
                            />
                            <div className="mt-2 flex items-center">
                                <input
                                    type="checkbox"
                                    id="sched-online-course"
                                    checked={isOnlineCourse}
                                    onChange={e => setIsOnlineCourse(e.target.checked)}
                                    className="mr-2"
                                />
                                <label htmlFor="sched-online-course" className="text-sm text-gray-700">This is an online course</label>
                            </div>
                            {!isOnlineCourse && (
                                <>
                                    {times.map((time, index) => (
                                        <div key={index} className="flex flex-row mt-2">
                                            <select
                                                className="p-2 w-fit border-gray-400 border rounded"
                                                value={time.day || 'Monday'}
                                                onChange={e => handleTimeChange(index, { ...time, day: e.target.value })}
                                                required
                                            >
                                                <option value="Monday">Monday</option>
                                                <option value="Tuesday">Tuesday</option>
                                                <option value="Wednesday">Wednesday</option>
                                                <option value="Thursday">Thursday</option>
                                                <option value="Friday">Friday</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder={`Time (e.g., 15:30-16:30)`}
                                                className="ml-1 p-2 w-full border-gray-400 border rounded"
                                                value={time.time || ''}
                                                pattern="\b([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]\b"
                                                onChange={e => handleTimeChange(index, { ...time, time: e.target.value })}
                                                required
                                            />
                                            {times.length > 1 && (
                                                <button type="button" onClick={() => removeTime(index)} className="ml-1 bg-red-500 text-white px-2 rounded text-sm">
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {times.length < 5 && (
                                        <button type="button" onClick={addTime} className="mt-2 p-2 w-full bg-blue-500 text-white rounded text-sm">
                                            Add Time
                                        </button>
                                    )}
                                </>
                            )}
                            <button type="submit" className="mt-3 p-2 w-full bg-green-500 text-white rounded font-medium">
                                Add Custom Course
                            </button>
                        </form>
                    )}
                </div>

                {/* Currently Selected Courses */}
                {checkedCourses.size > 0 && (
                    <div className="mb-6">
                        <p className="text-gray-700 mb-2 font-semibold">Selected courses ({checkedCourses.size}):</p>
                        <div className="flex flex-wrap gap-2">
                            {[...checkedCourses].sort().map(code => (
                                <span key={code} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                    {code}
                                    <button onClick={() => handleRemoveSelected(code)} className="text-blue-600 hover:text-red-500 font-bold">&#x2715;</button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Preferences */}
                <div className="mb-6">
                    <h3 className="text-gray-800 font-bold mb-3">Preferences (Optional)</h3>

                    {/* Term preferences for dual-term courses */}
                    {dualTermCourses.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Some courses are offered in both terms. Choose your preference:</p>
                            <div className="space-y-2">
                                {dualTermCourses.map(code => {
                                    const key = code.replace(/\s/g, '');
                                    return (
                                        <div key={code} className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-700 w-24">{code}:</span>
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setTermPreferences(prev => {
                                                        const next = { ...prev };
                                                        if (next[key] === 'fall') delete next[key];
                                                        else next[key] = 'fall';
                                                        return next;
                                                    })}
                                                    className={`px-3 py-1 rounded text-sm ${termPreferences[key] === 'fall' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                >
                                                    Fall
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTermPreferences(prev => {
                                                        const next = { ...prev };
                                                        if (next[key] === 'winter') delete next[key];
                                                        else next[key] = 'winter';
                                                        return next;
                                                    })}
                                                    className={`px-3 py-1 rounded text-sm ${termPreferences[key] === 'winter' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                >
                                                    Winter
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Max courses per term */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max number of courses per term:</label>
                        <div className="flex gap-1">
                            {[2, 3, 4, 5, 6].map(n => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setMaxPerTerm(n)}
                                    className={`px-4 py-2 rounded font-medium text-sm ${maxPerTerm === n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prefer morning */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Avoid morning classes:</label>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setAvoidMorning(true)}
                                className={`px-4 py-2 rounded font-medium text-sm ${avoidMorning ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                True
                            </button>
                            <button
                                type="button"
                                onClick={() => setAvoidMorning(false)}
                                className={`px-4 py-2 rounded font-medium text-sm ${!avoidMorning ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                False
                            </button>
                        </div>
                    </div>
                </div>

                {/* Find Schedule Button */}
                <button
                    onClick={handleFindSchedule}
                    disabled={checkedCourses.size === 0 || scheduleLoading}
                    className={`w-full py-3 rounded-lg font-bold text-lg transition-colors ${checkedCourses.size > 0 && !scheduleLoading ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                    {scheduleLoading ? 'Finding Schedule...' : 'Find Schedule'}
                </button>

                {/* Error Display */}
                {scheduleError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm whitespace-pre-line">
                        {scheduleError}
                    </div>
                )}

                {/* Success confirmation */}
                {payload && payload.status === 'complete' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                        Schedule found! Results opened in a new tab.
                    </div>
                )}
            </div>
        </div>
    );
}
