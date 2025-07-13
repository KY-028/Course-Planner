import { useState, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { getPlanPrefix, processSection, clearPlanReq } from './courseFunctions';
import CompleteIcon from '/complete.svg';

// Component to display plan details in a formatted way
export default function PlanDetailsDisplay({ planData, planPrefix, sectionNames, plansFilling, coursesTaken, planIndex, setCoursesTaken, setPlansFilling, selectedPlanCombo, selectedSubPlans, setSelectedSubPlans, setCustomAssignments }) {
    // Track selected option for subplans
    const [showElectiveAssignment, setShowElectiveAssignment] = useState(null);
    const [assignmentPosition, setAssignmentPosition] = useState({ x: 0, y: 0 });

    const handleOptionChange = (planIndex, value) => {

        const prevSubPlan = selectedSubPlans[planIndex];

        // Update selected sub-plans state (as an array)
        setSelectedSubPlans(prev => {
            const arr = [...prev];
            if (value === "") {
                arr[planIndex] = null;
            } else {
                arr[planIndex] = value || null;
            }
            return arr;
        });

        // TODO: Add logic to update plansFilling, etc.
        setPlansFilling(prev => {
            const newPlansFilling = { ...prev };
            let planName = "";
            // Find the section that has a subplan
            for (const name of sectionNames[planIndex]) {
                if (planData[name] && planData[name].subsections) {
                    for (const subsec of planData[name].subsections) {
                        if (subsec.plan) {
                            planName = name + subsec.id;
                        }
                    }
                }
            }

            // Find the section with subplans
            Object.keys(planData).forEach(key => {
                if (planData[key].subsections) {
                    planData[key].subsections.forEach(subsection => {
                        if (subsection.plan) {
                            // Delete everything that begins with
                            Object.keys(newPlansFilling).forEach(k => {
                                if (k.startsWith(`${planPrefix}${key}`)) {
                                    console.log("Deleting starts with ", `${planPrefix}${key}`)
                                    delete newPlansFilling[k];
                                }
                            });
                            if (value) {
                                processSection(`${planPrefix}${key}${subsection.id}-${value}`, subsection.plan[value], newPlansFilling);
                                processSection(`${planPrefix}${key}`, planData[key], newPlansFilling);
                                delete newPlansFilling[`${planPrefix}${key}${subsection.id}`]
                            } else {
                                console.log("Value is none");
                                processSection(`${planPrefix}${key}`, planData[key], newPlansFilling);
                                console.log("Processed plansFilling:", newPlansFilling);
                            }
                        }
                    });
                }
            });
            return newPlansFilling;
        });

        // This should retrigger plan assignments
        setCoursesTaken(clearPlanReq(coursesTaken));
    };

    // Handle elective course click to show assignment options
    const handleElectiveClick = (course, event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Calculate position, ensuring the window doesn't go off-screen
        let x = rect.left;
        let y = rect.bottom + 5;

        // Adjust horizontal position if needed
        if (x + 400 > windowWidth) { // 400px is approximate width of the window
            x = windowWidth - 420;
        }

        // Adjust vertical position if needed
        if (y + 300 > windowHeight) { // 300px is max height of the window
            y = rect.top - 305;
        }

        setAssignmentPosition({ x, y });
        setShowElectiveAssignment(course);
    };

    // Check if a course fits a requirement
    const courseFitsRequirement = (course, requirementId) => {
        // Check if the course is already assigned to this requirement
        let requirement = requirementId.split("-");
        let id = requirement[1].charAt(requirement[1].length - 1);
        let subsection = requirement[1].slice(0, -1);
        console.log(requirement, id, subsection);
        if (requirement[1] && id) {
            // Go through each key in planData and see if subsection is part of it
            for (const key in planData) {
                if (planData[key].subsections && key.includes(subsection)) {
                    console.log("Checking subsection:", subsection, "in planData key:", key);
                    for (const item of planData[key].subsections) {
                        if (item.id && item.id === id) {
                            console.log("Found matching subsection with id:", id);
                            // Check if the course code is in the subsection's courses
                            if (item.courses && item.courses.some(c => c.code === course.code)) {
                                console.log("I found the course in the subsection:", subsection, "requirement", id);
                                return true;
                            }
                        }
                    }
                }
            }
        } else {
            return false;
        }
    };

    // Handle assigning a course to a requirement
    const handleAssignCourseToRequirement = (courseCode, requirementId) => {
        console.log("Button clicked to assign course:", courseCode, "to requirement:", requirementId);
        // Find the course in coursesTaken
        const courseIndex = coursesTaken.findIndex(c => c && c.code === courseCode);
        if (courseIndex === -1) return;

        // Find if course already has an assignment
        let existingAssignment = coursesTaken[courseIndex].planreq
            ? coursesTaken[courseIndex].planreq.split(',').map(s => s.trim()).filter(req => req !== 'Unassigned/Electives')
            : [];
        existingAssignment.push(requirementId);
        console.log("New existing assignment for course:", existingAssignment);

        // Update the course's planreq
        const updatedCourse = {
            ...coursesTaken[courseIndex],
            planreq: existingAssignment ? existingAssignment.join(', ') : requirementId
        };

        // Add this course to the custom assignments
        setCustomAssignments(prev => {
            const alreadyExists = prev.some(
                entry => entry.index === courseIndex
            );
            if (!alreadyExists || existingAssignment.length >= 2) {
                // If course doesn't exist in custom assignments or multiple requirements involved, add it
                return [...prev, { index: courseIndex, course: updatedCourse }];
            } else {
                // If course already exists in custom assignments,
                // First check if this course is supposed to be a requirement for that section
                if (courseFitsRequirement(updatedCourse, requirementId)) {
                    // If it fits, remove this course from custom assignments
                    return prev.filter(entry => entry.index !== courseIndex);
                } else {
                    return [...prev, { index: courseIndex, course: updatedCourse }]
                }
            }
        });

        // Update plansFilling - add the course to the requirement
        const newPlansFilling = { ...plansFilling };
        if (!newPlansFilling[requirementId]) {
            newPlansFilling[requirementId] = {
                unitsRequired: 0,
                unitsCompleted: 0,
                courses: []
            };
        }

        // Add course to the requirement if not already present
        if (!newPlansFilling[requirementId].courses.includes(courseCode)) {
            newPlansFilling[requirementId].courses.push(courseCode);
            // Update units completed (assuming 3 units per course - adjust as needed)
            newPlansFilling[requirementId].unitsCompleted += (parseFloat(updatedCourse.units) || 3);
        }
        // // If this is a double major, also add to the second requirement
        // if (selectedPlanCombo === 1 && secondReqId && !newPlansFilling[secondReqId]) {
        //     newPlansFilling[secondReqId].courses.push(courseCode);
        //     newPlansFilling[secondReqId].unitsCompleted += (updatedCourse.units || 3);
        // }

        // Update coursesTaken
        const newCoursesTaken = [...coursesTaken];
        newCoursesTaken[courseIndex] = updatedCourse;
        setCoursesTaken(newCoursesTaken);

        setPlansFilling(newPlansFilling);
        setShowElectiveAssignment(null);
    };

    // Get all requirements for this plan that start with the plan prefix
    const planRequirements = Object.entries(plansFilling)
        .filter(([key]) => key.startsWith(planPrefix))
        .map(([key, value]) => {
            // Format the title more nicely
            let title = key.replace(planPrefix, '');
            // Add spaces before capital letters
            title = title.replace(/([A-Z])/g, ' $1').trim();
            // Capitalize first letter
            title = title.charAt(0).toUpperCase() + title.slice(1);

            return {
                id: key,
                title: title,
                unitsRequired: value.unitsRequired,
                unitsCompleted: value.unitsCompleted,
                courses: value.courses || []
            };
        });

    // Handle click outside to close assignment window
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showElectiveAssignment && !event.target.closest('.assignment-window')) {
                setShowElectiveAssignment(null);
            }
        };

        if (showElectiveAssignment) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showElectiveAssignment]);

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
                        {sectionKey}
                    </div>
                    {sectionData.subsections.map((subsection, idx) => (
                        <div key={`${sectionId}-${idx}`} className="">
                            {renderSubsection(subsection, sectionLevel + 1, currentPath, sectionKey, setCustomAssignments)}
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    };

    const renderSubsection = (subsection, level = 0, parentPath = '', sectionKey = '') => {
        return (
            <PlanSubsection
                subsection={subsection}
                level={level}
                parentPath={parentPath}
                sectionKey={sectionKey}
                planIndex={planIndex}
                planData={planData}
                selectedPlanCombo={selectedPlanCombo}
                plansFilling={plansFilling}
                coursesTaken={coursesTaken}
                setCoursesTaken={setCoursesTaken}
                selectedSubPlans={selectedSubPlans}
                handleOptionChange={handleOptionChange}
                renderSection={renderSection}
                setCustomAssignments={setCustomAssignments}
            />
        );
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            {sectionNames[planIndex].map((sectionKey, sectionIdx) => {
                return renderSection(sectionKey, planData[sectionKey]);
            })}
            {plansFilling["Unassigned/Electives"] && (
                <div className={`space-y-2 mt-4`}>
                    <div className="font-semibold text-gray-800">
                        Unassigned/Electives
                    </div>
                    {(() => {
                        const electiveCourses = coursesTaken.filter(course => course !== null && (!course.planreq || course.planreq.includes('Electives') || course.planreq === null));

                        if (electiveCourses.length === 0) {
                            return (
                                <div className="text-sm text-gray-500 italic">
                                    No elective courses available
                                </div>
                            );
                        }

                        return electiveCourses.map((course, idx) => (
                            <button
                                key={`course-${idx}`}
                                onClick={(e) => handleElectiveClick(course, e)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors duration-150 text-left w-full"
                            >
                                {course.code} - {course.title}
                            </button>
                        ));
                    })()}
                </div>
            )}
            <div className={`space-y-2 mt-4`}>
                <div className="font-semibold text-gray-800">
                    Courses Assigned to Other Plans
                </div>
                {(() => {
                    const otherCourses = coursesTaken.filter(course => course !== null
                        && course.planreq !== 'Unassigned/Electives'
                        && course.planreq && !course.planreq.includes(planPrefix));

                    if (otherCourses.length === 0) {
                        return (
                            <div className="text-sm text-gray-500 italic">
                                No courses from other plan(s)
                            </div>
                        );
                    }

                    return otherCourses.map((course, idx) => {
                        const courseWithAdditional = { ...course, additional: ' more requirements' };
                        return (
                            <button
                                key={`course-${idx}`}
                                onClick={(e) => handleElectiveClick(courseWithAdditional, e)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors duration-150 text-left w-full"
                            >
                                {courseWithAdditional.code} - {courseWithAdditional.title}
                            </button>
                        );
                    });
                })()}
            </div>

            {/* Floating assignment window */}
            {showElectiveAssignment && (
                <div
                    className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md assignment-window"
                    style={{
                        left: assignmentPosition.x,
                        top: assignmentPosition.y,
                        maxHeight: '300px',
                        overflowY: 'auto'
                    }}
                >
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-800">
                            Assign {showElectiveAssignment.code} to{showElectiveAssignment.additional || ''}:
                        </h4>
                        <button
                            onClick={() => setShowElectiveAssignment(null)}
                            className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-2">
                        {planRequirements.length === 0 ? (
                            <div className="text-gray-500 text-sm italic">
                                No plan requirements available for assignment
                            </div>
                        ) : (
                            planRequirements.map((requirement) => {
                                const isComplete = requirement.unitsCompleted >= requirement.unitsRequired;
                                const isNearlyComplete = requirement.unitsCompleted >= requirement.unitsRequired * 0.8;

                                return (
                                    <button
                                        key={requirement.id}
                                        onClick={() => handleAssignCourseToRequirement(showElectiveAssignment.code, requirement.id)}
                                        className={`w-full text-left p-2 rounded border transition-colors ${isComplete
                                            ? 'bg-green-50 border-green-300 hover:bg-green-100'
                                            : isNearlyComplete
                                                ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                            }`}
                                    >
                                        <div className={`font-medium ${isComplete ? 'text-green-800' : 'text-gray-800'
                                            }`}>
                                            {requirement.title}
                                            {isComplete && <span className="ml-2 text-green-600">✓ Complete</span>}
                                        </div>
                                        <div className={`text-sm ${isComplete ? 'text-green-600' : 'text-gray-600'
                                            }`}>
                                            {requirement.unitsCompleted}/{requirement.unitsRequired} units
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

function PlanSubsection({
    subsection,
    level,
    parentPath,
    sectionKey,
    planIndex,
    planData,
    selectedPlanCombo,
    plansFilling,
    coursesTaken,
    setCoursesTaken,
    selectedSubPlans,
    handleOptionChange,
    renderSection,
    setCustomAssignments
}) {
    const currentPath = parentPath ? `${parentPath}-${subsection.id}` : subsection.id;
    const hasCourses = subsection.courses && subsection.courses.length > 0;
    const hasPlan = subsection.plan && Object.keys(subsection.plan).length > 0;
    const hasRequirement = subsection.requirement && (Array.isArray(subsection.requirement) ? subsection.requirement.length > 0 : subsection.requirement);

    // Compute the plan prefix for this plan
    const planPrefix = getPlanPrefix(planIndex, planData, selectedPlanCombo);

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
        if (idx === -1) return;

        // Remove this requirementId from planreq, add 'Electives' if not present
        let planreqArr = coursesTaken[idx].planreq ? coursesTaken[idx].planreq.split(',').map(s => s.trim()) : [];
        planreqArr = planreqArr.filter(req => req !== requirementId);
        if (!planreqArr.includes(`Unassigned/Electives`) && planreqArr.length === 0) planreqArr.push(`Unassigned/Electives`);
        const updatedCourse = { ...coursesTaken[idx], planreq: planreqArr.join(', ') };

        // Update coursesTaken
        const newCourses = [...coursesTaken];
        newCourses[idx] = updatedCourse;
        setCoursesTaken(newCourses);

        // Update customAssignments
        setCustomAssignments(prev => {
            const alreadyCustom = prev.some(entry => entry.index === idx);
            // If already custom, and planreqArr includes `Unassigned/Electives`, remove it
            if (alreadyCustom && planreqArr.length === 1 && planreqArr.includes(`Unassigned/Electives`)) {
                // Remove from customAssignments
                return prev.filter(entry => entry.index !== idx);
            } else if (planreqArr.length !== 1) {
                // Some other requirement is present, update it
                return prev.map(entry => {
                    if (entry.index === idx) {
                        return { ...entry, course: updatedCourse };
                    }
                    return entry;
                });
            } else {
                // Not custom yet, and only an elective, add it
                return [
                    ...prev,
                    {
                        index: idx,
                        course: { ...updatedCourse, planreq: `Unassigned/Electives` }
                    }
                ];
            }
        });
    };

    return (
        <div className={`space-y-2`}>
            <div className="flex items-start gap-1">
                {/* Progress circle column - only show if not a plan selection */}
                {!hasPlan && (
                    <div
                        className="relative w-16 min-w-[48px] h-12 flex-shrink-0 flex items-center justify-center"
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
                    {/* Render subtitle if exists */}
                    {subsection.subtitle && (
                        <div className="text-sm text-gray-500">
                            {subsection.subtitle}
                        </div>
                    )}

                    {/* Render courses and requirements */}
                    {(hasCourses || hasRequirement) && (
                        <div className="space-t-1">
                            {hasCourses && subsection.courses.map((course, idx) => (
                                <div key={`course-${idx}`} className="text-sm text-gray-600">
                                    {course.code === 'Combination' ? (
                                        <div>
                                            <span className="font-medium text-gray-500">Combination:</span>
                                            {course.courses.map((subCourse, subIdx) => (
                                                <div key={subIdx} className="ml-4 text-gray-600">
                                                    {subCourse.code} - {subCourse.title}
                                                </div>
                                            ))}
                                        </div>
                                    ) : course.code === 'One of' ? (
                                        <div>
                                            <span className="font-medium text-gray-500">One of:</span>
                                            {course.courses.map((subCourse, subIdx) => (
                                                <div key={subIdx} className="ml-4 text-gray-600">
                                                    {subCourse.code} - {subCourse.title}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div>
                                            {course.code} - {course.title}
                                        </div>
                                    )}
                                </div>
                            ))}
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
                                value={selectedSubPlans[planIndex] || ''}
                                onChange={(e) => handleOptionChange(planIndex, e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                                <option value="">Select an option...</option>
                                {Object.entries(subsection.plan).map(([optionKey, optionData]) => (
                                    <option key={optionKey} value={optionKey}>
                                        {optionData.title}
                                    </option>
                                ))}
                            </select>

                            {selectedSubPlans[planIndex] && (
                                <div className="mt-2">
                                    {renderSection(
                                        sectionKey + subsection.id + '-' + selectedSubPlans[planIndex],
                                        subsection.plan[selectedSubPlans[planIndex]],
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