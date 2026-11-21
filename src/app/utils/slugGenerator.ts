import { randomUUID } from "node:crypto";

export default function slugGenerator(value: string): string {
  const base = value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 100)
    .replace(/^-+|-+$/g, "");

  return `${base || "item"}-${randomUUID()}`;
}
