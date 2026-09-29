/**
 * Domain types used by the app. Table rows come from the generated `database.ts`;
 * RPC results are re-declared here with their real nullability (the generator marks
 * every RETURNS TABLE column as non-null).
 */
import type { Database, Json } from './database';

export type Mode = 'talent' | 'project' | 'investor';
export type CollabMode = 'Flash' | 'Side' | 'Equity';
export type HoursPerWeek = '' | 'flash' | 'light' | 'medium' | 'heavy' | 'full';
export type ProjectStage = 'Idée' | 'Prototype' | 'Lancé' | 'Croissance' | 'Série A+';
export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type LinkType =
  | 'github'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'behance'
  | 'linkedin'
  | 'pitch'
  | 'demo'
  | 'site'
  | 'autre';
export type SwipeDirection = 'like' | 'pass' | 'super';

export type ProfileLink = { type: LinkType; label: string; url: string; icon?: string };

type Tables = Database['public']['Tables'];
export type ProfileRow = Tables['profiles']['Row'];
export type TalentProfileRow = Tables['talent_profiles']['Row'];
export type ProjectProfileRow = Tables['project_profiles']['Row'];
export type InvestorProfileRow = Tables['investor_profiles']['Row'];
export type UserSettingsRow = Tables['user_settings']['Row'];
export type MessageRow = Tables['messages']['Row'];
export type NotificationRow = Tables['notifications']['Row'];
export type MissionRow = Tables['missions']['Row'];

export type MessageType = 'text' | 'image' | 'file' | 'mission' | 'system';
export type NotificationType = 'match' | 'message' | 'like' | 'contact' | 'mission' | 'system';

/** Result of get_me(): everything the app needs at startup (1 round trip). */
export type Me = {
  profile: ProfileRow;
  email: string | null;
  modes: Mode[];
  talent: TalentProfileRow | null;
  project: ProjectProfileRow | null;
  investor: InvestorProfileRow | null;
  settings: UserSettingsRow | null;
  unread_notifications: number;
  unread_messages: number;
  is_admin: boolean;
};

export type DeckCard = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  city: string | null;
  avatar_url: string | null;
  school: string | null;
  last_active_at: string;
  is_pro: boolean;
  statut: string | null;
  bio: string | null;
  skills: string[] | null;
  hours_per_week: HoursPerWeek | null;
  project_name: string | null;
  description: string | null;
  founder_bio: string | null;
  stage: ProjectStage | null;
  sectors: string[] | null;
  needs: string[] | null;
  work_mode: WorkMode | null;
  equity: string | null;
  budget: string | null;
  team_size: number | null;
  cover_url: string | null;
  collab_modes: CollabMode[] | null;
  links: ProfileLink[] | null;
  score: number;
  reasons: string[];
};

export type SwipeResult = { matched: boolean; match_id: string | null };

export type Conversation = {
  match_id: string;
  created_at: string;
  source: 'swipe' | 'contact';
  my_mode: Mode;
  other_mode: Mode;
  other_id: string;
  other_first_name: string | null;
  other_last_name: string | null;
  other_avatar_url: string | null;
  other_is_pro: boolean;
  other_last_active_at: string;
  other_project_name: string | null;
  other_statut: string | null;
  last_message_id: string | null;
  last_message_content: string | null;
  last_message_type: MessageType | null;
  last_message_sender_id: string | null;
  last_message_created_at: string | null;
  last_message_seen: boolean | null;
  unread_count: number;
};

export type AppNotification = Omit<NotificationRow, 'type' | 'data'> & {
  type: NotificationType;
  data: {
    match_id?: string;
    user_id?: string;
    request_id?: string;
    mission_id?: string;
    mode?: Mode;
    count?: number;
    [key: string]: Json | undefined;
  };
};

export type HomeStats = {
  likes_week: number;
  new_compatible: number;
  matches_total: number;
  matches_week: number;
  pending_contacts: number;
  likes_pending: number;
};

export type ProfileStats = {
  likes_received: number;
  investor_likes: number;
  likes_given: number;
  matches: number;
  conversations: number;
  missions_active: number;
  missions_done: number;
};

export type PublicProfile = {
  profile: Pick<
    ProfileRow,
    | 'id'
    | 'first_name'
    | 'last_name'
    | 'age'
    | 'city'
    | 'avatar_url'
    | 'school'
    | 'is_pro'
    | 'last_active_at'
    | 'created_at'
    | 'active_mode'
  >;
  modes: Mode[];
  talent: Omit<TalentProfileRow, 'id'> | null;
  project: Omit<ProjectProfileRow, 'id'> | null;
  investor: Omit<InvestorProfileRow, 'id'> | null;
  viewer: {
    is_me: boolean;
    match_id: string | null;
    contact_status: 'sent' | 'received' | null;
    contact_request_id: string | null;
    blocked: boolean;
  } | null;
};

export type SearchResult = {
  user_id: string;
  mode: Mode;
  name: string;
  subtitle: string;
  tags: string[];
  stage: ProjectStage | null;
  collab_modes: CollabMode[];
  dept_code: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  city: string | null;
  cover_url: string | null;
  last_active_at: string;
  rank: number;
};

export type SearchFilters = {
  dept?: string;
  stage?: ProjectStage;
  tags?: string[];
  collab?: CollabMode[];
};

export type LikeReceived = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  city: string | null;
  mode: Mode;
  direction: SwipeDirection;
  liked_at: string;
  project_name: string | null;
  statut: string | null;
};

export type ContactRequest = {
  id: string;
  direction: 'incoming' | 'outgoing';
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message: string;
  from_mode: Mode;
  created_at: string;
  other_id: string;
  other_first_name: string | null;
  other_last_name: string | null;
  other_avatar_url: string | null;
  other_project_name: string | null;
};

export type MatchDetails = { score: number; reasons: string[] };

export type ModerationItem = {
  report_id: string;
  reason: string;
  details: string;
  status: 'open' | 'actioned' | 'dismissed';
  created_at: string;
  reporter_id: string | null;
  reporter_name: string;
  reported_id: string | null;
  reported_name: string;
  reported_avatar_url: string | null;
  reported_suspended: boolean;
  reports_against: number;
  message_content: string | null;
};

export type ReportReason = 'spam' | 'harassment' | 'fake' | 'inappropriate' | 'scam' | 'other';

/** Payload stored in the signup metadata and applied server-side (private.apply_onboarding). */
export type OnboardingPayload = {
  first_name?: string;
  last_name?: string;
  age?: number;
  city?: string | null;
  school?: string | null;
  roles: Mode[];
  talent?: {
    skills?: string[];
    hours_per_week?: HoursPerWeek;
    collab_modes?: CollabMode[];
    statut?: string;
  };
  project?: {
    project_name?: string;
    stage?: ProjectStage;
    sectors?: string[];
    needs?: string[];
    collab_modes?: CollabMode[];
  };
  investor?: {
    ticket?: 'micro' | 'small' | 'medium' | 'large';
    sectors?: string[];
    preferred_stages?: ProjectStage[];
  };
};
