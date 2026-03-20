import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, pointerWithin } from '@dnd-kit/core';
import { getPlanPrefix } from '/src/components/courseFunctions';

function DraggableCourseChip({ code, units, fromReqId }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `${fromReqId}::${code}`,
        data: { code, fromReqId },
    });

    const style = {
        // Keep the original chip fixed in layout; movement is handled by DragOverlay only
        transform: undefined,
        opacity: isDragging ? 0.8 : 1,
        zIndex: 'auto',
        // Hide the original chip while dragging so we only see the overlay copy and avoid double-render + stretching
        visibility: isDragging ? 'hidden' : 'visible',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="inline-flex items-center gap-1 px-2 py-1 mr-1 mb-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-800 cursor-move whitespace-nowrap"
        >
            <span className="font-semibold">{code}</span>
            {units != null && (
                <span className="text-[11px] text-blue-700">
                    {units}
                </span>
            )}
        </div>
    );
}

function DroppableRequirement({ id, children }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={`min-h-[40px] p-2 rounded border border-dashed ${
                isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'
            }`}
        >
            {children}
        </div>
    );
}

// Utility: order requirements by plan prefix priority, then remainder.
// Priority: Specialization > Major > Minor (then others), then by numeric index (major1 before major2, etc.).
function sortRequirementIds(plansFilling) {
    const ids = Object.keys(plansFilling || {});
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

    const parse = (id) => {
        // Unassigned is handled outside, but keep a safe fallback
        if (id === 'Unassigned/Electives') return { cat: 999, idx: 999, rest: '' };

        // getPlanPrefix() produces prefixes like: specialization-, major-, major1-, major2-, minor-, minor1-, minor2-, joint1-, joint2-, general-
        const m = id.match(/^(specialization|major|minor|joint|general)(\d*)-(.*)$/i);
        if (!m) return { cat: 500, idx: 0, rest: id };

        const type = m[1].toLowerCase();
        const idx = m[2] ? Number(m[2]) : 0;
        const rest = m[3] || '';

        const cat =
            type === 'specialization' ? 0 :
                type === 'major' ? 1 :
                    type === 'joint' ? 2 :
                        type === 'minor' ? 3 :
                            type === 'general' ? 4 :
                                9;

        return { cat, idx, rest };
    };

    const base = ids.filter((id) => id !== 'Unassigned/Electives');
    base.sort((a, b) => {
        const pa = parse(a);
        const pb = parse(b);
        if (pa.cat !== pb.cat) return pa.cat - pb.cat;
        if (pa.idx !== pb.idx) return pa.idx - pb.idx;
        return collator.compare(pa.rest, pb.rest);
    });

    if (plansFilling && plansFilling['Unassigned/Electives']) base.push('Unassigned/Electives');
    return base;
}

function extractCodesFromCourses(courses) {
    const out = [];
    if (!Array.isArray(courses)) return out;
    for (const course of courses) {
        if (!course || !course.code) continue;
        if ((course.code === 'Combination' || course.code === 'One of') && Array.isArray(course.courses)) {
            for (const sub of course.courses) {
                if (sub?.code) out.push(sub.code);
            }
        } else {
            out.push(course.code);
        }
    }
    return out;
}

function buildCondensedLine(title, items) {
    const cleanTitle = (title || '').trim();
    const joined = (items || []).filter(Boolean).join(', ');
    if (!cleanTitle) return joined ? joined : null;
    if (!joined) return cleanTitle;
    // Many titles already end in ":"; avoid double punctuation.
    return cleanTitle.endsWith(':') ? `${cleanTitle} ${joined}` : `${cleanTitle}: ${joined}`;
}

function findPlanFallbackByLink(planResultsData, link) {
    if (!planResultsData || !link) return null;
    for (const arr of Object.values(planResultsData)) {
        if (!Array.isArray(arr)) continue;
        const hit = arr.find((p) => p && p.link === link && p.result);
        if (hit?.result) return hit.result;
    }
    return null;
}

function AssignmentBreakdownModalInner({
    isOpen,
    onClose,
    baselinePlansFilling,
    plansFilling,
    coursesTaken,
    setPlansFilling,
    setCoursesTaken,
    customAssignments,
    setCustomAssignments,
    plans,
    planLinks,
    selectedPlanCombo,
    selectedSubPlans,
    planResultsData,
}) {
    const [activeId, setActiveId] = useState(null);

    // Map requirement -> ordered list of course codes
    const requirementOrder = useMemo(
        () => sortRequirementIds(plansFilling),
        [plansFilling]
    );

    const codeToCourse = useMemo(() => {
        const map = new Map();
        (coursesTaken || []).forEach((c, idx) => {
            if (!c || !c.code) return;
            if (!map.has(c.code)) {
                map.set(c.code, { course: c, indices: [] });
            }
            map.get(c.code).indices.push(idx);
        });
        return map;
    }, [coursesTaken]);

    const detailLineByReqId = useMemo(() => {
        const map = {};
        const planArr = Array.isArray(plans) ? plans : [];
        const linksArr = Array.isArray(planLinks) ? planLinks : [];
        const subArr = Array.isArray(selectedSubPlans) ? selectedSubPlans : [];

        for (let planIndex = 0; planIndex < planArr.length; planIndex++) {
            const rawPlan = planArr[planIndex];
            const link = linksArr[planIndex];
            const planData = rawPlan || findPlanFallbackByLink(planResultsData, link);
            if (!planData) continue;

            const planPrefix = getPlanPrefix(planIndex, planData, selectedPlanCombo);
            const subPlanChoice = subArr[planIndex];

            for (const [sectionKey, sectionData] of Object.entries(planData)) {
                if (!sectionData || typeof sectionData !== 'object') continue;
                if (sectionKey === 'title' || sectionKey === 'units' || sectionKey === 'electives') continue;
                if (!Array.isArray(sectionData.subsections)) continue;

                for (const subsection of sectionData.subsections) {
                    if (!subsection || subsection.id == null) continue;
                    const baseReqId = `${planPrefix}${sectionKey}${subsection.id}`;
                    const items = [
                        ...extractCodesFromCourses(subsection.courses),
                        ...(Array.isArray(subsection.requirement) ? subsection.requirement : []),
                    ];
                    map[baseReqId] = buildCondensedLine(subsection.title, items);

                    // Subplan requirements
                    if (subsection.plan && subPlanChoice && subsection.plan[subPlanChoice]) {
                        const subPlan = subsection.plan[subPlanChoice];
                        if (Array.isArray(subPlan?.subsections)) {
                            for (const subsub of subPlan.subsections) {
                                if (!subsub || subsub.id == null) continue;
                                const reqId = `${planPrefix}${sectionKey}${subsection.id}-${subPlanChoice}${subsub.id}`;
                                const subItems = [
                                    ...extractCodesFromCourses(subsub.courses),
                                    ...(Array.isArray(subsub.requirement) ? subsub.requirement : []),
                                ];
                                map[reqId] = buildCondensedLine(subsub.title, subItems);
                            }
                        } else if (subPlan && typeof subPlan === 'object') {
                            for (const [thatSectionKey, thatSectionObj] of Object.entries(subPlan)) {
                                if (!thatSectionObj || typeof thatSectionObj !== 'object') continue;
                                if (!Array.isArray(thatSectionObj.subsections)) continue;
                                for (const thatSubsection of thatSectionObj.subsections) {
                                    if (!thatSubsection || thatSubsection.id == null) continue;
                                    const reqId = `${planPrefix}${sectionKey}${subsection.id}-${subPlanChoice}-${thatSectionKey}${thatSubsection.id}`;
                                    const subItems = [
                                        ...extractCodesFromCourses(thatSubsection.courses),
                                        ...(Array.isArray(thatSubsection.requirement) ? thatSubsection.requirement : []),
                                    ];
                                    map[reqId] = buildCondensedLine(thatSubsection.title, subItems);
                                }
                            }
                        }
                    }
                }
            }
        }

        return map;
    }, [plans, planLinks, selectedPlanCombo, selectedSubPlans, planResultsData]);

    // Helpers to compute requirement sets per course code from a plansFilling map
    const getReqSetFromFilling = (filling, code) => {
        const reqs = [];
        if (!filling) return reqs;
        for (const [reqId, data] of Object.entries(filling)) {
            if (Array.isArray(data.courses) && data.courses.includes(code)) {
                reqs.push(reqId);
            }
        }
        return reqs.sort();
    };

    const handleMoveCourse = ({ code, fromReqId, toReqId }) => {
        if (!code) return;

        const courseEntry = codeToCourse.get(code);
        if (!courseEntry) return;

        // Choose the first index for diffing/saving; all duplicates share same baseline set
        const courseIndex = courseEntry.indices[0];
        const course = courseEntry.course;
        const units = parseFloat(course.units) || 0;

        setPlansFilling(prev => {
            const next = { ...prev };

            // Remove from source
            if (fromReqId && next[fromReqId]) {
                const src = next[fromReqId];
                next[fromReqId] = {
                    ...src,
                    courses: (src.courses || []).filter(c => c !== code),
                    unitsCompleted: Math.max(0, (src.unitsCompleted || 0) - units),
                };
            }

            // Add to target
            if (toReqId) {
                const dst = next[toReqId] || { unitsRequired: 0, unitsCompleted: 0, courses: [] };
                const hasCode = (dst.courses || []).includes(code);
                next[toReqId] = {
                    ...dst,
                    courses: hasCode ? dst.courses : [...(dst.courses || []), code],
                    unitsCompleted: (dst.unitsCompleted || 0) + (hasCode ? 0 : units),
                };
            }

            return next;
        });

        // After updating plansFilling, also update coursesTaken + customAssignments based on baseline vs current
        setCoursesTaken(prevCourses => {
            const updatedCourses = [...prevCourses];
            const currentReqs = getReqSetFromFilling(
                {
                    ...plansFilling,
                    [fromReqId]: {
                        ...(plansFilling[fromReqId] || {}),
                        courses: (plansFilling[fromReqId]?.courses || []).filter(c => c !== code),
                    },
                    [toReqId]: {
                        ...(plansFilling[toReqId] || { unitsRequired: 0, unitsCompleted: 0, courses: [] }),
                        courses: (() => {
                            const dst = plansFilling[toReqId]?.courses || [];
                            return dst.includes(code) ? dst : [...dst, code];
                        })(),
                    },
                },
                code
            );
            const baselineReqs = getReqSetFromFilling(baselinePlansFilling, code);

            if (courseIndex != null && updatedCourses[courseIndex]) {
                const newPlanreq =
                    currentReqs.length === 0 ? null : currentReqs.join(', ');
                updatedCourses[courseIndex] = {
                    ...updatedCourses[courseIndex],
                    planreq: newPlanreq,
                };

                setCustomAssignments(prev => {
                    const sameAsBaseline =
                        currentReqs.length === baselineReqs.length &&
                        currentReqs.every((v, i) => v === baselineReqs[i]);
                    const exists = prev.some(e => e.index === courseIndex);
                    if (sameAsBaseline) {
                        return exists
                            ? prev.filter(e => e.index !== courseIndex)
                            : prev;
                    }
                    if (exists) {
                        return prev.map(e =>
                            e.index === courseIndex
                                ? { ...e, course: updatedCourses[courseIndex] }
                                : e
                        );
                    }
                    return [
                        ...prev,
                        { index: courseIndex, course: updatedCourses[courseIndex] },
                    ];
                });
            }

            return updatedCourses;
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!active || !over) return;
        setActiveId(null);
        const fromReqId = active.data?.current?.fromReqId;
        const code = active.data?.current?.code;
        const toReqId = over.id;
        // Require valid ids and an actual change of container
        if (!code || !fromReqId || !toReqId || fromReqId === toReqId) {
            return;
        }
        handleMoveCourse({ code, fromReqId, toReqId });
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 1000000 }}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            Here&apos;s how your plan was assigned
                        </h2>
                        <p className="text-sm text-gray-600">
                            Drag courses between requirements or into Unassigned/Electives to customize.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <DndContext
                    collisionDetection={pointerWithin}
                    onDragStart={(event) => setActiveId(event.active?.id ?? null)}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => setActiveId(null)}
                >
                    <div className="flex gap-4 relative">
                        {/* Left: requirements */}
                        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pr-2">
                            {requirementOrder
                                .filter(id => id !== 'Unassigned/Electives')
                                .map(reqId => {
                                    const data = plansFilling[reqId] || {};
                                    const courses = data.courses || [];
                                    const unitsRequired = data.unitsRequired || 0;
                                    const unitsCompleted = data.unitsCompleted || 0;
                                    const title = reqId;

                                    return (
                                        <div
                                            key={reqId}
                                            className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-semibold text-gray-800 text-sm break-all">
                                                    {title}
                                                </div>
                                                {unitsRequired > 0 && (
                                                    <div className="text-xs text-gray-600">
                                                        {unitsCompleted}/{unitsRequired} units
                                                    </div>
                                                )}
                                            </div>
                                            {detailLineByReqId[reqId] && (
                                                <div className="text-xs text-gray-600 mb-2">
                                                    {detailLineByReqId[reqId]}
                                                </div>
                                            )}

                                            <DroppableRequirement id={reqId}>
                                                    {courses.length === 0 && (
                                                        <div className="text-xs text-gray-400">
                                                            Drop courses here
                                                        </div>
                                                    )}
                                                    {courses.map(code => {
                                                        const info = codeToCourse.get(code);
                                                        const units =
                                                            info?.course?.units != null
                                                                ? info.course.units
                                                                : null;
                                                        return (
                                                            <DraggableCourseChip
                                                                key={`${reqId}::${code}`}
                                                                code={code}
                                                                units={units}
                                                                fromReqId={reqId}
                                                            />
                                                        );
                                                    })}
                                            </DroppableRequirement>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Right: Unassigned/Electives library */}
                        <div className="w-[320px] flex-shrink-0">
                            <div className="sticky top-0 right-0">
                                <div className="mb-2 font-semibold text-gray-800">
                                    Unassigned Electives
                                </div>
                                {(() => {
                                    const unassignedId = 'Unassigned/Electives';
                                    const unassignedCourses = plansFilling['Unassigned/Electives']?.courses || [];
                                    return (
                                        <DroppableRequirement id={unassignedId}>
                                            <div className="max-h-[60vh] overflow-y-auto">
                                                {unassignedCourses.length === 0 && (
                                                    <div className="text-xs text-gray-400">
                                                        Courses the solver could not assign will appear here.
                                                    </div>
                                                )}
                                                {unassignedCourses.map(code => {
                                                    const info = codeToCourse.get(code);
                                                    const units =
                                                        info?.course?.units != null
                                                            ? info.course.units
                                                            : null;
                                                    return (
                                                        <DraggableCourseChip
                                                            key={`${unassignedId}::${code}`}
                                                            code={code}
                                                            units={units}
                                                            fromReqId={unassignedId}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </DroppableRequirement>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Drag overlay so the chip stays fully visible while dragging */}
                        <DragOverlay>
                    {activeId && (() => {
                        // Use the currently dragged course from activeId
                        const [, code] = String(activeId).split('::');
                        if (!code) return null;
                        const info = codeToCourse.get(code);
                        const units = info?.course?.units != null ? info.course.units : null;
                        return (
                            <div className="z-50 inline-flex">
                                <div className="inline-flex items-center gap-1 px-2 py-1 mr-1 mb-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-800 whitespace-nowrap">
                                    <span className="font-semibold">{code}</span>
                                    {units != null && (
                                        <span className="text-[11px] text-blue-700">
                                            {units}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                        </DragOverlay>
                    </div>
                </DndContext>

                {/* Debug: show customAssignments */}
                {customAssignments && customAssignments.length > 0 && (
                    <div className="mt-4">
                        <div className="text-xs font-semibold text-gray-600 mb-1">
                            customAssignments (debug)
                        </div>
                        <pre className="text-[10px] bg-gray-100 rounded p-2 overflow-x-auto max-h-40">
                            {JSON.stringify(customAssignments, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AssignmentBreakdownModal(props) {
    if (!props.isOpen) return null;
    return <AssignmentBreakdownModalInner {...props} />;
}

