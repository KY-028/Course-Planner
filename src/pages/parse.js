// async function fetchData(url) {
//     try {
//     const response = await fetch(url);
//     if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     const text = await response.text();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(text, 'text/html');
//     return doc;
//     } catch (error) {
//     console.error('Error fetching data:', error);
//     }
// }

// async function scrapeData() {
//     const url = "https://www.queensu.ca/academic-calendar/arts-science/course-descriptions/arin/";
//     const doc = await fetchData(url);

//     if (doc) {
//     // Example: Extract course descriptions
//     const courses = doc.querySelectorAll('.courseblock');
//     courses.forEach(course => {
//         const title = course.querySelector('.courseblocktitle').textContent.trim();
//         const description = course.querySelector('.courseblockdesc').textContent.trim();
//         console.log('Title:', title);
//         console.log('Description:', description);
//     });
//     }
// }

// scrapeData();
