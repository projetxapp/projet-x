
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admins_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"contact_requests": {
                  Row: {
                    "created_at": string,"from_mode": string,"from_user": string,"id": string,"match_id": string | null,"message": string,"responded_at": string | null,"status": string,"to_user": string
                  }
                  Insert: {
                    "created_at"?: string,"from_mode": string,"from_user": string,"id"?: string,"match_id"?: string | null,"message"?: string,"responded_at"?: string | null,"status"?: string,"to_user": string
                  }
                  Update: {
                    "created_at"?: string,"from_mode"?: string,"from_user"?: string,"id"?: string,"match_id"?: string | null,"message"?: string,"responded_at"?: string | null,"status"?: string,"to_user"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contact_requests_from_user_fkey"
      columns: ["from_user"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contact_requests_match_id_fkey"
      columns: ["match_id"]
isOneToOne: false
      referencedRelation: "matches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contact_requests_to_user_fkey"
      columns: ["to_user"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"investor_profiles": {
                  Row: {
                    "bio": string,"id": string,"links": NonNullable<Json>,"portfolio": NonNullable<Json>,"preferred_stages": (string)[],"sectors": (string)[],"statut": string,"thesis": string,"ticket_max": number,"ticket_min": number,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "bio"?: string,"id"?: string,"links"?: NonNullable<Json>,"portfolio"?: NonNullable<Json>,"preferred_stages"?: (string)[],"sectors"?: (string)[],"statut"?: string,"thesis"?: string,"ticket_max"?: number,"ticket_min"?: number,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "bio"?: string,"id"?: string,"links"?: NonNullable<Json>,"portfolio"?: NonNullable<Json>,"preferred_stages"?: (string)[],"sectors"?: (string)[],"statut"?: string,"thesis"?: string,"ticket_max"?: number,"ticket_min"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "investor_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"matches": {
                  Row: {
                    "created_at": string,"id": string,"last_message_at": string | null,"mode1": string,"mode2": string,"source": string,"user1_id": string,"user2_id": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"last_message_at"?: string | null,"mode1": string,"mode2": string,"source"?: string,"user1_id": string,"user2_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"last_message_at"?: string | null,"mode1"?: string,"mode2"?: string,"source"?: string,"user1_id"?: string,"user2_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "matches_user1_id_fkey"
      columns: ["user1_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "matches_user2_id_fkey"
      columns: ["user2_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"matching_weights": {
                  Row: {
                    "component": string,"description": string,"mode": string,"weight": number
                  }
                  Insert: {
                    "component": string,"description"?: string,"mode": string,"weight": number
                  }
                  Update: {
                    "component"?: string,"description"?: string,"mode"?: string,"weight"?: number
                  }
                  Relationships: [
                    
                  ]
                },"messages": {
                  Row: {
                    "attachment_mime": string | null,"attachment_name": string | null,"attachment_size": number | null,"attachment_url": string | null,"content": string,"created_at": string,"id": string,"match_id": string,"metadata": NonNullable<Json>,"seen": boolean,"seen_at": string | null,"sender_id": string,"type": string
                  }
                  Insert: {
                    "attachment_mime"?: string | null,"attachment_name"?: string | null,"attachment_size"?: number | null,"attachment_url"?: string | null,"content": string,"created_at"?: string,"id"?: string,"match_id": string,"metadata"?: NonNullable<Json>,"seen"?: boolean,"seen_at"?: string | null,"sender_id": string,"type"?: string
                  }
                  Update: {
                    "attachment_mime"?: string | null,"attachment_name"?: string | null,"attachment_size"?: number | null,"attachment_url"?: string | null,"content"?: string,"created_at"?: string,"id"?: string,"match_id"?: string,"metadata"?: NonNullable<Json>,"seen"?: boolean,"seen_at"?: string | null,"sender_id"?: string,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_match_id_fkey"
      columns: ["match_id"]
isOneToOne: false
      referencedRelation: "matches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"missions": {
                  Row: {
                    "budget": number | null,"created_at": string,"description": string | null,"equity_percent": number | null,"id": string,"match_id": string | null,"mode": string,"proposed_by": string | null,"status": string,"title": string,"updated_at": string
                  }
                  Insert: {
                    "budget"?: number | null,"created_at"?: string,"description"?: string | null,"equity_percent"?: number | null,"id"?: string,"match_id"?: string | null,"mode": string,"proposed_by"?: string | null,"status"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "budget"?: number | null,"created_at"?: string,"description"?: string | null,"equity_percent"?: number | null,"id"?: string,"match_id"?: string | null,"mode"?: string,"proposed_by"?: string | null,"status"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "missions_match_id_fkey"
      columns: ["match_id"]
isOneToOne: false
      referencedRelation: "matches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "missions_proposed_by_fkey"
      columns: ["proposed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string,"created_at": string,"data": NonNullable<Json>,"id": string,"pushed_at": string | null,"read": boolean,"title": string,"type": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "body"?: string,"created_at"?: string,"data"?: NonNullable<Json>,"id"?: string,"pushed_at"?: string | null,"read"?: boolean,"title": string,"type": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"data"?: NonNullable<Json>,"id"?: string,"pushed_at"?: string | null,"read"?: boolean,"title"?: string,"type"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "active_mode": string,"age": number | null,"avatar_url": string | null,"city": string | null,"created_at": string,"dark_mode": boolean | null,"dept_code": string | null,"first_name": string | null,"id": string,"is_pro": boolean,"last_active_at": string,"last_name": string | null,"onboarding_completed": boolean,"region_code": string | null,"school": string | null,"suspended_at": string | null,"updated_at": string
                  }
                  Insert: {
                    "active_mode"?: string,"age"?: number | null,"avatar_url"?: string | null,"city"?: string | null,"created_at"?: string,"dark_mode"?: boolean | null,"dept_code"?: never,"first_name"?: string | null,"id": string,"is_pro"?: boolean,"last_active_at"?: string,"last_name"?: string | null,"onboarding_completed"?: boolean,"region_code"?: never,"school"?: string | null,"suspended_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "active_mode"?: string,"age"?: number | null,"avatar_url"?: string | null,"city"?: string | null,"created_at"?: string,"dark_mode"?: boolean | null,"dept_code"?: never,"first_name"?: string | null,"id"?: string,"is_pro"?: boolean,"last_active_at"?: string,"last_name"?: string | null,"onboarding_completed"?: boolean,"region_code"?: never,"school"?: string | null,"suspended_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"project_profiles": {
                  Row: {
                    "budget": string,"collab_modes": (string)[],"cover_url": string | null,"description": string,"equity": string,"founder_bio": string,"id": string,"links": NonNullable<Json>,"needs": (string)[],"project_name": string,"sectors": (string)[],"stage": string,"statut": string,"team_size": number,"updated_at": string,"user_id": string,"work_mode": string
                  }
                  Insert: {
                    "budget"?: string,"collab_modes"?: (string)[],"cover_url"?: string | null,"description"?: string,"equity"?: string,"founder_bio"?: string,"id"?: string,"links"?: NonNullable<Json>,"needs"?: (string)[],"project_name"?: string,"sectors"?: (string)[],"stage"?: string,"statut"?: string,"team_size"?: number,"updated_at"?: string,"user_id": string,"work_mode"?: string
                  }
                  Update: {
                    "budget"?: string,"collab_modes"?: (string)[],"cover_url"?: string | null,"description"?: string,"equity"?: string,"founder_bio"?: string,"id"?: string,"links"?: NonNullable<Json>,"needs"?: (string)[],"project_name"?: string,"sectors"?: (string)[],"stage"?: string,"statut"?: string,"team_size"?: number,"updated_at"?: string,"user_id"?: string,"work_mode"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"push_tokens": {
                  Row: {
                    "created_at": string,"platform": string,"token": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"platform": string,"token": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"platform"?: string,"token"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_tokens_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reports": {
                  Row: {
                    "created_at": string,"details": string,"id": string,"match_id": string | null,"message_id": string | null,"reason": string,"reported_id": string | null,"reporter_id": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"status": string
                  }
                  Insert: {
                    "created_at"?: string,"details"?: string,"id"?: string,"match_id"?: string | null,"message_id"?: string | null,"reason": string,"reported_id"?: string | null,"reporter_id"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"details"?: string,"id"?: string,"match_id"?: string | null,"message_id"?: string | null,"reason"?: string,"reported_id"?: string | null,"reporter_id"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_match_id_fkey"
      columns: ["match_id"]
isOneToOne: false
      referencedRelation: "matches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "messages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reported_id_fkey"
      columns: ["reported_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"search_index": {
                  Row: {
                    "collab_modes": (string)[],"created_at": string,"dept_code": string | null,"document": unknown,"mode": string,"name": string,"stage": string | null,"subtitle": string,"tags": (string)[],"tags_l": (string)[],"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "collab_modes"?: (string)[],"created_at"?: string,"dept_code"?: string | null,"document"?: unknown,"mode": string,"name"?: string,"stage"?: string | null,"subtitle"?: string,"tags"?: (string)[],"tags_l"?: (string)[],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "collab_modes"?: (string)[],"created_at"?: string,"dept_code"?: string | null,"document"?: unknown,"mode"?: string,"name"?: string,"stage"?: string | null,"subtitle"?: string,"tags"?: (string)[],"tags_l"?: (string)[],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "search_index_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"subscriptions": {
                  Row: {
                    "cancel_at_period_end": boolean,"created_at": string,"current_period_end": string | null,"customer_id": string | null,"id": string,"plan": string,"provider": string,"status": string,"subscription_id": string | null,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "cancel_at_period_end"?: boolean,"created_at"?: string,"current_period_end"?: string | null,"customer_id"?: string | null,"id"?: string,"plan"?: string,"provider"?: string,"status"?: string,"subscription_id"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "cancel_at_period_end"?: boolean,"created_at"?: string,"current_period_end"?: string | null,"customer_id"?: string | null,"id"?: string,"plan"?: string,"provider"?: string,"status"?: string,"subscription_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"swipes": {
                  Row: {
                    "created_at": string,"direction": string,"id": string,"swiped_id": string,"swiper_id": string,"swiper_mode": string
                  }
                  Insert: {
                    "created_at"?: string,"direction": string,"id"?: string,"swiped_id": string,"swiper_id": string,"swiper_mode": string
                  }
                  Update: {
                    "created_at"?: string,"direction"?: string,"id"?: string,"swiped_id"?: string,"swiper_id"?: string,"swiper_mode"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "swipes_swiped_id_fkey"
      columns: ["swiped_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "swipes_swiper_id_fkey"
      columns: ["swiper_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"talent_profiles": {
                  Row: {
                    "bio": string,"collab_modes": (string)[],"hours_per_week": string,"id": string,"links": NonNullable<Json>,"skills": (string)[],"statut": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "bio"?: string,"collab_modes"?: (string)[],"hours_per_week"?: string,"id"?: string,"links"?: NonNullable<Json>,"skills"?: (string)[],"statut"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "bio"?: string,"collab_modes"?: (string)[],"hours_per_week"?: string,"id"?: string,"links"?: NonNullable<Json>,"skills"?: (string)[],"statut"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "talent_profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_modes": {
                  Row: {
                    "created_at": string | null,"id": string,"mode": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"mode": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"mode"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_modes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_roles": {
                  Row: {
                    "id": string,"is_active": boolean | null,"role": string | null,"user_id": string | null
                  }
                  Insert: {
                    "id"?: string,"is_active"?: boolean | null,"role"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "id"?: string,"is_active"?: boolean | null,"role"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"user_settings": {
                  Row: {
                    "push_enabled": boolean,"push_likes": boolean,"push_matches": boolean,"push_messages": boolean,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "push_enabled"?: boolean,"push_likes"?: boolean,"push_matches"?: boolean,"push_messages"?: boolean,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "push_enabled"?: boolean,"push_likes"?: boolean,"push_matches"?: boolean,"push_messages"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_settings_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"users": {
                  Row: {
                    "avatar_url": string | null,"city": string | null,"created_at": string | null,"email": string,"full_name": string | null,"id": string,"is_verified": boolean | null,"last_active_at": string | null
                  }
                  Insert: {
                    "avatar_url"?: string | null,"city"?: string | null,"created_at"?: string | null,"email": string,"full_name"?: string | null,"id"?: string,"is_verified"?: boolean | null,"last_active_at"?: string | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"city"?: string | null,"created_at"?: string | null,"email"?: string,"full_name"?: string | null,"id"?: string,"is_verified"?: boolean | null,"last_active_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "activate_mode":
{ Args: { "p_mode": string }; Returns: undefined
                           },
"block_user":
{ Args: { "p_user": string }; Returns: undefined
                           },
"calculate_match_score":
{ Args: { "p_mode": string,"p_target_id": string,"p_user_id": string }; Returns: number
                           },
"cancel_contact_request":
{ Args: { "p_request_id": string }; Returns: undefined
                           },
"claim_notification_push":
{ Args: { "p_notification_id": string }; Returns: Json
                           },
"complete_onboarding":
{ Args: { "p_payload": Json }; Returns: undefined
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"export_my_data":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"forget_push_tokens":
{ Args: { "p_tokens": (string)[] }; Returns: undefined
                           },
"get_blocked_users":
{ Args: Record<PropertyKey, never>; Returns: {
              "avatar_url": string,"blocked_at": string,"first_name": string,"last_name": string,"user_id": string
            }[]
                           },
"get_contact_requests":
{ Args: Record<PropertyKey, never>; Returns: {
              "created_at": string,"direction": string,"from_mode": string,"id": string,"message": string,"other_avatar_url": string,"other_first_name": string,"other_id": string,"other_last_name": string,"other_project_name": string,"status": string
            }[]
                           },
"get_conversations_summary":
{ Args: { "p_limit"?: number,"p_user_id"?: string }; Returns: {
              "created_at": string,"last_message_content": string,"last_message_created_at": string,"last_message_id": string,"last_message_seen": boolean,"last_message_sender_id": string,"last_message_type": string,"match_id": string,"my_mode": string,"other_avatar_url": string,"other_first_name": string,"other_id": string,"other_is_pro": boolean,"other_last_active_at": string,"other_last_name": string,"other_mode": string,"other_project_name": string,"other_statut": string,"source": string,"unread_count": number
            }[]
                           },
"get_home_stats":
{ Args: { "p_mode": string }; Returns: Json
                           },
"get_likes_received":
{ Args: { "p_limit"?: number,"p_offset"?: number }; Returns: {
              "avatar_url": string,"city": string,"direction": string,"first_name": string,"last_name": string,"liked_at": string,"mode": string,"project_name": string,"statut": string,"user_id": string
            }[]
                           },
"get_match_details":
{ Args: { "p_mode": string,"p_target_id": string }; Returns: {
              "reasons": (string)[],"score": number
            }[]
                           },
"get_me":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"get_moderation_queue":
{ Args: { "p_status"?: string }; Returns: {
              "created_at": string,"details": string,"message_content": string,"reason": string,"report_id": string,"reported_avatar_url": string,"reported_id": string,"reported_name": string,"reported_suspended": boolean,"reporter_id": string,"reporter_name": string,"reports_against": number,"status": string
            }[]
                           },
"get_profile_stats":
{ Args: { "p_mode": string }; Returns: Json
                           },
"get_public_profile":
{ Args: { "p_user_id": string }; Returns: Json
                           },
"get_swipe_deck":
{ Args: { "p_collab_modes"?: (string)[],"p_limit"?: number,"p_mode": string,"p_offset"?: number,"p_user_id": string }; Returns: {
              "age": number,"avatar_url": string,"bio": string,"budget": string,"city": string,"collab_modes": (string)[],"cover_url": string,"description": string,"equity": string,"first_name": string,"founder_bio": string,"hours_per_week": string,"is_pro": boolean,"last_active_at": string,"last_name": string,"links": Json,"needs": (string)[],"project_name": string,"reasons": (string)[],"school": string,"score": number,"sectors": (string)[],"skills": (string)[],"stage": string,"statut": string,"team_size": number,"user_id": string,"work_mode": string
            }[]
                           },
"mark_conversation_read":
{ Args: { "p_match_id": string }; Returns: undefined
                           },
"mark_notifications_read":
{ Args: { "p_ids"?: (string)[] }; Returns: undefined
                           },
"moderate_report":
{ Args: { "p_report_id": string,"p_status": string,"p_suspend"?: boolean }; Returns: undefined
                           },
"propose_mission":
{ Args: { "p_budget"?: number,"p_description"?: string,"p_equity_percent"?: number,"p_match_id": string,"p_mode"?: string,"p_title": string }; Returns: {
              "budget": number | null,
"created_at": string,
"description": string | null,
"equity_percent": number | null,
"id": string,
"match_id": string | null,
"mode": string,
"proposed_by": string | null,
"status": string,
"title": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "missions"
        isOneToOne: true
        isSetofReturn: false
      } },
"register_push_token":
{ Args: { "p_platform": string,"p_token": string }; Returns: undefined
                           },
"report_user":
{ Args: { "p_block"?: boolean,"p_details"?: string,"p_match_id"?: string,"p_message_id"?: string,"p_reason": string,"p_user": string }; Returns: string
                           },
"request_contact":
{ Args: { "p_message"?: string,"p_mode": string,"p_to_user": string }; Returns: Json
                           },
"respond_contact_request":
{ Args: { "p_accept": boolean,"p_request_id": string }; Returns: Json
                           },
"respond_mission":
{ Args: { "p_mission_id": string,"p_status": string }; Returns: {
              "budget": number | null,
"created_at": string,
"description": string | null,
"equity_percent": number | null,
"id": string,
"match_id": string | null,
"mode": string,
"proposed_by": string | null,
"status": string,
"title": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "missions"
        isOneToOne: true
        isSetofReturn: false
      } },
"search_profiles":
{ Args: { "p_filters"?: Json,"p_limit"?: number,"p_mode"?: string,"p_offset"?: number,"p_query"?: string }; Returns: {
              "avatar_url": string,"city": string,"collab_modes": (string)[],"cover_url": string,"dept_code": string,"first_name": string,"last_active_at": string,"last_name": string,"mode": string,"name": string,"rank": number,"stage": string,"subtitle": string,"tags": (string)[],"user_id": string
            }[]
                           },
"set_user_suspended":
{ Args: { "p_suspended": boolean,"p_user": string }; Returns: undefined
                           },
"swipe":
{ Args: { "p_direction": string,"p_mode": string,"p_target": string }; Returns: Json
                           },
"unblock_user":
{ Args: { "p_user": string }; Returns: undefined
                           },
"undo_last_swipe":
{ Args: { "p_mode": string }; Returns: string
                           },
"unregister_push_token":
{ Args: { "p_token": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const

