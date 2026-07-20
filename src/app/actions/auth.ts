"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { getRateLimit } from "@/lib/rate-limit";
import { sendDiscordLog } from "@/lib/discord-logger";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown_ip";
    const email = formData.get("email") as string;

    // Concept 5: Honeypot Check (Bot Trap)
    const honeypot = formData.get("website") as string;
    if (honeypot) {
      await sendDiscordLog({
        category: "SECURITY",
        title: "Bot Honeypot Triggered",
        description: `IP **${ip}** filled the honeypot field during admin login. Email used: **${email || "UNKNOWN"}**`,
        color: 0x8b0000, // Dark Red
      });
      // Return vague error to trick the bot into thinking it's just wrong credentials
      return "Invalid credentials.";
    }

    // Concept 1: Dual-Layer Rate Limiting (IP & Email)
    // Max 5 attempts per 30 minutes (1800000 ms)
    const isIpAllowed = await getRateLimit(`admin_login_ip_${ip}`, 5, 1800000);
    const isEmailAllowed = email ? await getRateLimit(`admin_login_email_${email.toLowerCase()}`, 5, 1800000) : true;

    if (!isIpAllowed || !isEmailAllowed) {
      await sendDiscordLog({
        category: "SECURITY",
        title: "Admin Bruteforce Attempt Detected",
        description: `IP **${ip}** or Email **${email}** has exceeded the admin login rate limit (5 attempts/30min).`,
        color: 0xff0000,
      });
      return "Too many login attempts. Please try again later.";
    }

    const callbackUrl = (formData.get("callbackUrl") as string) || "/";
    await signIn("credentials", {
      ...Object.fromEntries(formData),
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const email = formData.get("email") as string;
      const headersList = await headers();
      const ip = headersList.get("x-forwarded-for") || "unknown_ip";

      switch (error.type) {
        case "CredentialsSignin":
          // Log failed admin login attempt
          await sendDiscordLog({
            category: "SECURITY",
            title: "Failed Admin Login Attempt",
            description: `IP **${ip}** attempted to login to Admin with email: **${email || "UNKNOWN"}**`,
            color: 0xffa500, // Orange
          });
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/admin/login" });
}
