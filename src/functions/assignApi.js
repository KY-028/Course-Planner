import axios from 'axios';

/**
 * Build request body for POST /api/assign.
 * Backend expects: planJSONs, coursesTaken, selectedSubplan, selectedPlanCombo, allowOverlap, optional customCourses.
 */
export function buildAssignPayload({
  planJSONs,
  coursesTaken,
  selectedSubplan,
  selectedPlanCombo,
  customCourses = null,
  allowOverlap = false,
}) {
  const body = {
    planJSONs: planJSONs || [],
    coursesTaken: (coursesTaken || []).filter(Boolean).map((c) => ({
      code: c.code,
      units: c.units,
      planreq: c.planreq ?? null,
      ...(c.title != null && { title: c.title }),
    })),
    selectedSubplan: selectedSubplan ?? [],
    selectedPlanCombo: selectedPlanCombo ?? 1,
    // Cross-plan overlap is disabled by default; pass allowOverlap: true to toggle on.
    allowOverlap: allowOverlap === true,
  };
  if (customCourses != null && Array.isArray(customCourses) && customCourses.length > 0) {
    body.customCourses = customCourses.map((entry) =>
      entry && typeof entry.course === 'object'
        ? { index: entry.index, course: { code: entry.course.code, units: entry.course.units, planreq: entry.course.planreq } }
        : entry
    );
  }
  return body;
}

/**
 * Call POST /api/assign. Returns { plansFilling, total_completed, overcounted_units }.
 * Does not return coursesTaken; derive from plansFilling via deriveCoursesTakenFromPlansFilling.
 * @throws on network error or when response has error message
 */
export async function callAssignApi(apiUrl, payload) {
  const url = `${apiUrl}/api/assign`;
  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });
  if (response.status !== 200) {
    const msg = response.data?.error || response.statusText || 'Assignment request failed';
    throw new Error(msg);
  }
  const data = response.data;
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

/**
 * Derive coursesTaken with planreq from plansFilling.
 * For each requirement id, each course code in plansFilling[req].courses gets that req added to planreq.
 * Preserves other course fields and order; courses not in any plansFilling get planreq "Unassigned/Electives" if present, else null.
 */
export function deriveCoursesTakenFromPlansFilling(coursesTaken, plansFilling) {
  if (!coursesTaken || !plansFilling) return coursesTaken;
  const codeToReqs = new Map();
  for (const [reqId, data] of Object.entries(plansFilling)) {
    if (!data || !Array.isArray(data.courses)) continue;
    for (const code of data.courses) {
      if (!codeToReqs.has(code)) codeToReqs.set(code, []);
      if (!codeToReqs.get(code).includes(reqId)) codeToReqs.get(code).push(reqId);
    }
  }
  return coursesTaken.map((c) => {
    if (c == null) return null;
    const reqs = codeToReqs.get(c.code);
    const planreq = reqs && reqs.length > 0 ? reqs.join(', ') : null;
    return { ...c, planreq };
  });
}
