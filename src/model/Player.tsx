export interface Player {
    id: string;
    email: string;  // Required email field
    firstname?: string;  // Optional as it will be loaded from user profile
    name?: string;       // Optional as it will be loaded from user profile
    result: number;
    aktiv: boolean;
}
