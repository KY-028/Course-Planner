import { useState, useEffect, useRef } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { processAllCourses, clearPlanReq, establishPlansFilling, getPlanPrefix, recomputePlanAssignments } from '/src/components/courseFunctions';
import planResultsData from '../assets/coursePlanResults.json';
import CompleteIcon from '/complete.svg';

const PLAN_OPTIONS = [
    { label: 'Double Major', value: 1, fields: ['Major 1 [Search or Paste Academic Calendar Link]', 'Major 2 [Search or Paste Academic Calendar Link]'] },
    { label: 'Major + Minor', value: 2, fields: ['Major [Search or Paste Academic Calendar Link]', 'Minor [Search or Paste Academic Calendar Link]'] },
    { label: 'Major + Double Minor', value: 3, fields: ['Major [Search or Paste Academic Calendar Link]', 'Minor 1 [Search or Paste Academic Calendar Link]', 'Minor 2 [Search or Paste Academic Calendar Link]'] },
    { label: 'Specialization', value: 4, fields: ['Specialization [Search or Paste Academic Calendar Link]'] },
    { label: 'Specialization + Minor', value: 5, fields: ['Specialization [Search or Paste Academic Calendar Link]', 'Minor [Search or Paste Academic Calendar Link]'] },
    { label: 'Joint Major', value: 6, fields: ['Joint Major 1 [Search or Paste Academic Calendar Link]', 'Joint Major 2 [Search or Paste Academic Calendar Link]'], 'Minor': 'Minor [Search or Paste Academic Calendar Link]'},
    { label: 'Major Only (Old Plan)', value: 7, fields: ['Major [Search or Paste Academic Calendar Link]'] },
];

// Helper to map field type to planResultsData key
const FIELD_TYPE_TO_KEY = {
    'Major': 'Major',
    'Minor': 'Minor',
    'Specialization': 'Specialization',
    'Joint Major': 'Joint Major',
    'Specialization + Minor': 'Specialization', // fallback
    'Double Major': 'Major',
    'Major + Minor': 'Major',
    'Major + Double Minor': 'Major',
    // Add more as needed
};

export default function SelectPlan({ coursesTaken, setCoursesTaken }) {
    // Select Degree Plan Combination
    const [selectedPlan, setSelectedPlan] = useState(PLAN_OPTIONS[0].value);
    // Search or Paste Academic Calendar Link Text Field
    const [fields, setFields] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(''));
    // Locked Text Field
    const [locked, setLocked] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(false));
    // Response from API
    const [responses, setResponses] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(null));
    // Error Message
    const [errors, setErrors] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(null));
    // Details Modal Open
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    // Selected Plan Data
    const [selectedPlanData, setSelectedPlanData] = useState(null);

    // For plan search dropdown
    const [searchResults, setSearchResults] = useState(Array(PLAN_OPTIONS[0].fields.length).fill([]));
    const [showDropdown, setShowDropdown] = useState(Array(PLAN_OPTIONS[0].fields.length).fill(false));

    const apiUrl = import.meta.env.VITE_API_URL;
    
    // Track plan requirements and their completion status
    const [plansFilling, setPlansFilling] = useState({});
    
    // Track selected sub-plans for each plan
    const [selectedSubPlans, setSelectedSubPlans] = useState({});
    
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

    // Monitor selectedSubPlans changes and recalculate assignments
    useEffect(() => {
        if (Object.keys(selectedSubPlans).length > 0 && coursesTaken && setCoursesTaken && responses.length > 0) {
            const validPlans = responses.filter(response => response !== null);
            if (validPlans.length > 0) {
                const result = recomputePlanAssignments(coursesTaken, validPlans);
                setCoursesTaken(result.coursesTaken);
                setPlansFilling(result.plansFilling);
            }
        }
    }, [selectedSubPlans]);

    const handlePlanChange = (e) => {
        const planValue = Number(e.target.value);
        const plan = PLAN_OPTIONS.find(opt => opt.value === planValue);
        setSelectedPlan(planValue);
        setFields(Array(plan.fields.length).fill(''));
        setLocked(Array(plan.fields.length).fill(false));
        setResponses(Array(plan.fields.length).fill(null));
        setErrors(Array(plan.fields.length).fill(null));
        setPlansFilling({}); // Will be re-established on plan lock
        setSelectedSubPlans({}); // Clear selected sub-plans
        setCoursesTaken(clearPlanReq(coursesTaken));
    };

    // Helper to get plan type for a field
    function getFieldType(idx) {
        const plan = PLAN_OPTIONS.find(opt => opt.value === selectedPlan);
        if (!plan) return 'Major';
        const field = plan.fields[idx];
        if (!field) return 'Major';
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
        const type = getFieldType(idx);
        const key = FIELD_TYPE_TO_KEY[type] || type;
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
        // Immediately lock and set response
        const newResponses = [...responses];
        newResponses[idx] = planObj.result;
        setResponses(newResponses);
        const newLocked = [...locked];
        newLocked[idx] = true;
        setLocked(newLocked);
        const newErrors = [...errors];
        newErrors[idx] = null;
        setErrors(newErrors);
        // Clear any selected sub-plans for this plan
        setSelectedSubPlans(prev => {
            const newSelected = { ...prev };
            delete newSelected[idx];
            return newSelected;
        });
        // Establish plansFilling for the newly locked plan
        let mergedPlansFilling = {};
        newResponses.forEach((planData, i) => {
            if (planData && newLocked[i]) {
                const planPrefix = getPlanPrefix(i, planData);
                Object.assign(mergedPlansFilling, establishPlansFilling(planData, planPrefix));
            }
        });
        setPlansFilling(mergedPlansFilling);
    };

    const handleFieldChange = (idx, value) => {
        handlePlanSearch(idx, value);
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

            // Clear any selected sub-plans for this plan
            setSelectedSubPlans(prev => {
                const newSelected = { ...prev };
                delete newSelected[idx];
                return newSelected;
            });

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
        // Clear selected sub-plans for this plan
        setSelectedSubPlans(prev => {
            const newSelected = { ...prev };
            delete newSelected[idx];
            return newSelected;
        });
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
    function hasUnselectedSubPlans(idx) {
        if (!responses[idx]) return false;
        const planPrefix = getPlanPrefix(idx, responses[idx]);
        // Look for keys that contain sub-plan patterns
        const hasSubPlans = Object.keys(plansFilling).some(key => 
            key.startsWith(planPrefix) && key.includes('-major-') && key.includes('a')
        );
        return hasSubPlans && !selectedSubPlans[idx];
    }

    // Helper: Calculate total units completed and required for a plan
    function getPlanProgress(idx) {
        if (!responses[idx]) return { completed: 0, required: 0 };
        const planPrefix = getPlanPrefix(idx, responses[idx]);
        let completed = 0;
        let required = 0;
        
        // If there's a selected sub-plan, only count that sub-plan's requirements
        if (selectedSubPlans[idx]) {
            const subPlanKey = selectedSubPlans[idx];
            Object.entries(plansFilling).forEach(([key, value]) => {
                if (key.startsWith(planPrefix + subPlanKey)) {
                    completed += value.unitsCompleted || 0;
                    required += value.unitsRequired || 0;
                }
            });
        } else {
            // Otherwise, count all requirements for this plan
            Object.entries(plansFilling).forEach(([key, value]) => {
                if (key.startsWith(planPrefix)) {
                    completed += value.unitsCompleted || 0;
                    required += value.unitsRequired || 0;
                }
            });
        }
        return { completed, required };
    }

    // Helper: Calculate section progress for a plan
    function getSectionProgress(idx, sectionKey) {
        if (!responses[idx]) return { completed: 0, required: 0 };
        const planPrefix = getPlanPrefix(idx, responses[idx]);
        let completed = 0;
        let required = 0;
        
        // If there's a selected sub-plan and this section is the sub-plan section
        if (selectedSubPlans[idx] && sectionKey.toLowerCase().includes('sub-plans')) {
            // Only count the selected sub-plan's requirements
            const subPlanKey = selectedSubPlans[idx];
            Object.entries(plansFilling).forEach(([key, value]) => {
                if (key.startsWith(planPrefix + subPlanKey)) {
                    completed += value.unitsCompleted || 0;
                    required += value.unitsRequired || 0;
                }
            });
        } else {
            // Normal section calculation
            Object.entries(plansFilling).forEach(([key, value]) => {
                // Section keys are like: major-1CoreA, major-1OptionB, etc.
                if (key.startsWith(planPrefix + sectionKey)) {
                    completed += value.unitsCompleted || 0;
                    required += value.unitsRequired || 0;
                }
            });
        }
        return { completed, required };
    }

    // Helper: Calculate electives progress for a plan
    function getElectivesProgress(idx) {
        if (!responses[idx]) return { completed: 0, required: 0 };
        // Electives are not in plansFilling, so sum units for courses assigned to 'Electives' for this plan
        let completed = 0;
        // Only count electives for this plan (if multi-plan, could be ambiguous)
        coursesTaken.forEach(course => {
            if (course && course.planreq && course.planreq.split(',').map(s => s.trim()).includes('Electives') && !course.isExcess) {
                completed += course.units || 0;
            }
        });
        // Required is from plan JSON
        const required = responses[idx].electives || 0;
        return { completed, required };
    }

    // Helper: Calculate section required units from plan JSON
    function getSectionRequired(idx, sectionKey) {
        if (!responses[idx]) return 0;
        const section = responses[idx][sectionKey];
        if (section && typeof section === 'object' && section.sectionunits) {
            return section.sectionunits;
        }
        return 0;
    }

    // Helper: Calculate electives required units from plan JSON, with adjustment if needed
    function getElectivesRequired(idx) {
        if (!responses[idx]) return 0;
        const totalUnits = responses[idx].units || 0;
        const coreUnits = getSectionRequired(idx, Object.keys(responses[idx]).find(k => k.toLowerCase().includes('core')));
        const subPlanUnits = getSectionRequired(idx, Object.keys(responses[idx]).find(k => k.toLowerCase().includes('sub-plans')));
        let electives = responses[idx].electives || 0;
        // Adjust electives if core+subplan > total
        if (coreUnits + subPlanUnits > totalUnits) {
            electives = 0;
        } else if (coreUnits + subPlanUnits + electives > totalUnits) {
            electives = totalUnits - coreUnits - subPlanUnits;
        }
        return electives;
    }

    // Helper: Calculate section completed units
    function getSectionCompleted(idx, sectionKey) {
        if (!responses[idx]) return 0;
        const planPrefix = getPlanPrefix(idx, responses[idx]);
        let completed = 0;
        Object.entries(plansFilling).forEach(([key, value]) => {
            if (key.startsWith(planPrefix + sectionKey)) {
                completed += value.unitsCompleted || 0;
            }
        });
        return completed;
    }

    // Helper: Calculate sub-plan completed units
    function getSubPlanCompleted(idx) {
        if (!responses[idx]) return 0;
        const planPrefix = getPlanPrefix(idx, responses[idx]);
        let completed = 0;
        Object.entries(plansFilling).forEach(([key, value]) => {
            if (key.startsWith(planPrefix) && key.includes('Sub-Plans')) {
                completed += value.unitsCompleted || 0;
            }
        });
        return completed;
    }

    // Helper: Calculate electives completed units
    function getElectivesCompleted(idx) {
        if (!responses[idx]) return 0;
        let completed = 0;
        coursesTaken.forEach(course => {
            if (course && course.planreq && course.planreq.split(',').map(s => s.trim()).includes('Electives') && !course.isExcess) {
                completed += course.units || 0;
            }
        });
        return completed;
    }

    // Helper: Calculate total completed units for the plan
    function getPlanCompleted(idx) {
        return getSectionCompleted(idx, Object.keys(responses[idx]).find(k => k.toLowerCase().includes('core')))
            + getSectionCompleted(idx, Object.keys(responses[idx]).find(k => k.toLowerCase().includes('sub-plans')))
            + getElectivesCompleted(idx);
    }

    // Helper: Get total required units for the plan
    function getPlanRequired(idx) {
        return responses[idx]?.units || 0;
    }

    // Helper: Get the relevant requirement keys for a plan and section
    function getSectionRequirementKeys(idx, sectionKey) {
        if (!responses[idx]) return [];
        const planPrefix = getPlanPrefix(idx, responses[idx]);
        // If a sub-plan is selected and this is the sub-plan section, only include that sub-plan's requirements
        if (selectedSubPlans[idx] && sectionKey.toLowerCase().includes('sub-plans')) {
            const subPlanKey = selectedSubPlans[idx];
            return Object.keys(plansFilling).filter(key => key.startsWith(planPrefix + subPlanKey));
        } else {
            // Otherwise, include all requirements for this section
            return Object.keys(plansFilling).filter(key => key.startsWith(planPrefix + sectionKey));
        }
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

    // Helper: Calculate electives progress from plansFilling (by convention, electives are not in plansFilling, so use previous logic)
    function getElectivesProgressFromFilling(idx) {
        let completed = 0;
        coursesTaken.forEach(course => {
            if (course && course.planreq && course.planreq.split(',').map(s => s.trim()).includes('Electives') && !course.isExcess) {
                completed += course.units || 0;
            }
        });
        // Required is from plan JSON, but may need to be adjusted if Core+SubPlans > total
        let required = responses[idx]?.electives || 0;
        const totalUnits = responses[idx]?.units || 0;
        const coreKey = Object.keys(responses[idx]).find(k => k.toLowerCase().includes('core'));
        const subPlanKey = Object.keys(responses[idx]).find(k => k.toLowerCase().includes('sub-plans'));
        const core = getSectionProgressFromFilling(idx, coreKey);
        const sub = getSectionProgressFromFilling(idx, subPlanKey);
        if (core.required + sub.required > totalUnits) {
            required = 0;
        } else if (core.required + sub.required + required > totalUnits) {
            required = totalUnits - core.required - sub.required;
        }
        return { completed, required };
    }

    // Helper: Calculate total completed and required units for the plan (from plansFilling)
    function getPlanProgressFromFilling(idx) {
        if (!responses[idx]) return { completed: 0, required: 0 };
        const coreKey = Object.keys(responses[idx]).find(k => k.toLowerCase().includes('core'));
        const subPlanKey = Object.keys(responses[idx]).find(k => k.toLowerCase().includes('sub-plans'));
        const core = getSectionProgressFromFilling(idx, coreKey);
        const sub = getSectionProgressFromFilling(idx, subPlanKey);
        const electives = getElectivesProgressFromFilling(idx);
        const required = responses[idx]?.units || 0;
        const completed = core.completed + sub.completed + electives.completed;
        return { completed, required };
    }

    // When a plan or sub-plan is selected/unlocked/changed, reconstruct plansFilling to only include the relevant requirements
    function reconstructPlansFilling() {
        let merged = {};
        responses.forEach((planData, i) => {
            if (planData) {
                const planPrefix = getPlanPrefix(i, planData);
                // If a sub-plan is selected, only include that sub-plan's requirements for the sub-plan section
                if (selectedSubPlans[i]) {
                    // Find the sub-plan section key
                    const subPlanKey = Object.keys(planData).find(k => k.toLowerCase().includes('sub-plans'));
                    // Add core section
                    Object.entries(planData).forEach(([sectionKey, sectionData]) => {
                        if (sectionKey.toLowerCase().includes('core')) {
                            Object.assign(merged, establishPlansFilling({ [sectionKey]: sectionData }, planPrefix));
                        }
                    });
                    // Add only the selected sub-plan
                    if (subPlanKey) {
                        const subPlanSection = planData[subPlanKey];
                        if (subPlanSection && subPlanSection.subsections) {
                            const selectedSub = subPlanSection.subsections.find(sub => sub.id === selectedSubPlans[i]);
                            if (selectedSub) {
                                Object.assign(merged, establishPlansFilling({ [subPlanKey]: { ...subPlanSection, subsections: [selectedSub] } }, planPrefix));
                            }
                        }
                    }
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

    // Call reconstructPlansFilling whenever responses, selectedSubPlans, or unlocking/locking changes
    useEffect(() => {
        reconstructPlansFilling();
    }, [responses, selectedSubPlans]);

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
            
            // Update selected sub-plans state
            if (value) {
                setSelectedSubPlans(prev => ({
                    ...prev,
                    [planIndex]: value
                }));
            } else {
                setSelectedSubPlans(prev => {
                    const newSelected = { ...prev };
                    delete newSelected[planIndex];
                    return newSelected;
                });
            }
        };

        const renderSection = (sectionKey, sectionData, sectionLevel = 0, parentPath = '') => {
            if (!sectionData || typeof sectionData !== 'object') return null;

            const indentClass = `ml-${sectionLevel * 2}`;
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
                            <div key={`${sectionId}-${idx}`} className="">
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
                    return courseObj ? courseObj : { code };
                })
                : [];
            const unitsCompleted = plansFilling[requirementId]?.unitsCompleted || 0;
            const unitsRequired = plansFilling[requirementId]?.unitsRequired || 0;
            const isComplete = unitsCompleted >= unitsRequired && unitsRequired > 0;
            const percent = unitsRequired > 0 ? Math.min(100, Math.round((unitsCompleted / unitsRequired) * 100)) : 0;
            const circleCirc = 2 * Math.PI * 18;
            const circleOffset = unitsRequired > 0 ? circleCirc * (1 - unitsCompleted / unitsRequired) : circleCirc;

            // Hover state for floating window
            const [showHover, setShowHover] = useState(false);
            const hoverTimeout = useRef();
            const handleMouseEnter = () => {
                clearTimeout(hoverTimeout.current);
                setShowHover(true);
            };
            const handleMouseLeave = () => {
                hoverTimeout.current = setTimeout(() => setShowHover(false), 150);
            };
            // Remove course from requirement handler
            const handleRemoveCourse = (courseCode) => {
                // Remove this course from this requirement, and move to Electives
                // Find the course in coursesTaken and update its planreq
                const idx = coursesTaken.findIndex(c => c && c.code === courseCode && (!c.isExcess));
                if (idx !== -1) {
                    // Remove this requirementId from planreq, add 'Electives' if not present
                    let planreqArr = coursesTaken[idx].planreq ? coursesTaken[idx].planreq.split(',').map(s => s.trim()) : [];
                    planreqArr = planreqArr.filter(req => req !== requirementId);
                    if (!planreqArr.includes('Electives')) planreqArr.push('Electives');
                    const updatedCourse = { ...coursesTaken[idx], planreq: planreqArr.join(', ') };
                    // Update state (this will trigger recomputePlanAssignments)
                    const newCourses = [...coursesTaken];
                    newCourses[idx] = updatedCourse;
                    setCoursesTaken(newCourses);
                }
            };

            return (
                <div key={subsectionId} className={`space-y-2`}>
                    <div className="flex items-start gap-1">
                        {/* Progress circle column - only show if not a plan selection */}
                        {!hasPlan && (
                            <div
                                 className="w-16 min-w-[48px] h-12 flex-shrink-0 flex items-center justify-center relative group"
                                 onMouseEnter={handleMouseEnter}
                                 onMouseLeave={handleMouseLeave}
                                 style={{ cursor: 'pointer', marginLeft: 0 }}
                            >
                                {/* Progress Circle */}
                                {isComplete ? (
                                    <div className="w-9 h-9 flex items-center justify-center bg-white rounded-full border-2 border-green-400 ">
                                        <img src={CompleteIcon} alt="Complete" className="w-7 h-7" />
                                    </div>
                                ) : (
                                    <svg width="36" height="36" viewBox="0 0 36 36" style={{ display: 'block', overflow: 'visible' }}>
                                        <circle cx="18" cy="18" r="18" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                                        <circle cx="18" cy="18" r="18" stroke="#3498f6" strokeWidth="4" fill="none" strokeDasharray={circleCirc} strokeDashoffset={circleOffset} style={{ transition: 'stroke-dashoffset 0.5s' }} />
                                        <text x="50%" y="50%" textAnchor="middle" dy="0.3em" fontSize="11" fill="#333">{unitsCompleted}/{unitsRequired}</text>
                                    </svg>
                                )}
                                {/* Floating window on hover */}
                                {showHover && assignedCourses.length > 0 && (
                                    <div
                                        className="absolute left-16 top-0 z-50 bg-white border border-gray-300 rounded shadow-lg p-2 min-w-[140px] flex flex-col gap-1"
                                        onMouseEnter={handleMouseEnter}
                                        onMouseLeave={handleMouseLeave}
                                        style={{ pointerEvents: 'auto' }}
                                    >
                                        <div className="font-semibold text-xs mb-1">Assigned Courses:</div>
                                        {assignedCourses.map((c, idx) => (
                                            <div key={c.code} className="flex items-center gap-1 text-xs">
                                                <span>{c.code}</span>
                                                <button className="text-red-500 hover:text-red-700 ml-1" onClick={() => handleRemoveCourse(c.code)}><FaTimes size={10} /></button>
                                            </div>
                                        ))}
                                    </div>
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
                        <div className="space-t-1">
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
                                {/* Left: Circular Progress */}
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
                                            // Find section keys
                                            const coreKey = Object.keys(responses[idx]).find(k => k.toLowerCase().includes('core'));
                                            const subPlanKey = Object.keys(responses[idx]).find(k => k.toLowerCase().includes('sub-plans'));
                                            const core = getSectionProgressFromFilling(idx, coreKey);
                                            const sub = getSectionProgressFromFilling(idx, subPlanKey);
                                            const electives = getElectivesProgressFromFilling(idx);
                                            return (
                                                <>
                                                    <div className='flex flex-row items-center gap-2'>
                                                        <span className='font-semibold'>1. Core</span>
                                                        <span className='text-gray-700'>{core.completed}/{core.required}</span>
                                                    </div>
                                                    <div className='flex flex-row items-center gap-2'>
                                                        <span className='font-semibold'>2. Sub-Plans</span>
                                                        <span className='text-gray-700'>{sub.completed}/{sub.required}</span>
                                                        {hasUnselectedSubPlans(idx) && (
                                                            <div className="relative group">
                                                                <img src="/info.svg" alt="info" className="w-4 h-4 text-gray-400 cursor-help" />
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                                    Select a sub-plan by clicking in Details
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className='flex flex-row items-center gap-2'>
                                                        <span className='font-semibold'>Electives</span>
                                                        <span className='text-gray-700'>{electives.completed}/{electives.required}</span>
                                                    </div>
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