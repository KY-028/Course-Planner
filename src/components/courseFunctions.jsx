export function generateOptions(courseBaseId, coursemaster) {

    const sectionKeys = Object.keys(coursemaster).filter(key => key.startsWith(courseBaseId));

    return sectionKeys.map(key => {
        return `Section ${key.split('_')[1]}: ${formatDays(coursemaster[key].slice(4,))}`;
    }).sort();

};

export function formatDays(sessions) {
    const daysOrder = ["M", "T", "W", "Th", "F"];
    const daysSet = new Set();

    sessions.forEach(session => {
        session.match(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g).forEach(day => {
            const dayAbbr = day.startsWith('Th') ? 'Th' : day.charAt(0);
            daysSet.add(dayAbbr);
        });
    });

    return Array.from(daysSet).sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b)).join('');
};

export function generateNewCourse(id, courseData) {

    const courseDetail = courseData[id];
    const newCourse = {
        id: id,
        name: courseDetail[0],
        title: courseDetail[1],
        options: generateOptions(courseDetail[0], courseData),
        selectedOption: `Section ${id.split('_')[1]}: ${formatDays(courseData[id].slice(4))}`,
    };
    return newCourse;

}

// coursesTaken is an array of courses
// plans is an array of plans (objects)
export function fillPlanReq(newCourse, coursesTaken, plans, plansFilling, originalCoursesTaken = null) {
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
    function assignInPlan(plan, planPrefix, restrictToSupporting = null) {
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
                                    updatedCoursesTaken.some(c => c && c.code === code && !c.isExcess)
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
                                        const courseUnits = comboCourseObj?.units || 0;
                                        let assignUnits = 0;
                                        let excessUnits = 0;
                                        if (unitsLeft > 0) {
                                            assignUnits = Math.min(courseUnits, unitsLeft);
                                            excessUnits = courseUnits - assignUnits;
                                            unitsLeft -= assignUnits;
                                        } else {
                                            assignUnits = 0;
                                            excessUnits = courseUnits;
                                        }
                                        // Assign to requirement
                                        if (assignUnits > 0) {
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
                                            updatedPlansFilling[requirementId].unitsCompleted += assignUnits;
                                            // Assign planreq for this requirement
                                            const idx = updatedCoursesTaken.findIndex(c => c && c.code === code && !c.isExcess);
                                            if (idx !== -1) {
                                                updatedCoursesTaken[idx] = {
                                                    ...updatedCoursesTaken[idx],
                                                    planreq: updatedCoursesTaken[idx].planreq
                                                        ? [...new Set([...updatedCoursesTaken[idx].planreq.split(',').map(s => s.trim()), requirementId])].join(', ')
                                                        : requirementId
                                                };
                                            }
                                        }
                                        // Handle excess units: add a new excess course object
                                        if (excessUnits > 0) {
                                            // Only add if not already present
                                            const excessTitle = `Excess from ${requirementLabel}`;
                                            const alreadyExists = allCourses.some(c => c && c.isExcess && c.code === code && c.title === excessTitle && c.units === excessUnits);
                                            if (!alreadyExists) {
                                                updatedCoursesTaken.push({
                                                    code: code,
                                                    title: excessTitle,
                                                    planreq: 'Electives',
                                                    units: excessUnits,
                                                    isExcess: true
                                                });
                                            }
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
                        } else if (course.code === courseCode) {
                            const courseUnits = course.units || 0;
                            const unitsRequired = updatedPlansFilling[requirementId]?.unitsRequired || courseUnits;
                            let unitsLeft = unitsRequired - (updatedPlansFilling[requirementId]?.unitsCompleted || 0);
                            let assignUnits = Math.min(courseUnits, Math.max(0, unitsLeft));
                            let excessUnits = courseUnits - assignUnits;
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
                            updatedPlansFilling[requirementId].unitsCompleted += assignUnits;
                            // Only assign if not already assigned
                            const idx = updatedCoursesTaken.findIndex(c => c && c.code === courseCode && !c.isExcess && (!c.planreq || !c.planreq.split(',').includes(requirementId)));
                            if (idx !== -1) {
                                updatedCoursesTaken[idx] = {
                                    ...updatedCoursesTaken[idx],
                                    planreq: updatedCoursesTaken[idx].planreq
                                        ? [...new Set([...updatedCoursesTaken[idx].planreq.split(',').map(s => s.trim()), requirementId])].join(', ')
                                        : requirementId
                                };
                            }
                            // Handle excess units: add a new excess course object
                            if (excessUnits > 0) {
                                const excessTitle = `Excess from ${requirementLabel}`;
                                const alreadyExists = allCourses.some(c => c && c.isExcess && c.code === courseCode && c.title === excessTitle && c.units === excessUnits);
                                if (!alreadyExists) {
                                    updatedCoursesTaken.push({
                                        code: courseCode,
                                        title: excessTitle,
                                        planreq: 'Electives',
                                        units: excessUnits,
                                        isExcess: true
                                    });
                                }
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
            }
        }
        return false;
    }

    // 1. First pass: assign to the first matching requirement in the first plan (any section)
    let assigned = false;
    for (let planIndex = 0; planIndex < plans.length; planIndex++) {
        const plan = plans[planIndex];
        if (!plan) continue;
        const planPrefix = getPlanPrefix(planIndex, plan);
        if (assignInPlan(plan, planPrefix, null)) {
            assigned = true;
            break; // Only assign to the first match in the first plan
        }
    }

    // 2. Cross-plan logic: check subsequent plans for additional assignments
    if (assigned && firstAssignmentType) {
        for (let planIndex = 0; planIndex < plans.length; planIndex++) {
            const plan = plans[planIndex];
            if (!plan) continue;
            const planPrefix = getPlanPrefix(planIndex, plan);
            // Skip the plan where the first assignment was made
            if (planPrefix === firstAssignmentPlanPrefix) continue;
            // If first assignment was to supporting, check only core/option (non-supporting) in other plans
            // If first assignment was to core/option, check only supporting in other plans
            assignInPlan(plan, planPrefix, firstAssignmentType === 'supporting' ? false : true);
        }
    }

    // If no assignment found in any plan, assign as "Electives"
    if (assignedRequirements.length === 0) {
        assignedRequirements.push("Electives");
    }

    // Update the course with the assigned requirement(s)
    const courseIndex = updatedCoursesTaken.findIndex(course => course && course.code === courseCode && course.planreq === null);
    if (courseIndex !== -1) {
        updatedCoursesTaken[courseIndex] = {
            ...updatedCoursesTaken[courseIndex],
            planreq: assignedRequirements.join(', ')
        };
    }

    return { coursesTaken: updatedCoursesTaken, plansFilling: updatedPlansFilling };
}

// Helper function to get plan prefix (e.g., "major1-", "minor-")
export function getPlanPrefix(planIndex, plan) {
    if (!plan || !plan.title) {
        console.alert("An unexpected error occurred. Please refresh and restart.");
        return;
    }
    
    const title = plan.title.toLowerCase();
    if (title.includes('major')) {
        if (title.includes('1') || title.includes('first')) return 'major1-';
        if (title.includes('2') || title.includes('second')) return 'major2-';
        return 'major-';
    }
    if (title.includes('minor')) {
        if (title.includes('1') || title.includes('first')) return 'minor1-';
        if (title.includes('2') || title.includes('second')) return 'minor2-';
        return 'minor-';
    }
    if (title.includes('specialization')) return 'specialization-';
    if (title.includes('joint')) return 'joint-';
    
    console.error("An unexpected error occurred. Please refresh and restart.");
    return `plan${planIndex}-`;
}

// Enhanced function to process all courses and assign them to plans
export function processAllCourses(coursesTaken, plans, plansFilling) {
    if (!coursesTaken || !plans || plans.length === 0) {
        return { coursesTaken, plansFilling };
    }

    let updatedCoursesTaken = [...coursesTaken];
    let updatedPlansFilling = { ...plansFilling };
    let hasChanges = false;

    // Process each course that doesn't have a planreq assigned
    for (let courseIndex = 0; courseIndex < updatedCoursesTaken.length; courseIndex++) {
        const course = updatedCoursesTaken[courseIndex];
        if (!course || !course.code || course.planreq !== null) {
            continue;
        }

        const result = fillPlanReq(course, updatedCoursesTaken, plans, updatedPlansFilling);
        updatedCoursesTaken = result.coursesTaken;
        updatedPlansFilling = result.plansFilling;
        hasChanges = true;
    }

    // If we made changes, we need to do a second pass to check for supporting section cross-references
    if (hasChanges) {
        const crossReferenceResult = crossReferenceSupportingSections(updatedCoursesTaken, plans, updatedPlansFilling);
        updatedCoursesTaken = crossReferenceResult.coursesTaken;
        updatedPlansFilling = crossReferenceResult.plansFilling;
    }

    return { coursesTaken: updatedCoursesTaken, plansFilling: updatedPlansFilling };
}

// Function to cross-reference supporting sections across plans
function crossReferenceSupportingSections(coursesTaken, plans, plansFilling) {
    let updatedCoursesTaken = [...coursesTaken];
    let updatedPlansFilling = { ...plansFilling };
    let hasChanges = false;

    // For each course, check if it can fill supporting sections in other plans
    for (let courseIndex = 0; courseIndex < updatedCoursesTaken.length; courseIndex++) {
        const course = updatedCoursesTaken[courseIndex];
        if (!course || !course.code) continue;

        const courseCode = course.code;
        const currentPlanreq = course.planreq;

        // Skip if already assigned to a supporting section
        if (currentPlanreq && currentPlanreq.includes('supporting')) {
            continue;
        }

        // Check each plan for supporting section opportunities
        for (let planIndex = 0; planIndex < plans.length; planIndex++) {
            const plan = plans[planIndex];
            if (!plan) continue;

            const planPrefix = getPlanPrefix(planIndex, plan);
            
            // Look for supporting sections in this plan
            const supportingSections = Object.keys(plan).filter(key => 
                key.toLowerCase().includes('supporting') && 
                !['title', 'electives', 'units'].includes(key)
            );

            for (const supportingSection of supportingSections) {
                const sectionData = plan[supportingSection];
                if (!sectionData.subsections) continue;

                for (const subsection of sectionData.subsections) {
                    const requirementId = `${planPrefix}${supportingSection}${subsection.id}`;
                    
                    // Check if this requirement needs more courses
                    if (updatedPlansFilling[requirementId] && 
                        updatedPlansFilling[requirementId].unitsCompleted < updatedPlansFilling[requirementId].unitsRequired) {
                        
                        // Check if our course matches this supporting requirement
                        if (subsection.courses) {
                            for (const reqCourse of subsection.courses) {
                                if (reqCourse.code === courseCode) {
                                    // Add this course to the supporting requirement
                                    updatedPlansFilling[requirementId].courses.push(courseCode);
                                    updatedPlansFilling[requirementId].unitsCompleted += (reqCourse.units || 0);
                                    
                                    // Update the course's planreq to include both assignments
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

export function clearPlanReq(coursesTaken) {
    return coursesTaken.map(course => {
        if (course === null) {
            return null; // Preserve null values for empty slots
        }
        return { ...course, planreq: null };
    });
}

// Utility to robustly calculate units for a section/subsection
export function calculateSectionUnits(section) {
    if (!section) return 0;
    // Check if title contains a float number (e.g., "Complete 6.00 units from the following:")
    const floatMatch = section.title && section.title.match(/(\d+\.\d+)\s*units?/i);
    if (floatMatch) {
        return parseFloat(floatMatch[1]);
    }

    // Special case: If title is "Complete one of the following Sub-Plans:"
    if (section.title && section.title.toLowerCase().includes('complete one of the following sub-plans')) {
        if (section.plan) {
            // Find the minimum planunits from all plan options
            let minUnits = Infinity;
            for (const planObj of Object.values(section.plan)) {
                if (planObj && typeof planObj.planunits === 'number') {
                    minUnits = Math.min(minUnits, planObj.planunits);
                }
            }
            return minUnits === Infinity ? 0 : minUnits;
        }
        return 0;
    }

    // If no float in title and not a sub-plan case, sum up all course units
    if (section.courses && Array.isArray(section.courses)) {
        return section.courses.reduce((sum, course) => sum + (course.units || 0), 0);
    }
    return 0;
}

function processSection(sectionKey, sectionData, plansFillingMap, parentPrefix = '', planPrefix = '') {
    if (!sectionData.subsections) return;
    if (sectionData.plan) {
        // remove the old prefix and add the ones for the specific plan

    }
    // for every subsection in the section, create a requirementId and add it to the plansFillingMap
    sectionData.subsections.forEach((subsection) => {
        const requirementId = `${parentPrefix}${sectionKey}${subsection.id}`;
        const unitsRequired = calculateSectionUnits(subsection);
        plansFillingMap[requirementId] = {
            unitsRequired,
            unitsCompleted: 0,
            courses: []
        };
    });
}

// Recursively build plansFilling for a plan object
export function establishPlansFilling(planData, planPrefix = '') {
    const plansFillingMap = {};

    // Process all sections (sectionKey = name, sectionData = object)
    Object.entries(planData).forEach(([sectionKey, sectionData]) => {
        if (!['title', 'electives', 'units'].includes(sectionKey)) {
            processSection(sectionKey, sectionData, plansFillingMap, planPrefix);
        }
    });

    return plansFillingMap;
}

// Recompute plansFilling and all course assignments from scratch
export function recomputePlanAssignments(coursesTaken, plans) {
    // 1. Build fresh plansFilling from all locked plans
    let plansFilling = {};
    plans.forEach((plan, i) => {
        if (plan) {
            const planPrefix = getPlanPrefix(i, plan);
            Object.assign(plansFilling, establishPlansFilling(plan, planPrefix));
        }
    });
    // 2. Start with all courses unassigned (except isExcess)
    let updatedCoursesTaken = coursesTaken.filter(course => !course?.isExcess).map(course => course ? { ...course, planreq: null } : null);
    // 3. Assign all courses (including combinations)
    for (let i = 0; i < updatedCoursesTaken.length; i++) {
        const course = updatedCoursesTaken[i];
        if (!course || !course.code) continue;
        // Use the latest state for each assignment, pass original coursesTaken for excess check
        const result = fillPlanReq(course, updatedCoursesTaken, plans, plansFilling, coursesTaken);
        updatedCoursesTaken = result.coursesTaken;
        plansFilling = result.plansFilling;
    }
    // 4. Add back all isExcess courses
    const excessCourses = coursesTaken.filter(course => course?.isExcess);
    updatedCoursesTaken = [...updatedCoursesTaken, ...excessCourses];
    return { coursesTaken: updatedCoursesTaken, plansFilling };
}