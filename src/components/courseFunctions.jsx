
export function generateSelections() {

    const selections = [];
    const generateOptions = (courseBaseId, coursemaster) => {
        const sectionKeys = Object.keys(coursemaster).filter(key => key.startsWith(courseBaseId));
        return sectionKeys.map(key => {
            return `Section ${key.split('_')[1]}: ${formatDays(coursemaster[key].slice(2))}`;
        }).sort();
    };

    const formatDays = (sessions) => {
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

    return selections;

}

export function generateOptions(courseBaseId, coursemaster) {

    const sectionKeys = Object.keys(coursemaster).filter(key => key.startsWith(courseBaseId));

    return sectionKeys.map(key => {
        return `Section ${key.split('_')[1]}: ${formatDays(coursemaster[key].slice(2))}`;
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
        options: generateOptions(courseDetail[0], courseData),
        selectedOption: `Section ${id.split('_')[1]}: ${formatDays(courseData[id].slice(2))}`,
    };
    return newCourse;

}