export interface DemoProduct {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  badge?: string;
  inStock: boolean;
  sku: string;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'prod_neural_accelerator',
    name: 'Neural Edge TPU Inference Module',
    category: 'Hardware Accelerators',
    price: '$249.00',
    description: 'Ultra-low latency 32 TOPS tensor processor for autonomous on-device model execution and real-time vision processing.',
    badge: 'Enterprise Tier',
    inStock: true,
    sku: 'TPU-EDGE-32X',
  },
  {
    id: 'prod_lidar_sensor',
    name: 'Solid-State LiDAR Rangefinder Sensor',
    category: 'Autonomous Perception',
    price: '$890.00',
    description: '300m range optical array with 0.05° angular resolution and dynamic weather penetration filtering.',
    badge: 'High Precision',
    inStock: true,
    sku: 'LIDAR-SS-300M',
  },
  {
    id: 'prod_hsm_keyvault',
    name: 'Hardware Security Module (HSM) Cryptovault',
    category: 'Security & Telematics',
    price: '$420.00',
    description: 'FIPS 140-3 Level 4 tamper-resistant hardware enclave for agent root identity and secure enclave key storage.',
    badge: 'Zero-Trust Certified',
    inStock: true,
    sku: 'HSM-VAULT-F4',
  },
  {
    id: 'prod_gateway_node',
    name: 'Autonomous Fleet Telemetry Gateway',
    category: 'Networking & Edge',
    price: '$560.00',
    description: 'Dual 5G / Gigabit Ethernet edge router with CAN-bus integration and automated WebMCP discovery broadcast.',
    badge: 'Edge Node',
    inStock: true,
    sku: 'GW-FLEET-5GX',
  },
  {
    id: 'prod_thermal_cooler',
    name: 'Dielectric Inverter Thermal Loop Cooling Kit',
    category: 'Thermal Systems',
    price: '$180.00',
    description: 'Closed-loop micro-channel liquid chiller designed for 24/7 sustained high-load AI compute workloads.',
    badge: 'Industrial Grade',
    inStock: true,
    sku: 'COOL-DIEL-400W',
  },
  {
    id: 'prod_optical_cam',
    name: 'Multi-Spectrum Stereoscopic AI Camera Array',
    category: 'Autonomous Perception',
    price: '$375.00',
    description: 'Global shutter 4K HDR stereo vision module with hardware synchronized depth mapping and IR illumination.',
    badge: '4K Stereo HDR',
    inStock: true,
    sku: 'CAM-STEREO-4K',
  },
  {
    id: 'prod_power_dist',
    name: 'Intelligent Solid-State Power Distribution Unit',
    category: 'Power Management',
    price: '$295.00',
    description: 'Microsecond-switchable digital breaker with per-channel power monitoring and automated load shedding.',
    badge: 'Telemetry Monitored',
    inStock: true,
    sku: 'PDU-SMART-8CH',
  },
  {
    id: 'prod_can_transceiver',
    name: 'Isolated CAN-FD / Ethernet Bus Bridge',
    category: 'Networking & Edge',
    price: '$145.00',
    description: 'Galvanically isolated vehicle network bridge supporting 8Mbps CAN-FD and zero-packet-drop buffering.',
    badge: 'ISO 11898-2',
    inStock: true,
    sku: 'BUS-CANFD-ISO',
  },
];
