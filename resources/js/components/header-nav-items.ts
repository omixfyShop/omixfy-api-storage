import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { LayoutGrid } from 'lucide-react';

export const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

export const rightNavItems: NavItem[] = [];

export const activeItemStyles =
    'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';
