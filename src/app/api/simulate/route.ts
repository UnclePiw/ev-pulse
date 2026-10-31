import { NextRequest, NextResponse } from "next/server";

export interface SimulationRequest {
  action: "start" | "stop" | "tick";
  stationId: string;
  sessionId?: string;
  vehicleBattery?: number;  // current battery % when ticking
  elapsed?: number;         // seconds elapsed
}

export interface SimulationResponse {
  success: boolean;
  sessionId: string;
  stationId: string;
  action: "start" | "stop" | "tick";
  batteryPercent: number;
  energyTransferred: number;   // kWh
  cost: number;                // THB
  powerDraw: number;           // kW
  chargingSpeed: string;
  estimatedTimeRemaining: number; // seconds
  status: "active" | "complete" | "stopped";
  message: string;
  timestamp: string;
}

// Simple in-memory session store (per serverless invocation lifespan)
const sessions = new Map<string, { startTime: number; stationId: string }>();

function generateSessionId() {
  return `ses-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function POST(request: NextRequest) {
  const body: SimulationRequest = await request.json();
  const { action, stationId, sessionId, vehicleBattery = 20, elapsed = 0 } = body;

  // Station pricing map (matches stations API)
  const stationRates: Record<string, number> = {
    "st-001": 8.5,
    "st-002": 7.9,
    "st-003": 9.2,
    "st-004": 7.5,
    "st-005": 8.8,
    "st-006": 9.5,
  };

  const stationPower: Record<string, number> = {
    "st-001": 150,
    "st-002": 120,
    "st-003": 250,
    "st-004": 75,
    "st-005": 180,
    "st-006": 100,
  };

  const pricingRate = stationRates[stationId] ?? 8.5;
  const maxPower = stationPower[stationId] ?? 120;

  if (action === "start") {
    const newSessionId = generateSessionId();
    sessions.set(newSessionId, { startTime: Date.now(), stationId });

    return NextResponse.json<SimulationResponse>({
      success: true,
      sessionId: newSessionId,
      stationId,
      action: "start",
      batteryPercent: vehicleBattery,
      energyTransferred: 0,
      cost: 0,
      powerDraw: maxPower * 0.95,
      chargingSpeed: maxPower >= 150 ? "DC Fast Charge" : "AC Level 2",
      estimatedTimeRemaining: Math.round(((100 - vehicleBattery) / 100) * 3600),
      status: "active",
      message: `Session started at ${maxPower}kW. Charging initiated.`,
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "tick") {
    // Simulate progress: each tick represents ~3 seconds of real charging
    const currentBattery = vehicleBattery;
    const tickRate = 3 / 3600; // 3 seconds as fraction of hour

    // Power tapers as battery fills (DC fast charge curve)
    const powerFactor =
      currentBattery < 80 ? 1.0 : 1.0 - (currentBattery - 80) / 100;
    const effectivePower = maxPower * powerFactor * (0.9 + Math.random() * 0.1);
    const energyThisTick = effectivePower * tickRate;

    // Battery capacity: assume 75 kWh vehicle
    const batteryCapacity = 75;
    const batteryGain = (energyThisTick / batteryCapacity) * 100;
    const newBattery = Math.min(100, currentBattery + batteryGain);

    const totalEnergyTransferred = ((newBattery - 20) / 100) * batteryCapacity;
    const totalCost = totalEnergyTransferred * pricingRate;

    const isComplete = newBattery >= 100;
    const remaining = isComplete
      ? 0
      : Math.round(((100 - newBattery) / 100) * batteryCapacity / effectivePower * 3600);

    return NextResponse.json<SimulationResponse>({
      success: true,
      sessionId: sessionId ?? "unknown",
      stationId,
      action: "tick",
      batteryPercent: Math.round(newBattery * 10) / 10,
      energyTransferred: Math.round(totalEnergyTransferred * 100) / 100,
      cost: Math.round(totalCost * 100) / 100,
      powerDraw: Math.round(effectivePower * 10) / 10,
      chargingSpeed: maxPower >= 150 ? "DC Fast Charge" : "AC Level 2",
      estimatedTimeRemaining: remaining,
      status: isComplete ? "complete" : "active",
      message: isComplete
        ? "⚡ Vehicle charged to 100%! Ready to drive."
        : `Charging at ${Math.round(effectivePower)}kW…`,
      timestamp: new Date().toISOString(),
    });
  }

  if (action === "stop") {
    if (sessionId) sessions.delete(sessionId);
    const currentBattery = vehicleBattery;
    const batteryCapacity = 75;
    const energyDelivered = ((currentBattery - 20) / 100) * batteryCapacity;
    const totalCost = Math.max(0, energyDelivered) * pricingRate;

    return NextResponse.json<SimulationResponse>({
      success: true,
      sessionId: sessionId ?? "unknown",
      stationId,
      action: "stop",
      batteryPercent: currentBattery,
      energyTransferred: Math.round(Math.max(0, energyDelivered) * 100) / 100,
      cost: Math.round(Math.max(0, totalCost) * 100) / 100,
      powerDraw: 0,
      chargingSpeed: "Stopped",
      estimatedTimeRemaining: 0,
      status: "stopped",
      message: `Session ended. ${Math.round(Math.max(0, energyDelivered) * 10) / 10} kWh delivered.`,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json(
    { success: false, error: "Invalid action" },
    { status: 400 }
  );
}
