import type { MetadataRoute } from "next";
import { INDEXING_ENABLED } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return INDEXING_ENABLED
    ? { rules: { userAgent: "*", allow: "/" } }
    : { rules: { userAgent: "*", disallow: "/" } };
}
