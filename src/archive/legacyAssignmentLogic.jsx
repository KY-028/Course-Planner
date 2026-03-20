/**
 * Legacy assignment logic – not used in the main app.
 * Assignment is now done via POST /api/assign (see assignApi.js and SelectPlan).
 * Kept for reference only; this file is not imported anywhere.
 */
import { getPlanPrefix } from '/src/components/courseFunctions';

// coursesTaken is an array of courses
// plans is an array of plans (objects)
export function fillPlanReq(newCourse, coursesTaken, plans, plansFilling, selectedPlanCombo, selectedSubPlans, originalCoursesTaken = null) {
    if (!newCourse || !newCourse.code || !plans || plans.length === 0) {
        return { coursesTaken, plansFilling };
    }

    const courseCode = newCourse.code;
    let updatedCoursesTaken = [...coursesTaken];
    let updatedPlansFilling = { ...plansFilling };
    let assignedRequirements = [];
    let firstAssignmentType = null; // 'supporting' or 'non-supporting'
    let firstAssignmentPlanPrefix = null;
    let firstAssignmentRequirementId = null;
    const allCourses = originalCoursesTaken || coursesTaken;

    // Helper to assign course to a requirement in a plan
    function assignInPlan(plan, planPrefix, selectedSubPlans, restrictToSupporting = null) {
        const sectionOrder = Object.keys(plan).filter(key => !['title', 'electives', 'units'].includes(key)).sort();
        for (const sectionKey of sectionOrder) {
            const sectionData = plan[sectionKey];
            const isSupportingSection = sectionKey.toLowerCase().includes('supporting');
            if (restrictToSupporting === true && !isSupportingSection) continue;
            if (!sectionData.subsections) continue;
            for (const subsection of sectionData.subsections) {
                const requirementId = `${planPrefix}${sectionKey}${subsection.id}`;
                const requirementLabel = `${planPrefix}${sectionKey}${subsection.id}`;
                // Skip if this requirement is already complete
                if (updatedPlansFilling[requirementId] && updatedPlansFilling[requirementId].unitsCompleted >= updatedPlansFilling[requirementId].unitsRequired) {
                    continue;
                }
                // Check if course matches this requirement
                if (subsection.courses) {
                    for (const course of subsection.courses) {
                        // Handle combination
                        if (course.code === 'Combination' && Array.isArray(course.courses)) {
                            const comboCodes = course.courses.map(c => c.code);
                            if (comboCodes.includes(courseCode)) {
                                const allPresent = comboCodes.every(code =>
                                    updatedCoursesTaken.some(c => c && c.code === code)
                                );
                                if (allPresent) {
                                    // Calculate total units for the combination
                                    const comboUnits = course.courses.reduce((sum, c) => sum + (c.units || 0), 0);
                                    const unitsRequired = updatedPlansFilling[requirementId]?.unitsRequired || comboUnits;
                                    let unitsAlreadyAssigned = updatedPlansFilling[requirementId]?.unitsCompleted || 0;
                                    let unitsLeft = Math.max(0, unitsRequired - unitsAlreadyAssigned);
                                    // For each course in the combination
                                    comboCodes.forEach(code => {
                                        const comboCourseObj = course.courses.find(c => c.code === code);
                                        const courseUnits = parseFloat(comboCourseObj?.units) || 0;
                                        let excessUnits = updatedPlansFilling[requirementId]?.unitsCompleted + courseUnits - unitsRequired || 0;
                                        // Assign to requirement
                                        if (!updatedPlansFilling[requirementId]) {
                                            updatedPlansFilling[requirementId] = {
                                                unitsRequired: unitsRequired,
                                                unitsCompleted: 0,
                                                courses: []
                                            };
                                        }
                                        if (!updatedPlansFilling[requirementId].courses.includes(code)) {
                                            updatedPlansFilling[requirementId].courses.push(code);
                                        }
                                        updatedPlansFilling[requirementId].unitsCompleted += courseUnits;
                                        // Assign planreq for this requirement
                                        const idx = updatedCoursesTaken.findIndex(c => c && c.code === code);
                                        if (idx !== -1) {
                                            updatedCoursesTaken[idx] = {
                                                ...updatedCoursesTaken[idx],
                                                planreq: updatedCoursesTaken[idx].planreq
                                                    ? [...new Set([...updatedCoursesTaken[idx].planreq.split(',').map(s => s.trim()), requirementId])].join(', ')
                                                    : requirementId
                                            };
                                        }
                                        // Handle excess units
                                        if (excessUnits > 0) {
                                            // Don't need to be handled anymore in this logic
                                        }
                                    });
                                    assignedRequirements.push(requirementId);
                                    if (!firstAssignmentType) {
                                        firstAssignmentType = isSupportingSection ? 'supporting' : 'non-supporting';
                                        firstAssignmentPlanPrefix = planPrefix;
                                        firstAssignmentRequirementId = requirementId;
                                    }
                                    return true;
                                }
                            }
                        } else if (course.code === 'One of' && Array.isArray(course.courses)) {
                            for (const subCourse of course.courses) {
                                if (subCourse.code !== courseCode) continue;
                                // Check if the other options already assigned to this requirementId
                                if (updatedPlansFilling[requirementId] && updatedPlansFilling[requirementId].courses.includes(subCourse.code)) continue;
                                const courseUnits = parseFloat(course.units) || 0;
                                const unitsRequired = updatedPlansFilling[requirementId]?.unitsRequired || courseUnits;
                                let excessUnits = updatedPlansFilling[requirementId]?.unitsCompleted + courseUnits - unitsRequired || 0;
                                // Assign to requirement
                                if (!updatedPlansFilling[requirementId]) {
                                    updatedPlansFilling[requirementId] = {
                                        unitsRequired: unitsRequired,
                                        unitsCompleted: 0,
                                        courses: []
                                    };
                                }
                                if (!updatedPlansFilling[requirementId].courses.includes(courseCode)) {
                                    updatedPlansFilling[requirementId].courses.push(courseCode);
                                }
                                updatedPlansFilling[requirementId].unitsCompleted += courseUnits;
                                // Only assign if not already assigned
                                const idx = updatedCoursesTaken.findIndex(c => c && c.code === courseCode && (!c.planreq || !c.planreq.split(',').includes(requirementId)));
                                if (idx !== -1) {
                                    updatedCoursesTaken[idx] = {
                                        ...updatedCoursesTaken[idx],
                                        planreq: updatedCoursesTaken[idx].planreq
                                            ? [...new Set([...updatedCoursesTaken[idx].planreq.split(',').map(s => s.trim()), requirementId])].join(', ')
                                            : requirementId
                                    };
                                }
                                assignedRequirements.push(requirementId);
                                if (!firstAssignmentType) {
                                    firstAssignmentType = isSupportingSection ? 'supporting' : 'non-supporting';
                                    firstAssignmentPlanPrefix = planPrefix;
                                    firstAssignmentRequirementId = requirementId;
                                }
                                return true;
                            }
                        } else if (course.code === courseCode) {
                            const courseUnits = parseFloat(course.units) || 0;
                            const unitsRequired = updatedPlansFilling[requirementId]?.unitsRequired || courseUnits;
                            let excessUnits = updatedPlansFilling[requirementId]?.unitsCompleted + courseUnits - unitsRequired || 0;
                            // Assign to requirement
                            if (!updatedPlansFilling[requirementId]) {
                                updatedPlansFilling[requirementId] = {
                                    unitsRequired: unitsRequired,
                                    unitsCompleted: 0,
                                    courses: []
                                };
                            }
                            if (!updatedPlansFilling[requirementId].courses.includes(courseCode)) {
                                updatedPlansFilling[requirementId].courses.push(courseCode);
                            }
                            updatedPlansFilling[requirementId].unitsCompleted += courseUnits;
                            // Only assign if not already assigned
                            const idx = updatedCoursesTaken.findIndex(c => c && c.code === courseCode && (!c.planreq || !c.planreq.split(',').includes(requirementId)));
                            if (idx !== -1) {
                                updatedCoursesTaken[idx] = {
                                    ...updatedCoursesTaken[idx],
                                    planreq: updatedCoursesTaken[idx].planreq
                                        ? [...new Set([...updatedCoursesTaken[idx].planreq.split(',').map(s => s.trim()), requirementId])].join(', ')
                                        : requirementId
                                };
                            }
                            assignedRequirements.push(requirementId);
                            if (!firstAssignmentType) {
                                firstAssignmentType = isSupportingSection ? 'supporting' : 'non-supporting';
                                firstAssignmentPlanPrefix = planPrefix;
                                firstAssignmentRequirementId = requirementId;
                            }
                            return true;
                        }
                    }
                }
                // Check if course is part of a plan
                if (subsection.plan) {
                    for (const planName of selectedSubPlans) {
                        if (subsection.plan[planName]) {
                            // Check if course fulfills ANY requirements in this plan
                            if (subsection.plan[planName].subsections) {
                                for (const plansubsection of subsection.plan[planName].subsections) {
                                    const planReqId = `${planPrefix}${sectionKey}${subsection.id}-${planName}${plansubsection.id}`
                                    if (updatedPlansFilling[planReqId] && updatedPlansFilling[planReqId].unitsCompleted >= updatedPlansFilling[planReqId].unitsRequired) {
                                        continue;
                                    }
                                    // Check if course matches this requirement
                                    if (plansubsection.courses) {
                                        for (const course of plansubsection.courses) {
                                            // Handle combination
                                            if (course.code === 'Combination' && Array.isArray(course.courses)) {
                                                const comboCodes = course.courses.map(c => c.code);
                                                if (comboCodes.includes(courseCode)) {
                                                    const allPresent = comboCodes.every(code =>
                                                        updatedCoursesTaken.some(c => c && c.code === code)
                                                    );
                                                    if (allPresent) {
                                                        const comboUnits = course.courses.reduce((sum, c) => sum + (c.units || 0), 0);
                                                        const unitsRequired = updatedPlansFilling[planReqId]?.unitsRequired || comboUnits;
                                                        comboCodes.forEach(code => {
                                                            const comboCourseObj = course.courses.find(c => c.code === code);
                                                            const courseUnits = parseFloat(comboCourseObj?.units) || 0;
                                                            if (!updatedPlansFilling[planReqId]) {
                                                                updatedPlansFilling[planReqId] = {
                                                                    unitsRequired: unitsRequired,
                                                                    unitsCompleted: 0,
                                                                    courses: []
                                                                };
                                                            }
                                                            if (!updatedPlansFilling[planReqId].courses.includes(code)) {
                                                                updatedPlansFilling[planReqId].courses.push(code);
                                                            }
                                                            updatedPlansFilling[planReqId].unitsCompleted += courseUnits;
                                                            const idx = updatedCoursesTaken.findIndex(c => c && c.code === code);
                                                            if (idx !== -1) {
                                                                updatedCoursesTaken[idx] = {
                                                                    ...updatedCoursesTaken[idx],
                                                                    planreq: updatedCoursesTaken[idx].planreq
                                                                        ? [...new Set([...updatedCoursesTaken[idx].planreq.split(',').map(s => s.trim()), planReqId])].join(', ')
                                                                        : planReqId
                                                                };
                                                            }
                                                        });
                                                        assignedRequirements.push(planReqId);
                                                        if (!firstAssignmentType) {
                                                            firstAssignmentType = isSupportingSection ? 'supporting' : 'non-supporting';
                                                            firstAssignmentPlanPrefix = planPrefix;
                                                            firstAssignmentRequirementId = planReqId;
                                                        }
                                                        return true;
                                                    }
                                                }
                                            } else if (course.code === 'One of' && Array.isArray(course.courses)) {
                                                for (const subCourse of course.courses) {
                                                    if (subCourse.code !== courseCode) continue;
                                                    if (updatedPlansFilling[requirementId] && updatedPlansFilling[requirementId].courses.includes(subCourse.code)) continue;
                                                    const courseUnits = parseFloat(course.units) || 0;
                                                    const unitsRequired = updatedPlansFilling[requirementId]?.unitsRequired || courseUnits;
                                                    if (!updatedPlansFilling[requirementId]) {
                                                        updatedPlansFilling[requirementId] = {
                                                            unitsRequired: unitsRequired,
                                                            unitsCompleted: 0,
                                                            courses: []
                                                        };
                                                    }
                                                    if (!updatedPlansFilling[requirementId].courses.includes(courseCode)) {
                                                        updatedPlansFilling[requirementId].courses.push(courseCode);
                                                    }
                                                    updatedPlansFilling[requirementId].unitsCompleted += courseUnits;
                                                    const idx = updatedCoursesTaken.findIndex(c => c && c.code === courseCode && (!c.planreq || !c.planreq.split(',').includes(requirementId)));
                                                    if (idx !== -1) {
                                                        updatedCoursesTaken[idx] = {
                                                            ...updatedCoursesTaken[idx],
                                                            planreq: updatedCoursesTaken[idx].planreq
                                                                ? [...new Set([...updatedCoursesTaken[idx].planreq.split(',').map(s => s.trim()), requirementId])].join(', ')
                                                                : requirementId
                                                        };
                                                    }
                                                    assignedRequirements.push(requirementId);
                                                    if (!firstAssignmentType) {
                                                        firstAssignmentType = isSupportingSection ? 'supporting' : 'non-supporting';
                                                        firstAssignmentPlanPrefix = planPrefix;
                                                        firstAssignmentRequirementId = requirementId;
                                                    }
                                                    return true;
                                                }
                                            } else if (course.code === courseCode) {
                                                const courseUnits = parseFloat(course.units) || 0;
                                                const unitsRequired = updatedPlansFilling[planReqId]?.unitsRequired || courseUnits;
                                                if (!updatedPlansFilling[planReqId]) {
                                                    updatedPlansFilling[planReqId] = {
                                                        unitsRequired: unitsRequired,
                                                        unitsCompleted: 0,
                                                        courses: []
                                                    };
                                                }
                                                if (!updatedPlansFilling[planReqId].courses.includes(courseCode)) {
                                                    updatedPlansFilling[planReqId].courses.push(courseCode);
                                                }
                                                updatedPlansFilling[planReqId].unitsCompleted += courseUnits;
                                                const idx = updatedCoursesTaken.findIndex(c => c && c.code === courseCode && (!c.planreq || !c.planreq.split(',').includes(planReqId)));
                                                if (idx !== -1) {
                                                    updatedCoursesTaken[idx] = {
                                                        ...updatedCoursesTaken[idx],
                                                        planreq: updatedCoursesTaken[idx].planreq
                                                            ? [...new Set([...updatedCoursesTaken[idx].planreq.split(',').map(s => s.trim()), planReqId])].join(', ')
                                                            : planReqId
                                                    };
                                                }
                                                assignedRequirements.push(planReqId);
                                                if (!firstAssignmentType) {
                                                    firstAssignmentType = isSupportingSection ? 'supporting' : 'non-supporting';
                                                    firstAssignmentPlanPrefix = planPrefix;
                                                    firstAssignmentRequirementId = planReqId;
                                                }
                                                return true;
                                            }
                                        }
                                    }
                                }

                            } else {
                                for (const [thatSectionKey, thatSectionObj] of Object.entries(subsection.plan[planName])) {
                                    if (
                                        thatSectionObj &&
                                        typeof thatSectionObj === 'object' &&
                                        Array.isArray(thatSectionObj.subsections)
                                    ) {
                                        for (const thatSubsection of thatSectionObj.subsections) {
                                            const planReqId = `${planPrefix}${sectionKey}${subsection.id}-${planName}-${thatSectionKey}${thatSubsection.id}`;
                                            if (
                                                updatedPlansFilling[planReqId] &&
                                                updatedPlansFilling[planReqId].unitsCompleted < updatedPlansFilling[planReqId].unitsRequired &&
                                                thatSubsection.courses
                                            ) {
                                                for (const course of thatSubsection.courses) {
                                                    if (course.code === 'Combination' && Array.isArray(course.courses)) {
                                                        const comboCodes = course.courses.map(c => c.code);
                                                        if (comboCodes.includes(courseCode)) {
                                                            const allPresent = comboCodes.every(code =>
                                                                updatedCoursesTaken.some(c => c && c.code === code)
                                                            );
                                                            if (allPresent) {
                                                                const comboUnits = course.courses.reduce((sum, c) => sum + (c.units || 0), 0);
                                                                const unitsRequired = updatedPlansFilling[planReqId]?.unitsRequired || comboUnits;
                                                                comboCodes.forEach(code => {
                                                                    const comboCourseObj = course.courses.find(c => c.code === code);
                                                                    const courseUnits = parseFloat(comboCourseObj?.units) || 0;
                                                                    if (!updatedPlansFilling[planReqId]) {
                                                                        updatedPlansFilling[planReqId] = {
                                                                            unitsRequired: unitsRequired,
                                                                            unitsCompleted: 0,
                                                                            courses: []
                                                                        };
                                                                    }
                                                                    if (!updatedPlansFilling[planReqId].courses.includes(code)) {
                                                                        updatedPlansFilling[planReqId].courses.push(code);
                                                                    }
                                                                    updatedPlansFilling[planReqId].unitsCompleted += courseUnits;
                                                                    const idx = updatedCoursesTaken.findIndex(c => c && c.code === code);
                                                                    if (idx !== -1) {
                                                                        updatedCoursesTaken[idx] = {
                                                                            ...updatedCoursesTaken[idx],
                                                                            planreq: updatedCoursesTaken[idx].planreq
                                                                                ? [...new Set([...updatedCoursesTaken[idx].planreq.split(',').map(s => s.trim()), planReqId])].join(', ')
                                                                                : planReqId
                                                                        };
                                                                    }
                                                                });
                                                                assignedRequirements.push(planReqId);
                                                                if (!firstAssignmentType) {
                                                                    firstAssignmentType = isSupportingSection ? 'supporting' : 'non-supporting';
                                                                    firstAssignmentPlanPrefix = planPrefix;
                                                                    firstAssignmentRequirementId = planReqId;
                                                                }
                                                                return true;
                                                            }
                                                        }
                                                    } else if (course.code === 'One of' && Array.isArray(course.courses)) {
                                                        for (const subCourse of course.courses) {
                                                            if (subCourse.code !== courseCode) continue;
                                                            if (updatedPlansFilling[planReqId] && updatedPlansFilling[planReqId].courses.includes(subCourse.code)) continue;
                                                            const courseUnits = parseFloat(course.units) || 0;
                                                            const unitsRequired = updatedPlansFilling[planReqId]?.unitsRequired || courseUnits;
                                                            if (!updatedPlansFilling[planReqId]) {
                                                                updatedPlansFilling[planReqId] = {
                                                                    unitsRequired: unitsRequired,
                                                                    unitsCompleted: 0,
                                                                    courses: []
                                                                };
                                                            }
                                                            if (!updatedPlansFilling[planReqId].courses.includes(courseCode)) {
                                                                updatedPlansFilling[planReqId].courses.push(courseCode);
                                                            }
                                                            updatedPlansFilling[planReqId].unitsCompleted += courseUnits;
                                                            const idx = updatedCoursesTaken.findIndex(c => c && c.code === courseCode && (!c.planreq || !c.planreq.split(',').includes(planReqId)));
                                                            if (idx !== -1) {
                                                                updatedCoursesTaken[idx] = {
                                                                    ...updatedCoursesTaken[idx],
                                                                    planreq: updatedCoursesTaken[idx].planreq
                                                                        ? [...new Set([...updatedCoursesTaken[idx].planreq.split(',').map(s => s.trim()), planReqId])].join(', ')
                                                                        : planReqId
                                                                };
                                                            }
                                                            assignedRequirements.push(planReqId);
                                                            if (!firstAssignmentType) {
                                                                firstAssignmentType = isSupportingSection ? 'supporting' : 'non-supporting';
                                                                firstAssignmentPlanPrefix = planPrefix;
                                                                firstAssignmentRequirementId = planReqId;
                                                            }
                                                            return true;
                                                        }
                                                    } else if (course.code === courseCode) {
                                                        const courseUnits = parseFloat(course.units) || 0;
                                                        const unitsRequired = updatedPlansFilling[planReqId]?.unitsRequired || courseUnits;
                                                        if (!updatedPlansFilling[planReqId].courses.includes(courseCode)) {
                                                            updatedPlansFilling[planReqId].courses.push(courseCode);
                                                        }
                                                        updatedPlansFilling[planReqId].unitsCompleted += courseUnits;
                                                        const idx = updatedCoursesTaken.findIndex(c => c && c.code === courseCode && (!c.planreq || !c.planreq.split(', ').includes(planReqId)));
                                                        if (idx !== -1) {
                                                            updatedCoursesTaken[idx] = {
                                                                ...updatedCoursesTaken[idx],
                                                                planreq: updatedCoursesTaken[idx].planreq
                                                                    ? [...new Set([...updatedCoursesTaken[idx].planreq.split(',').map(s => s.trim()), planReqId])].join(', ')
                                                                    : planReqId
                                                            };
                                                        }
                                                        assignedRequirements.push(planReqId);
                                                        if (!firstAssignmentType) {
                                                            firstAssignmentType = isSupportingSection ? 'supporting' : 'non-supporting';
                                                            firstAssignmentPlanPrefix = planPrefix;
                                                            firstAssignmentRequirementId = planReqId;
                                                        }
                                                        return true;
                                                    }
                                                }
                                            }
                                        };
                                    }
                                };
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    // 1. First pass: assign to the first matching requirement in the first plan (any section)
    let assigned = false;
    for (let planIndex = 0; planIndex < plans.length; planIndex++) {
        const plan = plans[planIndex];
        if (!plan) continue;
        const planPrefix = getPlanPrefix(planIndex, plan, selectedPlanCombo);
        if (assignInPlan(plan, planPrefix, selectedSubPlans, null)) {
            assigned = true;
            break;
        }
    }

    // 2. Cross-plan logic
    if (assigned && firstAssignmentType) {
        for (let planIndex = 0; planIndex < plans.length; planIndex++) {
            const plan = plans[planIndex];
            if (!plan) continue;
            const planPrefix = getPlanPrefix(planIndex, plan, selectedPlanCombo);
            if (planPrefix === firstAssignmentPlanPrefix) continue;
            assignInPlan(plan, planPrefix, selectedSubPlans, firstAssignmentType === 'supporting' ? false : true);
        }
    }

    // If no assignment found in any plan, assign as "Electives"
    if (assignedRequirements.length === 0) {
        assignedRequirements.push("Unassigned/Electives");
        if (!updatedPlansFilling["Unassigned/Electives"]) {
            updatedPlansFilling["Unassigned/Electives"] = {
                unitsRequired: 0,
                unitsCompleted: 0,
                courses: []
            };
        }
        if (!updatedPlansFilling["Unassigned/Electives"].courses.includes(courseCode)) {
            updatedPlansFilling["Unassigned/Electives"].courses.push(courseCode);
            updatedPlansFilling["Unassigned/Electives"].unitsCompleted += parseFloat(newCourse.units) || 0;
        }
    }

    const courseIndex = updatedCoursesTaken.findIndex(course => course && course.code === courseCode);
    if (courseIndex !== -1) {
        updatedCoursesTaken[courseIndex] = {
            ...updatedCoursesTaken[courseIndex],
            planreq: assignedRequirements.join(', ')
        };
    }

    return { coursesTaken: updatedCoursesTaken, plansFilling: updatedPlansFilling };
}

export function recomputePlanAssignments(coursesTaken, plans, selectedPlanCombo, customAssignments, setCustomAssignments, curPlansFilling, selectedSubPlans, setCoursesTaken) {
    let plansFilling = Object.fromEntries(
        Object.entries(curPlansFilling).map(([req, value]) => [
            req,
            { ...value, unitsCompleted: 0, courses: [] }
        ])
    );

    let updatedCoursesTaken = coursesTaken.map(course => course ? { ...course, planreq: null } : null);
    if (customAssignments && Array.isArray(customAssignments)) {
        customAssignments = customAssignments.filter(customCourse => {
            if (!customCourse || typeof customCourse.index !== "number" || !customCourse.course) return false;
            const courseCode = customCourse.course.code;
            return updatedCoursesTaken.some(c => c && c.code === courseCode);
        });
        for (const customCourse of customAssignments) {
            if (!customCourse || typeof customCourse.index !== "number" || !customCourse.course) continue;
            const { code, planreq, units } = customCourse.course;
            if (updatedCoursesTaken[customCourse.index]) {
                updatedCoursesTaken[customCourse.index] = {
                    ...updatedCoursesTaken[customCourse.index],
                    planreq: planreq || null
                };
            }
            if (planreq) {
                const requirementIds = planreq.split(',').map(s => s.trim());
                for (const requirementId of requirementIds) {
                    if (!plansFilling[requirementId]) {
                        setCoursesTaken(prev =>
                            prev.map((c, idx) =>
                                idx === customCourse.index ? { ...c, planreq: null } : c
                            )
                        );
                        customAssignments = customAssignments.filter((_, idx) => idx !== customCourse.index);
                    } else {
                        if (!plansFilling[requirementId].courses.includes(code)) {
                            plansFilling[requirementId].courses.push(code);
                            plansFilling[requirementId].unitsCompleted += (parseFloat(units) || 0);
                        }
                    }
                }
            }
        }
        setCustomAssignments(customAssignments);
    }

    for (let i = 0; i < updatedCoursesTaken.length; i++) {
        const course = updatedCoursesTaken[i];
        if (!course || !course.code || course.planreq !== null) continue;
        const result = fillPlanReq(course, updatedCoursesTaken, plans, plansFilling, selectedPlanCombo, selectedSubPlans, coursesTaken);
        updatedCoursesTaken = result.coursesTaken;
        plansFilling = result.plansFilling;
    }
    return { coursesTaken: updatedCoursesTaken, plansFilling };
}

export function processAllCourses(coursesTaken, plans, plansFilling, selectedPlanCombo, selectedSubPlans) {
    if (!coursesTaken || !plans || plans.length === 0) {
        return { coursesTaken, plansFilling };
    }

    let updatedCoursesTaken = [...coursesTaken];
    let updatedPlansFilling = { ...plansFilling };
    let hasChanges = false;

    for (let courseIndex = 0; courseIndex < updatedCoursesTaken.length; courseIndex++) {
        const course = updatedCoursesTaken[courseIndex];
        if (!course || !course.code || course.planreq !== null) {
            continue;
        }

        const result = fillPlanReq(course, updatedCoursesTaken, plans, updatedPlansFilling, selectedPlanCombo, selectedSubPlans);
        updatedCoursesTaken = result.coursesTaken;
        updatedPlansFilling = result.plansFilling;
        hasChanges = true;
    }

    if (hasChanges) {
        const crossReferenceResult = crossReferenceSupportingSections(updatedCoursesTaken, plans, updatedPlansFilling, selectedPlanCombo);
        updatedCoursesTaken = crossReferenceResult.coursesTaken;
        updatedPlansFilling = crossReferenceResult.plansFilling;
    }

    return { coursesTaken: updatedCoursesTaken, plansFilling: updatedPlansFilling };
}

function crossReferenceSupportingSections(coursesTaken, plans, plansFilling, selectedPlanCombo) {
    let updatedCoursesTaken = [...coursesTaken];
    let updatedPlansFilling = { ...plansFilling };
    let hasChanges = false;

    for (let courseIndex = 0; courseIndex < updatedCoursesTaken.length; courseIndex++) {
        const course = updatedCoursesTaken[courseIndex];
        if (!course || !course.code) continue;

        const courseCode = course.code;
        const currentPlanreq = course.planreq;

        if (currentPlanreq && currentPlanreq.includes('supporting')) {
            continue;
        }

        for (let planIndex = 0; planIndex < plans.length; planIndex++) {
            const plan = plans[planIndex];
            if (!plan) continue;

            const planPrefix = getPlanPrefix(planIndex, plan, selectedPlanCombo);

            const supportingSections = Object.keys(plan).filter(key =>
                key.toLowerCase().includes('supporting') &&
                !['title', 'electives', 'units'].includes(key)
            );

            for (const supportingSection of supportingSections) {
                const sectionData = plan[supportingSection];
                if (!sectionData.subsections) continue;

                for (const subsection of sectionData.subsections) {
                    const requirementId = `${planPrefix}${supportingSection}${subsection.id}`;

                    if (updatedPlansFilling[requirementId] &&
                        updatedPlansFilling[requirementId].unitsCompleted < updatedPlansFilling[requirementId].unitsRequired) {

                        if (subsection.courses) {
                            for (const reqCourse of subsection.courses) {
                                if (reqCourse.code === courseCode) {
                                    updatedPlansFilling[requirementId].courses.push(courseCode);
                                    updatedPlansFilling[requirementId].unitsCompleted += (parseFloat(reqCourse.units) || 0);

                                    const newPlanreq = currentPlanreq ?
                                        `${currentPlanreq}, ${requirementId}` :
                                        requirementId;

                                    updatedCoursesTaken[courseIndex] = {
                                        ...updatedCoursesTaken[courseIndex],
                                        planreq: newPlanreq
                                    };

                                    hasChanges = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return { coursesTaken: updatedCoursesTaken, plansFilling: updatedPlansFilling };
}
