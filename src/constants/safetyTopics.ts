import { SafetyTopic } from "../types";

const seedDate = new Date('2025-08-01T10:00:00Z').toISOString();

const TOPIC_DATA = [
    { id: 'topic-001', name: 'Confined Spaces' },
    { id: 'topic-002', name: 'Tool and Equipment Safety' },
    { id: 'topic-003', name: 'Electrical Safety' },
    { id: 'topic-004', name: 'First Aid and Emergency Response' },
    { id: 'topic-005', name: 'Fall Protection' },
    { id: 'topic-006', name: 'Fire Prevention' },
    { id: 'topic-007', name: 'Hazard Communication' },
    { id: 'topic-008', name: 'Ladders and Stairways' },
    { id: 'topic-009', name: 'Lockout/Tagout Procedures' },
    { id: 'topic-010', name: 'Personal Protective Equipment (PPE)' },
    { id: 'topic-011', name: 'Scaffolding Safety' },
    { id: 'topic-012', name: 'Trenching and Excavation' },
];


export const INITIAL_SAFETY_TOPICS: SafetyTopic[] = TOPIC_DATA.map(({id, name}) => ({
  id,
  name,
  content: `This topic covers the essential safety guidelines for ${name}. Please refer to the PDF for detailed procedures and checklists.`,
  pdfUrl: '/mock-topic.pdf', // Using a placeholder PDF link
  status: 'active' as 'active' | 'inactive',
  dateAdded: seedDate,
  lastModified: seedDate,
  history: [
    {
      timestamp: seedDate,
      action: 'CREATED',
      details: `Topic "${name}" was created.`,
      actor: 'SYSTEM'
    }
  ]
}));