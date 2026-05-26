import { Breadcrumbs } from '@/components/breadcrumbs';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { dashboard } from '@/routes';
import AppLogo from './app-logo';
import { HeaderDesktopNav } from './header-desktop-nav';
import { HeaderMobileMenu } from './header-mobile-menu';
import { mainNavItems, rightNavItems } from './header-nav-items';
import { HeaderRightNav } from './header-right-nav';

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;

    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    <HeaderMobileMenu
                        mainNavItems={mainNavItems}
                        rightNavItems={rightNavItems}
                    />

                    <Link
                        href={dashboard()}
                        prefetch
                        className="flex items-center space-x-2"
                    >
                        <AppLogo />
                    </Link>

                    <HeaderDesktopNav
                        items={mainNavItems}
                        currentUrl={page.url}
                    />

                    <HeaderRightNav
                        items={rightNavItems}
                        user={auth.user}
                    />
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
