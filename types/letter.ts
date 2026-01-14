// Shared Letter type definition for consistency across components
export interface Letter {
    from?: {
        name?: string;
        address?: string;
    };
    to?: {
        name?: string;
        address?: string;
    };
    date?: string;
    subject?: string;
    content?: string;
}
