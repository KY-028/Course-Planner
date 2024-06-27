import { db } from "../db.js";

export const courseChange = async (req, res) => {
    const { userId, courses_ids, term } = req.body;

    if (!userId || !Array.isArray(courses_ids) || !term) {
        return res.status(400).send('Invalid input');
    }

    const maxCourses = 15; 

    try {
        // Clear existing courses for the specified term
        let clearQuery = 'UPDATE users SET ';
        for (let i = 1; i <= maxCourses; i++) {
            clearQuery += `${term}Course${i} = NULL, `;
        }
        clearQuery = clearQuery.slice(0, -2) + ' WHERE id = ?';
        console.log('Clear Query:', clearQuery, [userId]);
        await db.execute(clearQuery, [userId]);

        // Construct the update query for new courses
        let updateQuery = 'UPDATE users SET ';
        const updateValues = [];
        if (courses_ids.length > 0) {
            courses_ids.forEach((courseId, index) => {
                updateQuery += `${term}Course${index + 1} = ?, `;
                updateValues.push(courseId);
            });
            updateQuery = updateQuery.slice(0, -2);
            updateQuery += ' WHERE id = ?';
            updateValues.push(userId);


            console.log('Update Query:', updateQuery, updateValues);
            const [result] = await db.execute(updateQuery, updateValues);
            if (result.affectedRows === 0) {
                return res.status(404).send('User not found');
            }
            res.status(200).send('Courses updated successfully');
            }

    } catch (error) {
        console.error('Error updating courses:', error);
        res.status(500).send('Error updating courses: ' + error.message);
    }
    
};
