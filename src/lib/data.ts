import type { Fault, Worker } from "./types";

export const workers: Worker[] = [
  { id: "worker-1", name: "Jonas Jonaitis", email: "jonas@zarasubustas.lt", password: "password123", specialty: ["electricity", "general"] },
  { id: "worker-2", name: "Petras Petraitis", email: "petras@zarasubustas.lt", password: "password123", specialty: ["plumbing"] },
  { id: "worker-3", name: "Ona Onaitė", email: "ona@zarasubustas.lt", password: "password123", specialty: ["renovation", "general"] },
];

export const faults: Omit<Fault, 'createdAt' | 'updatedAt'>[] = [
  {
    id: "FAULT-001",
    reporterName: "Marija Marijona",
    reporterEmail: "marija@email.com",
    reporterPhone: "+37061234567",
    address: "Vilniaus g. 1, Vilnius",
    type: "plumbing",
    description: "Laša vanduo iš čiaupo virtuvėje. Atrodo, kad sugedo tarpinė.",
    status: "assigned",
    assignedTo: "worker-2",
  },
  {
    id: "FAULT-002",
    reporterName: "Kazys Kaziukas",
    reporterEmail: "kazys@email.com",
    reporterPhone: "+37061234568",
    address: "Kauno al. 23-5, Kaunas",
    type: "electricity",
    description: "Nėra elektros viename kambaryje. Saugikliai atrodo tvarkingi.",
    status: "new",
  },
  {
    id: "FAULT-003",
    reporterName: "Barbora Barboriuke",
    reporterEmail: "barbora@email.com",
    reporterPhone: "+37061234569",
    address: "Gedimino pr. 9, Vilnius",
    type: "renovation",
    description: "Reikalingas kosmetinis remontas koridoriuje po vamzdyno avarijos.",
    status: "completed",
    assignedTo: "worker-3",
    workerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    customerSignature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
  },
  {
    id: "FAULT-004",
    reporterName: "Juozas Juozapavicius",
    reporterEmail: "juozas@email.com",
    reporterPhone: "+37061234570",
    address: "Klaipėdos g. 15, Klaipėda",
    type: "general",
    description: "Sulūžo laiptinės durų spyna, nebeužsirakina.",
    status: "in-progress",
    assignedTo: "worker-1",
  },
    {
    id: "FAULT-005",
    reporterName: "Rūta Rūtelė",
    reporterEmail: "ruta@email.com",
    reporterPhone: "+37061234571",
    address: "Šiaulių pl. 5, Šiauliai",
    type: "plumbing",
    description: "Užsikimšo vonios nutekėjimas, vanduo nebėga.",
    status: "new",
  },
];
