import { badRequest, route } from "@/lib/api";
import { uploadResume } from "@/lib/resume/service";

export const POST = route(async (req: Request) => {
  const form = await req.formData();
  const file = form.get("resume");
  if (!(file instanceof File)) return badRequest("Choose a PDF or DOCX file.");
  const { profile, version } = await uploadResume(Buffer.from(await file.arrayBuffer()), file.name, file.type);
  return Response.json({ profile, version });
}, "We couldn't read that resume. Try a text-based PDF or DOCX.");
