import { useState, useEffect, useRef } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { processAllCourses, clearPlanReq, establishPlansFilling, getPlanPrefix, recomputePlanAssignments } from '/src/components/courseFunctions';

const PLAN_OPTIONS = [
    { label: 'Double Major', value: 1, fields: ['Major 1 [Paste Academic Calendar Link]', 'Major 2 [Paste Academic Calendar Link]'] },
    { label: 'Major + Minor', value: 2, fields: ['Major [Paste Academic Calendar Link]', 'Minor [Paste Academic Calendar Link]'] },
    { label: 'Major + Double Minor', value: 3, fields: ['Major [Paste Academic Calendar Link]', 'Minor 1 [Paste Academic Calendar Link]', 'Minor 2 [Paste Academic Calendar Link]'] },
    { label: 'Specialization', value: 4, fields: ['Specialization [Paste Academic Calendar Link]'] },
    { label: 'Specialization + Minor', value: 5, fields: ['Specialization [Paste Academic Calendar Link]', 'Minor [Paste Academic Calendar Link]'] },
    { label: 'Joint Major', value: 6, fields: ['Joint Major 1 [Paste Academic Calendar Link]', 'Joint Major 2 [Paste Academic Calendar Link]'], 'Minor': 'Minor [Paste Academic Calendar Link]'},
    { label: 'Major Only (Old Plan)', value: 7, fields: ['Major [Paste Academic Calendar Link]'] },
];

export default function SelectPlan({ coursesTaken, setCoursesTaken }) {
    const [selectedPlan, setSelectedPlan] = useState(PLAN_OPTIONS[0].value);
    const [fields, setFields] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(''));
    const [locked, setLocked] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(false));
    const [responses, setResponses] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(null));
    const [errors, setErrors] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(null));
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedPlanData, setSelectedPlanData] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    // Track previous courses to detect new additions (using useRef to avoid dependency issues)
    const previousCoursesRef = useRef([]);
    
    // Track plan requirements and their completion status
    const [plansFilling, setPlansFilling] = useState({});
    
    // Monitor coursesTaken changes and automatically assign courses to requirements
    useEffect(() => {
        if (coursesTaken && setCoursesTaken && responses.length > 0) {
            // Filter out null responses to get valid plans
            const validPlans = responses.filter(response => response !== null);
            if (validPlans.length > 0) {
                const result = recomputePlanAssignments(coursesTaken, validPlans);
                // Only update state if changed
                const hasChanges = JSON.stringify(result.coursesTaken) !== JSON.stringify(coursesTaken) ||
                                   JSON.stringify(result.plansFilling) !== JSON.stringify(plansFilling);
                if (hasChanges) {
                    setCoursesTaken(result.coursesTaken);
                    setPlansFilling(result.plansFilling);
                }
                // Print plansFilling and coursesTaken for debugging (prints once per update)
                console.log('--- Plan Assignment Debug ---');
                console.log('plansFilling:', result.plansFilling);
                console.log('coursesTaken:', result.coursesTaken);
                console.log('-----------------------------');
            }
        }
    }, [coursesTaken, setCoursesTaken, responses, plansFilling]);

    const handlePlanChange = (e) => {
        const planValue = Number(e.target.value);
        const plan = PLAN_OPTIONS.find(opt => opt.value === planValue);
        setSelectedPlan(planValue);
        setFields(Array(plan.fields.length).fill(''));
        setLocked(Array(plan.fields.length).fill(false));
        setResponses(Array(plan.fields.length).fill(null));
        setErrors(Array(plan.fields.length).fill(null));
        setPlansFilling({}); // Will be re-established on plan lock
        setCoursesTaken(clearPlanReq(coursesTaken));
    };

    const handleFieldChange = (idx, value) => {
        const newFields = [...fields];
        newFields[idx] = value;
        setFields(newFields);
    };

    const validateUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };
    const validateResponse = (response, fieldType) => {
        const title = response.title?.toLowerCase() || '';
        const fieldTypeLower = fieldType.toLowerCase();
        
        // Extract the expected type from the field (e.g., "Major", "Minor", "Specialization")
        const expectedType = fieldTypeLower.split(' ')[0].trim();
        
        // Check if the title contains the expected type
        console.log(title, expectedType);
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
            newErrors[idx] = "Please enter a valid URL";
            setErrors(newErrors);
            return;
        }

        try {
            const response = await axios.get(`${apiUrl}/backend/coursePlan?url=${encodeURIComponent(url)}`);
            
            const fieldType = PLAN_OPTIONS.find(opt => opt.value === selectedPlan).fields[idx];
            
            if (!validateResponse(response.data, fieldType)) {
                const newErrors = [...errors];
                newErrors[idx] = `Invalid plan type. Expected ${fieldType.split(' ')[0].trim()}`;
                setErrors(newErrors);
                return;
            }

            const newResponses = [...responses];
            newResponses[idx] = response.data;
            setResponses(newResponses);

            const newLocked = [...locked];
            newLocked[idx] = true;
            setLocked(newLocked);

            const newErrors = [...errors];
            newErrors[idx] = null;
            setErrors(newErrors);

            // Establish plansFilling for the newly locked plan
            // Use establishPlansFilling for each locked plan and merge results
            let mergedPlansFilling = {};
            newResponses.forEach((planData, i) => {
                if (planData && newLocked[i]) {
                    const planPrefix = getPlanPrefix(i, planData);
                    Object.assign(mergedPlansFilling, establishPlansFilling(planData, planPrefix));
                }
            });
            setPlansFilling(mergedPlansFilling);
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
        // Rebuild plansFilling for remaining locked plans
        let mergedPlansFilling = {};
        newResponses.forEach((planData, i) => {
            if (planData && newLocked[i]) {
                const planPrefix = getPlanPrefix(i, planData);
                Object.assign(mergedPlansFilling, establishPlansFilling(planData, planPrefix));
            }
        });
        setPlansFilling(mergedPlansFilling);
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Enter' && fields[idx].trim() && !locked[idx]) {
            handleLock(idx);
        }
    };

    const openDetailsModal = (planData) => {
        setSelectedPlanData(planData);
        setDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setDetailsModalOpen(false);
        setSelectedPlanData(null);
    };

    // Component to display plan details in a formatted way
    const PlanDetailsDisplay = ({ planData, level = 0, plansFilling = {}, coursesTaken = [], planIndex = 0 }) => {
        const [expandedSections, setExpandedSections] = useState({});
        const [selectedOptions, setSelectedOptions] = useState({});

        const toggleSection = (sectionId) => {
            setExpandedSections(prev => ({
                ...prev,
                [sectionId]: !prev[sectionId]
            }));
        };

        const handleOptionChange = (sectionId, value) => {
            setSelectedOptions(prev => ({
                ...prev,
                [sectionId]: value
            }));
        };

        const renderSection = (sectionKey, sectionData, sectionLevel = 0, parentPath = '') => {
            if (!sectionData || typeof sectionData !== 'object') return null;

            const indentClass = `ml-${sectionLevel * 4}`;
            const currentPath = parentPath ? `${parentPath}-${sectionKey}` : sectionKey;
            const sectionId = `${currentPath}-${sectionLevel}`;

            // Handle subsections
            if (sectionData.subsections) {
                return (
                    <div key={sectionId} className={`${indentClass} space-y-2`}>
                        <div className="font-semibold text-gray-800">
                            {sectionData.title || sectionKey}
                        </div>
                        {sectionData.subsections.map((subsection, idx) => (
                            <div key={`${sectionId}-${idx}`} className="ml-4">
                                {renderSubsection(subsection, sectionLevel + 1, currentPath, sectionKey)}
                            </div>
                        ))}
                    </div>
                );
            }

            return null;
        };

        const renderSubsection = (subsection, level = 0, parentPath = '', sectionKey = '') => {
            const indentClass = `ml-${level * 4}`;
            const currentPath = parentPath ? `${parentPath}-${subsection.id}` : subsection.id;
            const subsectionId = `${currentPath}-${level}`;
            const hasCourses = subsection.courses && subsection.courses.length > 0;
            const hasPlan = subsection.plan && Object.keys(subsection.plan).length > 0;
            const hasRequirement = subsection.requirement && (Array.isArray(subsection.requirement) ? subsection.requirement.length > 0 : subsection.requirement);

            // Compute the plan prefix for this plan
            const planPrefix = getPlanPrefix(planIndex, planData);

            // Compute requirementId as in plansFilling
            const requirementId = `${planPrefix}${sectionKey}${subsection.id}`;
            // Only use the key for this plan's prefix
            const assignedCourses = plansFilling[requirementId]?.courses?.length > 0
                ? plansFilling[requirementId].courses.map(code => {
                    const courseObj = coursesTaken.find(c => c && c.code === code);
                    return courseObj ? courseObj.code : code;
                })
                : [];

            return (
                <div key={subsectionId} className={`${indentClass} space-y-2`}>
                    <div className="flex items-start gap-2">
                        {/* Course fulfillment column - only show if not a plan selection */}
                        {!hasPlan && (
                            <div className="w-32 flex-shrink-0">
                                {assignedCourses.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        {assignedCourses.map((c, idx) => (
                                            <div key={idx} className="w-28 h-6 bg-blue-50 border border-blue-300 rounded flex items-center justify-center text-xs text-blue-700">
                                                {c}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <></>
                                )}
                            </div>
                        )}
                        
                        {/* Requirement title and content */}
                        <div className="flex-1">
                            <span className="font-medium text-gray-700">
                                {subsection.title}
                            </span>

                    {/* Render courses and requirements */}
                    {(hasCourses || hasRequirement) && (
                        <div className="ml-4 space-t-1">
                            {/* Render courses first */}
                            {hasCourses && subsection.courses.map((course, idx) => (
                                <div key={`course-${idx}`} className="text-sm text-gray-600">
                                    {course.code === 'Combination' ? (
                                        <div className="">
                                            <span className="font-medium text-gray-500">Combination:</span>
                                            {course.courses.map((subCourse, subIdx) => (
                                                <div key={subIdx} className="ml-4 text-gray-600">
                                                    {subCourse.code} - {subCourse.title}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="">
                                            {course.code} - {course.title}
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {/* Render requirements */}
                            {hasRequirement && (
                                <div className="text-sm text-gray-600">
                                    {Array.isArray(subsection.requirement) ? (
                                        subsection.requirement.map((req, idx) => (
                                            <div key={`req-${idx}`} className="text-gray-600">
                                                {req}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-600 font-medium">
                                            {subsection.requirement}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Render plan options if exists */}
                    {hasPlan && (
                        <div>
                            <select
                                value={selectedOptions[subsectionId] || ''}
                                onChange={(e) => handleOptionChange(subsectionId, e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                                <option value="">Select an option...</option>
                                {Object.entries(subsection.plan).map(([optionKey, optionData]) => (
                                    <option key={optionKey} value={optionKey}>
                                        {optionData.title}
                                    </option>
                                ))}
                            </select>
                            
                            {selectedOptions[subsectionId] && (
                                <div className="mt-2">
                                    {renderSection(
                                        selectedOptions[subsectionId],
                                        subsection.plan[selectedOptions[subsectionId]],
                                        level + 1,
                                        currentPath
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                        </div>
                    </div>
                </div>
            );
        };

        // Filter out non-section properties
        const sections = Object.entries(planData).filter(([key]) => 
            !['title', 'electives', 'units'].includes(key)
        );

        return (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                {sections.map(([sectionKey, sectionData]) => 
                    renderSection(sectionKey, sectionData)
                )}
            </div>
        );
    };

    const plan = PLAN_OPTIONS.find(opt => opt.value === selectedPlan);

    return (
        <div className='flex flex-col p-3 border rounded-lg md-custom:mr-0 mr-8'>
            <div className='text-xl font-bold mb-2 lg:mt-0 mt-2'>Select Plan</div>
            <div className='flex items-center mb-4'>
                <label className='mr-3 font-medium'>Type:</label>
                <select
                    className='border rounded px-3 py-1 text-base w-full'
                    value={selectedPlan}
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
                        <div className='flex w-full'>
                            <input
                                type='text'
                                className={`border rounded px-3 py-1 text-base flex-1 transition-all duration-150 mr-2 ${locked[idx] ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
                                placeholder={placeholder}
                                value={fields[idx]}
                                onChange={e => handleFieldChange(idx, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, idx)}
                                disabled={locked[idx]}
                                style={{ minWidth: 0 }}
                            />
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
                            (() => {
                                // Calculate plan prefix for this plan
                                const planPrefix = getPlanPrefix(idx, responses[idx]);
                                // Filter plansFilling keys for this plan
                                const planReqs = Object.entries(plansFilling).filter(([key]) => key.startsWith(planPrefix));
                                // Calculate overall progress
                                let totalCompleted = 0;
                                planReqs.forEach(([key, req]) => {
                                    totalCompleted += req.unitsCompleted || 0;
                                });
                                const totalRequired = responses[idx].units || 0;
                                // For each section (Core, Option, Supporting, etc.)
                                const sectionProgress = {};
                                Object.entries(responses[idx])
                                    .filter(([key]) => !['title', 'electives', 'units'].includes(key))
                                    .forEach(([sectionKey, sectionData]) => {
                                        // Sum up all requirements in this section
                                        let sectionCompleted = 0, sectionRequired = 0;
                                        if (sectionData.subsections) {
                                            sectionData.subsections.forEach(subsection => {
                                                const reqId = `${planPrefix}${sectionKey}${subsection.id}`;
                                                if (plansFilling[reqId]) {
                                                    sectionCompleted += plansFilling[reqId].unitsCompleted || 0;
                                                    sectionRequired += plansFilling[reqId].unitsRequired || 0;
                                                }
                                            });
                                        }
                                        sectionProgress[sectionKey] = { completed: sectionCompleted, required: sectionRequired };
                                    });
                                // Electives (if present)
                                let electivesCompleted = 0, electivesRequired = responses[idx].electives || 0;
                                // Optionally, you can sum up courses assigned as "Electives" in plansFilling
                                // Render
                                const percent = totalRequired > 0 ? Math.min(100, Math.round((totalCompleted / totalRequired) * 100)) : 0;
                                const circleCirc = 2 * Math.PI * 28;
                                const circleOffset = totalRequired > 0 ? circleCirc * (1 - totalCompleted / totalRequired) : circleCirc;
                                return (
                                    <>
                                        <div className='mt-2 p-3 bg-gray-100 rounded-lg flex flex-row items-center gap-6'>
                                            {/* Left: Circular Progress */}
                                            <div className='flex items-center justify-center'>
                                                <svg width="64" height="64" viewBox="0 0 64 64">
                                                    <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                                    <circle cx="32" cy="32" r="28" stroke="#65A8F6" strokeWidth="8" fill="none" strokeDasharray={circleCirc} strokeDashoffset={circleOffset} style={{ transition: 'stroke-dashoffset 0.5s' }} />
                                                    <text x="50%" y="50%" textAnchor="middle" dy="0.3em" fontSize="16" fill="#333">{totalCompleted}/{totalRequired}</text>
                                                </svg>
                                            </div>
                                            {/* Right: Section List */}
                                            <div className='flex flex-col gap-1'>
                                                {Object.entries(sectionProgress).map(([sectionKey, prog]) => (
                                                    <div key={sectionKey} className='flex flex-row items-center gap-2'>
                                                        <span className='font-semibold'>{sectionKey}</span>
                                                        <span className='text-gray-700'>{prog.completed}/{prog.required}</span>
                                                    </div>
                                                ))}
                                                {electivesRequired > 0 && (
                                                    <div className='flex flex-row items-center gap-2'>
                                                        <span className='font-semibold'>Electives</span>
                                                        <span className='text-gray-700'>{electivesCompleted}/{electivesRequired}</span>
                                                    </div>
                                                )}
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
                                );
                            })()
                        )}
                    </div>
                ))}
            </div>
            
            {/* Details Modal */}
            {detailsModalOpen && selectedPlanData && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4" style={{zIndex: 1000000}}>
                    <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Plan Details</h2>
                            <button 
                                onClick={closeDetailsModal}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
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
                                    <PlanDetailsDisplay planData={selectedPlanData} plansFilling={plansFilling} coursesTaken={coursesTaken} planIndex={planIndex} />
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