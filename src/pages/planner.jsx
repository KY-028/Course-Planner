import { Link } from "react-router-dom";
import { useState, useEffect } from 'react';
import LeftMenu from '/src/components/leftMenu';
import Nav from '/src/components/nav';
import DonateBanner from '/src/components/donatebanner';
import TakenGrid from '/src/components/takenGrid';
import SelectPlan from '/src/components/selectPlan';

function WelcomeModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50" style={{ zIndex: 1000000 }}>
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Welcome to Plan Requirements Planner!</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4 text-gray-700">
                    <p className="text-md">
                        This feature is designed to helps you visualize how much of your plan requirements you have completed.
                    </p>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-sm">
                        <h3 className="font-semibold text-blue-800 mb-2">Getting Started:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-blue-700">
                            <li>Search for your plan OR paste academic calendar link (Instruction below)</li>
                            <li>Fill in your courses in the grid</li>
                            <li>Select a sub-plan (if applicable) by clicking on "Details"</li>
                            <li>Re-assign a course to fill different or multiple requirements inside of "Details"</li>
                            <li>Make sure to hit "save" before you close the browser/switch tabs!</li>
                        </ol>
                    </div>
                    <div className="text-sm">
                        <h3 className="font-semibold mb-2">Guide: Searching your plan in Academic Calendar:</h3>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Visit the <a href="https://www.queensu.ca/academic-calendar" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Queen's Academic Calendar</a>
                                &nbsp;OR the <a href="https://www.queensu.ca/academic-calendar/archive/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Archived Calendars</a>&nbsp;for upper years.</li>
                            <li>Find your faculty and click on "Departments/Schools and Degree Plans"</li>
                            <li>Find your plan (Specialization, Major, Minor, etc.) and paste the URL in the text field.</li>
                        </ol>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
                        <h3 className="font-semibold text-yellow-800 mb-2">Important Disclaimer:</h3>
                        <p className="text-yellow-700">
                            We do NOT guarantee the accuracy of this tool. The assignments are only made for
                            exact course code matches. This tool is meant to be a helpful guide, but always consult with your academic advisor
                            for official degree requirements and planning.
                        </p>
                    </div>

                    {/* <p className="text-sm text-gray-600">
                    </p> */}



                </div>

                <div className="mt-6 flex justify-end text-sm">
                    <button
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        I understand!
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Planner() {

    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);

    useEffect(() => {
        // Show welcome modal on first visit
        // You could add localStorage logic here to only show once
    }, []);

    const [coursesTaken, setCoursesTaken] = useState(Array(60).fill(null));

    return (
        <div className='grid xl:grid-cols-sidebar-lg lg:grid-cols-sidebar min-h-screen overflow-y-auto'>
            <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} />

            <div className='relative lg:block hidden '>
                <div className='absolute top-0 left-0'>
                    <LeftMenu activeTab="planner" />
                </div>
            </div>

            <div className='flex flex-col w-full'>
                <Nav activeTab="planner" />
                <DonateBanner />

                <div className='w-full flex md-custom:flex-row flex-col-reverse gap-3'>
                    <div className='m-4 p-0 md-custom:w-[70%] w-full'>
                        <div className='text-center text-2xl font-bold mb-2 lg:mt-0 mt-2'>Courses Taken</div>
                        <TakenGrid coursesTaken={coursesTaken} setCoursesTaken={setCoursesTaken} />
                    </div>
                    <div className='m-4 md-custom:ml-0 p-0 md-custom:w-[30%] w-full flex flex-col'>
                        <SelectPlan coursesTaken={coursesTaken} setCoursesTaken={setCoursesTaken} />
                    </div>
                </div>
            </div>

        </div>

        // <div className="w-full">
        //     <div className="flex bg-white h-screen">
        //         <div className="flex items-center text-center lg:text-left px-8 md:px-12 lg:w-1/2">
        //             <div>
        //                 <span className="text-2xl font-semibold text-gray-800 md:text-4xl">⏰ Coming<span className="ml-2 text-blue-600">Soon</span> ⏰</span>
        //                 <h1 className="py-5 text-5xl font-semibold text-gray-800 md:text-6xl">Plan Req<span className="text-blue-600"> Planner</span></h1>
        //                 <p className="mt-2 text-sm text-gray-500 md:text-lg"><Link to="/" className="text-blue-600">CoursePlanner</Link> is the best free online website to generate cool and stylish timetable. This Plan Req Planner Feature is currently under construction. But please come back to see its deployment in July (For real this time)!</p>
        //                 <div className="flex space-x-3 justify-center lg:justify-start mt-6">
        //                     <Link to="/course-selection" className="flex bg-blue-500 lg:h-12 h-8 w-fit px-0.5  py-2 font-semibold text-white items-center rounded whitespace-nowrap">
        //                         <svg fill="#FFFFFF" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg"
        //                             width="800px" height="800px" viewBox="0 0 299.021 299.021" className="z-30 w-[10%] h-full mx-2  object-contain">
        //                             <g>
        //                                 <g>
        //                                     <path d="M292.866,254.432c-2.288,0-4.443-1.285-5.5-3.399c-0.354-0.684-28.541-52.949-146.169-54.727v51.977
        //                                     c0,2.342-1.333,4.48-3.432,5.513c-2.096,1.033-4.594,0.793-6.461-0.63L2.417,154.392C0.898,153.227,0,151.425,0,149.516
        //                                     c0-1.919,0.898-3.72,2.417-4.888l128.893-98.77c1.87-1.426,4.365-1.667,6.461-0.639c2.099,1.026,3.432,3.173,3.432,5.509v54.776
        //                                     c3.111-0.198,7.164-0.37,11.947-0.37c43.861,0,145.871,13.952,145.871,143.136c0,2.858-1.964,5.344-4.75,5.993
        //                                     C293.802,254.384,293.34,254.432,292.866,254.432z"/>
        //                                 </g>
        //                             </g>
        //                         </svg>
        //                         <div className="w-[90%] lg:text-lg text-base mx-2">Back to Course Selection Page</div>
        //                     </Link>
        //                 </div>
        //             </div>
        //         </div>
        //         <div className="hidden lg:block lg:w-1/2">
        //             <div
        //                 className="h-full object-cover"
        //                 style={{
        //                     backgroundImage: 'url(https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1400&q=80)'
        //                 }}
        //             >
        //                 <div className="h-full bg-blue-500 opacity-50"></div>
        //             </div>
        //         </div>
        //     </div>
        // </div>
    );
}