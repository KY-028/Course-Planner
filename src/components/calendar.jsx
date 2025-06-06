// src/components/Calendar.jsx

import React, { useState, useEffect } from 'react';
import linkIcon from '/src/assets/ext-link.png';


const initialColors = [
    "bg-blue-100 text-blue-500",
    "bg-red-100 text-red-500",
    "bg-yellow-100 text-yellow-700",
    "bg-purple-100 text-purple-600",
    "bg-green-100 text-green-600",
    "bg-indigo-100 text-indigo-600",
    "bg-pink-100 text-pink-600",
    "bg-orange-100 text-orange-600",
    "bg-lime-100 text-lime-700",
    // Add more colors as needed
];

const dayOfWeek = new Date().getDay();
const startingHour = 8;


const Calendar = (props) => {
    const [colors, setColors] = useState(initialColors);
    const [courseColors, setCourseColors] = useState({});
    const [times, setTimes] = useState([]);  // State to hold parsed times


    useEffect(() => {
        if (props.times && Array.isArray(props.times)) {
            const processedTimes = props.times
                .filter(timeString => timeString.trim().length !== 0 && timeString.trim().split(' ').length >= 3)
                .map(timeString => {
                    const parts = timeString.trim().split(' ');
                    const name = parts[0];
                    const we = parts[1];
                    const day = parts[2];
                    const time = parts[3];
                    const profName = parts.slice(4,).join(" ");
                    const [startHour, startMinute] = time.split('-')[0].split(':').map(Number);
                    const [endHour, endMinute] = time.split('-')[1].split(':').map(Number);
                    const startTime = startHour * 60 + startMinute;
                    const endTime = endHour * 60 + endMinute;
                    return { name, we, day, time, startTime, endTime, profName };
                });

            setTimes(processedTimes); // Update state with processed times
            checkForConflicts(processedTimes);  // Check and update conflicts
        }
    }, [props.times]); // Dependency array includes props.times


    const checkForConflicts = (processedTimes) => {
        const newConflicts = new Set();  // Use a set to automatically handle duplicates
        processedTimes.forEach((current, index, array) => {
            for (let i = 0; i < array.length; i++) {
                if (i !== index && current.day === array[i].day) {  // Check only against other classes on the same day
                    const slot = array[i];
                    if (((current.startTime < slot.endTime && current.endTime > slot.startTime) ||
                        (current.endTime > slot.startTime && current.startTime < slot.endTime)) &&
                        !(current.startTime === slot.endTime || current.endTime === slot.startTime)) {
                        // Ensure consistent ordering of course names in the string
                        const sortedNames = [current.name, slot.name].sort();
                        const conflictString = `${sortedNames[0]} and ${sortedNames[1]}`;
                        newConflicts.add(conflictString);  // Add to set, duplicates are automatically ignored
                    }
                }
            }
        });
        props.setConflicts([...newConflicts]);  // Directly set the new conflicts
    };


    const isConflict = (event, slots) => {
        const [startHour, startMinute] = event.time.split('-')[0].split(':').map(Number);
        const [endHour, endMinute] = event.time.split('-')[1].split(':').map(Number);
        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        return slots.some(slot => {
            if (slot !== event && slot.day === event.day) {
                return ((startTime < slot.endTime && endTime > slot.startTime) ||
                    (endTime > slot.startTime && startTime < slot.endTime)) &&
                    !(startTime === slot.endTime || endTime === slot.startTime);
            }
            return false;
        });
    };

    const renderSlots = (day) => {

        return times.filter(event => event.day === day).map((event, index) => {

            const conflict = isConflict(event, times);
            const color = conflict ? 'border-black border-2 bg-red-800 bg-opacity-70 text-white' : getColor(event.name);


            return (
                <div key={index}>
                    <Slot time={event.time} name={event.name} color={color} west={event.we} profName={event.profName} />
                </div>
            );
        });
    };

    const getColor = (courseName) => {
        if (courseName in courseColors) {
            return courseColors[courseName];
        }

        if (colors.length === 0) {
            return null; // No colors left
        }

        const randomIndex = Math.floor(Math.random() * colors.length);
        const selectedColor = colors[randomIndex];
        setColors(colors.filter((_, index) => index !== randomIndex));
        setCourseColors({ ...courseColors, [courseName]: selectedColor });
        return selectedColor;
    };


    return (
        <div className="lg:m-4 m-2 lg:text-base md-custom:text-sm sm:text-base text-sm">
            <div className="grid grid-cols-table text-center text-gray-700">
                <div className={`relative lg:pb-2 pb-1 border-dark-blue w-full text-right lg:pr-2 pr-0.5 font-bold`}>
                    <div className=' text-dark-blue font-extrabold absolute xl:right-2 lg:right-1 sm:right-2 right-0.5'>
                        {props.term}
                    </div>
                </div>
                <div className={` pb-2 border-dark-blue ${dayOfWeek === 1 ? "font-bold text-dark-blue border-b-2" : ""}`}>MON</div>
                <div className={` pb-2 border-dark-blue ${dayOfWeek === 2 ? "font-bold text-dark-blue border-b-2" : ""}`}>TUE</div>
                <div className={` pb-2 border-dark-blue ${dayOfWeek === 3 ? "font-bold text-dark-blue border-b-2" : ""}`}>WED</div>
                <div className={` pb-2 border-dark-blue ${dayOfWeek === 4 ? "font-bold text-dark-blue border-b-2" : ""}`}>THU</div>
                <div className={` pb-2 border-dark-blue ${dayOfWeek === 5 ? "font-bold text-dark-blue border-dark-blue border-b-4" : ""}`}>FRI</div>
            </div>

            {/* For the extra space */}
            <div className="grid grid-cols-table relative h-4">
                <div className='border-r-2 '></div>
                <div className='border-r-2 border-b-2'></div>
                <div className='border-r-2 border-b-2'></div>
                <div className='border-r-2 border-b-2'></div>
                <div className='border-r-2 border-b-2'></div>
                <div className='border-r-2 border-b-2'></div>
            </div>

            {/* The top row */}
            <div className="grid grid-cols-table relative xl:h-14 h-12">
                <div className='relative xl:h-14 h-12 border-r-2'>
                    <div className='text-gray-500 absolute xl:right-2 lg:right-1 md:right-2 right-1 -top-3'>
                        {startingHour}:00
                    </div>
                </div>
                <div className="col-span-1 border-r-2 relative">
                    {renderSlots('Monday')}
                </div>
                <div className="col-span-1 border-r-2 relative">
                    {renderSlots('Tuesday')}
                </div>
                <div className="col-span-1 border-r-2 relative">
                    {renderSlots('Wednesday')}
                </div>
                <div className="col-span-1 border-r-2 relative">
                    {renderSlots('Thursday')}
                </div>
                <div className="col-span-1 border-r-2 relative">
                    {renderSlots('Friday')}
                </div>
            </div>

            {/* Every other row */}
            {[...Array(12)].map((_, i) => (
                <div key={i + 1} className="grid grid-cols-table relative xl:h-14 h-12">
                    <div className='relative xl:h-14 h-12 border-r-2'>
                        <div className=' text-gray-500 absolute xl:right-2 lg:right-1 md:right-2 right-1 -top-2.5'>
                            {startingHour + i + 1}:00
                        </div>
                    </div>
                    <div className="col-span-1 border-t-2 border-r-2 relative">
                    </div>
                    <div className="col-span-1 border-t-2 border-r-2 relative">
                    </div>
                    <div className="col-span-1 border-t-2 border-r-2 relative">
                    </div>
                    <div className="col-span-1 border-t-2 border-r-2 relative">
                    </div>
                    <div className="col-span-1 border-r-2 border-t-2 relative">
                    </div>
                </div>
            ))}

            <div className="grid grid-cols-table  relative xl:h-14 h-12">
                <div className='relative xl:h-14 h-12 border-r-2'>
                    <div className='text-gray-500 absolute xl:right-2 lg:right-1 md:right-2 right-1 -top-2.5'>
                        {startingHour + 13}:00
                    </div>
                </div>
                <div className="col-span-1 border-t-2 border-r-2 border-b-2 relative">
                </div>
                <div className="col-span-1 border-t-2 border-r-2 border-b-2 relative">
                </div>
                <div className="col-span-1 border-t-2 border-r-2 border-b-2 relative">
                </div>
                <div className="col-span-1 border-t-2 border-r-2 border-b-2 relative">
                </div>
                <div className="col-span-1 border-t-2 border-r-2 border-b-2 relative">
                </div>
            </div>

        </div>
    );
};

const styles = {
    container: (isWide, totalMinutes, durationMinutes, startMinutes) => ({
        top: isWide ? `${(totalMinutes / 60) * 3.5}rem` : `${(totalMinutes / 60) * 3}rem`,
        height: isWide ? `${(durationMinutes / 60) * 3.5}rem` : `${(durationMinutes / 60) * 3}rem`,
        zIndex: Math.round(1000 + startMinutes - (durationMinutes / 60)),
    })
};


const Slot = ({ time, name, color, west, profName }) => {
    const mediaMatch = window.matchMedia('(min-width: 1280px)');
    const [matches, setMatches] = useState(mediaMatch.matches);

    useEffect(() => {
        const handler = e => setMatches(e.matches);
        mediaMatch.addListener(handler);
        return () => mediaMatch.removeListener(handler);
    });

    const [start, end] = time.split('-');
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const totalMinutes = (startHour - 8) * 60 + startMinute;
    const endTotalMinutes = (endHour - 8) * 60 + endMinute;

    const durationMinutes = endTotalMinutes - totalMinutes;

    return (
        <div
            className="z-10 absolute left-0 w-full py-0.5 drop-shadow-md"
            style={styles.container(matches, totalMinutes, durationMinutes, (startHour * 60 + startMinute))}
        >
            <div className={`${color} 2xl:px-1.5 xl:px-1 lg:px-0.5 md-custom:px-1 sm:px-1 px-0.5 sm:mx-0.5 rounded h-full box-border`}>
                <div className='flex flex-col'>
                    <p className='sm:block hidden 2xl:text-sm xl:text-xs lg:text-xxxs lg-custom:text-xxs md-custom:text-xxxs text-xs 2xl:mt-0.5 xl:mt-0.5 lg:-mt-0 md-custom:-mt-0.5 mt-0.25 font-bold'>
                        {time}
                    </p>
                    <p className='sm:hidden relative text-xs mt-0.25 font-bold'>
                        {start}
                    </p>
                    <p className='2xl:text-sm xl:text-xs lg:text-xxs md-custom:text-xxxs text-xs xl:-mt-0.5 lg:-mt-1 md-custom:-mt-1.5 -mt-0.5'>
                        {name}
                    </p>

                    <div className="absolute left-0 w-full h-full flex items-center justify-center transition-opacity duration-300 opacity-0 hover:opacity-100">
                        <div className='absolute bottom-full bg-dark-blue text-white rounded px-3 py-1 pr-6 text-sm text-nowrap'
                            style={{
                                bottom: '108%',
                                zIndex: 100000
                            }}>
                            {profName.toLowerCase() !== "staff" ? (
                                <a className='flex items-center' href={`https://www.ratemyprofessors.com/search/professors/1466?q=${profName.split(",").reverse().join(" ").trim()}`} target="_blank" rel="noopener noreferrer">
                                    <img src={linkIcon} alt="Icon" className="mr-2" style={{ height: '1em' }} />
                                    {profName.split(",").reverse().join(" ").trim()}
                                </a>
                            ) : (
                                <span className="flex items-center">
                                    <span className="pl-3">Staff</span>
                                </span>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            {west === 'W' && (
                <div className='absolute md-custom:bottom-1.5 md-custom:right-1.5 bottom-0 right-1.5 xl:font-bold lg:text-xs text-xxs cursor-help text-red-600' style={{ zIndex: 10000000 }}
                    onClick={() => alert('This class is on west campus!')}>
                    {/* <img src={"./exclamation.svg"} alt="!" /> */}
                    W
                </div>
            )}
        </div>
    )
}


export default Calendar;
