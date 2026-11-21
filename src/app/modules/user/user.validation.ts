import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z
    .strictObject({
      name: z.string().trim().min(1).exactOptional(),
      phone: z.string().trim().min(1).nullable().exactOptional(),
      address: z.string().trim().min(1).nullable().exactOptional(),
      image: z
        .url({ protocol: /^https?$/ })
        .nullable()
        .exactOptional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide at least one profile field to update"
    ),
});

export type ProfileUpdate = z.output<typeof updateProfileSchema>["body"];
