import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const pages = {
    ...import.meta.glob('./pages/**/*.tsx'),
    ...import.meta.glob('./Pages/**/*.jsx'),
};

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        const importPage =
            pages[`./pages/${name}.tsx`] ?? pages[`./Pages/${name}.jsx`];

        if (!importPage) {
            throw new Error(`Page not found: ${name}`);
        }

        const module = await importPage();
        const component = (module as { default?: unknown }).default ?? module;

        return component as never;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
