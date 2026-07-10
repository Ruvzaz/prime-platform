import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EventsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
             <Skeleton className="h-10 w-64" />
             <Skeleton className="h-10 w-64" />
          </div>
          <div className="space-y-4">
             <Skeleton className="h-10 w-full" />
             {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
             ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
