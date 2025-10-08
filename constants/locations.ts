import { Location } from "../types";

const seedDate = new Date('2025-08-01T10:00:00Z').toISOString();

export const INITIAL_LOCATIONS: Location[] = [
  '123 Main St, Site A',
  '456 Oak Ave, Site B',
  '789 Pine Ln, Site C',
  'North Project - Sector 4',
  'Downtown Tower - Floors 10-15',
  'Westside Bridge Expansion'
].sort().map(name => ({
  id: crypto.randomUUID(),
  name,
  status: 'active' as 'active' | 'inactive',
  dateAdded: seedDate,
  lastModified: seedDate,
  history: [
    {
      timestamp: seedDate,
      action: 'CREATED',
      details: `Location "${name}" was created.`,
      actor: 'SYSTEM'
    }
  ]
}));
