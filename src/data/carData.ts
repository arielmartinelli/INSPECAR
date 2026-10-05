export interface CarDatabase {
  [brand: string]: {
    popularModels: string[];
    types: ('Sedán' | 'Hatchback' | 'SUV' | 'Pick-up' | 'Coupé')[];
  };
}

export const POPULAR_VEHICLES: CarDatabase = {
  Fiat: {
    popularModels: [
      'Cronos',
      'Toro Freedom',
      'Toro Volcano',
      'Toro Ranch',
      'Pulse',
      'Fastback',
      'Strada',
      'Palio',
      'Siena',
      'Argo',
      'Mobi',
      'Punto',
      'Uno',
      'Duna',
      'Idea',
      'Línea',
      'Bravo',
      'Fiorino',
      'Ducato',
      'Doblò'
    ],
    types: ['Sedán', 'Hatchback', 'Pick-up', 'SUV']
  },
  Volkswagen: {
    popularModels: [
      'Gol Trend',
      'Gol Power',
      'Amarok',
      'Polo',
      'Virtus',
      'Nivus',
      'T-Cross',
      'Taos',
      'Vento',
      'Fox',
      'Suran',
      'Up!',
      'Bora',
      'Passat',
      'Saveiro',
      'Tiguan',
      'Golf',
      'Transporter',
      'Scirocco'
    ],
    types: ['Hatchback', 'Sedán', 'Pick-up', 'SUV']
  },
  Toyota: {
    popularModels: [
      'Hilux',
      'Corolla',
      'Corolla Cross',
      'Etios',
      'Yaris',
      'SW4',
      'RAV4',
      'Land Cruiser',
      'Hiace',
      'GR86'
    ],
    types: ['Pick-up', 'Sedán', 'Hatchback', 'SUV']
  },
  Ford: {
    popularModels: [
      'Ranger',
      'Ranger Raptor',
      'Ka',
      'Ka Freestyle',
      'Fiesta',
      'Fiesta Kinetic',
      'Focus',
      'EcoSport',
      'Territory',
      'Maverick',
      'Kuga',
      'F-100',
      'Mondeo',
      'Transit',
      'Mustang'
    ],
    types: ['Pick-up', 'Hatchback', 'Sedán', 'SUV']
  },
  Renault: {
    popularModels: [
      'Sandero',
      'Stepway',
      'Logan',
      'Duster',
      'Duster Oroch',
      'Alaskan',
      'Clio',
      'Clio Mio',
      'Kwid',
      'Fluence',
      'Megane',
      'Captur',
      'Symbol',
      'Kangoo',
      'Master',
      'Trafic'
    ],
    types: ['Hatchback', 'Sedán', 'SUV', 'Pick-up']
  },
  Peugeot: {
    popularModels: [
      '208',
      '208 GT',
      '2008',
      '3008',
      '206',
      '207 Compact',
      '308',
      '408',
      '307',
      '5008',
      'Partner',
      'Expert',
      'Boxer',
      'RCZ'
    ],
    types: ['Hatchback', 'SUV', 'Sedán']
  },
  Chevrolet: {
    popularModels: [
      'Onix',
      'Onix Plus',
      'Tracker',
      'Cruze (Hatch/Sedán)',
      'S10',
      'Spin',
      'Celta',
      'Classic / Corsa',
      'Prisma',
      'Agile',
      'Montana',
      'Aveo',
      'Sonic',
      'Trailblazer',
      'Captiva',
      'Equinox',
      'Camaro'
    ],
    types: ['Hatchback', 'Sedán', 'SUV', 'Pick-up']
  },
  Honda: {
    popularModels: [
      'Civic',
      'HR-V',
      'CR-V',
      'Fit',
      'City',
      'WR-V',
      'Accord'
    ],
    types: ['Sedán', 'SUV', 'Hatchback']
  },
  Nissan: {
    popularModels: [
      'Frontier',
      'Kicks',
      'Versa',
      'Sentra',
      'March',
      'Note',
      'Tiida',
      'X-Trail',
      'Murano'
    ],
    types: ['Pick-up', 'SUV', 'Sedán', 'Hatchback']
  },
  Citroën: {
    popularModels: [
      'C3',
      'C3 Aircross',
      'C4 Cactus',
      'C4 Lounge',
      'C4',
      'Xsara Picasso',
      'Berlingo',
      'Jumpy',
      'Jumper'
    ],
    types: ['Hatchback', 'SUV', 'Sedán']
  },
  Jeep: {
    popularModels: [
      'Renegade',
      'Compass',
      'Commander',
      'Grand Cherokee',
      'Wrangler',
      'Gladiator'
    ],
    types: ['SUV', 'Pick-up']
  },
  Hyundai: {
    popularModels: [
      'Tucson',
      'Creta',
      'Santa Fe',
      'i10',
      'Grand i10',
      'i30',
      'Elantra',
      'H1'
    ],
    types: ['SUV', 'Hatchback', 'Sedán']
  },
  Kia: {
    popularModels: [
      'Sportage',
      'Seltos',
      'Carnival',
      'Cerato',
      'Rio',
      'Picanto',
      'Sorento'
    ],
    types: ['SUV', 'Sedán', 'Hatchback']
  },
  Suzuki: {
    popularModels: [
      'Swift',
      'Grand Vitara',
      'Jimny',
      'Fun',
      'Baleno',
      'Ignis'
    ],
    types: ['Hatchback', 'SUV']
  },
  Dodge: {
    popularModels: [
      'RAM 1500',
      'RAM 2500',
      'Journey',
      'Dakota',
      'Caliber'
    ],
    types: ['Pick-up', 'SUV']
  },
  BMW: {
    popularModels: [
      'Serie 1 (118i, 120i, 135i)',
      'Serie 3 (320i, 328i, 330i)',
      'Serie 4',
      'Serie 5',
      'X1',
      'X3',
      'X4',
      'X5'
    ],
    types: ['Sedán', 'SUV', 'Hatchback', 'Coupé']
  },
  'Mercedes-Benz': {
    popularModels: [
      'Clase A',
      'Clase C',
      'Clase E',
      'GLA',
      'GLC',
      'Sprinter',
      'Vito'
    ],
    types: ['Sedán', 'Hatchback', 'SUV']
  },
  Audi: {
    popularModels: [
      'A1',
      'A3',
      'A4',
      'A5',
      'Q2',
      'Q3',
      'Q5',
      'Q7'
    ],
    types: ['Hatchback', 'Sedán', 'SUV']
  }
};

export const VEHICLE_BODY_TYPES = [
  'Pick-up (Con caja)',
  'Sedán (Con baúl)',
  'Hatchback (Sin baúl)',
  'SUV / Camioneta cerrada',
  'Coupé (2 puertas)',
  'Furgón / Utilitario'
];

export type BlueprintKey = 'pickup' | 'sedan' | 'hatchback' | 'suv' | 'furgon';
export type BlueprintView = 'lateral_der' | 'lateral_izq' | 'frente' | 'trasera' | 'techo';

const ALL_VIEWS: BlueprintView[] = ['lateral_der', 'lateral_izq', 'frente', 'trasera', 'techo'];

/** Vistas que tienen plano para cada carrocería (el furgón no tiene vista de techo). */
export const BLUEPRINT_VIEWS: Record<BlueprintKey, BlueprintView[]> = {
  pickup: ALL_VIEWS,
  sedan: ALL_VIEWS,
  hatchback: ALL_VIEWS,
  suv: ALL_VIEWS,
  furgon: ['lateral_der', 'lateral_izq', 'frente', 'trasera']
};

/**
 * Única fuente de verdad para elegir el plano según la carrocería (la usan la app y el PDF).
 * Coupé usa por ahora la silueta del sedán hasta tener un plano propio.
 */
export const getBlueprintKey = (bodyType: string): BlueprintKey => {
  const n = (bodyType || '').toLowerCase();
  if (n.includes('pick') || n.includes('caja')) return 'pickup';
  if (n.includes('furg') || n.includes('utilit')) return 'furgon';
  if (n.includes('suv') || n.includes('camioneta') || n.includes('cerrada')) return 'suv';
  if (n.includes('hatch') || n.includes('sin baúl') || n.includes('sin baul')) return 'hatchback';
  return 'sedan';
};

export const isCoupe = (bodyType: string) => /coup/i.test(bodyType || '');

export const blueprintSrc = (key: BlueprintKey, view: string) => `/blueprints/crops/${key}_${view}.jpg`;

export const FUEL_TYPES = [
  'Nafta',
  'Diesel',
  'GNC / Nafta',
  'Híbrido',
  'Eléctrico'
];
