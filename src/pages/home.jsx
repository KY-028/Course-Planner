import React from 'react'
import HomeNav from '/src/components/homenav'
import Calendar from '/src/components/calendar'

function Home() {
    return (
        <>
            <HomeNav />
            <div className='grid lg:grid-cols-sidebar'>
                <div>20%</div>
                <div className='grid md-custom:grid-cols-2 grid-rows md-custom:mx-0 mx-2 gap-3'>
                    {/* <div className='border-r-2 border-dark-blue'>
                        Your sidebar
                    </div> */}
                    <div>
                        <Calendar term="Fall"/>
                        {/* <div> Placeholder element</div> */}
                    </div>
                    <div>
                        <Calendar term="Winter"/>
                        {/* <div> Placeholder element</div> */}
                    </div>

                </div>

            </div>
            
        </>
    )
}

export default Home