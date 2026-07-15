export type LogCategory = 'TEAM' | 'AUTH' | 'ADMIN' | 'SYSTEM' | 'SECURITY';

interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordLogOptions {
  category: LogCategory;
  title: string;
  description: string;
  color?: number; // Decimal color code (e.g., 0xff0000 for red)
  fields?: DiscordField[];
}

// Map categories to their specific environment variables dynamically
function getWebhookUrl(category: LogCategory): string | undefined {
  switch (category) {
    case 'TEAM': return process.env.DISCORD_WEBHOOK_TEAM;
    case 'AUTH': return process.env.DISCORD_WEBHOOK_AUTH;
    case 'ADMIN': return process.env.DISCORD_WEBHOOK_ADMIN;
    case 'SYSTEM': return process.env.DISCORD_WEBHOOK_SYSTEM;
    case 'SECURITY': return process.env.DISCORD_WEBHOOK_SECURITY;
    default: return process.env.DISCORD_WEBHOOK_DEFAULT;
  }
}

export async function sendDiscordLog({ category, title, description, color, fields }: DiscordLogOptions) {
  // Always log to console as a fallback for Vercel Logs
  console.log(`[${category}] ${title}: ${description}`);

  const webhookUrl = getWebhookUrl(category);

  if (!webhookUrl) {
    // Silently fail if no webhook is configured so it doesn't break the app
    return false;
  }

  try {
    const payload = {
      embeds: [
        {
          title,
          description,
          color: color || 0x3498db, // Default blue
          fields: fields || [],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error(`Failed to send Discord log for category ${category}:`, error);
    return false;
  }
}
