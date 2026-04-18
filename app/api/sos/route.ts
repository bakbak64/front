import { NextResponse } from "next/server"

/**
 * Placeholder SOS intake endpoint.
 *
 * Accepts multipart/form-data with:
 *   - timestamp (ISO string)
 *   - lat, lng, accuracy (optional numbers as strings)
 *   - audio (optional File — webm/opus blob)
 *
 * Real implementations should persist the audio to blob storage (e.g. Vercel
 * Blob, S3) and the metadata to a database. For now, we log and echo.
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const timestamp = String(form.get("timestamp") ?? new Date().toISOString())
    const latRaw = form.get("lat")
    const lngRaw = form.get("lng")
    const accuracyRaw = form.get("accuracy")
    const audio = form.get("audio")

    const lat = latRaw != null ? Number(latRaw) : null
    const lng = lngRaw != null ? Number(lngRaw) : null
    const accuracy = accuracyRaw != null ? Number(accuracyRaw) : null

    const audioSize = audio instanceof File ? audio.size : 0
    const audioType = audio instanceof File ? audio.type : null

    console.log("[v0][sos:intake]", {
      timestamp,
      location:
        lat != null && lng != null
          ? { lat, lng, accuracy: accuracy ?? undefined }
          : null,
      audioSize,
      audioType,
    })

    return NextResponse.json({
      ok: true,
      received: {
        timestamp,
        location:
          lat != null && lng != null
            ? { lat, lng, accuracy: accuracy ?? undefined }
            : null,
        audioSize,
        audioType,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn("[v0][sos:intake] failed to parse payload:", message)
    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 },
    )
  }
}
