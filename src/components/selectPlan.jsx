import { useState, useEffect, useRef, useContext } from 'react';
import emailjs from '@emailjs/browser'
// Error Modal Component
import { AuthContext } from '../context/authContext';
import { FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { validateUrl, clearPlanReq, establishPlansFilling, getPlanPrefix, recomputePlanAssignments } from '/src/components/courseFunctions';
import planResultsData from '../assets/coursePlanResults.json';
import PlanDetailsDisplay from '/src/components/planDetailsDisplay.jsx';
import LoadingModal from '/src/components/loadingModal.jsx';


function ErrorModal({ isOpen, onClose, term }) {
    const [email, setEmail] = useState('');
    const [errorTypes, setErrorTypes] = useState([]);
    const [description, setDescription] = useState('');

    const errorTypeOptions = [
        'Error when loading',
        'Error in plan display (details pop up)',
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
                    alert("We've received your error report!");
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

export default function SelectPlan({ coursesTaken, setCoursesTaken }) {
    // Error modal state
    const [errorModalOpen, setErrorModalOpen] = useState(false);
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

    // Track custom course assignments array of course objects
    const [customAssignments, setCustomAssignments] = useState([]);

    // When lauched, load data
    const { currentUser } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(true);

    const [oldCoursesTaken, setOldCoursesTaken] = useState(coursesTaken);

    // Load user's existing information from database
    useEffect(() => {
        if (!currentUser) {
            alert("You are not logged in. The save button will not work.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const userId = currentUser ? currentUser.id : null;
            if (!userId) {
                console.log("User has not logged in");
                return;
            }

            const response = await axios.get(`${apiUrl}/backend/userPlans/${userId}`);
            const data = response.data;
            setSelectedPlanCombo(data.selectedPlanCombo || PLAN_OPTIONS[0].value);
            setFields(data.fields || Array(PLAN_OPTIONS[0].fields.length).fill(''));
            setLocked(data.fields.map(field => field && field.trim() !== '' ? true : false));
            // Build responses array by matching each field's link in planResultsData
            setResponses(
                (data.fields || Array(PLAN_OPTIONS[0].fields.length).fill('')).map((field, idx) => {
                    if (!field || !field.trim()) return null;
                    // Determine plan type for this field
                    const planType = (() => {
                        const plan = PLAN_OPTIONS.find(opt => opt.value === (data.selectedPlanCombo || PLAN_OPTIONS[0].value));
                        if (!plan) return 'Major';
                        const fieldStr = plan.fields[idx] || '';
                        if (fieldStr.toLowerCase().includes('specialization')) return 'Specialization';
                        if (fieldStr.toLowerCase().includes('minor')) return 'Minor';
                        if (fieldStr.toLowerCase().includes('joint')) return 'Joint Major';
                        if (fieldStr.toLowerCase().includes('major')) return 'Major';
                        if (fieldStr.toLowerCase().includes('general')) return 'General';
                        return 'Major';
                    })();
                    // Search for matching plan in planResultsData
                    const plans = planResultsData[planType] || [];
                    const match = plans.find(planObj => planObj.link === field.trim());
                    return match ? match.result : null;
                })
            );
            setPlansFilling(data.plansFilling || {});
            setSelectedSubPlans(data.selectedSubPlans || Array(PLAN_OPTIONS[0].fields.length).fill(null));
            setSectionNames(data.sectionNames || Array(PLAN_OPTIONS[0].fields.length).fill([]));
            setCustomAssignments(data.customAssignments || []);
            setCoursesTaken(data.coursesTaken || Array(60).fill(null));
            setOldCoursesTaken(data.coursesTaken || Array(60).fill(null));
        } catch (error) {
            console.error("Error loading user data:", error);

            // Extract the actual error message from the response
            let errorMessage = "An error occurred while loading your data";

            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const responseData = error.response.data;
                errorMessage = responseData.message || responseData.error || errorMessage;
            } else if (error.request) {
                // The request was made but no response was received
                errorMessage = "No response received from server";
            } else {
                // Something happened in setting up the request that triggered an Error
                errorMessage = error.message || errorMessage;
            }

            alert("Error: " + errorMessage);
        } finally {
            setIsLoading(false);
        }
    }


    // Monitor coursesTaken changes and automatically assign courses to requirements
    useEffect(() => {
        if (coursesTaken && responses.length > 0) {
            // Filter out null responses to get valid plans
            const validPlans = responses.filter(response => response !== null);
            if (validPlans.length > 0) {
                const result = recomputePlanAssignments(coursesTaken, validPlans, selectedPlanCombo, customAssignments, setCustomAssignments, plansFilling, selectedSubPlans, setCoursesTaken);
                // Remove courses from plansFilling that are not in coursesTaken
                const coursesTakenCodes = new Set(coursesTaken.filter(c => c != null).map(c => c.code));
                const cleanedPlansFilling = {};
                Object.entries(result.plansFilling).forEach(([key, value]) => {
                    cleanedPlansFilling[key] = {
                        ...value,
                        courses: value.courses.filter(course => !coursesTakenCodes.has(course.code))
                    };
                });
                result.plansFilling = cleanedPlansFilling;

                // Remove customAssignments that are not in coursesTaken
                setCustomAssignments(prevAssignments => {
                    return prevAssignments.filter(course => !coursesTakenCodes.has(course.code));
                });
                // Only update state if changed
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

    const handleSavePlans = async () => {
        if (!currentUser) {
            alert("You are not logged in. Please log in to save your plans.");
            return;
        }
        try {
            setIsLoading(true);
            const userId = currentUser.id;
            const dataToSave = {
                user: userId,
                selectedPlanCombo,
                plansFilling,
                selectedSubPlans,
                sectionNames,
                customAssignments,
                coursesTaken,
                fields
            };
            await axios.post(`${apiUrl}/backend/userPlans/savePlan`, dataToSave);
            alert("Your plans have been saved successfully!");
            setOldCoursesTaken(coursesTaken); // Update old courses taken to current state
        } catch (error) {
            console.error("Error saving plans:", error);
            alert("There was an error saving your plans. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }

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
                Object.assign(mergedPlansFilling, establishPlansFilling(planData, planPrefix));
                // mergedPlansFilling[`${planPrefix}Electives`] = {
                //     unitsRequired: planData.electives || 0,
                //     unitsCompleted: 0,
                //     courses: []
                // };
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
            console.error("Plan requirements do not match total units due to unexpected calendar formatting. Required:", required, "Total Units:", totalUnits);
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
                    Object.assign(mergedPlansFilling, establishPlansFilling(planData, planPrefix));
                    mergedPlansFilling[`${planPrefix}Electives`] = {
                        unitsRequired: planData.electives || 0,
                        unitsCompleted: 0,
                        courses: []
                    };
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
                // mergedPlansFilling[`${planPrefix}Electives`] = {
                //     unitsRequired: planData.electives || 0,
                //     unitsCompleted: 0,
                //     courses: []
                // };
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
            const planPrefix = getPlanPrefix(idx, responses[idx], selectedPlanCombo);
            const otherUnitsCompleted = coursesTaken
                .filter(course => course && (!course.planreq || !course.planreq.includes(planPrefix)))
                .reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0);
            completed += otherUnitsCompleted;
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
            {isLoading && <LoadingModal />}
            <div>
                {/* Save / Report Error section */}
                <div className="flex justify-between mb-4">
                    <button
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-4 rounded transition-colors"
                        onClick={handleSavePlans}
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
                                                                                    Electives/Other Plans
                                                                                </span>
                                                                                <span className='text-gray-700'>
                                                                                    {otherUnitsCompleted} Units
                                                                                </span>
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