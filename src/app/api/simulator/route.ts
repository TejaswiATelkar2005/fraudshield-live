import { NextRequest, NextResponse } from "next/server";
import { simulator } from "@/lib/simulator/simulator";
import { SimulatorActionSchema, checkRateLimit } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(simulator.getStatus());
}

export async function POST(req: NextRequest) {
  // Rate limit simulator actions to prevent abuse
  const clientIp = req.headers.get("x-forwarded-for") ?? "local-client";
  const rateLimit = checkRateLimit(`sim-${clientIp}`, 60, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many simulator control requests. Please slow down." },
      { status: 429 }
    );
  }

  try {
    const body: unknown = await req.json();
    const parsed = SimulatorActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid action payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { action, speedMs } = parsed.data;

    switch (action) {
      case "start":
        simulator.start();
        break;
      case "stop":
        simulator.stop();
        break;
      case "speed":
        if (speedMs) {
          simulator.setIntervalMs(speedMs);
        }
        break;
      case "burst":
        void simulator.injectFraudBurst();
        break;
      case "tick":
        await simulator.generateAndProcess();
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      status: simulator.getStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to perform simulator action", message: String(error) },
      { status: 500 }
    );
  }
}
