import React from 'react'
import HomeNav from '/src/components/homenav'
import LeftMenu from '../components/leftMenu'

function Home() {
    return (
        <div>
            <HomeNav />
            // The rest of the Home Components
            <LeftMenu activeTab={'home'}/>
        </div>
    )
}

export default Home