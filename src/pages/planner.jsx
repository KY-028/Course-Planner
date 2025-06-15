import { Link } from "react-router-dom";
import { useState } from 'react';
import LeftMenu from '/src/components/leftMenu';
import Nav from '/src/components/nav';
import DonateBanner from '/src/components/donatebanner';
import TakenGrid from '/src/components/takenGrid';
import SelectPlan from '/src/components/selectPlan';

export default function Planner() {

    const [coursesTaken, setCoursesTaken] = useState(Array(60).fill(null));

    return (
        <div className='grid xl:grid-cols-sidebar-lg lg:grid-cols-sidebar min-h-screen overflow-y-auto'>
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
                    <div className='m-4 md-custom:ml-0 p-0 md-custom:w-[30%] w-full border flex flex-col'>
                        <SelectPlan coursesTaken={coursesTaken} setCoursesTaken={setCoursesTaken} />
                    </div>
                </div>
            </div>

        </div>

    );
}