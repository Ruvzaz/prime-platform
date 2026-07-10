import { Metadata } from "next";
import { getLogs } from "@/app/actions/activity-log";
import { getEvents } from "@/app/actions/events";
import { LogsClient } from "./logs-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Activity Logs | Admin",
};

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const eventId = typeof params.eventId === "string" ? params.eventId : "all";
  const type = typeof params.type === "string" ? params.type : "all";

  // Fetch logs and events in parallel
  const [logsRes, eventsRes] = await Promise.all([
    getLogs(eventId, type, page, 50),
    getEvents(),
  ]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="px-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground mt-1">
          Monitor system activities, check-ins, and email deliveries.
        </p>
      </div>

      <LogsClient 
        initialLogs={logsRes.data} 
        metadata={logsRes.metadata} 
        events={eventsRes}
        currentEventId={eventId}
        currentType={type}
      />
    </div>
  );
}
