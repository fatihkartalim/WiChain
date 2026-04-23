"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PauseCircle, Power, Router, Star, TimerReset, Wifi } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { PanelGrid, PanelMetric, ProtectedPanel } from "@/components/protected-panel";
import { useCountdown, formatRemainingTime } from "@/hooks/use-countdown";
import { getApiErrorMessage } from "@/lib/api-error";
import { queryKeys } from "@/lib/query-keys";
import { createRating } from "@/services/rating.service";
import { endSession, getActiveSession, getLastCompletedSession } from "@/services/session.service";
import type { CompletedSession } from "@/types/api";

export default function SessionPage() {
  return (
    <AuthGuard allowedRoles={["USER", "NODE_OWNER", "ADMIN"]}>
      <SessionContent />
    </AuthGuard>
  );
}

function SessionContent() {
  const queryClient = useQueryClient();
  const activeSession = useQuery({
    queryKey: queryKeys.activeSession,
    queryFn: getActiveSession,
    refetchOnWindowFocus: true
  });

  const completedSession = useQuery({
    queryKey: ["sessions", "completed", "last"],
    queryFn: getLastCompletedSession
  });

  const endActiveSession = useMutation({
    mutationFn: (sessionId: string) => endSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeSession });
      queryClient.invalidateQueries({ queryKey: ["sessions", "completed", "last"] });
    }
  });

  const handleExpire = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activeSession });
  }, [queryClient]);

  const remainingSeconds = useCountdown(activeSession.data?.remainingSeconds ?? 0, handleExpire);

  if (activeSession.isLoading) {
    return (
      <ProtectedPanel title="Active Session" subtitle="Current access session and remaining time.">
        <StateBox title="Loading session" body="Checking active access session." />
      </ProtectedPanel>
    );
  }

  if (activeSession.isError) {
    return (
      <ProtectedPanel title="Active Session" subtitle="Current access session and remaining time.">
        <StateBox title="Something went wrong" body="The active session could not be loaded." />
      </ProtectedPanel>
    );
  }

  if (!activeSession.data || activeSession.data.status === "EXPIRED" || activeSession.data.status === "ENDED") {
    return (
      <ProtectedPanel title="Active Session" subtitle="Current access session and remaining time.">
        <div className="grid gap-5">
          <section className="rounded-lg border border-ink/10 bg-white p-6 text-center shadow-soft">
            <PauseCircle aria-hidden="true" className="mx-auto text-ink/45" size={42} />
            <h2 className="mt-4 text-2xl font-black text-ink">No active session</h2>
            <p className="mt-2 text-sm text-ink/65">Purchase a package and start a session after payment verification.</p>
            <Link href="/dashboard" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 text-sm font-semibold text-white transition hover:bg-fern">
              Find hotspots
            </Link>
          </section>
          {completedSession.data ? <RatingPanel session={completedSession.data} /> : null}
        </div>
      </ProtectedPanel>
    );
  }

  const session = activeSession.data;
  const totalSeconds = Math.max(session.remainingSeconds, remainingSeconds);
  const progress = totalSeconds === 0 ? 0 : Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));

  return (
    <ProtectedPanel title="Active Session" subtitle="Current access session and remaining time.">
      <div className="grid gap-5">
        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-fern">
                <Wifi aria-hidden="true" size={18} />
                {session.status}
              </div>
              <div className="mt-4 break-words font-mono text-4xl font-black text-ink sm:text-6xl">{formatRemainingTime(remainingSeconds)}</div>
              <p className="mt-3 text-sm text-ink/65">Session ends at {new Date(session.endsAt).toLocaleTimeString()}.</p>
            </div>
            <button
              onClick={() => endActiveSession.mutate(session.id)}
              disabled={endActiveSession.isPending}
              className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-coral px-5 font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Power aria-hidden="true" size={18} />
              {endActiveSession.isPending ? "Ending session" : "End session"}
            </button>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-fern transition-all" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <PanelGrid>
          <PanelMetric label="Session ID" value={session.id.slice(0, 8)} />
          <PanelMetric label="Purchase ID" value={session.purchaseId.slice(0, 8)} />
          <PanelMetric label="Hotspot ID" value={session.hotspotId.slice(0, 8)} />
        </PanelGrid>

        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard icon={<Router size={20} />} title="Connection" body="Use the hotspot credentials supplied by the node owner for this active package." />
          <InfoCard icon={<TimerReset size={20} />} title="Expiration" body="When the timer reaches zero, the frontend marks the session expired and refreshes the active session state." />
        </section>
      </div>
    </ProtectedPanel>
  );
}

function RatingPanel({ session }: { session: CompletedSession }) {
  const queryClient = useQueryClient();
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState("");

  const rating = useMutation({
    mutationFn: () =>
      createRating({
        hotspotId: session.hotspotId,
        purchaseId: session.purchaseId,
        score,
        comment
      }),
    onSuccess: () => {
      setRatingError("");
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings(session.hotspotId) });
    },
    onError: (error) => {
      setRatingError(getApiErrorMessage(error, error instanceof Error ? error.message : "Rating could not be submitted."));
    }
  });

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-fern">
            <Star aria-hidden="true" size={18} />
            Completed session
          </div>
          <h2 className="mt-3 text-xl font-black text-ink">Rate this hotspot</h2>
          <p className="mt-2 text-sm text-ink/65">Ratings are available after a session ends and are linked to the completed purchase.</p>
        </div>
        <div className="w-fit rounded-md bg-mist px-3 py-2 text-sm font-bold text-ink">Purchase {session.purchaseId.slice(0, 8)}</div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
        <label className="text-sm font-bold text-ink">
          Score
          <select
            value={score}
            onChange={(event) => setScore(Number(event.target.value))}
            className="mt-2 min-h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-ink outline-none focus:border-fern"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} star{value === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold text-ink">
          Comment
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={500}
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-ink/15 bg-white p-3 text-ink outline-none focus:border-fern"
            placeholder="Share connection quality, speed, or reliability."
          />
        </label>
      </div>

      {ratingError ? <div className="mt-4 rounded-md border border-coral/30 bg-coral/10 p-3 text-sm font-semibold text-coral">{ratingError}</div> : null}
      {rating.data ? <div className="mt-4 rounded-md border border-fern/25 bg-fern/10 p-3 text-sm font-semibold text-fern">Rating submitted.</div> : null}

      <button
        onClick={() => rating.mutate()}
        disabled={rating.isPending}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-fern disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Star aria-hidden="true" size={17} />
        {rating.isPending ? "Submitting" : rating.data ? "Update rating" : "Submit rating"}
      </button>
    </section>
  );
}

function InfoCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2 font-black text-ink">
        <span className="text-fern">{icon}</span>
        {title}
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/65">{body}</p>
    </article>
  );
}

function StateBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-6 text-ink shadow-soft">
      <div className="font-bold">{title}</div>
      <p className="mt-2 text-sm text-ink/65">{body}</p>
    </div>
  );
}
