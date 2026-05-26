import { Icon } from '@/components/icon';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { activeItemStyles } from './header-nav-items';

interface HeaderDesktopNavProps {
    items: NavItem[];
    currentUrl: string;
}

export function HeaderDesktopNav({
    items,
    currentUrl,
}: HeaderDesktopNavProps): React.JSX.Element {
    return (
        <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
            <NavigationMenu className="flex h-full items-stretch">
                <NavigationMenuList className="flex h-full items-stretch space-x-2">
                    {items.map((item, index) => (
                        <NavigationMenuItem
                            key={index}
                            className="relative flex h-full items-center"
                        >
                            <Link
                                href={item.href}
                                className={cn(
                                    navigationMenuTriggerStyle(),
                                    currentUrl ===
                                        (typeof item.href === 'string'
                                            ? item.href
                                            : item.href.url) &&
                                        activeItemStyles,
                                    'h-9 cursor-pointer px-3',
                                )}
                            >
                                {item.icon && (
                                    <Icon
                                        iconNode={item.icon}
                                        className="mr-2 h-4 w-4"
                                    />
                                )}
                                {item.title}
                            </Link>
                            {currentUrl === item.href && (
                                <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                            )}
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
            </NavigationMenu>
        </div>
    );
}
