import { redirect } from "next/navigation"

export default async function AutoCheckInPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  redirect(`/check-in?code=${code}`)
}
