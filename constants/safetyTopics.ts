import { SafetyTopic } from "../types";

const seedDate = new Date('2025-08-01T10:00:00Z').toISOString();

// Simple PDF with text "SiteSafe Safety Topic"
const MOCK_PDF_DATA_URI = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUgcGFnZXMKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgNTk1LjI4IDg0MS44OSBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqICAlIHBhZ2UKPDwKICAvVHlwZSAvUGFnZQogIC9QYXJlbnQgMiAwIFIKICAvUmVzb3VyY2VzIDw8CiAgICAvRm9udCA8PAogICAgICAvRjEgNCAwIFIKICAgID4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqICAlIGZvbnQKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNSAwIG9iaiAgJSBjb250ZW50cwo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDcwMCBVEgovRjEgMjQgVGYKKFNpdGVTYWZlIFNhZmV0eSBUb3BpYykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAgCjAwMDAwMDAxNTcgMDAwMDAgbiAgCjAwMDAwMDAyNjggMDAwMDAgbiAgCjAwMDAwMDAzNTUgMDAwMDAgbiAgCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MAolJUVPRgo=";

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
  pdfUrl: MOCK_PDF_DATA_URI, 
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