import React, { useState, useEffect } from 'react'

const Grids = ({ users }) => {

    return (

        <div className="grid grid-cols-1 gap-4 gap-y-8  py-12 md:grid-cols-2 lg:grid-cols-3" >
            {
                users.map((user) => (
                    <div className="rounded-md border" key={user.name}>
                        <img
                            src={user.image}
                            alt={user.name}
                            className="h-[300px] w-full rounded-lg object-cover "
                        />
                        <p className="mt-6 w-full px-2 text-xl  font-semibold text-gray-900">{user.name}</p>
                        <p className="w-full px-2 pb-6 text-sm font-semibold text-gray-500">
                            {user.position}
                        </p>
                    </div>
                ))
            }
        </div>

    )
}

export default Grids;