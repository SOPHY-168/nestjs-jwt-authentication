export interface AuthSession {
    id: string;
    userId: string;
    email: string;
    refreshTokenHash: string;
    expiresAt: number;
    createdAt: number;
}
