import LeftMenu from '/src/components/leftMenu'
import Calendar from '/src/components/calendar'
import Nav from '/src/components/nav'

const falltimes = [
    { name: 'CISC 322', day: 'Tuesday', time: '8:30-9:30' },
    { name: 'CISC 322', day: 'Wednesday', time: '10:30-11:30' },
    { name: 'CISC 322', day: 'Friday', time: '9:30-10:30' },
    { name: 'CISC 322', day: 'Monday', time: '14:30-16:30' },
    // { name: 'CISC 322-2', day: 'Wednesday', time: '15:30-17:30' },
    { name: 'CISC 324', day: 'Tuesday', time: '9:30-10:30' },
    { name: 'CISC 324', day: 'Thursday', time: '8:30-9:30' },
    { name: 'CISC 324', day: 'Friday', time: '10:30-11:30' },
    { name: 'CISC 327', day: 'Monday', time: '9:30-10:30' },
    { name: 'CISC 327', day: 'Wednesday', time: '8:30-9:30' },
    { name: 'CISC 327', day: 'Thursday', time: '10:30-11:30' },
    { name: 'CISC 360', day: 'Monday', time: '11:30-12:30' },
    { name: 'CISC 360', day: 'Tuesday', time: '13:30-14:30' },
    { name: 'CISC 360', day: 'Thursday', time: '12:30-13:30' },
    { name: 'CISC 371', day: 'Monday', time: '13:30-14:30' },
    { name: 'CISC 371', day: 'Wednesday', time: '12:30-13:30' },
    { name: 'CISC 371', day: 'Friday', time: '11:30-12:30' },
    
    { name: 'FREN 219', day: 'Monday', time: '16:00-17:30' },
    // { name: 'FREN 219', day: 'Wednesday', time: '14:30-16:30' },
];

const wintertimes = [
    { name: 'CISC 332', day: 'Tuesday', time: '8:30-9:30' },
    { name: 'CISC 332', day: 'Wednesday', time: '10:30-11:30' },
    { name: 'CISC 332', day: 'Friday', time: '9:30-10:30' },
    { name: 'CISC 335', day: 'Monday', time: '11:30-12:30' },
    { name: 'CISC 335', day: 'Tuesday', time: '13:30-14:30' },
    { name: 'CISC 335', day: 'Thursday', time: '12:30-13:30' },
    { name: 'CISC 352', day: 'Tuesday', time: '9:30-10:30' },
    { name: 'CISC 352', day: 'Thursday', time: '8:30-9:30' },
    { name: 'CISC 352', day: 'Friday', time: '10:30-11:30' },
    { name: 'CISC 365', day: 'Tuesday', time: '12:30-13:30' },
    { name: 'CISC 365', day: 'Thursday', time: '11:30-12:30' },
    { name: 'CISC 365', day: 'Friday', time: '13:30-14:30' },
    { name: 'STAT 362', day: 'Monday', time: '13:30-14:30' },
    { name: 'STAT 362', day: 'Wednesday', time: '12:30-13:30' },
    { name: 'STAT 362', day: 'Friday', time: '11:30-12:30' },
    { name: 'FREN 219', day: "Friday", time: "10:30-12:00"},
]

export default function Courses() {
    return (

        <div className='grid xl:grid-cols-sidebar-lg lg:grid-cols-sidebar min-h-screen overflow-y-auto'>
            <div className='relative lg:block hidden'>
                <div className='absolute top-0 left-0'>
                    <LeftMenu activeTab="courses"/>
                </div>
            </div>

            <div className='flex flex-col w-full'>
                <Nav activeTab="courses"/>
                <div className='w-full grid md-custom:grid-cols-2 grid-cols md-custom:mx-0 m-0 p-0 gap-3'>
                    <div className='m-0 p-0'>
                        <Calendar term="Fall" times={falltimes} />
                        {/* <div> Placeholder element</div> */}
                    </div>
                    <div className='m-0 p-0'>
                        <Calendar term="Winter" times={wintertimes} />
                        {/* <div> Placeholder element</div> */}
                    </div>

                </div>
            </div>

        </div>

    );
}