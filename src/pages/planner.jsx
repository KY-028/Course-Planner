import { Link } from "react-router-dom";

export default function Planner() {
    return (
        <div class="w-full">
            <div class="flex bg-white h-screen">
                <div class="flex items-center text-center lg:text-left px-8 md:px-12 lg:w-1/2">
                    <div>
                        <span class="text-2xl font-semibold text-gray-800 md:text-4xl">⏰ Coming<span class="ml-2 text-blue-600">Soon</span> ⏰</span>
                        <h1 class="py-5 text-5xl font-semibold text-gray-800 md:text-6xl">Plan Req<span class="text-blue-600"> Planner</span></h1>
                        <p class="mt-2 text-sm text-gray-500 md:text-lg"><Link to="/" className="text-blue-600">CoursePlanner</Link> is the best free online website to generate cool and stylish timetable. This Plan Req Planner Feature is currently under construction. But please come back to see its deployment in July!</p>
                        <div class="flex space-x-3 justify-center lg:justify-start mt-6">
                            <Link to="/course-selection" class="flex bg-blue-500 lg:h-12 h-8 w-fit px-0.5  py-2 font-semibold text-white items-center rounded whitespace-nowrap">
                                <svg fill="#FFFFFF" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg"
                                    width="800px" height="800px" viewBox="0 0 299.021 299.021" className="z-30 w-[10%] h-full mx-2  object-contain">
                                    <g>
                                        <g>
                                            <path d="M292.866,254.432c-2.288,0-4.443-1.285-5.5-3.399c-0.354-0.684-28.541-52.949-146.169-54.727v51.977
                                            c0,2.342-1.333,4.48-3.432,5.513c-2.096,1.033-4.594,0.793-6.461-0.63L2.417,154.392C0.898,153.227,0,151.425,0,149.516
                                            c0-1.919,0.898-3.72,2.417-4.888l128.893-98.77c1.87-1.426,4.365-1.667,6.461-0.639c2.099,1.026,3.432,3.173,3.432,5.509v54.776
                                            c3.111-0.198,7.164-0.37,11.947-0.37c43.861,0,145.871,13.952,145.871,143.136c0,2.858-1.964,5.344-4.75,5.993
                                            C293.802,254.384,293.34,254.432,292.866,254.432z"/>
                                        </g>
                                    </g>
                                </svg>
                                <div className="w-[90%] lg:text-lg text-base mx-2">Back to Course Selection Page</div>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block lg:w-1/2">
                    <div
                        className="h-full object-cover"
                        style={{
                            backgroundImage: 'url(https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1400&q=80)'
                        }}
                    >
                        <div className="h-full bg-blue-500 opacity-50"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}