import { z } from "zod";

export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .pipe(z.coerce.number<string>().int().min(1).max(10_000_000))
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/)
    .pipe(z.coerce.number<string>().int().min(1).max(100))
    .default(20),
});

export type Pagination = z.output<typeof paginationSchema>;

export function paginationMeta({ page, limit }: Pagination, total: number) {
  return { page, limit, total, totalPage: Math.ceil(total / limit) };
}
