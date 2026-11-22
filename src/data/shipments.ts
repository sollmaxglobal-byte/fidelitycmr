export const SHIPMENT_STATUSES = [
  "Order Confirmed",
  "Picked by Courier",
  "On The Way",
  "Custom Hold",
  "Delivered",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export type Place = {
  label: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
};

export type TrackingEvent = {
  id: string;
  status: ShipmentStatus;
  location: string;
  comment: string;
  at: string;
};

export type Shipment = {
  trackingNumber: string;
  status: ShipmentStatus;
  mode: string;
  weightKg: number;
  pieces: number;
  dimensions: string;
  shippedAt: string;
  pickupAt: string;
  expectedAt: string;
  updatedAt: string;
  origin: Place;
  current: Place;
  destination: Place;
  sender: { name: string; address: string; phone: string };
  recipient: { name: string; address: string; phone: string; email?: string };
  dutyFee: number;
  dutyPaid: boolean;
  events: TrackingEvent[];
};

const places = {
  cairo: { label: "Cairo, Egypt", city: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  newYork: {
    label: "New York, USA",
    city: "New York",
    country: "USA",
    lat: 40.7128,
    lng: -74.006,
  },
  lagos: { label: "Lagos, Nigeria", city: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792 },
  dakar: {
    label: "Dakar, Senegal",
    city: "Dakar",
    country: "Senegal",
    lat: 14.7167,
    lng: -17.4677,
  },
  london: {
    label: "London, United Kingdom",
    city: "London",
    country: "United Kingdom",
    lat: 51.5074,
    lng: -0.1278,
  },
  dubai: {
    label: "Dubai, United Arab Emirates",
    city: "Dubai",
    country: "United Arab Emirates",
    lat: 25.2048,
    lng: 55.2708,
  },
  toronto: {
    label: "Toronto, Canada",
    city: "Toronto",
    country: "Canada",
    lat: 43.6532,
    lng: -79.3832,
  },
} satisfies Record<string, Place>;

export const seedShipments: Shipment[] = [
  {
    trackingNumber: "REM-91076436",
    status: "Delivered",
    mode: "Sea Freight",
    weightKg: 0.5,
    pieces: 1,
    dimensions: "30 × 20 × 15 cm",
    shippedAt: "2024-01-17T07:14:00Z",
    pickupAt: "2024-01-17T07:14:00Z",
    expectedAt: "2024-01-20T09:16:00Z",
    updatedAt: "2026-09-02T12:21:00Z",
    origin: places.cairo,
    current: places.newYork,
    destination: places.newYork,
    sender: { name: "Lucky dube", address: "Cairo, Egypt", phone: "3221334556" },
    recipient: {
      name: "Ofofonobs Developer",
      address: "Desperate road 4b5, New York",
      phone: "2348114313795",
      email: "ofofonobs@gmail.com",
    },
    dutyFee: 1800,
    dutyPaid: true,
    events: [
      {
        id: "REM-91076436-7",
        status: "Delivered",
        location: "New York, USA",
        comment: "delivered",
        at: "2026-09-02T12:21:00Z",
      },
      {
        id: "REM-91076436-6",
        status: "Custom Hold",
        location: "New York, USA",
        comment: "pay",
        at: "2026-09-02T12:19:00Z",
      },
      {
        id: "REM-91076436-5",
        status: "On The Way",
        location: "Abuja",
        comment: "Currently in Abuja",
        at: "2026-03-26T14:03:00Z",
      },
      {
        id: "REM-91076436-4",
        status: "On The Way",
        location: "Atlantic Hub",
        comment: "ISS",
        at: "2025-10-02T03:09:00Z",
      },
      {
        id: "REM-91076436-3",
        status: "Order Confirmed",
        location: "Cairo, Egypt",
        comment: "Status updated from In Transit to Order Confirmed by admin.",
        at: "2025-08-15T16:42:00Z",
      },
      {
        id: "REM-91076436-2",
        status: "Picked by Courier",
        location: "Aba",
        comment: "Aba",
        at: "2024-01-19T08:18:00Z",
      },
      {
        id: "REM-91076436-1",
        status: "Custom Hold",
        location: "Lagos",
        comment: "Shipment is currently held by customs",
        at: "2024-01-19T08:17:00Z",
      },
    ],
  },
  {
    trackingNumber: "REM-77120459",
    status: "On The Way",
    mode: "Air Freight",
    weightKg: 12.4,
    pieces: 3,
    dimensions: "60 × 40 × 40 cm",
    shippedAt: "2026-11-14T09:20:00Z",
    pickupAt: "2026-11-14T11:05:00Z",
    expectedAt: "2026-11-25T17:00:00Z",
    updatedAt: "2026-11-20T08:42:00Z",
    origin: places.lagos,
    current: places.dakar,
    destination: places.london,
    sender: { name: "Adaeze Okafor", address: "12 Marina Road, Lagos", phone: "+234 802 555 0114" },
    recipient: {
      name: "James Whitfield",
      address: "48 Camden High Street, London",
      phone: "+44 7700 900123",
      email: "adaeze.buyer@example.com",
    },
    dutyFee: 420,
    dutyPaid: false,
    events: [
      {
        id: "REM-77120459-4",
        status: "On The Way",
        location: "Dakar, Senegal",
        comment: "Departed regional hub, in transit to London Gatwick.",
        at: "2026-11-20T08:42:00Z",
      },
      {
        id: "REM-77120459-3",
        status: "On The Way",
        location: "Lagos, Nigeria",
        comment: "Consignment cleared export customs.",
        at: "2026-11-16T13:30:00Z",
      },
      {
        id: "REM-77120459-2",
        status: "Picked by Courier",
        location: "Lagos, Nigeria",
        at: "2026-11-14T11:05:00Z",
        comment: "Collected from sender.",
      },
      {
        id: "REM-77120459-1",
        status: "Order Confirmed",
        location: "Lagos, Nigeria",
        comment: "Shipment booked and label generated.",
        at: "2026-11-14T09:20:00Z",
      },
    ],
  },
  {
    trackingNumber: "REM-33219805",
    status: "Order Confirmed",
    mode: "Air Freight",
    weightKg: 2.4,
    pieces: 1,
    dimensions: "45 × 35 × 30 cm",
    shippedAt: "2026-11-21T14:10:00Z",
    pickupAt: "2026-11-22T10:00:00Z",
    expectedAt: "2026-11-28T18:00:00Z",
    updatedAt: "2026-11-21T14:10:00Z",
    origin: places.dubai,
    current: places.dubai,
    destination: places.toronto,
    sender: {
      name: "Gulf Traders LLC",
      address: "Sheikh Zayed Road, Dubai",
      phone: "971501122334",
    },
    recipient: {
      name: "Megan Clarke",
      address: "88 Front Street West, Toronto",
      phone: "14165550199",
      email: "megan.clarke@example.com",
    },
    dutyFee: 0,
    dutyPaid: true,
    events: [
      {
        id: "REM-33219805-1",
        status: "Order Confirmed",
        location: "Dubai, United Arab Emirates",
        comment: "Shipment booked, awaiting courier pickup.",
        at: "2026-11-21T14:10:00Z",
      },
    ],
  },
];
