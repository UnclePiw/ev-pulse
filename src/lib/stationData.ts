export interface Station {
  id: string;
  name: string;
  status: "Available" | "Charging" | "Maintenance";
  powerOutput: number;
  currentLoad: number;
  location: string;
  coordinates: { lat: number; lng: number };
  pricingRate: number;
  connectorType: string;
  totalPorts: number;
  activePorts: number;
  photo: string;          // kept for fallback / modal hero
  efficiency: number;
  uptime: number;
  totalEnergy: number;
  lastUpdated: string;
}

// Pexels CDN — free, no API key needed, CC0 license
// Format: https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg
// All IDs verified 200 OK
const LOCATION_PHOTOS: Record<string, string> = {
  // EV charging station sign with plants — close-up outdoor
  "st-001": "https://images.pexels.com/photos/9800007/pexels-photo-9800007.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Gray EV car plugged at outdoor charging station daytime
  "st-002": "https://images.pexels.com/photos/9800006/pexels-photo-9800006.jpeg?auto=compress&cs=tinysrgb&w=800",
  // EV charger close-up with cable
  "st-003": "https://images.pexels.com/photos/7516804/pexels-photo-7516804.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Electric car charging at parking lot station
  "st-004": "https://images.pexels.com/photos/9786714/pexels-photo-9786714.jpeg?auto=compress&cs=tinysrgb&w=800",
  // EV charger plug inserted in vehicle side
  "st-005": "https://images.pexels.com/photos/17838070/pexels-photo-17838070.jpeg?auto=compress&cs=tinysrgb&w=800",
  // Charging station bollard at parking area
  "st-006": "https://images.pexels.com/photos/16880944/pexels-photo-16880944.jpeg?auto=compress&cs=tinysrgb&w=800",
};

export const BASE_STATIONS: Omit<Station, "lastUpdated">[] = [
  {
    id: "st-001",
    name: "Bangkok Central Hub",
    status: "Charging",
    powerOutput: 150,
    currentLoad: 128,
    location: "Siam Square, Bangkok",
    coordinates: { lat: 13.7468, lng: 100.5347 },
    pricingRate: 8.5,
    connectorType: "CCS2 / CHAdeMO",
    totalPorts: 8,
    activePorts: 5,
    photo: LOCATION_PHOTOS["st-001"],
    efficiency: 97.2,
    uptime: 99.1,
    totalEnergy: 1840,
  },
  {
    id: "st-002",
    name: "Sukhumvit Tech Park",
    status: "Available",
    powerOutput: 120,
    currentLoad: 0,
    location: "Sukhumvit Soi 21, Bangkok",
    coordinates: { lat: 13.7327, lng: 100.5601 },
    pricingRate: 7.9,
    connectorType: "CCS2 / Type 2",
    totalPorts: 6,
    activePorts: 0,
    photo: LOCATION_PHOTOS["st-002"],
    efficiency: 96.8,
    uptime: 98.7,
    totalEnergy: 620,
  },
  {
    id: "st-003",
    name: "Don Mueang Expressway",
    status: "Charging",
    powerOutput: 250,
    currentLoad: 215,
    location: "Don Mueang, Bangkok",
    coordinates: { lat: 13.9185, lng: 100.6075 },
    pricingRate: 9.2,
    connectorType: "CCS2 / GB/T",
    totalPorts: 12,
    activePorts: 9,
    photo: LOCATION_PHOTOS["st-003"],
    efficiency: 98.1,
    uptime: 99.5,
    totalEnergy: 3280,
  },
  {
    id: "st-004",
    name: "Chiang Mai Mountain Gate",
    status: "Maintenance",
    powerOutput: 75,
    currentLoad: 0,
    location: "Nimmanhaemin, Chiang Mai",
    coordinates: { lat: 18.8017, lng: 98.9677 },
    pricingRate: 7.5,
    connectorType: "Type 2 / CCS2",
    totalPorts: 4,
    activePorts: 0,
    photo: LOCATION_PHOTOS["st-004"],
    efficiency: 94.3,
    uptime: 91.2,
    totalEnergy: 0,
  },
  {
    id: "st-005",
    name: "Pattaya Coastal Station",
    status: "Charging",
    powerOutput: 180,
    currentLoad: 156,
    location: "Pattaya Beach Road, Chonburi",
    coordinates: { lat: 12.9236, lng: 100.8824 },
    pricingRate: 8.8,
    connectorType: "CCS2 / CHAdeMO",
    totalPorts: 10,
    activePorts: 7,
    photo: LOCATION_PHOTOS["st-005"],
    efficiency: 97.6,
    uptime: 98.9,
    totalEnergy: 2460,
  },
  {
    id: "st-006",
    name: "Phuket Airport Lounge",
    status: "Available",
    powerOutput: 100,
    currentLoad: 0,
    location: "Phuket International Airport",
    coordinates: { lat: 8.1132, lng: 98.3017 },
    pricingRate: 9.5,
    connectorType: "CCS2 / Type 2",
    totalPorts: 6,
    activePorts: 0,
    photo: LOCATION_PHOTOS["st-006"],
    efficiency: 96.5,
    uptime: 97.8,
    totalEnergy: 480,
  },
];

export function getLiveStations(): Station[] {
  return BASE_STATIONS.map((s) => ({
    ...s,
    currentLoad:
      s.status === "Charging"
        ? Math.round(s.currentLoad * (0.92 + Math.random() * 0.16))
        : 0,
    activePorts:
      s.status === "Charging"
        ? Math.min(s.totalPorts, s.activePorts + Math.round(Math.random() * 2 - 1))
        : 0,
    lastUpdated: new Date().toISOString(),
  }));
}

export function buildSummary(stations: Station[]) {
  const totalActivePower = stations.reduce((sum, s) => sum + s.currentLoad, 0);
  const activeSessions   = stations.reduce((sum, s) => sum + s.activePorts, 0);
  const dailyRevenue     = stations.reduce((sum, s) => sum + s.totalEnergy * s.pricingRate, 0);
  const gridHealth       = (stations.filter((s) => s.status !== "Maintenance").length / stations.length) * 100;
  return {
    totalActivePower:    Math.round(totalActivePower),
    activeSessions,
    dailyRevenue:        Math.round(dailyRevenue),
    gridHealth:          Math.round(gridHealth),
    totalStations:       stations.length,
    availableStations:   stations.filter((s) => s.status === "Available").length,
    maintenanceStations: stations.filter((s) => s.status === "Maintenance").length,
  };
}
