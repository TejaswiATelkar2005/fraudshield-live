import { z } from "zod";

export const ChannelSchema = z.enum(["UPI", "Card", "NetBanking"]);

export const DecisionSchema = z.enum(["APPROVED", "REVIEW", "HELD"]);

export const AlertStatusSchema = z.enum([
  "OPEN",
  "CONFIRMED_FRAUD",
  "FALSE_ALARM",
  "APPROVED",
]);

export const TransactionInputSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(2).max(50),
  channel: ChannelSchema,
  amountINR: z.number().positive().max(10000000), // Max ₹1 crore
  merchantCategory: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  deviceId: z.string().min(2).max(100),
  isNewDevice: z.boolean(),
  isForeignLocation: z.boolean(),
  hourOfDay: z.number().int().min(0).max(23),
  txnsLast10Min: z.number().int().min(0).max(100),
});

export const UpdateAlertSchema = z.object({
  status: AlertStatusSchema,
  analystNote: z.string().max(1000).optional(),
  analystId: z.string().max(100).optional(),
});

export const SimulatorActionSchema = z.object({
  action: z.enum(["start", "stop", "speed", "burst", "tick"]),
  speedMs: z.number().int().min(500).max(10000).optional(),
});

// Simple in-memory sliding-window rate limiter for sensitive endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}
