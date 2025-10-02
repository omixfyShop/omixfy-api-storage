import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const pages = {
    ...import.meta.glob('./pages/**/*.tsx'),
    ...import.meta.glob('./pages/**/*.jsx'),
};

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: async (name) => {
            const importPage =
                pages[`./pages/${name}.tsx`] ?? pages[`./pages/${name}.jsx`];

            if (!importPage) {
                throw new Error(`Page not found: ${name}`);
            }

            const resolvedPage = await importPage();
            const component = (resolvedPage as { default?: unknown }).default ?? resolvedPage;

            return component as never;
        },
        setup: ({ App, props }) => {
            return <App {...props} />;
        },
    }),
);
