import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getEvents } from "@/app/actions/events"
import { EventsTable } from "@/components/admin/events-table"

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Events</h1>
        </div>
        <Button asChild className="rounded-2xl shadow-xl shadow-primary/20 h-12 px-8 font-bold text-base transition-all hover:scale-[1.02]">
          <Link href="/events/new">
            <Plus className="mr-2 h-6 w-6" /> Create Event
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/60 dark:shadow-none dark:bg-slate-900/50 rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <EventsTable initialEvents={events} />
        </CardContent>
      </Card>
    </div>
  )
}
