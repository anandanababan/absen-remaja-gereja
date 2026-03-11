import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type PinCode = string;
export interface Session {
    id: SessionId;
    pin: PinCode;
    status: SessionStatus;
    title: string;
    attendeeCount: bigint;
    createdAt: Time;
}
export type Time = bigint;
export interface Attendance {
    id: AttendanceId;
    name: string;
    timestamp: Time;
    sessionId: SessionId;
}
export type SessionId = bigint;
export type AttendanceId = bigint;
export interface UserProfile {
    name: string;
}
export enum SessionStatus {
    closed = "closed",
    active = "active"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    closeSession(sessionId: SessionId): Promise<void>;
    createSession(title: string): Promise<SessionId>;
    getAllSessions(): Promise<Array<Session>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSessionAttendees(sessionId: SessionId): Promise<Array<Attendance>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitAttendance(name: string, pin: PinCode): Promise<void>;
}
