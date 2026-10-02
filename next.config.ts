import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Focused Fix pipeline reads its system prompt from disk at request time
  // (lib/agents/focused-fix-prompts.ts), which is what makes editing the spec
  // take effect on the next generation with no rebuild. A file read at runtime is
  // invisible to Next's dependency tracing, so without this it would exist on the
  // developer's machine and be missing from the deployed function — and the
  // failure would look like a bare ENOENT.
  outputFileTracingIncludes: {
    "/api/compile": ["./prompts/focused-fix-output.md"],
    "/api/dev/fixture": ["./prompts/focused-fix-output.md"],
  },
};

export default nextConfig;
