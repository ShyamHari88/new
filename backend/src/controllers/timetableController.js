
import Timetable from '../models/Timetable.js';

// Get timetable for a specific class
export const getClassTimetable = async (req, res) => {
    try {
        const { departmentId, year, section } = req.query;
        if (!departmentId || !year || !section) {
            return res.status(400).json({ message: 'Please provide departmentId, year, and section' });
        }

        const timetable = await Timetable.find({ departmentId, year: parseInt(year), section });
        res.json({ success: true, timetable });
    } catch (error) {
        console.error('Get timetable error:', error);
        res.status(500).json({ message: 'Error fetching timetable', error: error.message });
    }
};

// Update/Create timetable for a class
export const updateClassTimetable = async (req, res) => {
    try {
        const { departmentId, year, section, days } = req.body;
        // days is an array of { day: 'Monday', periods: [...] }

        if (!departmentId || !year || !section || !days || !Array.isArray(days)) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const results = [];

        for (const dayData of days) {
            const { day, periods } = dayData;

            // Upsert (update or insert)
            const updated = await Timetable.findOneAndUpdate(
                { departmentId, year: parseInt(year), section, day },
                { periods },
                { new: true, upsert: true }
            );
            results.push(updated);
        }

        res.json({ success: true, message: 'Timetable updated successfully', results });
    } catch (error) {
        console.error('Update timetable error:', error);
        res.status(500).json({ message: 'Error updating timetable', error: error.message });
    }
};

// Get teacher's timetable
export const getTeacherTimetable = async (req, res) => {
    try {
        // This is a bit complex as we need to search within the periods array
        // Assuming we store teacherId or teacher name in periods.
        // For now, let's assume filtering by teacherId if you implement strict linking.
        // If simply storing names, we might search by regex, but robust way is teacherId.

        const { teacherId } = req.params; // or req.user.teacherId

        // Find all timetables where any period has this teacherId
        const timetables = await Timetable.find({ "periods.teacherId": teacherId });

        res.json({ success: true, timetables });
    } catch (error) {
        console.error('Get teacher timetable error:', error);
        res.status(500).json({ message: 'Error fetching teacher timetable', error: error.message });
    }
};
