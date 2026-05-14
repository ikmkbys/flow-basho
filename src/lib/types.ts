import type { Timestamp } from 'firebase/firestore';

export interface Candidate {
  id: string;
  name: string;
  tabelogUrl?: string;
  mapsUrl?: string;
  note?: string;
}

export interface BashoEvent {
  id: string;
  title: string;
  creatorName: string;
  creatorUid?: string;
  deadline?: string;
  yoteiUrl?: string;
  createdAt: Timestamp;
  candidates: Candidate[];
}

export type VoteValue = 'want' | 'ok' | 'pass';

export interface VoteResponse {
  id: string;
  respondentName: string;
  votes: Record<string, VoteValue>;
  answeredAt: Timestamp;
}

export interface Shop {
  id: string;
  name: string;
  tabelogUrl?: string;
  mapsUrl?: string;
  note?: string;
  ownerUid: string;
  lastUsedAt: Timestamp;
  useCount: number;
}
