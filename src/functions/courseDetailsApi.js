import axios from 'axios';

export async function fetchCourseDetailsByCode(courseCode, apiUrl) {
    const formattedCode = courseCode.replace(/\s+/g, '%20');
    const response = await axios.get(`${apiUrl}/backend/courseDetails?courseCode=${formattedCode}`);
    return {
        title: response.data?.title || null,
        units: response.data?.units ?? 3.0,
    };
}

export async function enrichCoursesTakenWithDetails(coursesTaken, apiUrl) {
    const updated = [...coursesTaken];
    const indices = updated
        .map((course, index) => (course?.code ? index : null))
        .filter((index) => index !== null);

    await Promise.all(
        indices.map(async (index) => {
            try {
                const details = await fetchCourseDetailsByCode(updated[index].code, apiUrl);
                updated[index] = {
                    ...updated[index],
                    title: details.title,
                    units: details.units,
                };
            } catch (error) {
                console.error(`Error fetching details for ${updated[index].code}:`, error);
                updated[index] = {
                    ...updated[index],
                    title: updated[index].title || null,
                    units: updated[index].units ?? null,
                };
            }
        })
    );

    return updated;
}
