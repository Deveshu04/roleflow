import { badRequest, route } from "@/lib/api";
import { searchJobs, type SearchInput } from "@/lib/jobs/search";

export const POST = route(async (req: Request) => {
  const body = (await req.json()) as Partial<SearchInput>;
  const query = body.query?.trim();
  if (!query) return badRequest("Describe the role you're looking for.");
  const sources = body.sources ?? { linkedin: true, web: true };
  if (!sources.linkedin && !sources.web) return badRequest("Pick at least one source.");
  const result = await searchJobs({ query, location: body.location?.trim() || "", sources, linkedin: body.linkedin });
  return Response.json(result);
}, "Job search failed. Please retry.");
