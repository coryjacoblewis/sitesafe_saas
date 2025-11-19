import { TalkRecord } from './types';

// Simple PDF with text "SiteSafe Safety Topic"
const MOCK_PDF_DATA_URI = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUgcGFnZXMKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgNTk1LjI4IDg0MS44OSBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqICAlIHBhZ2UKPDwKICAvVHlwZSAvUGFnZQogIC9QYXJlbnQgMiAwIFIKICAvUmVzb3VyY2VzIDw8CiAgICAvRm9udCA8PAogICAgICAvRjEgNCAwIFIKICAgID4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqICAlIGZvbnQKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNSAwIG9iaiAgJSBjb250ZW50cwo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDcwMCBVEgovRjEgMjQgVGYKKFNpdGVTYWZlIFNhZmV0eSBUb3BpYykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAgCjAwMDAwMDAxNTcgMDAwMDAgbiAgCjAwMDAwMDAyNjggMDAwMDAgbiAgCjAwMDAwMDAzNTUgMDAwMDAgbiAgCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MAolJUVPRgo=";

const createHistory = (dateTime: string, foremanName: string) => [{
    timestamp: dateTime,
    action: 'CREATED' as const,
    details: 'Talk record submitted by foreman.',
    actor: foremanName,
}];

export const MOCK_TALK_RECORDS: TalkRecord[] = [
  {
    id: 'talk-001',
    dateTime: '2025-10-08T07:05:12Z',
    location: '123 Main St, Site A',
    topic: 'Fall Protection',
    topicId: 'topic-005',
    topicPdfUrl: MOCK_PDF_DATA_URI,
    foremanName: 'Frank Miller',
    crewSignatures: [
      { name: 'John Doe', signature: null },
      { name: 'Jane Smith', signature: null },
      { name: 'Mike Ross', signature: null },
    ],
    syncStatus: 'synced',
    recordStatus: 'submitted',
    history: createHistory('2025-10-08T07:05:12Z', 'Frank Miller'),
  },
  {
    id: 'talk-002',
    dateTime: '2025-10-07T07:10:30Z',
    location: '456 Oak Ave, Site B',
    topic: 'Personal Protective Equipment (PPE)',
    topicId: 'topic-010',
    topicPdfUrl: MOCK_PDF_DATA_URI,
    foremanName: 'Sarah Chen',
    crewSignatures: [
      { name: 'Carlos Ray', signature: null },
      { name: 'Emily White', signature: null },
    ],
    syncStatus: 'synced',
    recordStatus: 'submitted',
    history: createHistory('2025-10-07T07:10:30Z', 'Sarah Chen'),
  },
  {
    id: 'talk-003',
    dateTime: '2025-10-06T07:02:45Z',
    location: '123 Main St, Site A',
    topic: 'Hazard Communication',
    topicId: 'topic-007',
    topicPdfUrl: MOCK_PDF_DATA_URI,
    foremanName: 'Frank Miller',
    crewSignatures: [
      { name: 'John Doe', signature: null },
      { name: 'Jane Smith', signature: null },
      { name: 'Mike Ross', signature: null },
      { name: 'Lisa Ray', signature: null },
    ],
    syncStatus: 'synced',
    recordStatus: 'submitted',
    history: createHistory('2025-10-06T07:02:45Z', 'Frank Miller'),
  },
  {
    id: 'talk-004',
    dateTime: '2025-10-05T07:15:00Z',
    location: '789 Pine Ln, Site C',
    topic: 'Electrical Safety',
    topicId: 'topic-003',
    topicPdfUrl: MOCK_PDF_DATA_URI,
    foremanName: 'David Kim',
    crewSignatures: [
      { name: 'Peter Jones', signature: null },
      { name: 'Anna Garcia', signature: null },
      { name: 'Tom Wilson', signature: null },
    ],
    syncStatus: 'synced',
    recordStatus: 'submitted',
    history: createHistory('2025-10-05T07:15:00Z', 'David Kim'),
  },
    {
    id: 'talk-005',
    dateTime: '2025-10-04T07:08:22Z',
    location: '456 Oak Ave, Site B',
    topic: 'Scaffolding Safety',
    topicId: 'topic-011',
    topicPdfUrl: MOCK_PDF_DATA_URI,
    foremanName: 'Sarah Chen',
    crewSignatures: [
      { name: 'Carlos Ray', signature: null },
      { name: 'Emily White', signature: null },
      { name: 'Steve Holt', signature: null },
    ],
    syncStatus: 'synced',
    recordStatus: 'flagged', // Updated to show flagged status
    history: [
        ...createHistory('2025-10-04T07:08:22Z', 'Sarah Chen'),
        {
            timestamp: '2025-10-04T14:30:00Z',
            action: 'FLAGGED',
            details: 'Report flagged for correction. Reason: "Missing signature for Steve Holt."',
            actor: 'manager@sitesafe.com',
        }
    ],
    flag: {
        flaggedBy: 'manager@sitesafe.com',
        flaggedAt: '2025-10-04T14:30:00Z',
        reason: 'Missing signature for Steve Holt.',
    }
  },
  {
    id: 'talk-006',
    dateTime: '2025-10-03T07:01:50Z',
    location: '123 Main St, Site A',
    topic: 'Trenching and Excavation',
    topicId: 'topic-012',
    topicPdfUrl: MOCK_PDF_DATA_URI,
    foremanName: 'Frank Miller',
    crewSignatures: [
      { name: 'John Doe', signature: null },
      { name: 'Jane Smith', signature: null },
      { name: 'Mike Ross', signature: null },
    ],
    syncStatus: 'synced',
    recordStatus: 'submitted',
    history: createHistory('2025-10-03T07:01:50Z', 'Frank Miller'),
  },
  {
    id: 'talk-007',
    dateTime: '2025-10-02T07:11:11Z',
    location: '789 Pine Ln, Site C',
    topic: 'Fire Prevention',
    topicId: 'topic-006',
    topicPdfUrl: MOCK_PDF_DATA_URI,
    foremanName: 'David Kim',
    crewSignatures: [
      { name: 'Peter Jones', signature: null },
      { name: 'Anna Garcia', signature: null },
    ],
    syncStatus: 'synced',
    recordStatus: 'submitted',
    history: createHistory('2025-10-02T07:11:11Z', 'David Kim'),
  },
  {
    id: 'talk-008',
    dateTime: '2025-10-01T07:03:18Z',
    location: '456 Oak Ave, Site B',
    topic: 'Tool and Equipment Safety',
    topicId: 'topic-002',
    topicPdfUrl: MOCK_PDF_DATA_URI,
    foremanName: 'Sarah Chen',
    crewSignatures: [
      { name: 'Carlos Ray', signature: null },
      { name: 'Emily White', signature: null },
      { name: 'Steve Holt', signature: null },
    ],
    syncStatus: 'synced',
    recordStatus: 'submitted',
    history: createHistory('2025-10-01T07:03:18Z', 'Sarah Chen'),
  },
];