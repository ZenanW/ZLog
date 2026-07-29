/**
 * One-time (idempotent) setup for the private PDF storage bucket.
 *
 * Usage: node --env-file=.env.local scripts/setup-storage.mjs
 *
 * Creates the "pdfs" bucket (private, PDF-only, 20MB limit) and verifies
 * that public URL access is blocked while signed URLs work.
 */
import { createClient } from "@supabase/supabase-js";

const BUCKET = "pdfs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env.local)");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  // 1. Create the bucket if it doesn't exist.
  const { data: existing, error: getError } = await supabase.storage.getBucket(BUCKET);
  if (getError && !/not found/i.test(getError.message)) {
    throw new Error(`getBucket failed: ${getError.message}`);
  }

  const bucketConfig = {
    public: false,
    fileSizeLimit: "20MB",
    allowedMimeTypes: ["application/pdf"],
  };

  if (!existing) {
    const { error } = await supabase.storage.createBucket(BUCKET, bucketConfig);
    if (error) throw new Error(`createBucket failed: ${error.message}`);
    console.log(`Created bucket "${BUCKET}" (private, PDF-only, 20MB limit)`);
  } else {
    // Ensure config matches even if the bucket pre-existed.
    const { error } = await supabase.storage.updateBucket(BUCKET, bucketConfig);
    if (error) throw new Error(`updateBucket failed: ${error.message}`);
    console.log(`Bucket "${BUCKET}" already exists; config enforced (private, PDF-only, 20MB limit)`);
  }

  // 2. Verify the access model with a throwaway file.
  const testPath = `__setup_check__/${Date.now()}.pdf`;
  // Minimal valid-enough PDF header so the mime check passes.
  const pdfBytes = new TextEncoder().encode("%PDF-1.4\n%%EOF\n");

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(testPath, pdfBytes, { contentType: "application/pdf" });
  if (uploadError) throw new Error(`test upload failed: ${uploadError.message}`);

  try {
    // Public URL must NOT serve the file (bucket is private).
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(testPath);
    const pubRes = await fetch(pub.publicUrl);
    if (pubRes.ok) {
      throw new Error(`SECURITY CHECK FAILED: public URL returned ${pubRes.status} — bucket is not private!`);
    }
    console.log(`Public URL correctly blocked (HTTP ${pubRes.status})`);

    // Signed URL must work.
    const { data: signed, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(testPath, 60);
    if (signError) throw new Error(`createSignedUrl failed: ${signError.message}`);
    const signedRes = await fetch(signed.signedUrl);
    if (!signedRes.ok) {
      throw new Error(`signed URL fetch failed with HTTP ${signedRes.status}`);
    }
    console.log("Signed URL access works (HTTP 200)");
  } finally {
    await supabase.storage.from(BUCKET).remove([testPath]);
  }

  console.log("Storage setup complete.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
