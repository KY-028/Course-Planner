const COURSES_PER_COLUMN = 12;
const GRID_COLUMNS = 5;
const GRID_ROWS = 12;
const GRID_SIZE = GRID_COLUMNS * GRID_ROWS;
const YEAR_COLUMNS = 4;

const SEASON_ORDER = { fall: 0, winter: 1, spring: 2, summer: 3 };

function parseTerm(termStr) {
    const match = String(termStr).trim().match(/^(\d{4})\s+(Fall|Winter|Spring|Summer)$/i);
    if (!match) return null;

    const calendarYear = parseInt(match[1], 10);
    const season = match[2].toLowerCase();
    const academicYearStart = season === 'fall' ? calendarYear : calendarYear - 1;

    return {
        term: termStr,
        calendarYear,
        season,
        academicYearStart,
        seasonOrder: SEASON_ORDER[season],
    };
}

function compareTerms(a, b) {
    const parsedA = parseTerm(a.term);
    const parsedB = parseTerm(b.term);

    if (!parsedA && !parsedB) return 0;
    if (!parsedA) return 1;
    if (!parsedB) return -1;

    if (parsedA.academicYearStart !== parsedB.academicYearStart) {
        return parsedA.academicYearStart - parsedB.academicYearStart;
    }

    return parsedA.seasonOrder - parsedB.seasonOrder;
}

function normalizeCourseEntry({ subject, number, grade, applyGradeFilter, applyFullYearFilter, description, units }) {
    if (applyGradeFilter && String(grade ?? '').trim().toUpperCase() === 'F') return null;

    const subjectStr = String(subject ?? '').trim();
    let numberStr = String(number ?? '').trim();
    if (!subjectStr || !numberStr) return null;

    if (applyFullYearFilter) {
        if (/A$/i.test(numberStr)) return null;
        if (/B$/i.test(numberStr)) numberStr = numberStr.slice(0, -1);
    }

    const code = `${subjectStr} ${numberStr}`.replace(/\s+/g, ' ').toUpperCase();
    const parsedUnits = units != null && units !== '' ? parseFloat(units) : null;

    return {
        code,
        title: description?.trim() || null,
        units: Number.isFinite(parsedUnits) ? parsedUnits : null,
    };
}

function normalizeCourse(course) {
    return normalizeCourseEntry({
        subject: course.subject,
        number: course.number,
        grade: course.grade,
        description: course.description,
        units: course.units,
        applyGradeFilter: true,
        applyFullYearFilter: true,
    });
}

function extractCoursesFromTerms(terms) {
    const sortedTerms = [...(terms || [])].sort(compareTerms);
    const courses = [];

    for (const termEntry of sortedTerms) {
        for (const course of termEntry.courses || []) {
            const normalized = normalizeCourse(course);
            if (normalized) {
                courses.push({ term: termEntry.term, ...normalized });
            }
        }
    }

    return { sortedTerms, courses };
}

function shouldUseTermLogic(termCount, courseCount) {
    if (termCount <= 4) return true;
    if (courseCount <= 35 && termCount <= 8) return true;
    return false;
}

function groupCoursesByAcademicYear(sortedTerms) {
    const groups = [];
    let currentKey = null;
    let currentGroup = [];

    for (const termEntry of sortedTerms) {
        const parsed = parseTerm(termEntry.term);
        const key = parsed?.academicYearStart ?? termEntry.term;

        if (key !== currentKey) {
            if (currentGroup.length > 0) groups.push(currentGroup);
            currentGroup = [];
            currentKey = key;
        }

        for (const course of termEntry.courses || []) {
            const normalized = normalizeCourse(course);
            if (normalized) currentGroup.push(normalized);
        }
    }

    if (currentGroup.length > 0) groups.push(currentGroup);

    return groups;
}

function getCourseLevel(code) {
    const numberPart = code.split(/\s+/)[1] ?? '';
    const digits = numberPart.replace(/[^0-9]/g, '');
    if (!digits) return 1;

    const numeric = parseInt(digits, 10);
    if (!Number.isFinite(numeric) || numeric <= 0) return 1;

    return Math.floor(numeric / 100) || 1;
}

function levelToColumn(level) {
    if (level <= 1) return 0;
    if (level === 2) return 1;
    if (level === 3) return 2;
    return 3;
}

function dedupeCourses(courses) {
    const seen = new Set();
    const result = [];

    for (const course of courses) {
        if (seen.has(course.code)) continue;
        seen.add(course.code);
        result.push(course);
    }

    return result;
}

function placeCoursesIntoColumns(courseGroups, startColumnForGroup) {
    const columns = Array.from({ length: YEAR_COLUMNS }, () => []);
    const seen = new Set();

    for (let groupIndex = 0; groupIndex < courseGroups.length; groupIndex++) {
        let column = Math.min(startColumnForGroup(groupIndex), YEAR_COLUMNS - 1);

        for (const course of courseGroups[groupIndex]) {
            if (seen.has(course.code)) continue;
            seen.add(course.code);

            while (column < YEAR_COLUMNS && columns[column].length >= COURSES_PER_COLUMN) {
                column += 1;
            }

            const targetColumn = Math.min(column, YEAR_COLUMNS - 1);
            columns[targetColumn].push(course);
        }
    }

    return columns;
}

function placeByTermLogic(academicYearGroups) {
    return placeCoursesIntoColumns(academicYearGroups, (groupIndex) => groupIndex);
}

function placeByLevelLogic(courses) {
    const buckets = [[], [], [], []];

    for (const course of dedupeCourses(courses)) {
        const column = levelToColumn(getCourseLevel(course.code));
        buckets[column].push(course);
    }

    return placeCoursesIntoColumns(buckets, (groupIndex) => groupIndex);
}

function columnsToCoursesTaken(columns) {
    const coursesTaken = Array(GRID_SIZE).fill(null);

    for (let column = 0; column < YEAR_COLUMNS; column++) {
        columns[column].forEach((course, row) => {
            if (row >= COURSES_PER_COLUMN) return;

            const index = column + row * GRID_COLUMNS;
            coursesTaken[index] = {
                code: course.code,
                title: course.title,
                units: course.units,
                planreq: null,
            };
        });
    }

    return coursesTaken;
}

export function processTranscriptToCoursesTaken(transcript) {
    const { sortedTerms, courses } = extractCoursesFromTerms(transcript?.terms);
    const termCount = sortedTerms.length;
    const courseCount = courses.length;

    const columns = shouldUseTermLogic(termCount, courseCount)
        ? placeByTermLogic(groupCoursesByAcademicYear(sortedTerms))
        : placeByLevelLogic(courses);

    return columnsToCoursesTaken(columns);
}

const GRADE_COLUMN_ALIASES = ['grade', 'grades', 'mark', 'marks', 'letter grade', 'final grade', 'letter'];

function parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values.map((value) => value.replace(/^"|"$/g, '').trim());
}

function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] ?? '';
        });
        return row;
    });

    return { headers, rows };
}

function findColumnName(headers, aliases) {
    const normalizedHeaders = headers.map((header) => header.toLowerCase().trim());

    for (const alias of aliases) {
        const exactIndex = normalizedHeaders.indexOf(alias);
        if (exactIndex !== -1) return headers[exactIndex];
    }

    for (const alias of aliases) {
        const partialIndex = normalizedHeaders.findIndex((header) => header.includes(alias));
        if (partialIndex !== -1) return headers[partialIndex];
    }

    return null;
}

function parseCourseField(raw) {
    const value = String(raw ?? '').trim();
    if (!value) return null;

    const compactMatch = value.match(/^([A-Za-z]+)\s*(\d+[A-Za-z]?)$/);
    if (compactMatch) {
        return { subject: compactMatch[1], number: compactMatch[2] };
    }

    const parts = value.split(/\s+/);
    if (parts.length >= 2) {
        return { subject: parts[0], number: parts.slice(1).join('') };
    }

    return null;
}

export function csvHasCourseColumn(text) {
    const { headers } = parseCsv(text);
    return Boolean(findColumnName(headers, ['course']));
}

export function processCsvToCoursesTaken(csvText) {
    const { headers, rows } = parseCsv(csvText);
    const courseColumn = findColumnName(headers, ['course']);

    if (!courseColumn) {
        throw new Error('CSV must include a column header named "Course".');
    }

    const gradeColumn = findColumnName(headers, GRADE_COLUMN_ALIASES);
    const hasGradeColumn = Boolean(gradeColumn);
    const courses = [];

    for (const row of rows) {
        const parsedCourse = parseCourseField(row[courseColumn]);
        if (!parsedCourse) continue;

        const normalized = normalizeCourseEntry({
            subject: parsedCourse.subject,
            number: parsedCourse.number,
            grade: hasGradeColumn ? row[gradeColumn] : undefined,
            applyGradeFilter: hasGradeColumn,
            applyFullYearFilter: !hasGradeColumn,
        });

        if (normalized) courses.push(normalized);
    }

    return columnsToCoursesTaken(placeByLevelLogic(courses));
}

export {
    normalizeCourse,
    shouldUseTermLogic,
    getCourseLevel,
    parseTerm,
    compareTerms,
};
