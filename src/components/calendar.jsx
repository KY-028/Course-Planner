// src/components/Calendar.jsx

import React, { useState } from 'react';


const times = [
    { name: 'CISC 121', day: 'Tuesday', time: '9:30-10:30' },
    { name: 'CISC 121', day: 'Wednesday', time: '8:30-9:30' },
    { name: 'CISC 121', day: 'Friday', time: '10:30-11:30' },
    { name: 'MATH 121', day: 'Tuesday', time: '12:30-13:30' },
    { name: 'CISC 203', day: 'Tuesday', time: '18:30-21:30' },
    { name: 'MUSC 156', day: 'Thursday', time: '10:00-11:30' },
    
];

const dayOfWeek = new Date().getDay();
const startingHour = 8;


const Calendar = (props) => {
  return (
    <div className="lg:m-4 m-2 lg:text-base md-custom:text-sm sm:text-base text-sm">
        <div className="grid grid-cols-table text-center text-gray-700">
            <div className={`relative border-b-2 lg:pb-2 pb-1 border-dark-blue w-full text-right lg:pr-2 pr-0.5 font-bold`}>
                <div className='absolute sm:right-2 right-0.5'>
                    {props.term}
                </div>
            </div>
            <div className={`border-b-2 pb-2 border-dark-blue ${dayOfWeek === 1 ? "font-bold text-bright-blue" : ""}`}>MON</div>
            <div className={`border-b-2 pb-2 border-dark-blue ${dayOfWeek === 2 ? "font-bold text-bright-blue" : ""}`}>TUE</div>
            <div className={`border-b-2 pb-2 border-dark-blue ${dayOfWeek === 3 ? "font-bold text-bright-blue" : ""}`}>WED</div>
            <div className={`border-b-2 pb-2 border-dark-blue ${dayOfWeek === 4 ? "font-bold text-bright-blue" : ""}`}>THU</div>
            <div className={`border-b-2 pb-2 border-dark-blue ${dayOfWeek === 5 ? "font-bold text-bright-blue" : ""}`}>FRI</div>
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
        <div className="grid grid-cols-table relative h-12">
            <div className='relative h-12 border-r-2'>
                <div className='absolute md:right-2 right-1 -top-3'>
                    {startingHour}:00
                </div>
            </div>
            <div className="col-span-1 border-r-2 relative">
                {times.map((event, index) => {
                    if (event.day !== 'Monday') return null;
                    return (
                        <div key={index}>
                            <Slot time={event.time} name={event.name} />
                        </div>
                    );
                })}
            </div>
            <div className="col-span-1 border-r-2 relative">
                {times.map((event, index) => {
                    if (event.day !== 'Tuesday') return null;
                    return (
                        <div key={index}>
                            <Slot time={event.time} name={event.name} />
                        </div>
                    );
                })}
            </div>
            <div className="col-span-1 border-r-2 relative">
                {times.map((event, index) => {
                    if (event.day !== 'Wednesday') return null;
                    return (
                        <div key={index}>
                            <Slot time={event.time} name={event.name} />
                        </div>                    );
                })}
            </div>
            <div className="col-span-1 border-r-2 relative">
                {times.map((event, index) => {
                    if (event.day !== 'Thursday') return null;
                    return (
                        <div key={index}>
                            <Slot time={event.time} name={event.name} />
                        </div>
                    );
                })}
            </div>
            <div className="col-span-1 border-r-2 relative">
                {times.map((event, index) => {
                    if (event.day !== 'Friday') return null;
                    return (
                        <div key={index}>
                            <Slot time={event.time} name={event.name} />
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Every other row */}
        {[...Array(12)].map((_, i) => (
            <div key={i+1} className="grid grid-cols-table relative h-12">
                <div className='relative h-12 border-r-2'>
                    <div className='absolute md:right-2 right-1 -top-2.5'>
                        {startingHour+i+1}:00
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

        <div className="grid grid-cols-table  relative h-12">
            <div className='relative h-12 border-r-2'>
                <div className='absolute md:right-2 right-1 -top-2.5'>
                    {startingHour+13}:00
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

const Slot = ({ time, name }) => {
    const [start, end] = time.split('-');
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const totalMinutes = (startHour-8) * 60 + startMinute;
    const endTotalMinutes = (endHour-8) * 60 + endMinute;
    const topPosition = (totalMinutes / 60) * 3;
    const durationMinutes = endTotalMinutes - totalMinutes;
    const height = (durationMinutes / 60) * 3;

    return (
        <div
            className="z-10 absolute left-0 w-full"
            style={{ top: `${topPosition}rem`, height: `${height}rem` }}
        >
            <div className="bg-blue-100 text-blue-500 lg:mx-4 md:mx-0 sm:mx-1 mx-0 sm:p-1 pt-0.5 rounded h-full box-border">
                <div className='flex flex-col'>
                    <p className='xl:text-sm lg:text-small md-custom:text-xs sm:text-sm hidden font-bold'>
                        {time}
                    </p>
                    <p className='text-xs font-bold'>
                        {start}
                    </p>
                    <p className='xl:text-sm lg:text-small md-custom:text-xs sm:text-sm text-xs'>
                        {name}
                    </p>
                </div>
            </div>
        </div>
    )
}


export default Calendar;
