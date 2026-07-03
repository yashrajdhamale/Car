    import React from "react";
    import { Link } from "react-router-dom";

    const SiteMap = () => {
        return (
            <div className="bg-gray-100 min-h-screen py-8">
                <div className="container mx-auto px-4">
                    {/* Main Section */}
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Main Section</h2>
                        <ul className="flex gap-10">
                            <li className="mb-2">
                                <Link className="text-black font-semibold hover:bg-black hover:text-white px-2 py-1 rounded" to="/">Home</Link>
                            </li>
                            <li className="mb-2">
                                <Link className="text-black font-semibold hover:bg-black hover:text-white px-2 py-1 rounded" to="/about">About</Link>
                            </li>
                            <li className="mb-2">
                                <Link className="text-black font-semibold hover:bg-black hover:text-white px-2 py-1 rounded" to="/contact">Contact</Link>
                            </li>
                            <li className="mb-2">
                                <Link className="text-black font-semibold hover:bg-black hover:text-white px-2 py-1 rounded" to="/blog">Blog</Link>
                            </li>
                            <li className="mb-2">
                                <Link className="text-black font-semibold hover:bg-black hover:text-white px-2 py-1 rounded" to="/BookNow">Book Now</Link>
                            </li>
                            {/* Add more main section links here */}
                        </ul>
                    </section>

                    {/* Admin Section */}
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Admin Section</h2>
                        <ul className="flex gap-10">
                            <li className="mb-2">
                                <Link className="text-black font-semibold hover:bg-black hover:text-white px-2 py-1 rounded" to="/admin/holiday">Admin Holiday Home</Link>
                            </li>
                            <li className="mb-2">
                                <Link className="text-black font-semibold hover:bg-black hover:text-white px-2 py-1 rounded" to="/admin/holiday/packages">Admin Holiday Packages</Link>
                            </li>
                            <li className="mb-2">
                                <Link className="text-black font-semibold hover:bg-black hover:text-white px-2 py-1 rounded" to="/admin/holiday/addpackage">Add Holiday Package</Link>
                            </li>
                            <li className="mb-2">
                                <Link className="text-black font-semibold hover:bg-black hover:text-white px-2 py-1 rounded" to="/admin/holiday/editpackage">Edit Holiday Package</Link>
                            </li>
                            <li className="mb-2">
                                <Link className="text-black font-semibold hover:bg-black hover:text-white px-2 py-1 rounded" to="/admin/holiday/approval">Holiday Approval</Link>
                            </li>
                            {/* Add more admin section links here */}
                        </ul>
                    </section>
                </div>
            </div>
        );
    };

    export default SiteMap;
