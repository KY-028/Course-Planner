import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser'
// Error Modal Component
import { FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { validateUrl, clearPlanReq, establishPlansFilling, getPlanPrefix, recomputePlanAssignments, processSection } from '/src/components/courseFunctions';
import planResultsData from '../assets/coursePlanResults.json';
import PlanDetailsDisplay from '/src/components/planDetailsDisplay.jsx';

function ErrorModal({ isOpen, onClose, term }) {
    const [email, setEmail] = useState('');
    const [errorTypes, setErrorTypes] = useState([]);
    const [description, setDescription] = useState('');

    const errorTypeOptions = [
        'Error when loading',
        'Incorrect plan display (details pop up)',
        'Plan requirements do not match Academic Calendar',
        'Error after pasting plan',
        'Error after selecting plan',
        'Other',
    ];

    const handleErrorTypeChange = (errorType) => {
        setErrorTypes(prev => {
            if (prev.includes(errorType)) {
                return prev.filter(type => type !== errorType);
            } else {
                return [...prev, errorType];
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const message = JSON.stringify({
            error_type: errorTypes.join(', '),
            description
        });
        emailjs.send('service_cfmmnlp', 'template_fmvts7a', { email, message }, '2qeaMXLo7xFUpCTe0')
            .then(
                (result) => {
                    alert("We've received your error report! However, due to the complexity, we do not guarantee if your error will be fixed. We will send you an update via email regarding the outcome.");
                },
                (error) => {
                    alert(`There was an error: ${error.text}`);
                },
            );
        setEmail('');
        setErrorTypes([]);
        setDescription('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 10000000 }}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Report an Error</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&#x2715;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Email:</label>
                        <input
                            type="email"
                            placeholder="Email address"
                            className="w-full p-2 border border-gray-300 rounded"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Error Type(s):</label>
                        <div className="space-y-2">
                            {errorTypeOptions.map((option) => (
                                <label key={option} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={errorTypes.includes(option)}
                                        onChange={() => handleErrorTypeChange(option)}
                                    />
                                    <span className="text-sm">{option}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description:</label>
                        <textarea
                            className="w-full p-2 border border-gray-300 rounded h-20 resize-none"
                            placeholder="Please provide details about the error..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            disabled={errorTypes.length === 0 || !email}
                        >
                            Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const PLAN_OPTIONS = [
    { label: 'Double Major', value: 1, fields: ['Major 1 [Search or Paste Academic Calendar Link]', 'Major 2 [Search or Paste Academic Calendar Link]'] },
    { label: 'Major + Minor', value: 2, fields: ['Major [Search or Paste Academic Calendar Link]', 'Minor [Search or Paste Academic Calendar Link]'] },
    { label: 'Major + Double Minor', value: 3, fields: ['Major [Search or Paste Academic Calendar Link]', 'Minor 1 [Search or Paste Academic Calendar Link]', 'Minor 2 [Search or Paste Academic Calendar Link]'] },
    { label: 'Specialization', value: 4, fields: ['Specialization [Search or Paste Academic Calendar Link]'] },
    { label: 'Specialization + Minor', value: 5, fields: ['Specialization [Search or Paste Academic Calendar Link]', 'Minor [Search or Paste Academic Calendar Link]'] },
    { label: 'Joint Major', value: 6, fields: ['Joint Major 1 [Search or Paste Academic Calendar Link]', 'Joint Major 2 [Search or Paste Academic Calendar Link]'], 'Minor': 'Minor [Search or Paste Academic Calendar Link]' },
    { label: 'General Degree', value: 7, fields: ['General [Search or Paste Academic Calendar Link]'] },
    { label: 'Major Only (Old Plan)', value: 8, fields: ['Major [Search or Paste Academic Calendar Link]'] },
];

export default function SelectPlan(
    { coursesTaken, setCoursesTaken,
        selectedPlanCombo, setSelectedPlanCombo,
        fields, setFields,
        locked, setLocked,
        responses, setResponses,
        errors, setErrors,
        plansFilling, setPlansFilling,
        selectedSubPlans, setSelectedSubPlans,
        sectionNames, setSectionNames,
        customAssignments, setCustomAssignments,
        handleSavePlans, isLoading
    }) {
    // Error modal state
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;
    // Details Modal Open
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    // Selected Plan Data (For Details Modal)
    const [selectedPlanData, setSelectedPlanData] = useState(null);
    // For plan search dropdown
    const [searchResults, setSearchResults] = useState(Array(PLAN_OPTIONS[0].fields.length).fill([]));
    const [showDropdown, setShowDropdown] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(false));




    // Monitor coursesTaken changes and automatically assign courses to requirements
    useEffect(() => {
        if (coursesTaken && responses.length > 0) {
            const coursesTakenCodes = new Set(coursesTaken.filter(c => c != null).map(c => c.code));
            // Filter out null responses to get valid plans
            const validPlans = responses.filter(response => response !== null);
            if (validPlans.length > 0) {
                // Only update state if changed
                const result = recomputePlanAssignments(coursesTaken, responses, selectedPlanCombo, customAssignments, setCustomAssignments, plansFilling, selectedSubPlans, setCoursesTaken);
                // Remove courses from plansFilling that are not in coursesTaken
                const cleanedPlansFilling = {};
                Object.entries(result.plansFilling).forEach(([key, value]) => {
                    cleanedPlansFilling[key] = {
                        ...value,
                        courses: value.courses.filter(course => !coursesTakenCodes.has(course.code)) || []
                    };
                });
                result.plansFilling = cleanedPlansFilling;

                const hasCoursesChanged = JSON.stringify(result.coursesTaken) !== JSON.stringify(coursesTaken);
                const hasPlansChanged = JSON.stringify(result.plansFilling) !== JSON.stringify(plansFilling);

                if (hasCoursesChanged) {
                    setCoursesTaken(result.coursesTaken);
                }
                if (hasPlansChanged) {
                    setPlansFilling(result.plansFilling);
                }
            }
        }
    }, [coursesTaken, responses]);


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
        if (field.toLowerCase().includes('general')) return 'General';
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
        // Prevent duplicate plan selection
        const isDuplicate = responses.some((resp, i) =>
            i !== idx &&
            resp &&
            resp.title === planObj.result.title &&
            resp.year === planObj.result.year
        );
        if (isDuplicate) {
            alert("You have already selected this plan for another slot. Please choose a different plan.");
            return;
        }
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
                // Check if a sub-plan is selected for this plan
                const subPlanName = selectedSubPlans[i];
                let hasSubPlan = false;
        
                // First, process all sections normally
                Object.assign(mergedPlansFilling, establishPlansFilling(planData, planPrefix));
        
                // Then, handle sub-plan sections specially
                Object.keys(planData).forEach(key => {
                    if (planData[key].subsections) {
                        planData[key].subsections.forEach(subsection => {
                            if (subsection.plan) {
                                hasSubPlan = true;
                                // Remove old requirements for this section
                                Object.keys(mergedPlansFilling).forEach(k => {
                                    if (k.startsWith(`${planPrefix}${key}`)) {
                                        delete mergedPlansFilling[k];
                                    }
                                });
                                if (subPlanName && subsection.plan[subPlanName]) {
                                    // Add requirements for the selected sub-plan
                                    if (subsection.plan[subPlanName].subsections) {
                                        processSection(`${planPrefix}${key}${subsection.id}-${subPlanName}`, subsection.plan[subPlanName], mergedPlansFilling);
                                    } else {
                                        establishPlansFilling(subsection.plan[subPlanName], `${planPrefix}${key}${subsection.id}-${subPlanName}-`, mergedPlansFilling);
                                    }
                                    processSection(`${planPrefix}${key}`, planData[key], mergedPlansFilling);
                                    delete mergedPlansFilling[`${planPrefix}${key}${subsection.id}`];
                                } else {
                                    // No sub-plan selected, just process the main section
                                    processSection(`${planPrefix}${key}`, planData[key], mergedPlansFilling);
                                }
                            }
                        });
                    }
                });
            }
        });

        mergedPlansFilling["Unassigned/Electives"] = {
            unitsRequired: 0,
            unitsCompleted: 0,
            courses: []
        }
        const totalUnits = newResponses[idx]?.units || 0;
        let required = 0;
        // Check if the plan is valid for this index
        const planPrefix = getPlanPrefix(idx, newResponses[idx], selectedPlanCombo);
        Object.entries(mergedPlansFilling).forEach(([key, value]) => {
            if (key.startsWith(planPrefix)) {
                required += value.unitsRequired || 0;
            }
        });
        if (required === totalUnits - (newResponses[idx]?.electives || 0)) {
            setPlansFilling(mergedPlansFilling);
        } else {
            console.error("Plan requirements do not match total units due to unexpected calendar formatting. Required:", required, "Total Units:", totalUnits, "Plan:", mergedPlansFilling);
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
            // Prevent duplicate plan selection
            const isDuplicate = responses.some((resp, i) =>
                i !== idx &&
                resp &&
                resp.title === response.data.title &&
                resp.year === response.data.year
            );
            if (isDuplicate) {
                const newErrors = [...errors];
                newErrors[idx] = "You have already selected this plan for another slot. Please choose a different plan.";
                setErrors(newErrors);
                return;
            }
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
                    // Check if a sub-plan is selected for this plan
                    const subPlanName = selectedSubPlans[i];
                    let hasSubPlan = false;

                    // Find the section with a subplan
                    Object.keys(planData).forEach(key => {
                        if (planData[key].subsections) {
                            planData[key].subsections.forEach(subsection => {
                                if (subsection.plan) {
                                    hasSubPlan = true;
                                    // Remove old requirements for this section
                                    Object.keys(mergedPlansFilling).forEach(k => {
                                        if (k.startsWith(`${planPrefix}${key}`)) {
                                            delete mergedPlansFilling[k];
                                        }
                                    });
                                    if (subPlanName && subsection.plan[subPlanName]) {
                                        // Add requirements for the selected sub-plan
                                        if (subsection.plan[subPlanName].subsections) {
                                            processSection(`${planPrefix}${key}${subsection.id}-${subPlanName}`, subsection.plan[subPlanName], mergedPlansFilling);
                                        } else {
                                            establishPlansFilling(subsection.plan[subPlanName], `${planPrefix}${key}${subsection.id}-${subPlanName}-`, mergedPlansFilling);
                                        }
                                        processSection(`${planPrefix}${key}`, planData[key], mergedPlansFilling);
                                        delete mergedPlansFilling[`${planPrefix}${key}${subsection.id}`];
                                    } else {
                                        // No sub-plan selected, just process the main section
                                        processSection(`${planPrefix}${key}`, planData[key], mergedPlansFilling);
                                    }
                                }
                            });
                        }
                    });

                    // If no sub-plan logic was triggered, just process the plan as usual
                    if (!hasSubPlan) {
                        Object.assign(mergedPlansFilling, establishPlansFilling(planData, planPrefix));
                    }
                }
            });
            mergedPlansFilling["Unassigned/Electives"] = {
                unitsRequired: 0,
                unitsCompleted: 0,
                courses: []
            }
            const totalUnits = newResponses[idx]?.units || 0;
            let required = 0;
            const planPrefix = getPlanPrefix(idx, newResponses[idx], selectedPlanCombo);
            Object.entries(mergedPlansFilling).forEach(([key, value]) => {
                if (key.startsWith(planPrefix)) {
                    required += value.unitsRequired || 0;
                }
            });
            if (required === totalUnits) {
                setPlansFilling(mergedPlansFilling);
            } else {
                console.error("Plan requirements do not match total units. Required:", required, "Total Units:", totalUnits);
                alert("Your plan was not parsed successfully. Please contact the developer.");
            }
            updateSectionNames(newResponses, newLocked);
        } catch (error) {
            const newErrors = [...errors];
            newErrors[idx] = error.response || "An error occurred while fetching the plan";
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

        // Clean up custom assignments so that the courses are not assigned to this plan's requirements
        const planPrefix = getPlanPrefix(idx, responses[idx], selectedPlanCombo);
        const filteredCustomAssignments = customAssignments.filter(ca => {
            if (!ca || !ca.course || !ca.course.planreq) return true;
            // Keep assignments that don't reference this plan's requirements
            return !ca.course.planreq.split(',').some(req =>
                req.trim().startsWith(planPrefix)
            );
        });
        setCustomAssignments(filteredCustomAssignments);

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
                // Check if a sub-plan is selected for this plan
                const subPlanName = selectedSubPlans[i];
                let hasSubPlan = false;

                // Find the section with a subplan
                Object.keys(planData).forEach(key => {
                    if (planData[key].subsections) {
                        planData[key].subsections.forEach(subsection => {
                            if (subsection.plan) {
                                hasSubPlan = true;
                                // Remove old requirements for this section
                                Object.keys(mergedPlansFilling).forEach(k => {
                                    if (k.startsWith(`${planPrefix}${key}`)) {
                                        delete mergedPlansFilling[k];
                                    }
                                });
                                if (subPlanName && subsection.plan[subPlanName]) {
                                    // Add requirements for the selected sub-plan
                                    if (subsection.plan[subPlanName].subsections) {
                                        processSection(`${planPrefix}${key}${subsection.id}-${subPlanName}`, subsection.plan[subPlanName], mergedPlansFilling);
                                    } else {
                                        establishPlansFilling(subsection.plan[subPlanName], `${planPrefix}${key}${subsection.id}-${subPlanName}-`, mergedPlansFilling);
                                    }
                                    processSection(`${planPrefix}${key}`, planData[key], mergedPlansFilling);
                                    delete mergedPlansFilling[`${planPrefix}${key}${subsection.id}`];
                                } else {
                                    // No sub-plan selected, just process the main section
                                    processSection(`${planPrefix}${key}`, planData[key], mergedPlansFilling);
                                }
                            }
                        });
                    }
                });

                // If no sub-plan logic was triggered, just process the plan as usual
                if (!hasSubPlan) {
                    Object.assign(mergedPlansFilling, establishPlansFilling(planData, planPrefix));
                }
            }
        });
        mergedPlansFilling["Unassigned/Electives"] = {
            unitsRequired: 0,
            unitsCompleted: 0,
            courses: []
        }

        setPlansFilling(mergedPlansFilling);
        setCoursesTaken(clearPlanReq(coursesTaken)); // Clear courses taken plan requirement assignments
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
        // Add electives section (if it's not a minor)
        if (!PLAN_OPTIONS[selectedPlanCombo - 1].fields[idx].includes('Minor')) {
            const allowedElectives = responses[idx]?.electives || 0;

            const planPrefix = getPlanPrefix(idx, responses[idx], selectedPlanCombo);
            const otherUnitsCompleted = coursesTaken
                .filter(course => course && (!course.planreq || !course.planreq.includes(planPrefix)))
                .reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
            completed += Math.min(otherUnitsCompleted, allowedElectives);
        }
        // Use the plan's total required units as the required value
        required = responses[idx]?.units || required;
        return { completed, required };
    }

    // Helper: Update sectionNames for all plans
    function updateSectionNames(responsesArr, lockedArr) {
        const newSectionNames = [];
        responsesArr.forEach((planData, i) => {
            if (planData && lockedArr[i]) {
                let sectionKeys = Object.keys(planData).filter(k => k !== 'title' && k !== 'electives' && k !== 'units');
                // Ensure 'Unassigned/Electives' is always present and last
                sectionKeys.push('Unassigned/Electives');
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
            <div>
                {/* Save / Report Error section */}
                <div className="flex justify-between mb-4 xl:text-base md-custom:text-sm sm:text-base text-sm">
                    <button
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-4 rounded transition-colors"
                        onClick={() => handleSavePlans(false)}
                        disabled={isLoading}
                    >
                        Save
                    </button>
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-4 rounded transition-colors"
                        onClick={() => setErrorModalOpen(true)}
                    >
                        Report Error/Bug
                    </button>
                </div>
            </div>
            <div className='lg:text-xl text-lg font-bold mb-2 lg:mt-0 mt-2'>Select Plan</div>
            <div className='flex items-center mb-4 lg:text-base text-sm'>
                <label className='mr-3 font-medium'>Type:</label>
                <select
                    className='border rounded px-3 py-1 w-full lg:text-base text-sm'
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
                                className={`border rounded px-3 py-1 lg:text-base text-sm flex-1 transition-all duration-150 mr-2 ${locked[idx] ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}`}
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
                                <div className='mt-2 p-3 pr-1 bg-gray-100 rounded-lg flex flex-row items-center gap-3'>
                                    {/* Left: Circular Progress for the plan */}
                                    <div className='flex items-center justify-center'>
                                        {(() => {
                                            const { completed, required } = getPlanProgressFromFilling(idx);
                                            const radius = 32; // bigger than 28
                                            const circ = 2 * Math.PI * radius;
                                            const percent = required > 0 ? Math.min(1, completed / required) : 0;
                                            const offset = circ * (1 - percent);
                                            return (
                                                <svg width="72" height="72" viewBox="0 0 72 72">
                                                    <circle cx="36" cy="36" r={radius} stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                                    <circle cx="36" cy="36" r={radius} stroke="#65A8F6" strokeWidth="8" fill="none" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.5s' }} />
                                                    <text x="50%" y="50%" textAnchor="middle" dy="0.3em" fontSize="14" fill="#333">{completed}/{required}</text>
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
                                                                {sectionKey !== 'Unassigned/Electives' && (
                                                                    <>
                                                                        <span className='font-semibold'>
                                                                            {sectionKey}
                                                                        </span>
                                                                        <span className='text-gray-700'>
                                                                            {progress.completed}/{progress.required}
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {sectionKey === 'Unassigned/Electives' && !PLAN_OPTIONS[selectedPlanCombo - 1].fields[idx].includes('Minor') && (
                                                                    (() => {
                                                                        const planPrefix = getPlanPrefix(idx, responses[idx], selectedPlanCombo);
                                                                        const otherUnitsCompleted = coursesTaken
                                                                            .filter(course => course && (!course.planreq || !course.planreq.includes(planPrefix)))
                                                                            .reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
                                                                        return (
                                                                            <>
                                                                                <span className='font-semibold'>
                                                                                    Other
                                                                                </span>
                                                                                <span className='text-gray-700'>
                                                                                    {otherUnitsCompleted} Units
                                                                                </span>
                                                                                <div className="relative group">
                                                                                    <img src="/info.svg" alt="info" className="w-4 h-4 text-gray-400 cursor-help" />
                                                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                                                        Electives and Units Assigned to Other Plans
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        );
                                                                    })()
                                                                )}
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
                                        planPrefix={getPlanPrefix(planIndex, selectedPlanData, selectedPlanCombo)}
                                        sectionNames={sectionNames}
                                        plansFilling={plansFilling}
                                        coursesTaken={coursesTaken}
                                        planIndex={planIndex}
                                        setCoursesTaken={setCoursesTaken}
                                        setPlansFilling={setPlansFilling}
                                        selectedPlanCombo={selectedPlanCombo}
                                        selectedSubPlans={selectedSubPlans}
                                        setSelectedSubPlans={setSelectedSubPlans}
                                        setCustomAssignments={setCustomAssignments}
                                        link={fields[planIndex] || ""}
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

            {/* Error Modal */}
            <ErrorModal isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} term={""} />
        </div>
    );
}