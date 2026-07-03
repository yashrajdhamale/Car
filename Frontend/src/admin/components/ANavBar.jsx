import { useEffect, useState, createElement } from "react";
import {
    Navbar,
    Collapse,
    Typography,
    IconButton,
    Menu,
    List,
    ListItem,
    MenuHandler,
    MenuList,
    MenuItem,
} from "@material-tailwind/react";
import {
    ChevronDownIcon,
    Bars3Icon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import {
    Bars4Icon,
    GlobeAmericasIcon,
    NewspaperIcon,
    PhoneIcon,
    RectangleGroupIcon,
    SquaresPlusIcon,
    SunIcon,
    TagIcon,
    UserGroupIcon,
} from "@heroicons/react/24/solid";
import ASideBar from "./ASideBar"
import { auth } from "@config/firebase"

import React from "react";
import {
    Tabs,
    TabsHeader,
    TabsBody,
    Tab,
    TabPanel,
} from "@material-tailwind/react";

import { useLocation, useNavigate, useParams } from 'react-router-dom';


const navListMenuItems = [
    {
        title: "Dashboard",
        description: "Find the perfect solution for your needs.",
        icon: SquaresPlusIcon,
    },

    {
        title: "Packages",
        description: "Find the perfect solution for your needs.",
        icon: SquaresPlusIcon,
    },

    {
        title: "Transactions",
        description: "Find the perfect solution for your needs.",
        icon: SquaresPlusIcon,
    },
    {
        title: "Profile",
        description: "Find the perfect solution for your needs.",
        icon: SquaresPlusIcon,
    },
    {
        title: "About Us",
        description: "Meet and learn about our dedication",
        icon: UserGroupIcon,
    },
    {
        title: "Blog",
        description: "Find the perfect solution for your needs.",
        icon: Bars4Icon,
    },
    {
        title: "Services",
        description: "Learn how we can help you achieve your goals.",
        icon: SunIcon,
    },
    {
        title: "Support",
        description: "Reach out to us for assistance or inquiries",
        icon: GlobeAmericasIcon,
    },
    {
        title: "Contact",
        description: "Find the perfect solution for your needs.",
        icon: PhoneIcon,
    },
    {
        title: "News",
        description: "Read insightful articles, tips, and expert opinions.",
        icon: NewspaperIcon,
    },
    {
        title: "Products",
        description: "Find the perfect solution for your needs.",
        icon: RectangleGroupIcon,
    },
    {
        title: "Special Offers",
        description: "Explore limited-time deals and bundles",
        icon: TagIcon,
    },
];



function NavListMenu() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const renderItems = navListMenuItems.map(
        ({ icon, title, description }, key) => (
            <a href="#" key={key}>
                <MenuItem className="flex items-center gap-3 rounded-lg">
                    <div className="flex items-center justify-center rounded-lg !bg-blue-gray-50 p-2 ">
                        {" "}
                        {createElement(icon, {
                            strokeWidth: 2,
                            className: "h-6 text-gray-900 w-6",
                        })}
                    </div>
                    <div>
                        <Typography
                            variant="h6"
                            color="blue-gray"
                            className="flex items-center text-sm font-bold"
                        >
                            {title}
                        </Typography>
                        <Typography
                            variant="paragraph"
                            className="text-xs !font-medium text-blue-gray-500"
                        >
                            {description}
                        </Typography>
                    </div>
                </MenuItem>
            </a>
        ),
    );

    return (
        <>
            <Menu
                open={isMenuOpen}
                handler={setIsMenuOpen}
                offset={{ mainAxis: 20 }}
                placement="bottom"
            >
                {/* <MenuHandler>
                    <Typography as="div" variant="small" className="font-medium">
                        <ListItem
                            className="flex items-center gap-2 py-2 pr-4 font-medium text-gray-900"
                            selected={isMenuOpen || isMobileMenuOpen}
                            onClick={() => setIsMobileMenuOpen((cur) => !cur)}
                        >
                            Resources
                            <ChevronDownIcon
                                strokeWidth={2.5}
                                className={`hidden h-3 w-3 transition-transform lg:block ${isMenuOpen ? "rotate-180" : ""
                                    }`}
                            />
                            <ChevronDownIcon
                                strokeWidth={2.5}
                                className={`block h-3 w-3 transition-transform lg:hidden ${isMobileMenuOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </ListItem>
                    </Typography>
                </MenuHandler> */}
                <MenuList className="hidden max-w-screen-xl rounded-xl lg:block">
                    <ul className="grid grid-cols-3 gap-y-2 outline-none outline-0">
                        {renderItems}
                    </ul>
                </MenuList>
            </Menu>
            <div className="block lg:hidden">
                <Collapse open={isMobileMenuOpen}>{renderItems}</Collapse>
            </div>
        </>
    );
}



function NavList() {

    const navigate = useNavigate();

    const handleNavigation = (path) => {
        // console.log('handleNavigation', path);
        navigate(path);
    };


    const removeuser = () => {
        auth.signOut()
            .then(() => {
                // User signed out successfully
                console.log('User signed out');
                setTimeout(() => {
                    navigate('/admin/login');
                }, 1000);
            })
            .catch((error) => {
                // An error occurred
                console.error('Error signing out:', error);
                // Handle error, if needed
            });
    }

    return (
        <List className="mt-4 mb-6 p-0 lg:mt-0 lg:mb-0 lg:flex-row lg:p-1">
            <Typography
                as="a"
                // href="#"
                variant="small"
                color="blue-gray"
                className="font-medium"
                onClick={() => handleNavigation('/admin')}
            >
                <ListItem className="flex items-center gap-2 py-2 pr-4
                hover:bg-green-200 hover:text-black">Home</ListItem>
            </Typography>

            <Typography
                as="a"
                href="#"
                variant="small"
                color="blue-gray"
                className="font-medium"
            >
                <ListItem className="flex items-center gap-2 py-2 pr-4 hover:bg-red-200 hover:text-black"
                    onClick={() => removeuser()}>
                    Logout
                </ListItem>
            </Typography>
            <NavListMenu />
        </List>
    );
}

export default function ANavBar() {
    const navigate = useNavigate();


    const [open, setOpen] = useState(false);

    const openDrawer = () => setOpen(true);
    const closeDrawer = () => setOpen(false);

    // useEffect(() => {
    //     window.addEventListener(
    //         "resize",
    //         () => window.innerWidth >= 960 && setOpenNav(false),
    //     );
    // }, []);


    const [activeTab, setActiveTab] = React.useState("html");
    const data = [
        {
            label: "HTML",
            value: "html",
            desc: `It really matters and then like it really doesn't matter.
      What matters is the people who are sparked by it. And the people 
      who are like offended by it, it doesn't matter.`,
        },
        {
            label: "React",
            value: "react",
            desc: `Because it's about motivating the doers. Because I'm here
      to follow my dreams and inspire other people to follow their dreams, too.`,
        },
        {
            label: "Vue",
            value: "vue",
            desc: `We're not always in the position that we want to be at.
      We're constantly growing. We're constantly making mistakes. We're
      constantly trying to express ourselves and actualize our dreams.`,
        },
        {
            label: "Angular",
            value: "angular",
            desc: `Because it's about motivating the doers. Because I'm here
      to follow my dreams and inspire other people to follow their dreams, too.`,
        },
        {
            label: "Svelte",
            value: "svelte",
            desc: `We're not always in the position that we want to be at.
      We're constantly growing. We're constantly making mistakes. We're
      constantly trying to express ourselves and actualize our dreams.`,
        },
    ];



    return (
        <>
            <ASideBar open={open} closeDrawer={closeDrawer} className="w-64" />
            <Navbar className="rounded-none max-w-full px-3 lg:px-10">
                <div className="flex items-center justify-between text-blue-gray-900">
                    <div className="flex justify-center items-center ">
                        <IconButton variant="text" size="lg" onClick={openDrawer}>
                            <Bars3Icon className="h-7 w-7 stroke-2" />
                        </IconButton>
                        <Typography
                            as="a"
                            // href="#"
                            variant="h6"
                            className="mr-4 cursor-pointer py-1.5 text-lg font-semibold lg:text-xl"
                            onClick={() => navigate("/admin")}
                        >
                            TraveLog Immigration
                        </Typography>


                    </div>


                    <div className="hidden lg:block">
                        <NavList />
                    </div>
                </div>

                {/* <div className="pt-1 rounded-full bg-gray-100">
                    <Tabs value={activeTab}>
                        <TabsHeader
                            className="rounded-none border-b border-blue-gray-50 bg-transparent p-0"
                            indicatorProps={{
                                className:
                                    "bg-transparent border-b-2 border-gray-900 shadow-none rounded-none",
                            }}
                        >
                            {data.map(({ label, value }) => (
                                <Tab
                                    key={value}
                                    value={value}
                                    onClick={() => setActiveTab(value)}
                                    className={activeTab === value ? "text-gray-900" : ""}
                                >
                                    {label}
                                </Tab>
                            ))}
                        </TabsHeader>
                        <TabsBody>
                            {data.map(({ value, desc }) => (
                                <TabPanel key={value} value={value}>
                                    {desc}
                                </TabPanel>
                            ))}
                        </TabsBody> 
                    </Tabs>
                </div> */}
            </Navbar>
        </>
    );
}