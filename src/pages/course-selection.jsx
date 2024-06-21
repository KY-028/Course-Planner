import LeftMenu from '/src/components/leftMenu'
import Calendar from '/src/components/calendar'
import Nav from '/src/components/nav'

export default function Courses() {
    return (

        <div className='grid xl:grid-cols-sidebar-lg lg:grid-cols-sidebar min-h-screen'>
            <div className='lg:flex hidden'>
                <LeftMenu activeTab="courses"/>
            </div>
            <div className='flex flex-col w-full'>
                <Nav activeTab="courses"/>
                <div className='w-full grid md-custom:grid-cols-2 grid-cols md-custom:mx-0 m-0 p-0 gap-3'>
                    <div className='m-0 p-0'>
                        <Calendar term="Fall"/>
                        {/* <div> Placeholder element</div> */}
                    </div>
                    <div className='m-0 p-0'>
                        <Calendar term="Winter"/>
                        {/* <div> Placeholder element</div> */}
                    </div>

                </div>
            </div>

        </div>

    );
}