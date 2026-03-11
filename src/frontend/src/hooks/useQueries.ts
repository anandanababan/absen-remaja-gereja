import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Attendance, Session, SessionId } from "../backend.d";
import { UserRole } from "../backend.d";
import { useActor } from "./useActor";

export function useGetAllSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSessionAttendees(sessionId: SessionId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Attendance[]>({
    queryKey: ["attendees", sessionId?.toString()],
    queryFn: async () => {
      if (!actor || sessionId === null) return [];
      return actor.getSessionAttendees(sessionId);
    },
    enabled: !!actor && !isFetching && sessionId !== null,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsFirstAdminClaimed() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isFirstAdminClaimed"],
    queryFn: async () => {
      if (!actor) return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).isFirstAdminClaimed();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimFirstAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const success = await (actor as any).claimFirstAdmin();
      if (!success) throw new Error("Gagal klaim admin pertama");
      return success;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isAdmin"] });
      qc.invalidateQueries({ queryKey: ["isFirstAdminClaimed"] });
    },
  });
}

export function useCreateSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.createSession(title);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useCloseSession() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: SessionId) => {
      if (!actor) throw new Error("Not connected");
      return actor.closeSession(sessionId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useSubmitAttendance() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ name, pin }: { name: string; pin: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitAttendance(name, pin);
    },
  });
}

export function useAssignAdminRole() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignCallerUserRole(principal, UserRole.admin);
    },
  });
}
