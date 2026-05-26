import type { AccessTokenItem } from '@/types';

export type PageProps = {
    tokens: AccessTokenItem[];
    plainToken?: string | null;
    highlightedTokenId?: string | null;
};
