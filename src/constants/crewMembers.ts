import { CrewMember } from "../types";

// In a real application, this data would likely be fetched from a database
// and be associated with a specific company or foreman.
// This serves as the initial seed data if localStorage is empty.

const seedDate = new Date('2025-08-01T10:00:00Z').toISOString();

export const INITIAL_CREW_MEMBERS: CrewMember[] = [
  'John Doe',
  'Jane Smith',
  'Mike Ross',
  'Carlos Ray',
  'Emily White',
  'Lisa Ray',
  'Peter Jones',
  'Anna Garcia',
  'Tom Wilson',
  'Steve Holt',
  'Harvey Specter',
  'Donna Paulsen',
  'Louis Litt',
  'Jessica Pearson',
  'Rachel Zane',
  'Daniel Hardman',
  'Katrina Bennett',
  'Alex Williams',
  'Samantha Wheeler',
  'Robert Zane'
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
      details: `Crew member added with name "${name}".`,
      actor: 'SYSTEM'
    }
  ]
}));