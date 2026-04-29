import { z } from "zod";

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Ім'я має містити щонайменше 2 символи")
      .max(50, "Ім'я задовге"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Введи дійсну email-адресу"),
    password: z
      .string()
      .min(8, "Пароль має містити щонайменше 8 символів")
      .max(128, "Пароль задовгий"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не співпадають",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Введи дійсну email-адресу"),
  password: z.string().min(1, "Введи пароль"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
