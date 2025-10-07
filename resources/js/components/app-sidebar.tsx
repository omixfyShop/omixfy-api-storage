import { InputToken } from '@/components/input-token';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Book } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { CloudUpload, KeyRound, LayoutGrid, List, Users } from 'lucide-react';
import AppLogo from './app-logo';

const baseNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Upload de Assets',
        href: '/assets/upload',
        icon: CloudUpload,
    },
    {
        title: 'Listar Assets',
        href: '/assets/list',
        icon: List,
    },
    {
        title: 'Biblioteca',
        href: '/library',
        icon: Book,
    },
    {
        title: 'Tokens',
        href: '/tokens',
        icon: KeyRound,
    },

];

const footerNavItems: NavItem[] = [
  
];

export function AppSidebar() {
    const page = usePage<{ auth: { user?: { is_master?: boolean } | null } }>();
    const isMaster = Boolean(page.props.auth?.user?.is_master);
    const mainNavItems = isMaster
        ? [...baseNavItems, { title: 'Usuários', href: '/admin/users', icon: Users }]
        : baseNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <InputToken />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
