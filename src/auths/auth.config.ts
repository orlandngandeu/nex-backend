import { betterAuth } from "better-auth"

export const auth = betterAuth({
  database: {
    provider: "postgres", // ou "mysql"
    url:
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
  },
})

export type Session = typeof auth.$Infer.Session
