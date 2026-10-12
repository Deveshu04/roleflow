import { route } from "@/lib/api";
import { config } from "@/lib/config";
import { getProfile, listResumeVersions, saveProfile } from "@/lib/store";
import type { Preferences, ResumeData } from "@/lib/types";

export const GET = route(async () => {
  const [profile, versions] = await Promise.all([getProfile(), listResumeVersions()]);
  return Response.json({
    profile,
    versions,
    openai: { configured: Boolean(config.openaiKey()), model: config.model(), agentModel: config.agentModel() },
  });
});

export const PUT = route(async (req: Request) => {
  const body = (await req.json()) as { preferences?: Partial<Preferences>; contact?: Partial<ResumeData["contact"]>; name?: string };
  const profile = await getProfile();
  if (body.preferences) profile.preferences = { ...profile.preferences, ...body.preferences };
  if (profile.resume && body.contact) profile.resume.contact = { ...profile.resume.contact, ...body.contact };
  if (profile.resume && body.name) profile.resume.name = body.name;
  await saveProfile(profile);
  return Response.json({ profile });
});
