export interface User {
  email: string;
  role: 'owner' | 'foreman';
}

export interface CrewSignature {
  name: string;
  signature: string | null;
  isGuest?: boolean;
}

export interface TalkRecord {
  id: string;
  dateTime: string;
  location: string;
  topic: string; // This is the topic name for display
  topicId: string; // The ID of the topic for stable reference
  topicPdfUrl: string; // The specific PDF URL at the time of the talk for compliance
  foremanName: string;
  crewSignatures: CrewSignature[];
  syncStatus: 'synced' | 'pending';
  recordStatus: 'submitted' | 'flagged' | 'amended';
  history: ChangeLog[];
  flag?: {
    flaggedBy: string; // manager's email
    flaggedAt: string; // ISO date string
    reason: string;
  };
  originalTalkId?: string; // If this is an amendment, this points to the original
}

export type FeedbackCategory = 'bug' | 'idea' | 'question' | 'design' | 'general';

export interface FeedbackSubmission {
  category: FeedbackCategory;
  formData: Record<string, any>;
  allowContact: boolean;
  context: {
    userEmail?: string;
    url: string;
    userAgent: string;
    screenResolution: string;
  };
}

export type ChangeLogAction =
  | 'CREATED'
  | 'UPDATED_NAME'
  | 'ACTIVATED'
  | 'DEACTIVATED'
  | 'UPDATED_CONTENT'
  | 'UPDATED_PDF'
  | 'UPDATED_DETAILS'
  | 'FLAGGED'
  | 'FLAG_RESOLVED'
  | 'AMENDED';


export interface ChangeLog {
  timestamp: string;
  action: ChangeLogAction;
  details: string;
  actor?: string | null;
}

export interface CrewMember {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  dateAdded: string;
  lastModified: string;
  history: ChangeLog[];
}

export interface PendingCrewMember {
  id: string; // unique ID based on normalized name
  name: string;
  source: {
    talkId: string;
    foremanEmail: string;
    dateAdded: string;
  };
}


export interface SafetyTopic {
  id: string;
  name: string;
  content: string; // Brief description or key points
  pdfUrl: string; // Link to the detailed PDF (can be a path or a data URL)
  status: 'active' | 'inactive';
  dateAdded: string;
  lastModified: string;
  history: ChangeLog[];
}

export interface Location {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  dateAdded: string;
  lastModified: string;
  history: ChangeLog[];
}