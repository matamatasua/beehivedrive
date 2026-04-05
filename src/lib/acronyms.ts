export interface AcronymDef {
  short: string;
  full: string;
  category: string;
  brief: string;
}

export const ACRONYMS: Record<string, AcronymDef> = {
  BAC: {
    short: "BAC",
    full: "Blood Alcohol Concentration",
    category: "DUI & Impaired Driving",
    brief: "The percentage of alcohol in your blood, used to measure impairment",
  },
  DUI: {
    short: "DUI",
    full: "Driving Under the Influence",
    category: "DUI & Impaired Driving",
    brief: "Operating a vehicle while impaired by alcohol or drugs",
  },
  DLD: {
    short: "DLD",
    full: "Driver License Division",
    category: "Licensing & Registration",
    brief: "Utah's government agency that handles driver licenses",
  },
  GDL: {
    short: "GDL",
    full: "Graduated Driver License",
    category: "Licensing & Registration",
    brief:
      "A tiered licensing system for new teen drivers with restrictions that ease over time",
  },
  PIP: {
    short: "PIP",
    full: "Personal Injury Protection",
    category: "Insurance & Financial Responsibility",
    brief:
      "Insurance that covers your medical bills regardless of who caused the accident",
  },
  MPH: {
    short: "MPH",
    full: "Miles Per Hour",
    category: "Speed & Traffic",
    brief: "Unit of speed measurement",
  },
  R2: {
    short: "R2",
    full: "R2 Traction Requirement",
    category: "Winter Driving",
    brief:
      "Utah's requirement for snow tires or chains in certain canyons",
  },
  UDOT: {
    short: "UDOT",
    full: "Utah Department of Transportation",
    category: "Government & Agencies",
    brief: "State agency managing Utah's roads and highways",
  },
  DWI: {
    short: "DWI",
    full: "Driving While Intoxicated",
    category: "DUI & Impaired Driving",
    brief:
      "Another term for impaired driving (some states use this instead of DUI)",
  },
  CDL: {
    short: "CDL",
    full: "Commercial Driver License",
    category: "Licensing & Registration",
    brief: "Special license required to drive large commercial vehicles",
  },
  SUV: {
    short: "SUV",
    full: "Sport Utility Vehicle",
    category: "Vehicles & Equipment",
    brief: "A type of vehicle with higher ground clearance",
  },
};
