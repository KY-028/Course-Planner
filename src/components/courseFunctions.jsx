export function generateOptions(courseBaseId, coursemaster) {

    const sectionKeys = Object.keys(coursemaster).filter(key => key.startsWith(courseBaseId));

    return sectionKeys.map(key => {
        return `Section ${key.split('_')[1]}: ${formatDays(coursemaster[key].slice(4,))}`;
    }).sort();

};

export function formatDays(sessions) {
    if (!sessions || sessions.length === 0) return 'Online';

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

export const validateUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Helper function to get plan prefix (e.g., "major1-", "minor-")
export function getPlanPrefix(planIndex, plan, selectedPlanCombo) {

    if (!plan || !plan.title) {
        alert("An unexpected error occurred. Please refresh and restart.");
        return;
    }

    // Handle different plan types based on the selected plan combination
    if (selectedPlanCombo === 1) { // Double Major
        if (planIndex === 0) return 'major1-';
        if (planIndex === 1) return 'major2-';
    } else if (selectedPlanCombo === 2) { // Major + Minor
        if (planIndex === 0) return 'major-';
        if (planIndex === 1) return 'minor-';
    } else if (selectedPlanCombo === 3) { // Major + Double Minor
        if (planIndex === 0) return 'major-';
        if (planIndex === 1) return 'minor1-';
        if (planIndex === 2) return 'minor2-';
    } else if (selectedPlanCombo === 4) { // Specialization
        return 'specialization-';
    } else if (selectedPlanCombo === 5) { // Specialization + Minor
        if (planIndex === 0) return 'specialization-';
        if (planIndex === 1) return 'minor-';
    } else if (selectedPlanCombo === 6) { // Joint Major
        if (planIndex === 0) return 'joint1-';
        if (planIndex === 1) return 'joint2-';
    } else if (selectedPlanCombo === 7) {
        return 'general-';
    } else if (selectedPlanCombo === 8) { // Major Only (Old Plan)
        return 'major-';
    }

    alert("An unexpected error occurred. Please refresh and restart.");
    return `plan${planIndex}-`;
}

// Utility to robustly calculate units for a section/subsection
export function calculateSectionUnits(section) {
    if (!section) return 0;
    // Check if title contains a float number (e.g., "Complete 6.00 units from the following:")
    // Match the first number (integer or float) in the title, regardless of the word "units"
    const floatMatch = section.title && section.title.match(/(\d+(\.\d+)?)/);
    if (floatMatch) {
        return parseFloat(floatMatch[1]);
    }

    // Special case: If title is "Complete one of the following Sub-Plans:"
    if (section.title && section.title.toLowerCase().includes('complete one of the following sub-plans')) {
        if (section.plan) {
            // Find the minimum plan units from all plan options
            let minUnits = Infinity;
            for (const planObj of Object.values(section.plan)) {
                if (planObj && typeof planObj.units === 'number') {
                    minUnits = Math.min(minUnits, planObj.units);
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

export function processSection(sectionKey, sectionData, plansFillingMap, parentPrefix = '', subplan = '') {
    if (!sectionData.subsections) return;
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
export function establishPlansFilling(planData, planPrefix = '', plansFillingMap = {}) {

    // Process all sections (sectionKey = name, sectionData = object)
    Object.entries(planData).forEach(([sectionKey, sectionData]) => {
        if (!['title', 'electives', 'units'].includes(sectionKey)) {
            processSection(sectionKey, sectionData, plansFillingMap, planPrefix);
        }
    });
    return plansFillingMap;
}

export function clearPlanReq(coursesTaken) {
    return coursesTaken.map(course => {
        if (course === null) {
            return null; // Preserve null values for empty slots
        }
        return { ...course, planreq: null };
    });
}


// Legacy assignment logic (fillPlanReq, recomputePlanAssignments, processAllCourses, crossReferenceSupportingSections)
// has been moved to legacyAssignmentLogic.jsx. Assignment is now done via POST /api/assign (see src/assignApi.js and SelectPlan).

