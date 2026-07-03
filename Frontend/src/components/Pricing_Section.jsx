import { CheckCircle } from 'lucide-react'

const Pricing_Section = () => {
    return (
        <div className="mx-auto my-12 max-w-7xl md:my-24 lg:my-32">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-6">
                <div className="px-4 py-10 lg:col-span-5 lg:px-0">
                    <span className="mb-8 inline-block rounded-full border p-1 px-3 text-xs font-semibold">
                        Pricing that fits your budget
                    </span>
                    <h1 className="text-3xl font-bold md:text-5xl">
                        Lorem ipsum dolor sit amet consectetur.
                    </h1>
                    <p className="mt-8 font-medium">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Laboriosam magni, rem sed
                        sint neque doloribus saepe veniam minima quaerat minus.
                    </p>
                    <div className="mt-8 flex w-full max-w-sm items-center space-x-2">
                        <input
                            className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                            type="email"
                            placeholder="Email"
                        ></input>
                        <button
                            type="button"
                            className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                        >
                            Subscribe
                        </button>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center md:flex-row lg:col-span-7">
                    <div className="w-full p-5 md:w-1/2">
                        <div className="rounded-md border bg-white bg-opacity-90">
                            <div className=" border-b">
                                <div className="px-9 py-7">
                                    <h3 className="mb-3 text-xl font-bold leading-snug text-gray-900">Standard</h3>
                                    <p className="font-medium leading-relaxed text-gray-500">
                                        Lorem ipsum dolor sit amet, consect etur adipiscing maror.
                                    </p>
                                </div>
                            </div>
                            <div className="px-9 pb-9 pt-8">
                                <p className="mb-6 font-medium leading-relaxed text-gray-600">
                                    Features included:
                                </p>
                                <ul className="mb-11">
                                    <li className="mb-4 flex items-center">
                                        <CheckCircle className="mr-2" size={16} />
                                        <p className="font-semibold leading-normal">3 Team Members</p>
                                    </li>
                                    <li className="mb-4 flex items-center">
                                        <CheckCircle className="mr-2" size={16} />
                                        <p className="font-semibold leading-normal">1200+ UI Blocks</p>
                                    </li>
                                    <li className="mb-4 flex items-center">
                                        <CheckCircle className="mr-2" size={16} />
                                        <p className="font-semibold leading-normal">10 GB Cloud Storage</p>
                                    </li>
                                    <li className="mb-4 flex items-center">
                                        <CheckCircle className="mr-2" size={16} />
                                        <p className="font-semibold leading-normal">Individual Email Account</p>
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="mr-2" size={16} />
                                        <p className="font-semibold leading-normal">Premium Support</p>
                                    </li>
                                </ul>
                                <p className="mb-6 text-lg font-semibold leading-normal text-gray-600">
                                    <span>Starting from</span>
                                    <span className="ml-2 text-gray-900">$49/mo</span>
                                </p>
                                <div className="md:inline-block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                    >
                                        Start your free trial
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full p-5 md:w-1/2">
                        <div className="rounded-md border bg-white bg-opacity-90">
                            <div className=" border-b">
                                <div className="px-9 py-7">
                                    <h3 className="mb-3 text-xl font-bold leading-snug text-gray-900">Standard</h3>
                                    <p className="font-medium leading-relaxed text-gray-500">
                                        Lorem ipsum dolor sit amet, consect etur adipiscing maror.
                                    </p>
                                </div>
                            </div>
                            <div className="px-9 pb-9 pt-8">
                                <p className="mb-6 font-medium leading-relaxed text-gray-600">
                                    Features included:
                                </p>
                                <ul className="mb-11">
                                    <li className="mb-4 flex items-center">
                                        <CheckCircle className="mr-2" size={16} />
                                        <p className="font-semibold leading-normal">3 Team Members</p>
                                    </li>
                                    <li className="mb-4 flex items-center">
                                        <CheckCircle className="mr-2" size={16} />
                                        <p className="font-semibold leading-normal">1200+ UI Blocks</p>
                                    </li>
                                    <li className="mb-4 flex items-center">
                                        <CheckCircle className="mr-2" size={16} />
                                        <p className="font-semibold leading-normal">10 GB Cloud Storage</p>
                                    </li>
                                    <li className="mb-4 flex items-center">
                                        <CheckCircle className="mr-2" size={16} />
                                        <p className="font-semibold leading-normal">Individual Email Account</p>
                                    </li>
                                    <li className="flex items-center">
                                        <CheckCircle className="mr-2" size={16} />
                                        <p className="font-semibold leading-normal">Premium Support</p>
                                    </li>
                                </ul>
                                <p className="mb-6 text-lg font-semibold leading-normal text-gray-600">
                                    <span>Starting from</span>
                                    <span className="ml-2 text-gray-900">$49/mo</span>
                                </p>
                                <div className="md:inline-block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                    >
                                        Start your free trial
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Pricing_Section