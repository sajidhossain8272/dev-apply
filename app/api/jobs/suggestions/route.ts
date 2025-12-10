import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchJobSuggestionsForUser } from "@/lib/jobs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const jobs = await fetchJobSuggestionsForUser(session.user.id);

  return NextResponse.json({ jobs });
}
