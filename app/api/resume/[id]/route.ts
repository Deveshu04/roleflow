import { promises as fs } from "fs";
import path from "path";
import type { NextRequest } from "next/server";
import { badRequest, route } from "@/lib/api";
import { getResumeVersion, resumeFilePath } from "@/lib/store";

const TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export const GET = route(async (req: NextRequest, ctx: RouteContext<"/api/resume/[id]">) => {
  const version = await getResumeVersion((await ctx.params).id);
  if (!version) return badRequest("Resume version not found.", 404);
  const wantCover = req.nextUrl.searchParams.get("file") === "cover";
  const name = wantCover ? version.coverLetterFile : version.fileName;
  if (!name) return badRequest("No cover letter for this version.", 404);
  const body = await fs.readFile(resumeFilePath(name));
  const download = req.nextUrl.searchParams.has("download");
  return new Response(body, {
    headers: {
      "Content-Type": TYPES[path.extname(name).toLowerCase()] || "application/octet-stream",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${path.basename(name)}"`,
      "Cache-Control": "no-store",
    },
  });
});
