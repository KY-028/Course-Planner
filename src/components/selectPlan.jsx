import { useState, useEffect, useRef } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { validateUrl, clearPlanReq, establishPlansFilling, getPlanPrefix, recomputePlanAssignments } from '/src/components/courseFunctions';
import planResultsData from '../assets/coursePlanResults.json';
import CompleteIcon from '/complete.svg';
import PlanDetailsDisplay from '/src/components/planDetailsDisplay.jsx';

const PLAN_OPTIONS = [
    { label: 'Double Major', value: 1, fields: ['Major 1 [Search or Paste Academic Calendar Link]', 'Major 2 [Search or Paste Academic Calendar Link]'] },
    { label: 'Major + Minor', value: 2, fields: ['Major [Search or Paste Academic Calendar Link]', 'Minor [Search or Paste Academic Calendar Link]'] },
    { label: 'Major + Double Minor', value: 3, fields: ['Major [Search or Paste Academic Calendar Link]', 'Minor 1 [Search or Paste Academic Calendar Link]', 'Minor 2 [Search or Paste Academic Calendar Link]'] },
    { label: 'Specialization', value: 4, fields: ['Specialization [Search or Paste Academic Calendar Link]'] },
    { label: 'Specialization + Minor', value: 5, fields: ['Specialization [Search or Paste Academic Calendar Link]', 'Minor [Search or Paste Academic Calendar Link]'] },
    { label: 'Joint Major', value: 6, fields: ['Joint Major 1 [Search or Paste Academic Calendar Link]', 'Joint Major 2 [Search or Paste Academic Calendar Link]'], 'Minor': 'Minor [Search or Paste Academic Calendar Link]' },
    { label: 'Major Only (Old Plan)', value: 7, fields: ['Major [Search or Paste Academic Calendar Link]'] },
];

export default function SelectPlan({ coursesTaken, setCoursesTaken }) {
    const apiUrl = import.meta.env.VITE_API_URL;
    // Select Degree Plan Combination (number)
    const [selectedPlanCombo, setSelectedPlanCombo] = useState(PLAN_OPTIONS[0].value);
    // Search or Paste Academic Calendar Link Text Field (list of strings)
    const [fields, setFields] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(''));
    // Locked Text Field (list of booleans)
    const [locked, setLocked] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(false));
    // Response from API (list of objects)
    const [responses, setResponses] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(null));
    // Error Message
    const [errors, setErrors] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(null));
    // Details Modal Open
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    // Selected Plan Data (For Details Modal)
    const [selectedPlanData, setSelectedPlanData] = useState(null);

    // For plan search dropdown
    const [searchResults, setSearchResults] = useState(Array(PLAN_OPTIONS[0].fields.length).fill([]));
    const [showDropdown, setShowDropdown] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(false));

    // Track plan requirements and their completion status
    const [plansFilling, setPlansFilling] = useState({});

    // Track selected sub-plans for each plan
    const [selectedSubPlans, setSelectedSubPlans] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(null));

    // Track section names for each plan
    const [sectionNames, setSectionNames] = useState(Array(PLAN_OPTIONS[0].fields.length).fill([]));

    // Track custom course assignments by index for each plan
    const [customAssignments, setCustomAssignments] = useState([]);

    // Debug purposes
    useEffect(() => {
        console.log('sectionNames updated:', sectionNames);
        console.log('plansFilling:', plansFilling);
        console.log('responses:', responses);
    }, [sectionNames]);

    useEffect(() => {
        console.log('selectedPlanData for that plan:', selectedPlanData);
    }, [detailsModalOpen]);

    // Monitor coursesTaken changes and automatically assign courses to requirements
    useEffect(() => {
        if (coursesTaken && setCoursesTaken && responses.length > 0) {
            // Filter out null responses to get valid plans
            const validPlans = responses.filter(response => response !== null);
            if (validPlans.length > 0) {
                const result = recomputePlanAssignments(coursesTaken, validPlans, selectedPlanCombo);
                // Only update state if changed
                const hasChanges = JSON.stringify(result.coursesTaken) !== JSON.stringify(coursesTaken) ||
                    JSON.stringify(result.plansFilling) !== JSON.stringify(plansFilling);
                if (hasChanges) {
                    setCoursesTaken(result.coursesTaken);
                    setPlansFilling(result.plansFilling);
                }
            }
        }
    }, [coursesTaken, setCoursesTaken, plansFilling]);

    // When plan combination drop down is changed
    const handlePlanChange = (e) => {
        // When plan combination changes, clear all states that depend on the length of the plan
        const planValue = Number(e.target.value);
        const plan = PLAN_OPTIONS.find(opt => opt.value === planValue);
        setSelectedPlanCombo(planValue);
        setFields(Array(plan.fields.length).fill(''));
        setLocked(Array(plan.fields.length).fill(false)); // Clear locked
        setResponses(Array(plan.fields.length).fill(null)); // Clear responses
        setErrors(Array(plan.fields.length).fill(null)); // Clear errors
        setPlansFilling({}); // Will be re-established on plan lock
        setSelectedSubPlans(Array(plan.fields.length).fill(null)); // Clear selected sub-plans
        setCoursesTaken(clearPlanReq(coursesTaken)); // Clear courses taken plan requirement assignments
        setSectionNames(Array(plan.fields.length).fill([])); // Clear section names
    };

    // Helper to get plan type for a field
    function getFieldType(idx) {
        const plan = PLAN_OPTIONS.find(opt => opt.value === selectedPlanCombo);
        if (!plan) alert("An error occurred. No plan found.");
        const field = plan.fields[idx];
        if (!field) alert("An error occurred. No plan found.")
        // Try to extract type from field string
        if (field.toLowerCase().includes('specialization')) return 'Specialization';
        if (field.toLowerCase().includes('minor')) return 'Minor';
        if (field.toLowerCase().includes('joint')) return 'Joint Major';
        if (field.toLowerCase().includes('major')) return 'Major';
        return 'Major';
    }

    // Plan search handler
    const handlePlanSearch = (idx, value) => {
        setFields(prev => {
            const arr = [...prev];
            arr[idx] = value;
            return arr;
        });
        // Only show dropdown if not a URL
        if (/^https?:\/\//i.test(value.trim())) {
            setShowDropdown(prev => {
                const arr = [...prev];
                arr[idx] = false;
                return arr;
            });
            setSearchResults(prev => {
                const arr = [...prev];
                arr[idx] = [];
                return arr;
            });
            return;
        }
        // Search in planResultsData
        const key = getFieldType(idx);
        const plans = planResultsData[key] || [];
        const search = value.trim().toLowerCase();
        const results = search.length === 0 ? [] : plans.filter(plan => plan.title.toLowerCase().includes(search));
        setSearchResults(prev => {
            const arr = [...prev];
            arr[idx] = results;
            return arr;
        });
        setShowDropdown(prev => {
            const arr = [...prev];
            arr[idx] = results.length > 0;
            return arr;
        });
    };

    // When user selects a plan from dropdown
    const handlePlanSelect = (idx, planObj) => {
        setFields(prev => {
            const arr = [...prev];
            arr[idx] = planObj.link;
            return arr;
        });
        setShowDropdown(prev => {
            const arr = [...prev];
            arr[idx] = false;
            return arr;
        });
        setSearchResults(prev => {
            const arr = [...prev];
            arr[idx] = [];
            return arr;
        });
        // Inline the locking logic
        const newResponses = [...responses];
        newResponses[idx] = planObj.result;
        setResponses(newResponses);
        const newLocked = [...locked];
        newLocked[idx] = true;
        setLocked(newLocked);
        const newErrors = [...errors];
        newErrors[idx] = null;
        setErrors(newErrors);
        setSelectedSubPlans(prev => {
            const newSelected = [...prev];
            newSelected[idx] = null;
            return newSelected;
        });
        let mergedPlansFilling = {};
        newResponses.forEach((planData, i) => {
            if (planData && newLocked[i]) {
                const planPrefix = getPlanPrefix(i, planData, selectedPlanCombo);
                Object.assign(mergedPlansFilling, establishPlansFilling(planData, planPrefix));
                mergedPlansFilling[`${planPrefix}Electives`] = {
                    unitsRequired: planData.electives || 0,
                    unitsCompleted: 0,
                    courses: []
                };
            }
        });
        console.log('mergedPlansFilling:', mergedPlansFilling);
        const totalUnits = newResponses[idx]?.units || 0;
        let required = 0;
        // Check if the plan is valid for this index
        const planPrefix = getPlanPrefix(idx, newResponses[idx], selectedPlanCombo);
        Object.entries(mergedPlansFilling).forEach(([key, value]) => {
            if (key.startsWith(planPrefix)) {
                required += value.unitsRequired || 0;
            }
        });
        if (required === totalUnits) {
            setPlansFilling(mergedPlansFilling);
        } else {
            alert("Your plan was not parsed successfully. Please contact the developer.");
        }
        updateSectionNames(newResponses, newLocked);
    };

    const handleFieldChange = (idx, value) => {
        handlePlanSearch(idx, value);
    };

    const validateResponse = (response, fieldType) => {
        const title = response.title?.toLowerCase() || '';
        const fieldTypeLower = fieldType.toLowerCase();

        // Extract the expected type from the field (e.g., "Major", "Minor", "Specialization")
        const expectedType = fieldTypeLower.split(' ')[0].trim();

        // Check if the title contains the expected type
        if (!title.includes(expectedType)) {
            return false;
        }

        return true;
    };

    const handleLock = async (idx) => {
        const url = fields[idx].trim();
        if (!url) {
            const newErrors = [...errors];
            newErrors[idx] = "Please enter a URL";
            setErrors(newErrors);
            return;
        }
        if (!validateUrl(url)) {
            const newErrors = [...errors];
            newErrors[idx] = "Please enter a valid URL or plan name.";
            setErrors(newErrors);
            return;
        }
        try {
            const response = await axios.get(`${apiUrl}/backend/coursePlan?url=${encodeURIComponent(url)}`);
            const fieldType = PLAN_OPTIONS.find(opt => opt.value === selectedPlanCombo).fields[idx];
            if (!validateResponse(response.data, fieldType)) {
                const newErrors = [...errors];
                newErrors[idx] = `Invalid plan type. Expected ${fieldType.split(' ')[0].trim()}`;
                setErrors(newErrors);
                return;
            }
            // Inline the locking logic
            const newResponses = [...responses];
            newResponses[idx] = response.data;
            setResponses(newResponses);
            const newLocked = [...locked];
            newLocked[idx] = true;
            setLocked(newLocked);
            const newErrors = [...errors];
            newErrors[idx] = null;
            setErrors(newErrors);
            setSelectedSubPlans(prev => {
                const newSelected = [...prev];
                newSelected[idx] = null;
                return newSelected;
            });
            let mergedPlansFilling = {};
            newResponses.forEach((planData, i) => {
                if (planData && newLocked[i]) {
                    const planPrefix = getPlanPrefix(i, planData, selectedPlanCombo);
                    Object.assign(mergedPlansFilling, establishPlansFilling(planData, planPrefix));
                    mergedPlansFilling[`${planPrefix}Electives`] = {
                        unitsRequired: planData.electives || 0,
                        unitsCompleted: 0,
                        courses: []
                    };
                }
            });
            const totalUnits = newResponses[idx]?.units || 0;
            let required = 0;
            Object.entries(mergedPlansFilling).forEach(([key, value]) => {
                required += value.unitsRequired || 0;
            });
            if (required === totalUnits) {
                setPlansFilling(mergedPlansFilling);
            } else {
                alert("Your plan was not parsed successfully. Please contact the developer.");
            }
            updateSectionNames(newResponses, newLocked);
        } catch (error) {
            const newErrors = [...errors];
            newErrors[idx] = error.response?.data?.message || "An error occurred while fetching the plan";
            setErrors(newErrors);
        }
    };

    const handleUnlock = (idx) => {
        const newLocked = [...locked];
        const newFields = [...fields];
        const newResponses = [...responses];
        const newErrors = [...errors];
        newLocked[idx] = false;
        newFields[idx] = '';
        newResponses[idx] = null;
        newErrors[idx] = null;
        setLocked(newLocked);
        setFields(newFields);
        setResponses(newResponses);
        setErrors(newErrors);
        // Clear selected sub-plans for this plan
        setSelectedSubPlans(prev => {
            const newSelected = [...prev];
            newSelected[idx] = null;
            return newSelected;
        });
        // Rebuild plansFilling for remaining locked plans
        let mergedPlansFilling = {};
        newResponses.forEach((planData, i) => {
            if (planData && newLocked[i]) {
                const planPrefix = getPlanPrefix(i, planData, selectedPlanCombo);
                Object.assign(mergedPlansFilling, establishPlansFilling(planData, planPrefix));
                // Add electives for this plan
                mergedPlansFilling[`${planPrefix}Electives`] = {
                    unitsRequired: planData.electives || 0,
                    unitsCompleted: 0,
                    courses: []
                };
            }
        });
        setPlansFilling(mergedPlansFilling);
        updateSectionNames(newResponses, newLocked);
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Enter' && fields[idx].trim() && !locked[idx]) {
            // If a dropdown is open and there are results, select the first
            if (showDropdown[idx] && searchResults[idx] && searchResults[idx].length > 0) {
                handlePlanSelect(idx, searchResults[idx][0]);
            } else {
                handleLock(idx);
            }
        }
    };

    const openDetailsModal = (planData) => {
        console.log(planData);
        setSelectedPlanData(planData);
        setDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setDetailsModalOpen(false);
        setSelectedPlanData(null);
    };

    // Helper: Check if a plan has sub-plans that need selection
    function hasUnselectedSubPlans(idx, sectionKey) {
        if (!responses[idx]) return false;
        // go through each subsections in responses[idx], find if any subsection has a requirement that has a plan attribute
        const subsections = responses[idx][sectionKey]?.subsections || [];
        return subsections.some(subsection => subsection.plan && Object.keys(subsection.plan).length > 0 && selectedSubPlans[idx] === null);
    }

    // Helper: Get the relevant requirement keys for a plan and section
    function getSectionRequirementKeys(idx, sectionKey) {
        if (!responses[idx]) return [];
        const planPrefix = getPlanPrefix(idx, responses[idx], selectedPlanCombo);
        return Object.keys(plansFilling).filter(key => key.startsWith(planPrefix + sectionKey));
    }

    // Helper: Calculate completed and required units for a section
    function getSectionProgressFromFilling(idx, sectionKey) {
        const keys = getSectionRequirementKeys(idx, sectionKey);
        let completed = 0;
        let required = 0;
        keys.forEach(key => {
            completed += plansFilling[key]?.unitsCompleted || 0;
            required += plansFilling[key]?.unitsRequired || 0;
        });
        return { completed, required };
    }

    // Helper: Calculate total completed and required units for the plan (from plansFilling)
    function getPlanProgressFromFilling(idx) {
        if (!responses[idx]) return { completed: 0, required: 0 };
        let completed = 0;
        let required = 0;
        // Sum up completed and required units from all sections
        for (const sectionKey of sectionNames[idx]) {
            const section = responses[idx][sectionKey];
            if (section) {
                const sectionProgress = getSectionProgressFromFilling(idx, sectionKey);
                completed += sectionProgress.completed;
                required += sectionProgress.required;
            }
        }
        // Use the plan's total required units as the required value
        required = responses[idx]?.units || required;
        return { completed, required };
    }

    // When a plan or sub-plan is selected/unlocked/changed, reconstruct plansFilling to only include the relevant requirements
    function reconstructPlansFilling() {
        let merged = {};
        responses.forEach((planData, i) => {
            if (planData) {
                const planPrefix = getPlanPrefix(i, planData, selectedPlanCombo);
                // If a sub-plan is selected, only include that sub-plan's requirements for the sub-plan section
                if (selectedSubPlans[i]) {

                } else {
                    // No sub-plan selected: only include core and the top-level sub-plan section (not its nested sub-plans)
                    Object.entries(planData).forEach(([sectionKey, sectionData]) => {
                        if (sectionKey.toLowerCase().includes('core') || sectionKey.toLowerCase().includes('sub-plans')) {
                            // For sub-plans, only include the section, not its nested plans
                            if (sectionKey.toLowerCase().includes('sub-plans')) {
                                const shallowSection = { ...sectionData, subsections: [] };
                                Object.assign(merged, establishPlansFilling({ [sectionKey]: shallowSection }, planPrefix));
                            } else {
                                Object.assign(merged, establishPlansFilling({ [sectionKey]: sectionData }, planPrefix));
                            }
                        }
                    });
                }
            }
        });
        setPlansFilling(merged);
    }

    // Helper: Update sectionNames for all plans
    function updateSectionNames(responsesArr, lockedArr) {
        const newSectionNames = [];
        responsesArr.forEach((planData, i) => {
            if (planData && lockedArr[i]) {
                let sectionKeys = Object.keys(planData).filter(k => k !== 'title' && k !== 'electives' && k !== 'units');
                // Ensure 'Electives' is always present and last
                const electivesIndex = sectionKeys.findIndex(section => section.toLowerCase() === 'electives');
                if (electivesIndex !== -1) {
                    sectionKeys[electivesIndex] = 'Electives';
                } else {
                    sectionKeys.push('Electives');
                }
                newSectionNames[i] = sectionKeys;
            } else {
                newSectionNames[i] = [];
            }
        });
        setSectionNames(newSectionNames);
    }

    const plan = PLAN_OPTIONS.find(opt => opt.value === selectedPlanCombo);

    return (
        <div className='flex flex-col p-3 border rounded-lg md-custom:mr-0 mr-8'>
            <div className='text-xl font-bold mb-2 lg:mt-0 mt-2'>Select Plan</div>
            <div className='flex items-center mb-4'>
                <label className='mr-3 font-medium'>Type:</label>
                <select
                    className='border rounded px-3 py-1 text-base w-full'
                    value={selectedPlanCombo}
                    onChange={handlePlanChange}
                >
                    {PLAN_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
            <div className='flex flex-col gap-3 w-full'>
                {plan.fields.map((placeholder, idx) => (
                    <div key={idx} className='flex flex-col w-full'>
                        <div className='flex w-full relative'>
                            <input
                                type='text'
                                className={`border rounded px-3 py-1 text-base flex-1 transition-all duration-150 mr-2 ${locked[idx] ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
                                placeholder={placeholder}
                                value={fields[idx]}
                                onChange={e => handleFieldChange(idx, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, idx)}
                                disabled={locked[idx]}
                                style={{ minWidth: 0 }}
                                autoComplete="off"
                                onFocus={() => {
                                    if (searchResults[idx]?.length > 0) setShowDropdown(prev => { const arr = [...prev]; arr[idx] = true; return arr; });
                                }}
                                onBlur={() => setTimeout(() => setShowDropdown(prev => { const arr = [...prev]; arr[idx] = false; return arr; }), 200)}
                            />
                            {/* Dropdown for plan search */}
                            {!locked[idx] && showDropdown[idx] && searchResults[idx]?.length > 0 && (
                                <div className="absolute z-50 left-0 top-full w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults[idx].map((planObj, i) => (
                                        <div
                                            key={planObj.link}
                                            className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm flex flex-col"
                                            onMouseDown={() => handlePlanSelect(idx, planObj)}
                                        >
                                            <span className="font-semibold">{planObj.title} [{planObj.year}]</span>
                                            <span className="text-xs text-gray-500">{planObj.link}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!locked[idx] && fields[idx].trim() && (
                                <button
                                    className='bg-green-500 hover:bg-green-600 text-white rounded flex items-center justify-center transition-colors duration-150'
                                    style={{ width: 32, height: 32 }}
                                    onClick={() => handleLock(idx)}
                                    tabIndex={-1}
                                >
                                    <FaCheck size={16} />
                                </button>
                            )}
                            {locked[idx] && (
                                <button
                                    className='bg-gray-400 hover:bg-gray-500 text-white rounded flex items-center justify-center transition-colors duration-150 ml-1'
                                    style={{ width: 32, height: 32 }}
                                    onClick={() => handleUnlock(idx)}
                                    tabIndex={-1}
                                >
                                    <FaTimes size={16} />
                                </button>
                            )}
                        </div>
                        {errors[idx] && (
                            <div className='text-red-500 text-sm mt-1'>{errors[idx]}</div>
                        )}
                        {responses[idx] && (
                            <>
                                <div className='mt-2 p-3 bg-gray-100 rounded-lg flex flex-row items-center gap-6'>
                                    {/* Left: Circular Progress for the plan */}
                                    <div className='flex items-center justify-center'>
                                        {(() => {
                                            const { completed, required } = getPlanProgressFromFilling(idx);
                                            const circ = 2 * Math.PI * 28;
                                            const percent = required > 0 ? Math.min(1, completed / required) : 0;
                                            const offset = circ * (1 - percent);
                                            return (
                                                <svg width="64" height="64" viewBox="0 0 64 64">
                                                    <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                                    <circle cx="32" cy="32" r="28" stroke="#65A8F6" strokeWidth="8" fill="none" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.5s' }} />
                                                    <text x="50%" y="50%" textAnchor="middle" dy="0.3em" fontSize="16" fill="#333">{completed}/{required}</text>
                                                </svg>
                                            );
                                        })()}
                                    </div>
                                    {/* Right: Section List */}
                                    <div className='flex flex-col gap-1'>
                                        {(() => {
                                            return (
                                                <>
                                                    {sectionNames[idx] && sectionNames[idx].map((sectionKey, sectionIdx) => {
                                                        const progress = getSectionProgressFromFilling(idx, sectionKey);
                                                        return (
                                                            <div className='flex flex-row items-center gap-2' key={sectionKey}>
                                                                <span className='font-semibold'>
                                                                    {sectionKey}
                                                                </span>
                                                                <span className='text-gray-700'>
                                                                    {progress.completed}/{progress.required}
                                                                </span>
                                                                {hasUnselectedSubPlans(idx, sectionKey) && (
                                                                    <div className="relative group">
                                                                        <img src="/info.svg" alt="info" className="w-4 h-4 text-gray-400 cursor-help" />
                                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                                            Select a sub-plan by clicking in Details
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                                {/* Details Button */}
                                <div className='mt-2 flex justify-center'>
                                    <button
                                        onClick={() => openDetailsModal(responses[idx])}
                                        className='bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1 px-3 rounded transition-colors'
                                    >
                                        Details
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Details Modal */}
            {detailsModalOpen && selectedPlanData && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 1000000 }}>
                    <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Plan Details</h2>
                            <button
                                onClick={closeDetailsModal}
                                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">{selectedPlanData.title}</h3>
                            {/* Find the plan index for the selectedPlanData in responses */}
                            {(() => {
                                const planIndex = responses.findIndex(r => r === selectedPlanData);
                                return (
                                    <PlanDetailsDisplay
                                        planData={selectedPlanData}
                                        sectionNames={sectionNames}
                                        plansFilling={plansFilling}
                                        coursesTaken={coursesTaken}
                                        planIndex={planIndex}
                                        setCoursesTaken={setCoursesTaken}
                                        setPlansFilling={setPlansFilling}
                                        selectedPlanCombo={selectedPlanCombo}
                                        selectedSubPlans={selectedSubPlans}
                                        setSelectedSubPlans={setSelectedSubPlans}
                                    />
                                );
                            })()}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={closeDetailsModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}