/* Types mirroring the TrustPRO API (see trustpro_backend/docs/API.md). */

export type NextStep = "PROFILE" | "ID_VERIFICATION" | "INTERVIEW";

export interface User {
  user_id: number;
  email: string;
  user_type: string;
  profile_complete: boolean;
  id_captured: boolean;
  next_step: NextStep;
}

/** A recruiter login that can open exactly one candidate report. */
export interface RecruiterAccess {
  login_id: string;
  report_id: number;
  candidate_name: string;
  expires_at: string;
}

export interface Profile {
  candidate_id: number;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  mobile_number: string | null;
  city: string | null;
  profile_photo_url: string | null;
  complete: boolean;
}

/** A government ID captured on camera; it is analysed when the report is generated. */
export interface IdDetails {
  name: string | null;
  id_number: string | null;
  id_type: string | null;
  dob: string | null;
}

export interface IdCapture {
  verification_id: number;
  attempt_no: number;
  capture_url: string | null;
  portrait_url: string | null;
  details: IdDetails;
  confirmed: boolean;
  created_at: string | null;
}

export interface Issue {
  code: string;
  message: string;
}

export interface FaceCheck {
  similarity: number | null;
  threshold: number;
  consistent: boolean | null;
  result?: "CONSISTENT" | "NOT_CONSISTENT" | "INCONCLUSIVE" | "UNAVAILABLE";
}

export type ReportState = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ReportBrief {
  report_id: number;
  status: ReportState;
  progress_pct: number;
  current_stage: string | null;
  error_message: string | null;
}

export interface Interview {
  interview_id: number;
  status: "CREATED" | "LIVE" | "ENDED" | "ABANDONED";
  identity_status: "ID_CAPTURED";
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number | null;
  recording_status: "NONE" | "UPLOADING" | "COMPLETE" | "FAILED";
  recording_chunks: number;
  recording_url: string | null;
  created_at: string | null;
  latest_report: ReportBrief | null;
}

export interface ReportStatus {
  report_id: number;
  interview_id: number;
  status: ReportState;
  progress_pct: number;
  current_stage: string | null;
  error_message: string | null;
  frames_analyzed: number;
  requested_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface EvidenceItem {
  evidence_id: number;
  kind: "IDENTITY" | "ENVIRONMENT";
  label: string;
  offset_ms: number;
  image_url: string | null;
  confidence: number | null;
  model_result: Record<string, unknown>;
  live: boolean;
}

export type ComparisonResult = "CONSISTENT" | "NOT_CONSISTENT" | "MIXED" | "INCONCLUSIVE" | "UNAVAILABLE";

export interface Comparison {
  pair: string;
  label: string;
  similarity: number | null;
  result: ComparisonResult;
  threshold?: number;
  frames_compared?: number;
  consistent_frames?: number;
  consistent_pct?: number | null;
  min_similarity?: number;
  max_similarity?: number;
}

export interface NameCheck {
  score: number;
  matched: boolean;
  text: string | null;
  order_same: boolean | null;
  extra_words: string[];
  parts: Record<string, number>;
}

export interface IdDocumentCheck {
  status: "completed" | "failed";
  error?: string;
  attempt_no?: number;
  capture_url?: string | null;
  portrait_url?: string | null;
  captured_at?: string | null;
  checks?: {
    portrait_detected: boolean;
    text_readable: boolean;
    text_lines_read: number;
    name: NameCheck | null;
    dob_match: boolean | null;
    dates_found: string[];
    face_vs_profile: FaceCheck;
  };
  quality?: { blurry?: boolean; too_dark?: boolean; glare?: boolean };
}

export interface IdentitySection {
  status: "completed" | "partial" | "failed";
  id_document?: IdDocumentCheck;
  error?: string;
  engine?: string;
  threshold?: number;
  comparisons?: Comparison[];
  overall?: { result: ComparisonResult; explanation: string };
  video?: { frames_analyzed: number; frames_with_face: number; frames_without_face: number; frames_with_multiple_faces: number; frames_failed: number };
  low_similarity_periods?: { start_ms: number; end_ms: number; frames: number; min_similarity: number; median_similarity: number; evidence_offset_ms?: number }[];
  timeline?: [number, number | null, number][];
  evidence: EvidenceItem[];
}

export interface EnvironmentEvent {
  event_id: number;
  source: "LIVE" | "ANALYSIS";
  event_type: string;
  title: string;
  start_ms: number;
  end_ms: number;
  duration_ms: number;
  peak_confidence: number | null;
  frames: number;
  confirmed_by: string | null;
  evidence: EvidenceItem | null;
  frame_evidence?: EvidenceItem[];   // every sampled frame of the event
}

export interface EnvironmentSection {
  status: "completed" | "partial" | "failed";
  error?: string;
  model?: string;
  frames_analyzed?: number;
  events_total?: number;
  events_by_type?: Record<string, number>;
  neighbour_frames_checked?: number;
  unconfirmed_single_frame_detections?: number;
  frames_with_one_person?: number;
  frames_with_no_person?: number;
  frames_with_background_people?: number;
  ignored_by_relevance_rules?: Record<string, number>;
  events: EnvironmentEvent[];
  live_events: EnvironmentEvent[];
}

export type GazeDirection = "FORWARD" | "LEFT" | "RIGHT" | "UP" | "DOWN" | "NO_FACE";

export interface GazeSection {
  status: "completed" | "no_data";
  interview_duration_ms?: number;
  monitored_ms?: number;
  events_total?: number;
  by_direction?: { direction: GazeDirection; total_ms: number; share_pct: number; episodes: number }[];
  away_episodes_over_2s?: number;
  longest_away?: { direction: GazeDirection; start_ms: number; duration_ms: number } | null;
  method?: string;
  events: { direction: GazeDirection; start_ms: number; end_ms: number; duration_ms: number; confidence: number | null; frames: number }[];
}

export interface FullReport extends ReportStatus {
  overview?: {
    candidate: {
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
      date_of_birth: string | null;
      mobile_number: string | null;
      city: string | null;
      profile_photo_url: string | null;
    };
    interview: Interview;
  };
  identity?: IdentitySection;
  gaze?: GazeSection;
  environment?: EnvironmentSection;
  evidence?: EvidenceItem[];
  processing?: {
    sample_interval_ms?: number;
    frames_analyzed?: number;
    frames_expected?: number;
    video?: { width: number; height: number; fps: number; codec: string };
    timings?: Record<string, number>;
    parallel?: Record<string, number>;
    models?: Record<string, string>;
  };
}

/* Live monitor messages */
export interface GazeMessage {
  type: "gaze";
  offset_ms: number;
  direction: GazeDirection;
  stable_direction: GazeDirection | null;
  confidence: number;
  faces: number;
  calibrated: boolean;
}

export interface EnvironmentAlert {
  event_type: string;
  title: string;
  message: string;
  confidence: number | null;
}

export interface EnvironmentMessage {
  type: "environment";
  offset_ms: number;
  available: boolean;
  persons?: number;
  active: EnvironmentAlert[];
}

export type MonitorMessage =
  | { type: "ready"; calibrated: boolean }
  | { type: "calibration"; frames: number; needed: number; face: boolean }
  | { type: "calibrated"; ok: boolean; frames: number }
  | { type: "skipped"; offset_ms: number }
  | GazeMessage
  | EnvironmentMessage
  | { type: "error"; code: string; message: string };
