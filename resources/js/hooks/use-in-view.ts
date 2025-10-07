import { useEffect, useRef, useState } from 'react';

type IntersectionOptions = IntersectionObserverInit;

export function useInView<T extends Element>(options?: IntersectionOptions) {
    const ref = useRef<T | null>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        if (!ref.current || isInView) {
            return;
        }

        const element = ref.current;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            });
        }, options);

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [options, isInView]);

    return { ref, isInView } as const;
}
