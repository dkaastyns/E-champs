import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      defaultRole: "user",
    }),
    nextCookies(),
  ],
});
