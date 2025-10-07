import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.stubGlobal('alert', vi.fn());

class MockIntersectionObserver {
    callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
    }

    observe(element: Element) {
        this.callback([
            {
                isIntersecting: true,
                target: element,
                intersectionRatio: 1,
                time: Date.now(),
                boundingClientRect: element.getBoundingClientRect(),
                intersectionRect: element.getBoundingClientRect(),
                rootBounds: null,
            } as IntersectionObserverEntry,
        ], this as unknown as IntersectionObserver);
    }

    disconnect() {}

    unobserve() {}

    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
