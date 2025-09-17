# Complete Data Model and Schema Specifications
## Political Desktop OS Simulation

**Version:** 1.0
**Date:** September 17, 2025
**Database Design:** MongoDB with TypeScript interfaces

## Overview and Design Philosophy

### Data Architecture Principles

**Schema Design Goals:**
- **Flexibility:** Support evolving political simulation requirements
- **Performance:** Optimized for real-time gameplay with <100ms query times
- **Scalability:** Handle thousands of political entities and millions of events
- **Extensibility:** Easy addition of new political systems and mechanics
- **Data Integrity:** Strong validation and relationship consistency

**Technology Stack:**
- **Primary Database:** MongoDB 7.0+ for document flexibility
- **Search Engine:** Elasticsearch 8.0+ for full-text political content search
- **Cache Layer:** Redis 7.0+ for performance-critical real-time data
- **Type Safety:** TypeScript interfaces with runtime validation

## Core Simulation Entities

### Politician Entity

**Purpose:** Represents individual political actors with AI-driven personalities and complex relationship networks

```typescript
interface Politician {
  // Identity and basic information
  id: string;                    // UUID primary key
  name: string;
  biography: string;
  date_of_birth: Date;
  place_of_birth: GeographicLocation;

  // Political affiliation and position
  party: PoliticalParty;
  current_position: PoliticalPosition;
  position_history: PositionHistory[];
  ideology: PoliticalIdeology;

  // Core attributes (1-100 scale)
  attributes: {
    charisma: number;            // Public appeal and communication skill
    intelligence: number;        // Policy understanding and strategic thinking
    integrity: number;           // Ethical behavior and trustworthiness
    ambition: number;            // Drive for power and advancement
    experience: number;          // Political experience and institutional knowledge
    energy: number;              // Current stamina and activity level
    stress_tolerance: number;    // Ability to handle pressure
  };

  // Specialized political skills (1-100 scale)
  skills: {
    foreign_policy: number;      // International relations expertise
    domestic_policy: number;     // National governance skills
    economic_policy: number;     // Economic and fiscal understanding
    communication: number;       // Media and public speaking ability
    negotiation: number;         // Deal-making and compromise skills
    crisis_management: number;   // Emergency response capability
    coalition_building: number; // Alliance formation skills
    opposition_research: number; // Intelligence gathering ability
  };

  // Dynamic political relationships
  relationships: {
    [politician_id: string]: {
      trust: number;             // -100 to 100: trust level
      influence: number;         // 0-100: ability to affect their decisions
      respect: number;           // -100 to 100: professional regard
      personal_relationship: 'ally' | 'rival' | 'enemy' | 'neutral' | 'mentor' | 'protege';
      relationship_history: RelationshipEvent[];
      last_interaction: Date;
      interaction_frequency: number; // Interactions per game month
    }
  };

  // Current political state
  approval_rating: {
    overall: number;             // General public approval 0-100
    demographic_breakdown: {
      [demographic: string]: number; // Approval by demographic group
    };
    trend: 'rising' | 'falling' | 'stable';
    last_updated: Date;
  };

  // Scandal and reputation management
  scandal_resistance: number;    // 0-100: ability to weather negative events
  current_scandals: Scandal[];
  reputation_modifiers: {
    [category: string]: {
      value: number;             // Positive or negative reputation impact
      source: string;            // What caused this reputation change
      expires: Date | null;      // When this modifier expires (null = permanent)
    }
  };

  // Physical and mental state
  current_state: {
    energy_level: number;        // 0-100: affects performance and decision quality
    stress_level: number;        // 0-100: affects judgment and health
    health_status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    location: GeographicLocation; // Current physical location
    availability: 'available' | 'busy' | 'unavailable' | 'traveling';
  };

  // AI personality system
  ai_personality: {
    system_prompt: string;       // Core personality description for LLM
    memory_context: string;      // Accumulated interaction history
    decision_patterns: {
      risk_tolerance: number;    // 0-100: willingness to take risks
      compromise_willingness: number; // 0-100: flexibility in negotiations
      loyalty_priority: number;  // 0-100: party vs personal interests
      public_vs_private: number; // 0-100: how much public image matters
    };
    voice_parameters: {
      formality: 'formal' | 'casual' | 'mixed';
      speaking_style: 'concise' | 'verbose' | 'moderate';
      emotional_tone: 'serious' | 'lighthearted' | 'adaptive' | 'passionate';
      rhetoric_level: 'simple' | 'moderate' | 'sophisticated';
    };
    behavioral_constraints: string[]; // Rules governing AI behavior
  };

  // Financial and resource information
  resources: {
    campaign_funds: number;      // Available campaign resources
    personal_wealth: number;     // Personal financial resources
    fundraising_ability: number; // 1-100: effectiveness at raising money
    donor_network: DonorRelationship[];
    pac_connections: PACConnection[];
  };

  // Metadata and system information
  created_at: Date;
  updated_at: Date;
  version: number;               // Schema version for migration support
  is_player_character: boolean;
  is_active: boolean;           // Currently participating in simulation
}
```

**Example - Senior Senator:**
```json
{
  "id": "pol_senator_martinez_001",
  "name": "Senator Maria Elena Martinez",
  "biography": "Former prosecutor turned three-term Senator, known for immigration reform advocacy",
  "date_of_birth": "1968-03-15T00:00:00.000Z",
  "place_of_birth": {
    "city": "Phoenix",
    "state": "Arizona",
    "country": "United States"
  },
  "party": {
    "id": "party_democratic_001",
    "name": "Democratic Party",
    "ideology": "center-left"
  },
  "current_position": {
    "title": "United States Senator",
    "jurisdiction": "Arizona",
    "term_start": "2019-01-03T00:00:00.000Z",
    "term_end": "2025-01-03T00:00:00.000Z"
  },
  "attributes": {
    "charisma": 78,
    "intelligence": 85,
    "integrity": 82,
    "ambition": 71,
    "experience": 89,
    "energy": 68,
    "stress_tolerance": 75
  },
  "skills": {
    "foreign_policy": 65,
    "domestic_policy": 88,
    "economic_policy": 72,
    "communication": 81,
    "negotiation": 79,
    "crisis_management": 84,
    "coalition_building": 86,
    "opposition_research": 58
  },
  "approval_rating": {
    "overall": 64,
    "demographic_breakdown": {
      "latino": 78,
      "suburban_women": 71,
      "rural_voters": 45,
      "young_adults": 69
    },
    "trend": "stable",
    "last_updated": "2025-09-15T14:30:00.000Z"
  },
  "ai_personality": {
    "system_prompt": "You are Senator Maria Elena Martinez, a pragmatic progressive who believes in building coalitions to achieve incremental change. You prioritize immigration reform, healthcare access, and economic opportunity. You speak with conviction but are willing to compromise for progress.",
    "decision_patterns": {
      "risk_tolerance": 45,
      "compromise_willingness": 73,
      "loyalty_priority": 67,
      "public_vs_private": 71
    },
    "voice_parameters": {
      "formality": "formal",
      "speaking_style": "moderate",
      "emotional_tone": "passionate",
      "rhetoric_level": "sophisticated"
    }
  }
}
```

### Political Bloc Entity

**Purpose:** Represents organized political groups, parties, or factions with collective behavior patterns

```typescript
interface PoliticalBloc {
  // Basic identification
  id: string;
  name: string;
  short_name: string;          // Abbreviation or common name
  description: string;
  founding_date: Date;

  // Ideological positioning
  ideology: {
    primary: PoliticalIdeology; // Main ideological identification
    secondary: PoliticalIdeology[]; // Additional ideological elements
    economic_position: number;   // -100 (socialist) to 100 (capitalist)
    social_position: number;     // -100 (progressive) to 100 (conservative)
    foreign_policy_position: number; // -100 (isolationist) to 100 (interventionist)
    government_role_position: number; // -100 (minimal) to 100 (expansive)
  };

  // Membership and organization
  membership: {
    total_members: number;
    active_members: number;
    member_ids: string[];        // References to Politician entities
    leadership_structure: {
      [role: string]: {
        politician_id: string;
        appointed_date: Date;
        term_length: number | null; // null = indefinite term
      }
    };
    membership_requirements: string[];
    admission_process: string;
  };

  // Organizational metrics
  cohesion_metrics: {
    unity_score: number;         // 0-100: how unified the bloc acts
    discipline_level: number;    // 0-100: adherence to bloc positions
    internal_satisfaction: number; // 0-100: member satisfaction
    leadership_approval: number; // 0-100: approval of current leadership
    schism_risk: number;        // 0-100: likelihood of bloc splitting
  };

  // Policy positions and priorities
  policy_platform: {
    [policy_area: string]: {
      priority_level: number;    // 1-10: how important this area is
      official_stance: number;   // -100 to 100: bloc's official position
      flexibility_range: number; // 0-100: willingness to compromise
      key_policies: PolicyPosition[];
      voting_record: VotingRecord[];
    }
  };

  // Strategic behavior patterns
  political_strategy: {
    cooperation_tendency: number; // 0-100: willingness to work across party lines
    obstructionism_level: number; // 0-100: tendency to block opposition initiatives
    media_engagement: number;    // 0-100: how much they engage with media
    grassroots_focus: number;    // 0-100: emphasis on grassroots organizing
    elite_networking: number;    // 0-100: focus on elite relationship building
  };

  // Resources and capabilities
  resources: {
    annual_budget: number;
    fundraising_capacity: number; // Average fundraising per cycle
    media_influence: number;     // 0-100: ability to shape media narratives
    grassroots_network: number;  // 0-100: strength of grassroots organization
    lobbying_connections: number; // 0-100: access to lobbying networks
    think_tank_relationships: number; // 0-100: policy research capabilities
  };

  // Electoral performance
  electoral_data: {
    seats_held: {
      [body: string]: number;    // e.g., "house": 235, "senate": 48
    };
    recent_election_performance: {
      election_date: Date;
      seats_won: number;
      seats_lost: number;
      vote_share_change: number;
      key_victories: string[];
      significant_losses: string[];
    }[];
    stronghold_regions: GeographicRegion[];
    competitive_regions: GeographicRegion[];
    weak_regions: GeographicRegion[];
  };

  // Alliance and opposition relationships
  relationships: {
    [bloc_id: string]: {
      relationship_type: 'ally' | 'coalition_partner' | 'neutral' | 'rival' | 'enemy';
      cooperation_level: number; // -100 to 100: likelihood of working together
      trust_level: number;       // -100 to 100: mutual trust
      recent_interactions: InteractionRecord[];
      formal_agreements: Agreement[];
    }
  };

  // Metadata
  created_at: Date;
  updated_at: Date;
  version: number;
  is_active: boolean;
  historical_notes: string[];
}
```

**Example - Congressional Progressive Caucus:**
```json
{
  "id": "bloc_progressive_caucus_001",
  "name": "Congressional Progressive Caucus",
  "short_name": "CPC",
  "description": "The progressive wing of the Democratic Party in Congress, advocating for economic equality and social justice",
  "ideology": {
    "primary": "progressive",
    "economic_position": -65,
    "social_position": -78,
    "foreign_policy_position": -32,
    "government_role_position": 72
  },
  "membership": {
    "total_members": 98,
    "active_members": 94,
    "leadership_structure": {
      "chair": {
        "politician_id": "pol_rep_ocasio_cortez_001",
        "appointed_date": "2023-01-03T00:00:00.000Z",
        "term_length": 24
      },
      "vice_chair": {
        "politician_id": "pol_rep_omar_001",
        "appointed_date": "2023-01-03T00:00:00.000Z",
        "term_length": 24
      }
    }
  },
  "cohesion_metrics": {
    "unity_score": 73,
    "discipline_level": 68,
    "internal_satisfaction": 81,
    "leadership_approval": 76,
    "schism_risk": 23
  },
  "policy_platform": {
    "healthcare": {
      "priority_level": 10,
      "official_stance": 85,
      "flexibility_range": 25,
      "key_policies": [
        {
          "title": "Medicare for All",
          "support_level": 95,
          "negotiability": "low"
        }
      ]
    },
    "climate_change": {
      "priority_level": 9,
      "official_stance": 90,
      "flexibility_range": 20,
      "key_policies": [
        {
          "title": "Green New Deal",
          "support_level": 88,
          "negotiability": "medium"
        }
      ]
    }
  },
  "resources": {
    "annual_budget": 2500000,
    "fundraising_capacity": 15000000,
    "media_influence": 78,
    "grassroots_network": 84,
    "lobbying_connections": 45,
    "think_tank_relationships": 67
  }
}
```

### Policy Entity

**Purpose:** Represents legislative proposals, enacted laws, and policy initiatives with comprehensive impact modeling

```typescript
interface Policy {
  // Basic policy information
  id: string;
  title: string;
  short_title: string;         // Abbreviated version
  policy_number: string;       // Official legislative number (e.g., "H.R. 1234")
  description: string;
  full_text: string;          // Complete policy text
  summary: string;            // Executive summary

  // Policy classification
  category: PolicyCategory;
  subcategories: string[];
  policy_type: 'bill' | 'resolution' | 'amendment' | 'executive_order' | 'regulation' | 'judicial_ruling';
  urgency_level: 'low' | 'medium' | 'high' | 'emergency';
  scope: 'local' | 'state' | 'national' | 'international';

  // Policy structure and content
  provisions: Provision[];
  key_sections: {
    [section_name: string]: {
      content: string;
      importance: number;       // 1-10
      controversy_level: number; // 1-10
      implementation_complexity: number; // 1-10
    }
  };

  // Political characteristics
  complexity_score: number;    // 1-10: how difficult to understand
  controversy_level: number;   // 1-10: how divisive among stakeholders
  implementation_difficulty: number; // 1-10: complexity of execution
  political_feasibility: number; // 1-10: likelihood of passage

  // Financial and resource implications
  fiscal_impact: {
    estimated_cost: number;     // Total estimated cost
    cost_breakdown: {
      [category: string]: {
        amount: number;
        timeframe: string;
        certainty: 'high' | 'medium' | 'low';
      }
    };
    funding_sources: FundingSource[];
    economic_multiplier: number; // Expected economic impact multiplier
    job_impact: {
      jobs_created: number;
      jobs_eliminated: number;
      sectors_affected: string[];
    };
  };

  // Timeline and legislative process
  timeline: {
    introduction_date: Date;
    committee_assignment_date: Date | null;
    committee_markup_date: Date | null;
    floor_consideration_date: Date | null;
    passage_date: Date | null;
    signature_date: Date | null;
    implementation_start_date: Date | null;
    full_implementation_date: Date | null;
    review_date: Date | null;
  };

  // Legislative journey tracking
  legislative_history: {
    current_status: 'draft' | 'introduced' | 'in_committee' | 'committee_approved' | 'floor_debate' | 'passed_house' | 'passed_senate' | 'reconciliation' | 'enacted' | 'vetoed' | 'failed';
    status_history: StatusChange[];
    committee_assignments: CommitteeAssignment[];
    amendments: Amendment[];
    votes: Vote[];
    procedural_actions: ProceduralAction[];
  };

  // Impact modeling and projections
  projected_effects: {
    economic_effects: {
      gdp_impact: number;       // Projected GDP change (percentage)
      inflation_impact: number; // Projected inflation change
      employment_impact: number; // Net job change
      sector_impacts: {
        [sector: string]: {
          impact_score: number; // -100 to 100
          confidence_level: 'high' | 'medium' | 'low';
          timeline: string;
        }
      };
    };

    social_effects: {
      demographic_impacts: {
        [demographic: string]: {
          benefit_score: number; // -100 to 100
          affected_population: number;
          implementation_burden: number; // 0-100
        }
      };
      regional_impacts: {
        [region: string]: {
          impact_score: number; // -100 to 100
          affected_population: number;
          infrastructure_requirements: string[];
        }
      };
    };

    political_effects: {
      polling_impact: {
        [demographic: string]: {
          support_change: number; // Projected polling change
          confidence_interval: number;
          time_horizon: string;
        }
      };
      coalition_effects: {
        likely_supporters: string[]; // Political bloc IDs
        likely_opponents: string[];  // Political bloc IDs
        swing_groups: string[];      // Groups that could go either way
      };
    };

    environmental_effects: {
      carbon_impact: number;    // Projected CO2 change (tons/year)
      resource_usage: {
        [resource: string]: {
          usage_change: number;  // Projected change in usage
          sustainability_score: number; // -100 to 100
        }
      };
      regulatory_burden: number; // 0-100: administrative complexity
    };
  };

  // Stakeholder analysis and support tracking
  stakeholder_positions: {
    [stakeholder_id: string]: {
      stakeholder_type: 'politician' | 'bloc' | 'interest_group' | 'corporation' | 'union' | 'think_tank';
      position: 'strongly_support' | 'support' | 'neutral' | 'oppose' | 'strongly_oppose';
      influence_level: number;   // 0-100: ability to affect policy outcome
      public_statement: string | null;
      lobbying_expenditure: number;
      key_concerns: string[];
      negotiation_points: string[];
    }
  };

  // Public engagement and media coverage
  public_engagement: {
    polling_data: {
      overall_support: number;   // 0-100 percentage support
      demographic_breakdown: {
        [demographic: string]: {
          support_percentage: number;
          sample_size: number;
          margin_of_error: number;
          poll_date: Date;
        }
      };
      trend: 'rising' | 'falling' | 'stable';
    };

    media_coverage: {
      total_mentions: number;
      sentiment_score: number;   // -100 to 100
      major_stories: MediaStory[];
      editorial_positions: {
        [outlet: string]: {
          position: 'support' | 'oppose' | 'neutral';
          editorial_count: number;
          influence_score: number;
        }
      };
    };

    grassroots_activity: {
      petition_signatures: number;
      protest_events: ProtestEvent[];
      lobbying_contacts: number; // Constituent contacts to legislators
      social_media_engagement: SocialEngagement;
    };
  };

  // Related policies and precedents
  relationships: {
    predecessor_policies: string[]; // IDs of policies this replaces/modifies
    related_policies: string[];     // IDs of complementary policies
    conflicting_policies: string[]; // IDs of policies this conflicts with
    dependent_policies: string[];   // IDs of policies that depend on this one
  };

  // Metadata and versioning
  created_at: Date;
  updated_at: Date;
  version: number;
  created_by: string;            // Politician ID who introduced
  co_sponsors: string[];         // Co-sponsoring politician IDs
  is_active: boolean;
  tags: string[];               // Searchable tags
}
```

**Example - Infrastructure Investment Policy:**
```json
{
  "id": "policy_infrastructure_2025_001",
  "title": "American Infrastructure Renewal Act of 2025",
  "short_title": "AIRA 2025",
  "policy_number": "H.R. 2847",
  "category": "infrastructure",
  "subcategories": ["transportation", "broadband", "energy"],
  "policy_type": "bill",
  "urgency_level": "high",
  "scope": "national",
  "complexity_score": 8,
  "controversy_level": 6,
  "implementation_difficulty": 9,
  "political_feasibility": 7,
  "fiscal_impact": {
    "estimated_cost": 1200000000000,
    "cost_breakdown": {
      "roads_bridges": {
        "amount": 450000000000,
        "timeframe": "10 years",
        "certainty": "high"
      },
      "broadband_expansion": {
        "amount": 200000000000,
        "timeframe": "8 years",
        "certainty": "medium"
      },
      "clean_energy_grid": {
        "amount": 350000000000,
        "timeframe": "12 years",
        "certainty": "medium"
      }
    },
    "job_impact": {
      "jobs_created": 2500000,
      "jobs_eliminated": 100000,
      "sectors_affected": ["construction", "technology", "energy", "manufacturing"]
    }
  },
  "projected_effects": {
    "economic_effects": {
      "gdp_impact": 2.3,
      "employment_impact": 2400000,
      "sector_impacts": {
        "construction": {
          "impact_score": 85,
          "confidence_level": "high",
          "timeline": "immediate"
        },
        "technology": {
          "impact_score": 67,
          "confidence_level": "medium",
          "timeline": "3-5 years"
        }
      }
    },
    "political_effects": {
      "coalition_effects": {
        "likely_supporters": ["bloc_progressive_caucus_001", "bloc_moderate_democrats_001"],
        "likely_opponents": ["bloc_freedom_caucus_001"],
        "swing_groups": ["bloc_tuesday_group_001"]
      }
    }
  },
  "stakeholder_positions": {
    "pol_president_biden_001": {
      "stakeholder_type": "politician",
      "position": "strongly_support",
      "influence_level": 95,
      "public_statement": "This infrastructure package will create millions of good-paying jobs and modernize America for the 21st century",
      "key_concerns": ["climate provisions", "rural broadband"]
    }
  }
}
```

### Event Entity

**Purpose:** Represents significant political happenings that affect simulation state and drive gameplay narratives

```typescript
interface GameEvent {
  // Basic event information
  id: string;
  title: string;
  description: string;
  detailed_description: string;  // Full narrative description
  event_type: EventType;
  category: EventCategory;

  // Temporal characteristics
  occurrence_time: Date;
  duration: number;              // Duration in game hours
  end_time: Date | null;         // null for instantaneous events
  time_sensitivity: 'immediate' | 'urgent' | 'moderate' | 'background';

  // Geographic and scope information
  geographic_scope: GeographicScope;
  affected_regions: GeographicRegion[];
  population_affected: number;   // Number of people directly affected

  // Event classification and importance
  severity: 'minor' | 'moderate' | 'major' | 'crisis' | 'historic';
  predictability: number;        // 0-100: how foreseeable this event was
  media_attention_level: number; // 0-100: expected media coverage intensity
  public_interest_level: number; // 0-100: general public interest

  // Causal relationships
  trigger_events: string[];      // IDs of events that caused this event
  triggered_by: {
    event_id: string | null;     // Parent event ID
    politician_action: string | null; // Politician action that triggered this
    policy_action: string | null;     // Policy that triggered this
    external_factor: string | null;   // External cause (news, etc.)
  };

  // Political impact and effects
  direct_effects: {
    // Immediate effects on political entities
    politician_effects: {
      [politician_id: string]: {
        approval_change: number;  // Change in approval rating
        attribute_changes: {
          [attribute: string]: number; // Temporary or permanent attribute changes
        };
        relationship_changes: {
          [other_politician_id: string]: {
            trust_change: number;
            influence_change: number;
            respect_change: number;
          }
        };
        stress_impact: number;    // Change in stress level
        energy_impact: number;    // Change in energy level
      }
    };

    // Effects on political blocs
    bloc_effects: {
      [bloc_id: string]: {
        unity_change: number;     // Change in bloc unity
        support_change: number;   // Public support change
        resource_change: number;  // Funding/resource impact
        strategy_shifts: string[]; // New strategic priorities
      }
    };

    // Effects on policies
    policy_effects: {
      [policy_id: string]: {
        support_change: number;   // Change in public/political support
        feasibility_change: number; // Change in implementation likelihood
        priority_change: number;  // Change in political priority
        timeline_impact: number;  // Days added/removed from timeline
      }
    };

    // Broader political environment changes
    systemic_effects: {
      overall_political_temperature: number; // -100 to 100: cooling/heating
      institutional_trust_change: number;    // Change in trust in institutions
      media_landscape_shift: number;         // Change in media dynamics
      public_engagement_change: number;      // Change in political participation
    };
  };

  // Response opportunities and constraints
  response_opportunities: {
    [politician_id: string]: {
      available_responses: PoliticalResponse[];
      response_deadline: Date;   // When response opportunity expires
      stakeholder_expectations: {
        [stakeholder: string]: {
          expected_response_type: string;
          consequences_of_silence: ImpactAssessment;
          consequences_of_action: ImpactAssessment;
        }
      };
    }
  };

  // Media and narrative elements
  media_narrative: {
    dominant_frame: string;      // How media is framing this event
    alternative_frames: string[]; // Other ways this could be framed
    key_quotes: {
      source: string;            // Who said it
      quote: string;             // What they said
      context: string;           // When/where they said it
      impact_level: number;      // 0-100: how influential this quote is
    }[];
    visual_elements: string[];   // Key images, videos, symbols associated
    trending_hashtags: string[];
    social_media_sentiment: number; // -100 to 100: overall sentiment
  };

  // Scenario and narrative integration
  scenario_context: {
    is_scripted: boolean;        // Pre-planned vs emergent event
    scenario_id: string | null;  // Related scenario if applicable
    narrative_importance: number; // 0-100: importance to overall story
    player_involvement: number;   // 0-100: how much this involves player
    ai_involvement: {
      [politician_id: string]: {
        involvement_level: number; // 0-100: how involved they are
        predicted_response: string; // AI's likely response
        response_confidence: number; // 0-100: confidence in prediction
      }
    };
  };

  // Resolution and outcomes
  resolution_status: 'ongoing' | 'resolved' | 'escalated' | 'abandoned';
  resolution_description: string | null;
  final_outcomes: {
    winners: string[];           // Politician IDs who benefited
    losers: string[];            // Politician IDs who were hurt
    neutral_parties: string[];   // Those unaffected
    long_term_implications: string[];
    lessons_learned: string[];
  };

  // Metadata and tracking
  created_at: Date;
  updated_at: Date;
  version: number;
  source: 'news_api' | 'ai_generated' | 'user_action' | 'system_event' | 'scripted';
  source_data: any;            // Original data from source (news article, etc.)
  tags: string[];
  related_events: string[];    // IDs of related events
}
```

**Example - Major Political Scandal:**
```json
{
  "id": "event_corruption_scandal_2025_003",
  "title": "Senior Commerce Official Charged with Insider Trading",
  "description": "Federal prosecutors charge Deputy Commerce Secretary with securities fraud",
  "event_type": "scandal",
  "category": "corruption",
  "occurrence_time": "2025-09-17T09:00:00.000Z",
  "duration": 168,
  "time_sensitivity": "immediate",
  "severity": "major",
  "media_attention_level": 95,
  "public_interest_level": 78,
  "direct_effects": {
    "politician_effects": {
      "pol_president_harris_001": {
        "approval_change": -8,
        "stress_impact": 15,
        "relationship_changes": {
          "pol_deputy_commerce_johnson_001": {
            "trust_change": -45,
            "influence_change": -30
          }
        }
      },
      "pol_deputy_commerce_johnson_001": {
        "approval_change": -72,
        "attribute_changes": {
          "integrity": -25,
          "influence": -40
        },
        "stress_impact": 85
      }
    },
    "systemic_effects": {
      "institutional_trust_change": -12,
      "media_landscape_shift": 8,
      "overall_political_temperature": 15
    }
  },
  "response_opportunities": {
    "pol_president_harris_001": {
      "available_responses": [
        {
          "response_type": "immediate_dismissal",
          "description": "Fire the Deputy Secretary immediately",
          "political_cost": 5,
          "approval_impact": 8,
          "deadline": "2025-09-17T18:00:00.000Z"
        },
        {
          "response_type": "call_for_investigation",
          "description": "Call for thorough investigation while maintaining support",
          "political_cost": 12,
          "approval_impact": -3,
          "deadline": "2025-09-18T12:00:00.000Z"
        }
      ],
      "response_deadline": "2025-09-18T12:00:00.000Z"
    }
  },
  "media_narrative": {
    "dominant_frame": "Administration corruption concerns",
    "alternative_frames": [
      "Isolated incident requiring investigation",
      "Pattern of ethical lapses",
      "Political witch hunt"
    ],
    "key_quotes": [
      {
        "source": "pol_opposition_leader_001",
        "quote": "This administration promised transparency but delivered scandal after scandal",
        "impact_level": 78
      }
    ],
    "trending_hashtags": ["#CorruptionCrisis", "#DrainTheSwamp", "#AccountabilityNow"],
    "social_media_sentiment": -64
  }
}
```

## Social Media Entities

### Social Media Post Entity

**Purpose:** Represents posts, comments, and social media interactions in the political simulation ecosystem

```typescript
interface SocialMediaPost {
  // Basic post information
  id: string;
  platform: 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'reddit' | 'linkedin' | 'youtube';
  persona_id: string;           // ID of the posting persona/character
  post_type: 'original' | 'reply' | 'repost' | 'quote_repost' | 'story' | 'live_stream';

  // Content and media
  content: {
    text: string;
    formatted_text: string;     // Text with platform-specific formatting
    character_count: number;
    media_attachments: {
      type: 'image' | 'video' | 'audio' | 'link' | 'poll' | 'document';
      url: string;
      description: string;
      metadata: any;
    }[];
    hashtags: string[];
    mentions: {
      persona_id: string;
      display_name: string;
      position_in_text: number;
    }[];
    links: {
      url: string;
      title: string;
      description: string;
      preview_image: string;
    }[];
  };

  // Thread and conversation context
  conversation_context: {
    is_thread_start: boolean;
    thread_id: string | null;
    parent_post_id: string | null; // For replies
    root_post_id: string | null;   // Original post in conversation
    reply_level: number;           // Depth of reply nesting
    conversation_participants: string[]; // Persona IDs involved
  };

  // Engagement metrics
  engagement: {
    likes: number;
    dislikes: number;
    shares: number;
    comments: number;
    reactions: {
      [reaction_type: string]: number; // Platform-specific reactions
    };
    bookmarks: number;
    reach: number;                // Unique accounts reached
    impressions: number;          // Total views
    engagement_rate: number;      // Percentage of impressions that engaged
  };

  // Virality and spread analysis
  virality_metrics: {
    viral_coefficient: number;    // How much each share generates additional shares
    spread_velocity: number;      // Speed of initial spread (shares/hour)
    peak_engagement_time: Date | null; // When engagement peaked
    demographic_spread: {
      [demographic: string]: {
        share_percentage: number;
        engagement_level: number;
      }
    };
    geographic_spread: {
      [region: string]: number;   // Percentage of shares from each region
    };
    cross_platform_mentions: number; // Mentions on other platforms
  };

  // Political analysis
  political_analysis: {
    // Sentiment and tone
    sentiment: {
      overall: number;            // -100 to 100: negative to positive
      emotional_tone: string[];   // angry, hopeful, fearful, excited, etc.
      confidence_level: number;   // 0-100: how confident the sentiment analysis is
    };

    // Political positioning
    political_stance: {
      [issue: string]: {
        position: number;         // -100 to 100: left to right on this issue
        intensity: number;        // 0-100: how strongly they feel
        certainty: number;        // 0-100: confidence in the position analysis
      }
    };

    // Bias and framing
    bias_indicators: {
      overall_bias: 'extreme_left' | 'left' | 'center_left' | 'center' | 'center_right' | 'right' | 'extreme_right';
      bias_confidence: number;    // 0-100: confidence in bias assessment
      framing_techniques: string[]; // Specific rhetorical techniques used
      emotional_appeals: string[]; // Types of emotional appeals present
    };

    // Topic and policy relevance
    topics: {
      primary_topics: string[];   // Main topics discussed
      secondary_topics: string[]; // Secondary themes
      policy_references: {
        policy_id: string;
        relevance_score: number;  // 0-100: how relevant to this policy
        stance: 'support' | 'oppose' | 'neutral' | 'mixed';
      }[];
      politician_mentions: {
        politician_id: string;
        mention_type: 'positive' | 'negative' | 'neutral' | 'complex';
        context: string;
      }[];
    };

    // Influence and impact potential
    influence_assessment: {
      potential_reach: number;    // Estimated total potential audience
      influence_score: number;    // 0-100: likely influence on public opinion
      mobilization_potential: number; // 0-100: likelihood to inspire action
      controversy_level: number;  // 0-100: how likely to generate controversy
      fact_check_flags: string[]; // Potential misinformation concerns
    };
  };

  // Algorithmic and platform factors
  platform_performance: {
    algorithm_boost_score: number; // -100 to 100: platform algorithm preference
    suppression_risk: number;     // 0-100: likelihood of being suppressed
    monetization_eligibility: boolean;
    content_warnings: string[];   // Platform-applied warnings
    age_restrictions: boolean;
    geographic_restrictions: string[]; // Countries where blocked
  };

  // Response and interaction tracking
  responses: {
    direct_replies: string[];     // IDs of direct reply posts
    quote_reposts: string[];      // IDs of quote reposts
    related_discussions: string[]; // IDs of related conversation threads
    media_pickups: {
      outlet: string;
      article_url: string;
      mention_type: 'quoted' | 'referenced' | 'criticized' | 'praised';
      publication_date: Date;
    }[];
  };

  // AI generation metadata (if applicable)
  ai_metadata: {
    is_ai_generated: boolean;
    generation_prompt: string | null;
    model_used: string | null;
    generation_parameters: {
      temperature: number;
      persona_consistency_score: number;
      fact_accuracy_score: number;
      style_consistency_score: number;
    } | null;
    human_edited: boolean;
    edit_description: string | null;
  };

  // Scheduling and publication
  publication: {
    scheduled_time: Date | null;  // null if posted immediately
    actual_publish_time: Date;
    timezone: string;
    publishing_client: string;    // App/service used to post
    is_boosted: boolean;         // Paid promotion
    boost_budget: number;        // Amount spent on promotion
  };

  // Metadata and system information
  created_at: Date;
  updated_at: Date;
  version: number;
  is_active: boolean;          // false if deleted
  moderation_status: 'approved' | 'pending' | 'flagged' | 'removed';
  moderation_notes: string[];
  tags: string[];
}
```

### Social Media Persona Entity

**Purpose:** Represents AI-driven social media personalities that generate political content

```typescript
interface SocialMediaPersona {
  // Identity and basic information
  id: string;
  username: string;
  display_name: string;
  biography: string;
  profile_image_url: string;
  banner_image_url: string;

  // Account characteristics
  account_type: 'individual' | 'organization' | 'media' | 'bot' | 'parody' | 'fan_account';
  verification_status: 'verified' | 'unverified' | 'legacy_verified';
  account_age: number;          // Days since account creation
  follower_count: number;
  following_count: number;
  post_count: number;

  // Platform presence
  platforms: {
    [platform: string]: {
      handle: string;
      follower_count: number;
      engagement_rate: number;   // Average engagement rate on this platform
      posting_frequency: number; // Posts per day
      platform_specific_metrics: any; // Platform-specific data
    }
  };

  // Political and ideological profile
  political_profile: {
    // Core political identity
    party_affiliation: string | null;
    ideology: {
      primary: string;           // Main ideological identification
      secondary: string[];       // Additional ideological elements
      economic: number;          // -100 (left) to 100 (right)
      social: number;            // -100 (progressive) to 100 (conservative)
      foreign_policy: number;    // -100 (dove) to 100 (hawk)
    };

    // Issue positions and priorities
    issue_positions: {
      [issue: string]: {
        position: number;        // -100 to 100 on this issue
        intensity: number;       // 0-100: how strongly they care
        expertise_level: number; // 0-100: how knowledgeable they are
        posting_frequency: number; // How often they post about this
      }
    };

    // Political engagement style
    engagement_style: {
      activism_level: number;    // 0-100: how actively they advocate
      partisanship: number;      // 0-100: how partisan vs bipartisan
      civility: number;          // 0-100: how respectful in discourse
      fact_orientation: number;  // 0-100: fact-based vs emotional appeals
      controversy_seeking: number; // 0-100: tendency to court controversy
    };
  };

  // AI personality system
  ai_personality: {
    // Core personality prompt
    system_prompt: string;
    personality_description: string;

    // Communication style
    voice_characteristics: {
      formality: 'very_formal' | 'formal' | 'casual' | 'very_casual';
      verbosity: 'concise' | 'moderate' | 'verbose';
      emotional_expression: 'reserved' | 'moderate' | 'expressive' | 'dramatic';
      humor_style: 'dry' | 'sarcastic' | 'lighthearted' | 'serious' | 'none';
      vocabulary_level: 'simple' | 'moderate' | 'sophisticated' | 'academic';
    };

    // Behavioral patterns
    posting_behavior: {
      preferred_times: number[]; // Hours of day when most active (0-23)
      posting_frequency: {
        min_per_day: number;
        max_per_day: number;
        average_per_day: number;
      };
      response_likelihood: number; // 0-100: chance to respond to replies
      original_vs_reactive: number; // 0-100: original content vs reactions
      thread_tendency: number;    // 0-100: likelihood to create threads
    };

    // Content preferences
    content_focus: {
      news_commentary: number;   // 0-100: focus on news analysis
      personal_opinion: number;  // 0-100: sharing personal views
      information_sharing: number; // 0-100: educational content
      community_building: number; // 0-100: fostering discussion
      advocacy: number;          // 0-100: promoting causes
    };

    // Interaction patterns
    interaction_style: {
      mention_sensitivity: number; // 0-100: likelihood to respond to mentions
      hashtag_usage: number;      // 0-100: tendency to use hashtags
      media_sharing: number;      // 0-100: likelihood to include media
      link_sharing: number;       // 0-100: tendency to share external links
      cross_platform_sync: number; // 0-100: similarity across platforms
    };
  };

  // Content generation parameters
  content_generation: {
    // Topic focus areas
    primary_topics: string[];    // Main topics this persona discusses
    secondary_topics: string[];  // Occasional topics
    avoided_topics: string[];    // Topics they don't discuss

    // Style and tone parameters
    generation_parameters: {
      temperature: number;       // Creativity/randomness level
      coherence_weight: number;  // Consistency with previous posts
      topicality_weight: number; // Relevance to current events
      engagement_weight: number; // Focus on engaging content
    };

    // Quality and safety constraints
    content_filters: {
      profanity_level: 'none' | 'mild' | 'moderate' | 'unrestricted';
      controversy_tolerance: number; // 0-100: acceptable controversy level
      fact_checking_strictness: number; // 0-100: how strict about accuracy
      bias_balance_requirement: number; // 0-100: requirement for balanced views
    };

    // Consistency maintenance
    memory_system: {
      short_term_context: string; // Recent conversation context
      long_term_personality: string; // Accumulated personality development
      relationship_memory: {
        [other_persona_id: string]: {
          relationship_type: 'friend' | 'rival' | 'neutral' | 'mentor' | 'follower';
          interaction_history: string;
          trust_level: number;
          influence_level: number;
        }
      };
      topic_expertise: {
        [topic: string]: {
          knowledge_level: number; // 0-100
          recent_developments: string[];
          key_positions: string[];
        }
      };
    };
  };

  // Performance and analytics
  performance_metrics: {
    // Engagement statistics
    average_likes_per_post: number;
    average_shares_per_post: number;
    average_comments_per_post: number;
    engagement_trend: 'growing' | 'stable' | 'declining';

    // Influence measurements
    influence_score: number;     // 0-100: overall influence level
    topic_authority: {
      [topic: string]: number;   // 0-100: authority on each topic
    };
    network_centrality: number;  // 0-100: position in social network
    viral_content_count: number; // Number of posts that went viral

    // Quality metrics
    fact_accuracy_rate: number;  // 0-100: accuracy of factual claims
    consistency_score: number;   // 0-100: consistency with persona
    toxicity_score: number;      // 0-100: likelihood of toxic behavior
    constructiveness_score: number; // 0-100: constructive discourse contribution
  };

  // Relationships and network
  social_network: {
    // Direct relationships
    followers: {
      [persona_id: string]: {
        follow_date: Date;
        engagement_level: number; // How much they interact
        influence_on_follower: number; // This persona's influence on them
      }
    };

    following: {
      [persona_id: string]: {
        follow_date: Date;
        attention_level: number;  // How much attention paid to them
        influence_received: number; // Their influence on this persona
      }
    };

    // Community involvement
    communities: string[];       // Groups/communities they participate in
    trending_participation: {
      [hashtag: string]: {
        participation_level: number; // 0-100: how actively they participate
        leadership_role: boolean;   // Whether they help drive the trend
        stance: 'support' | 'oppose' | 'neutral' | 'complex';
      }
    };
  };

  // Metadata and management
  created_at: Date;
  updated_at: Date;
  version: number;
  is_active: boolean;
  creation_method: 'ai_generated' | 'user_created' | 'imported' | 'procedural';
  creator_notes: string;
  tags: string[];
  content_approval_required: boolean;
}
```

## News and Media Entities

### News Article Entity

**Purpose:** Represents real-world news articles integrated into the political simulation

```typescript
interface NewsArticle {
  // Basic article information
  id: string;
  headline: string;
  subheading: string | null;
  byline: string;              // Author information
  content: string;             // Full article text
  summary: string;             // AI-generated or editorial summary
  excerpt: string;             // First paragraph or key excerpt

  // Source and publication information
  source: {
    id: string;
    name: string;              // "The New York Times", "Reuters", etc.
    url: string;               // Source website URL
    type: 'newspaper' | 'magazine' | 'wire_service' | 'broadcast' | 'digital_native' | 'blog';
    country: string;
    language: string;

    // Credibility assessment
    credibility_metrics: {
      factual_reporting: 'very_high' | 'high' | 'mostly_factual' | 'mixed' | 'low' | 'very_low';
      bias_rating: 'extreme_left' | 'left' | 'center_left' | 'center' | 'center_right' | 'right' | 'extreme_right';
      trust_score: number;       // 0-100 composite trust score
      mbfc_rating: string;       // Media Bias/Fact Check rating
    };
  };

  // Publication and timing
  publication: {
    published_at: Date;
    updated_at: Date | null;    // Last update if article was revised
    section: string;            // News section (Politics, Business, etc.)
    url: string;                // Original article URL
    canonical_url: string;      // Canonical version URL
    access_type: 'free' | 'paywall' | 'subscription' | 'premium';
  };

  // Content analysis and classification
  content_analysis: {
    // Political relevance
    political_relevance: {
      score: number;            // 0-1: how relevant to political simulation
      primary_categories: string[]; // Main political topic categories
      secondary_categories: string[]; // Additional relevant categories
      geographic_scope: 'local' | 'state' | 'national' | 'international' | 'global';
      institution_relevance: {
        [institution: string]: number; // 0-100: relevance to each institution
      };
    };

    // Topic and entity extraction
    entities: {
      politicians: {
        name: string;
        politician_id: string | null; // Linked to Politician entity if exists
        role: string;
        mention_sentiment: number; // -100 to 100
        context: string;
      }[];

      organizations: {
        name: string;
        type: 'government' | 'political_party' | 'interest_group' | 'corporation' | 'ngo';
        mention_context: string;
        sentiment: number;
      }[];

      policies: {
        title: string;
        policy_id: string | null;  // Linked to Policy entity if exists
        stance: 'support' | 'oppose' | 'neutral' | 'analysis';
        detail_level: 'mention' | 'summary' | 'detailed_analysis';
      }[];

      locations: {
        name: string;
        type: 'city' | 'state' | 'country' | 'region';
        relevance: number;        // 0-100: importance in article
      }[];
    };

    // Sentiment and bias analysis
    sentiment_analysis: {
      overall_sentiment: number; // -100 to 100
      emotional_tone: string[];  // anger, hope, fear, excitement, etc.
      objectivity_score: number; // 0-100: how objective vs. opinion-based
      editorial_stance: 'supportive' | 'critical' | 'neutral' | 'mixed';
    };

    // Style and presentation analysis
    presentation_analysis: {
      article_type: 'breaking_news' | 'feature' | 'analysis' | 'opinion' | 'editorial' | 'investigative';
      complexity_level: number;  // 1-10: reading difficulty
      word_count: number;
      reading_time_minutes: number;
      multimedia_elements: {
        images: number;
        videos: number;
        interactive_elements: number;
        charts_graphs: number;
      };
    };
  };

  // Game integration parameters
  game_integration: {
    // Temporal relevance
    temporal_decay: {
      decay_function: 'linear' | 'exponential' | 'gaussian' | 'step';
      half_life_hours: number;   // How quickly relevance decreases
      peak_relevance_hours: number; // When impact peaks
      minimum_relevance: number; // Floor relevance value
    };

    // Impact modeling
    predicted_impacts: {
      // Direct political impacts
      politician_impacts: {
        [politician_id: string]: {
          approval_impact: number; // Predicted approval change
          stress_impact: number;   // Stress level change
          opportunity_score: number; // 0-100: opportunity to benefit
          risk_score: number;      // 0-100: risk of negative impact
        }
      };

      // Policy impacts
      policy_impacts: {
        [policy_id: string]: {
          support_impact: number;  // Change in public support
          priority_impact: number; // Change in political priority
          timeline_impact: number; // Days added/removed from timeline
        }
      };

      // Systemic impacts
      systemic_impacts: {
        political_temperature_change: number; // -100 to 100
        institutional_trust_impact: number;   // Change in trust
        public_engagement_impact: number;     // Change in political participation
        media_attention_shift: number;        // Change in media focus
      };
    };

    // Event generation potential
    event_generation: {
      can_trigger_events: boolean;
      event_types: string[];     // Types of events this could trigger
      trigger_threshold: number; // Relevance threshold for event creation
      event_probability: number; // 0-100: likelihood of generating events
    };
  };

  // Social media and viral potential
  social_media_metrics: {
    // Shareability assessment
    virality_potential: number; // 0-100: likelihood to go viral
    engagement_prediction: number; // Predicted social media engagement
    controversy_level: number;   // 0-100: how controversial/divisive

    // Platform-specific predictions
    platform_predictions: {
      [platform: string]: {
        share_likelihood: number; // 0-100: likelihood to be shared
        engagement_type: string[]; // Types of engagement expected
        target_demographics: string[]; // Most likely sharing demographics
      }
    };

    // Cross-platform spread potential
    cross_platform_spread: {
      amplification_potential: number; // 0-100: multi-platform spread likelihood
      meme_potential: number;         // 0-100: likelihood to become meme
      discussion_longevity: number;   // 0-100: how long discussion will last
    };
  };

  // Legal and compliance information
  legal_status: {
    copyright_status: 'fair_use' | 'licensed' | 'restricted' | 'public_domain';
    attribution_required: boolean;
    usage_restrictions: string[];
    dmca_compliant: boolean;
    syndication_rights: 'full' | 'limited' | 'none';
  };

  // Quality and verification
  quality_metrics: {
    fact_check_status: 'verified' | 'unverified' | 'disputed' | 'false';
    source_verification: number; // 0-100: how well sources are documented
    transparency_score: number;  // 0-100: editorial transparency
    correction_history: {
      correction_date: Date;
      correction_description: string;
      severity: 'minor' | 'significant' | 'major';
    }[];
  };

  // Metadata and system information
  created_at: Date;
  updated_at: Date;
  version: number;
  processing_status: 'raw' | 'processed' | 'analyzed' | 'integrated' | 'archived';
  tags: string[];
  related_articles: string[];  // IDs of related articles
  duplicate_detection: {
    is_duplicate: boolean;
    original_article_id: string | null;
    similarity_score: number;   // 0-100: similarity to other articles
  };
}
```

### Media Outlet Entity

**Purpose:** Represents news organizations and their characteristics for bias analysis and credibility assessment

```typescript
interface MediaOutlet {
  // Basic identification
  id: string;
  name: string;
  short_name: string;          // Common abbreviation (e.g., "NYT", "CNN")
  website_url: string;
  headquarters_location: GeographicLocation;

  // Organizational information
  organization: {
    type: 'newspaper' | 'magazine' | 'broadcast_tv' | 'cable_tv' | 'radio' | 'digital_native' | 'wire_service';
    ownership: 'public' | 'private' | 'nonprofit' | 'government' | 'cooperative';
    parent_company: string | null;
    founding_date: Date;
    circulation_reach: number;   // Approximate daily reach/circulation
  };

  // Editorial characteristics
  editorial_profile: {
    // Political positioning
    bias_rating: {
      overall_bias: 'extreme_left' | 'left' | 'center_left' | 'center' | 'center_right' | 'right' | 'extreme_right';
      factual_reporting: 'very_high' | 'high' | 'mostly_factual' | 'mixed' | 'low' | 'very_low';

      // Third-party assessments
      mbfc_assessment: {
        bias: string;
        factual_reporting: string;
        country: string;
        press_freedom: string;
        media_type: string;
        traffic: string;
        mbfc_credibility_rating: string;
      };

      // Historical bias trends
      bias_consistency: number;  // 0-100: consistency of bias over time
      bias_transparency: number; // 0-100: how open they are about their perspective
    };

    // Editorial approach
    editorial_style: {
      news_vs_opinion_ratio: number; // 0-100: news focus vs opinion focus
      sensationalism_level: number;  // 0-100: tendency toward sensational coverage
      investigative_depth: number;   // 0-100: commitment to investigative journalism
      international_coverage: number; // 0-100: focus on international news
      local_coverage: number;        // 0-100: focus on local news
    };

    // Quality indicators
    journalistic_standards: {
      source_verification: number; // 0-100: thoroughness of source verification
      correction_policy: 'strong' | 'adequate' | 'weak' | 'poor';
      transparency_score: number;  // 0-100: editorial transparency
      ethical_standards: number;   // 0-100: adherence to journalistic ethics
    };
  };

  // Audience and influence
  audience_profile: {
    // Demographic reach
    target_demographics: {
      [demographic: string]: {
        percentage: number;      // Percentage of audience
        engagement_level: number; // 0-100: how engaged this demographic is
      }
    };

    // Geographic distribution
    geographic_reach: {
      [region: string]: {
        audience_percentage: number;
        local_influence_score: number; // 0-100: influence in this region
      }
    };

    // Political audience
    audience_political_profile: {
      [political_group: string]: {
        audience_percentage: number;
        trust_level: number;     // 0-100: how much this group trusts the outlet
      }
    };
  };

  // Influence and reach metrics
  influence_metrics: {
    // Industry influence
    industry_influence: number;  // 0-100: influence within media industry
    agenda_setting_power: number; // 0-100: ability to set news agenda
    elite_influence: number;     // 0-100: influence among political elites
    public_influence: number;    // 0-100: influence on general public opinion

    // Digital and social presence
    digital_metrics: {
      website_traffic_rank: number;
      social_media_followers: {
        [platform: string]: {
          followers: number;
          engagement_rate: number;
          posting_frequency: number; // Posts per day
        }
      };
      search_prominence: number;  // 0-100: prominence in search results
    };

    // Citation and reference
    citation_metrics: {
      academic_citations: number; // Citations in academic work
      other_media_citations: number; // Citations by other media outlets
      political_figure_references: number; // References by political figures
      think_tank_citations: number; // Citations by think tanks and policy groups
    };
  };

  // Content characteristics for simulation
  content_patterns: {
    // Topic focus
    coverage_priorities: {
      [topic: string]: {
        coverage_percentage: number; // Percentage of coverage devoted to topic
        typical_stance: string;     // Typical editorial stance on topic
        expertise_level: number;    // 0-100: depth of expertise in this area
      }
    };

    // Publication patterns
    publication_schedule: {
      daily_articles: number;     // Average articles per day
      breaking_news_frequency: number; // Breaking news stories per week
      investigative_pieces_per_month: number;
      opinion_pieces_per_week: number;
    };

    // Style and approach
    typical_article_characteristics: {
      average_word_count: number;
      complexity_level: number;   // 1-10: typical reading level
      multimedia_usage: number;   // 0-100: use of images, videos, etc.
      data_visualization_usage: number; // 0-100: use of charts, graphs
    };
  };

  // Reliability for simulation purposes
  simulation_reliability: {
    // Update frequency and timeliness
    update_frequency: 'real_time' | 'hourly' | 'daily' | 'irregular';
    breaking_news_speed: number; // 0-100: how quickly they report breaking news
    fact_check_reliability: number; // 0-100: reliability of their fact-checking

    // API and technical integration
    api_availability: boolean;
    rss_feed_quality: number;    // 0-100: quality of RSS feeds
    content_syndication: boolean; // Whether they syndicate to others
    paywall_restrictions: {
      has_paywall: boolean;
      free_articles_per_month: number;
      subscription_cost: number;
    };

    // Historical reliability
    consistency_score: number;   // 0-100: consistency in coverage quality
    uptime_reliability: number;  // 0-100: website/service availability
    correction_frequency: number; // Corrections per 1000 articles
  };

  // Metadata and tracking
  created_at: Date;
  updated_at: Date;
  version: number;
  monitoring_status: 'active' | 'inactive' | 'restricted' | 'banned';
  integration_notes: string[];
  tags: string[];
}
```

## UI State Management Entities

### Window Configuration Entity

**Purpose:** Manages desktop window states, layouts, and user interface persistence

```typescript
interface WindowConfiguration {
  // Window identification
  id: string;
  window_type: 'app' | 'dialog' | 'popup' | 'overlay' | 'system';
  app_id: string;              // Which application this window belongs to
  window_title: string;
  internal_name: string;       // Developer-facing identifier

  // Position and geometry
  geometry: {
    position: {
      x: number;
      y: number;
      monitor_id: string;      // Which monitor this window is on
      relative_to: 'screen' | 'parent' | 'center' | 'cursor';
    };

    size: {
      width: number;
      height: number;
      min_width: number;
      min_height: number;
      max_width: number | null;  // null = unlimited
      max_height: number | null; // null = unlimited
    };

    // Layout constraints
    aspect_ratio: {
      maintain: boolean;
      ratio: number | null;     // width/height ratio
    };

    snap_behavior: {
      snap_to_edges: boolean;
      snap_to_other_windows: boolean;
      snap_threshold: number;   // Pixels
    };
  };

  // Window behavior and capabilities
  behavior: {
    // Basic window operations
    resizable: boolean;
    movable: boolean;
    closable: boolean;
    minimizable: boolean;
    maximizable: boolean;

    // Advanced behaviors
    always_on_top: boolean;
    modal: boolean;             // Blocks interaction with parent
    skip_taskbar: boolean;
    focus_on_show: boolean;
    center_on_parent: boolean;

    // Platform integration
    show_in_dock: boolean;      // macOS dock visibility
    show_in_alt_tab: boolean;   // Alt-Tab window switching
    system_menu: boolean;       // Right-click title bar menu
  };

  // Visual appearance
  appearance: {
    // Window chrome
    decorations: boolean;       // Show title bar and borders
    custom_titlebar: boolean;   // Use custom title bar
    transparent: boolean;       // Transparent window background
    blur_behind: boolean;       // Background blur effect
    shadow: boolean;           // Drop shadow

    // Styling
    theme: 'light' | 'dark' | 'system' | 'custom';
    opacity: number;           // 0.0 to 1.0
    border_radius: number;     // Rounded corners
    custom_css: string | null; // Additional CSS styling

    // Content appearance
    background_color: string;
    text_color: string;
    accent_color: string;
  };

  // State management
  state: {
    // Current window state
    current_state: 'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'hidden';
    previous_state: 'normal' | 'minimized' | 'maximized' | 'fullscreen' | 'hidden';

    // Visibility and focus
    visible: boolean;
    focused: boolean;
    z_order: number;           // Stacking order

    // Persistence
    restore_state: boolean;    // Restore state on app restart
    save_geometry: boolean;    // Remember position and size
    workspace_id: string | null; // Virtual desktop/workspace
  };

  // Content and functionality
  content: {
    // Application-specific content
    content_type: string;      // Type of content this window displays
    content_id: string | null; // Specific content identifier

    // Data binding
    bound_data: {
      [key: string]: any;      // Data bound to this window
    };

    // User customization
    user_settings: {
      [setting: string]: any;  // User-specific window settings
    };

    // Layout within window
    layout_config: {
      layout_type: 'single' | 'split' | 'tabbed' | 'dashboard';
      panels: {
        id: string;
        type: string;
        position: 'left' | 'right' | 'top' | 'bottom' | 'center';
        size_percentage: number;
        collapsible: boolean;
        collapsed: boolean;
      }[];
    };
  };

  // Interaction and events
  interaction: {
    // Keyboard handling
    keyboard_shortcuts: {
      [shortcut: string]: {
        action: string;
        description: string;
        global: boolean;        // Works when window not focused
      }
    };

    // Mouse behavior
    mouse_behavior: {
      double_click_action: 'maximize' | 'minimize' | 'custom' | 'none';
      right_click_menu: boolean;
      drag_zones: {
        title_bar: boolean;
        content_area: boolean;
        custom_zones: string[]; // CSS selectors for draggable areas
      };
    };

    // Touch and gesture support
    touch_support: {
      pinch_zoom: boolean;
      swipe_gestures: boolean;
      touch_scrolling: boolean;
    };
  };

  // Performance and optimization
  performance: {
    // Rendering optimization
    hardware_acceleration: boolean;
    vsync: boolean;
    frame_rate_limit: number | null; // FPS limit, null = unlimited

    // Memory management
    content_caching: boolean;
    lazy_loading: boolean;
    memory_limit: number | null; // MB limit, null = unlimited

    // Update behavior
    auto_refresh: boolean;
    refresh_interval: number;   // Milliseconds
    update_on_focus: boolean;
  };

  // Security and permissions
  security: {
    // Content restrictions
    allow_javascript: boolean;
    allow_plugins: boolean;
    allow_external_content: boolean;

    // System access
    file_system_access: 'none' | 'read_only' | 'full';
    network_access: boolean;
    clipboard_access: boolean;

    // User data
    save_user_data: boolean;
    encrypt_data: boolean;
    data_retention_days: number;
  };

  // Relationship to other windows
  relationships: {
    // Parent-child relationships
    parent_window_id: string | null;
    child_window_ids: string[];

    // Window groups
    window_group_id: string | null;
    group_behavior: 'independent' | 'minimize_together' | 'close_together';

    // Dependencies
    dependent_windows: string[]; // Windows that depend on this one
    prerequisite_windows: string[]; // Windows this one depends on
  };

  // Accessibility
  accessibility: {
    // Screen reader support
    screen_reader_support: boolean;
    aria_labels: {
      [element: string]: string;
    };

    // Keyboard navigation
    tab_order: number[];       // Tab order for focusable elements
    focus_trap: boolean;       // Keep focus within window (for modals)

    // Visual accessibility
    high_contrast_mode: boolean;
    text_scaling_factor: number; // 0.5 to 3.0
    motion_reduction: boolean;
  };

  // Metadata and system information
  created_at: Date;
  updated_at: Date;
  version: number;
  created_by_user: string;     // User who created this configuration
  last_used: Date;
  usage_count: number;
  is_template: boolean;        // Whether this is a reusable template
  tags: string[];
}
```

## Implementation Examples and Realistic Scenarios

### Example 1: Major Policy Debate Scenario

**Scenario:** Healthcare reform bill causing major political upheaval

```typescript
// Complete data model example showing interconnected entities
const healthcareReformScenario = {
  policy: {
    id: "policy_healthcare_reform_2025_001",
    title: "Universal Healthcare Access Act of 2025",
    category: "healthcare",
    complexity_score: 9,
    controversy_level: 8,
    fiscal_impact: {
      estimated_cost: 2500000000000, // $2.5 trillion
      funding_sources: [
        { source: "progressive_taxation", amount: 1500000000000 },
        { source: "healthcare_savings", amount: 800000000000 },
        { source: "deficit_spending", amount: 200000000000 }
      ]
    },
    stakeholder_positions: {
      "bloc_progressive_caucus_001": {
        position: "strongly_support",
        influence_level: 75,
        key_concerns: ["single_payer_provision", "cost_controls"]
      },
      "bloc_moderate_democrats_001": {
        position: "support",
        influence_level: 80,
        key_concerns: ["implementation_timeline", "cost_management"]
      },
      "bloc_conservative_republicans_001": {
        position: "strongly_oppose",
        influence_level: 70,
        key_concerns: ["government_overreach", "tax_burden"]
      }
    }
  },

  triggerEvent: {
    id: "event_healthcare_cbo_score_2025_001",
    title: "CBO Releases Healthcare Reform Cost Analysis",
    event_type: "policy_analysis",
    severity: "major",
    direct_effects: {
      politician_effects: {
        "pol_president_harris_001": {
          approval_change: -12,
          stress_impact: 20
        },
        "pol_senator_sanders_001": {
          approval_change: 8,
          stress_impact: -5
        }
      }
    },
    media_narrative: {
      dominant_frame: "Sticker shock over healthcare costs",
      alternative_frames: [
        "Investment in American health security",
        "Long-term savings through preventive care"
      ]
    }
  },

  socialMediaResponse: [
    {
      id: "post_sanders_healthcare_response_001",
      persona_id: "persona_bernie_sanders_001",
      platform: "twitter",
      content: {
        text: "The CBO analysis confirms what we've always known - healthcare is expensive. But what's MORE expensive is doing nothing while Americans die from lack of coverage. #MedicareForAll #HealthcareIsAHumanRight",
        hashtags: ["#MedicareForAll", "#HealthcareIsAHumanRight"]
      },
      political_analysis: {
        sentiment: { overall: 75 },
        political_stance: {
          "healthcare": { position: 85, intensity: 90 }
        }
      }
    }
  ],

  newsArticles: [
    {
      id: "news_healthcare_cbo_analysis_001",
      headline: "Healthcare Reform Could Cost $2.5 Trillion, CBO Analysis Finds",
      source: {
        name: "The Washington Post",
        bias_rating: "center_left",
        credibility_metrics: {
          factual_reporting: "high",
          trust_score: 78
        }
      },
      political_relevance: {
        score: 0.95,
        primary_categories: ["healthcare_policy", "budget_analysis"],
        geographic_scope: "national"
      }
    }
  ]
};
```

### Example 2: Crisis Management Scenario

**Scenario:** Economic crisis requiring immediate government response

```typescript
const economicCrisisScenario = {
  triggerEvent: {
    id: "event_market_crash_2025_001",
    title: "Major Stock Market Correction",
    event_type: "economic_crisis",
    severity: "crisis",
    occurrence_time: "2025-09-17T09:30:00.000Z",
    duration: 72, // 3 days of immediate crisis
    direct_effects: {
      systemic_effects: {
        overall_political_temperature: 40,
        institutional_trust_change: -20,
        public_engagement_change: 25
      }
    },
    response_opportunities: {
      "pol_president_harris_001": {
        available_responses: [
          {
            response_type: "emergency_economic_package",
            description: "Propose immediate economic stimulus",
            political_cost: 15,
            approval_impact: 12,
            deadline: "2025-09-18T17:00:00.000Z"
          },
          {
            response_type: "reassurance_statement",
            description: "Public statement on economic fundamentals",
            political_cost: 5,
            approval_impact: 3,
            deadline: "2025-09-17T15:00:00.000Z"
          }
        ]
      }
    }
  },

  aiPersonaResponses: [
    {
      persona_id: "persona_wall_street_analyst_001",
      predicted_posts: [
        {
          platform: "linkedin",
          content: "Market corrections are normal and healthy. The fundamentals remain strong - employment is high, inflation is controlled, and corporate earnings are solid. This is a buying opportunity for long-term investors. #MarketCorrection #Fundamentals",
          sentiment: { overall: 20 }, // Cautiously optimistic
          influence_assessment: {
            influence_score: 65,
            mobilization_potential: 40
          }
        }
      ]
    },
    {
      persona_id: "persona_progressive_activist_001",
      predicted_posts: [
        {
          platform: "twitter",
          content: "While Wall Street panics, remember that working families have been in crisis for YEARS. Maybe now Congress will finally act on wealth inequality and corporate accountability. #EconomicJustice #WealthTax",
          sentiment: { overall: -45 }, // Critical but purposeful
          political_analysis: {
            political_stance: {
              "economic_inequality": { position: -80, intensity: 85 }
            }
          }
        }
      ]
    }
  ],

  windowConfigurations: [
    {
      id: "window_crisis_management_dashboard_001",
      window_type: "app",
      app_id: "crisis_management_center",
      behavior: {
        always_on_top: true,
        modal: false,
        focus_on_show: true
      },
      layout_config: {
        layout_type: "dashboard",
        panels: [
          {
            id: "market_indicators",
            type: "real_time_data",
            position: "top",
            size_percentage: 30,
            collapsible: false
          },
          {
            id: "response_options",
            type: "action_panel",
            position: "center",
            size_percentage: 50,
            collapsible: false
          },
          {
            id: "stakeholder_communications",
            type: "communication_hub",
            position: "bottom",
            size_percentage: 20,
            collapsible: true
          }
        ]
      }
    }
  ]
};
```

### Example 3: Social Media Viral Event

**Scenario:** Political gaffe going viral across platforms

```typescript
const viralGaffeScenario = {
  originalPost: {
    id: "post_gaffe_original_001",
    platform: "twitter",
    persona_id: "pol_congressman_mistake_001",
    content: {
      text: "Just voted on the Infrastructure Bill - great to see bipartisan support for rebuilding our roads, bridges, and airports in China! 🇺🇸 #Infrastructure",
      hashtags: ["#Infrastructure"]
    },
    engagement: {
      likes: 45,
      shares: 12000, // Huge share spike due to mistake
      comments: 8500
    },
    virality_metrics: {
      viral_coefficient: 4.2, // Each share generates 4.2 additional shares
      spread_velocity: 850, // Shares per hour
      peak_engagement_time: "2025-09-17T14:23:00.000Z"
    },
    political_analysis: {
      sentiment: { overall: -75 }, // Very negative due to obvious mistake
      influence_assessment: {
        controversy_level: 85,
        fact_check_flags: ["geographic_confusion"]
      }
    }
  },

  viralResponses: [
    {
      id: "post_viral_response_001",
      platform: "twitter",
      persona_id: "persona_political_satirist_001",
      content: {
        text: "Congressman clearly supports infrastructure investment in our 51st state! 😂 Maybe we should focus on American infrastructure first? Just a thought... #InfrastructureFail #Geography101",
        hashtags: ["#InfrastructureFail", "#Geography101"]
      },
      conversation_context: {
        parent_post_id: "post_gaffe_original_001",
        reply_level: 1
      },
      engagement: {
        likes: 15600,
        shares: 3200,
        comments: 890
      }
    },
    {
      id: "post_viral_response_002",
      platform: "tiktok",
      persona_id: "persona_gen_z_political_commentator_001",
      content: {
        text: "POV: You're a Congressman who apparently thinks infrastructure money goes to China 💀 Someone get this man a geography book stat #PoliticalFail #Infrastructure #Geography",
        hashtags: ["#PoliticalFail", "#Infrastructure", "#Geography"]
      },
      virality_metrics: {
        viral_coefficient: 6.8, // TikTok higher viral coefficient
        demographic_spread: {
          "gen_z": { share_percentage: 45, engagement_level: 89 },
          "millennials": { share_percentage: 32, engagement_level: 67 }
        }
      }
    }
  ],

  newsPickup: {
    id: "news_gaffe_coverage_001",
    headline: "Congressman Accidentally Praises Infrastructure Investment 'in China'",
    source: {
      name: "Politico",
      bias_rating: "center",
      trust_score: 82
    },
    content_analysis: {
      sentiment_analysis: {
        overall_sentiment: -20, // Mildly negative but factual
        editorial_stance: "neutral"
      },
      entities: {
        politicians: [
          {
            name: "Rep. John Mistake",
            politician_id: "pol_congressman_mistake_001",
            mention_sentiment: -35,
            context: "Social media gaffe about infrastructure funding"
          }
        ]
      }
    },
    game_integration: {
      predicted_impacts: {
        politician_impacts: {
          "pol_congressman_mistake_001": {
            approval_impact: -15,
            stress_impact: 25,
            risk_score: 70
          }
        }
      }
    }
  }
};
```

## Database Indexing and Performance Strategy

### MongoDB Index Strategy

```javascript
// Core collection indexes for optimal query performance
const indexStrategy = {
  politicians: [
    // Primary queries
    { party: 1, approval_rating: -1 }, // Party members by approval
    { "attributes.charisma": -1, "attributes.intelligence": -1 }, // Top performers
    { "current_position.title": 1, "current_position.jurisdiction": 1 }, // Position queries

    // Relationship queries
    { "relationships.trust": -1 }, // Relationship analysis
    { "relationships.last_interaction": -1 }, // Recent interactions

    // Text search
    { name: "text", biography: "text", "policy_positions": "text" },

    // Temporal queries
    { created_at: 1 }, // Creation time
    { updated_at: -1 } // Recent updates
  ],

  policies: [
    // Status and priority
    { "legislative_history.current_status": 1, "timeline.introduction_date": -1 },
    { category: 1, urgency_level: 1, complexity_score: 1 },

    // Support tracking
    { "stakeholder_positions.position": 1, "stakeholder_positions.influence_level": -1 },

    // Fiscal analysis
    { "fiscal_impact.estimated_cost": -1 },

    // Text search
    { title: "text", description: "text", full_text: "text" },

    // Geographic and scope
    { scope: 1, "projected_effects.regional_impacts": 1 }
  ],

  events: [
    // Temporal queries (most common)
    { occurrence_time: -1 }, // Recent events first
    { end_time: 1 }, // Ongoing events

    // Severity and impact
    { severity: 1, media_attention_level: -1 },
    { event_type: 1, category: 1 },

    // Geographic scope
    { "geographic_scope": 1, "affected_regions": 1 },

    // Response tracking
    { "response_opportunities.response_deadline": 1 },

    // Causal relationships
    { "trigger_events": 1 }, // Events that caused this
    { "triggered_by.event_id": 1 } // Parent events
  ],

  social_media_posts: [
    // Platform and time
    { platform: 1, "publication.actual_publish_time": -1 },

    // Persona and engagement
    { persona_id: 1, "engagement.likes": -1 },
    { "virality_metrics.viral_coefficient": -1 },

    // Political analysis
    { "political_analysis.sentiment.overall": 1 },
    { "political_analysis.topics.primary_topics": 1 },

    // Conversation threading
    { "conversation_context.thread_id": 1, "conversation_context.reply_level": 1 },

    // Text search
    { "content.text": "text", "content.hashtags": "text" }
  ],

  news_articles: [
    // Publication and relevance
    { "publication.published_at": -1 }, // Most recent first
    { "content_analysis.political_relevance.score": -1 }, // Most relevant first

    // Source and credibility
    { "source.name": 1, "source.credibility_metrics.trust_score": -1 },
    { "source.bias_rating": 1 },

    // Geographic and topic
    { "content_analysis.political_relevance.geographic_scope": 1 },
    { "content_analysis.political_relevance.primary_categories": 1 },

    // Entity mentions
    { "content_analysis.entities.politicians.politician_id": 1 },
    { "content_analysis.entities.policies.policy_id": 1 },

    // Text search
    { headline: "text", content: "text", summary: "text" }
  ]
};
```

### Query Performance Targets

**Target Response Times:**
- Simple lookups (by ID): <5ms
- Complex relationship queries: <50ms
- Full-text search: <100ms
- Aggregation pipelines: <200ms
- Real-time dashboard queries: <100ms

**Optimization Strategies:**
- Use projection to limit returned fields
- Implement result caching for expensive queries
- Use aggregation pipelines for complex analysis
- Employ read replicas for analytics queries
- Implement data archiving for historical data

## Conclusion

This comprehensive data model provides the foundation for a sophisticated political desktop OS simulation. The schema design balances flexibility with performance, enabling complex political relationships while maintaining query efficiency. The realistic examples demonstrate how interconnected entities create emergent gameplay narratives, while the indexing strategy ensures real-time performance at scale.

**Key Design Strengths:**
1. **Comprehensive Coverage:** All aspects of political simulation represented
2. **Relationship Modeling:** Complex political relationships and influences
3. **Real-time Integration:** News and social media data integration
4. **AI-Driven Content:** LLM personality and content generation support
5. **Performance Optimization:** Strategic indexing and caching approaches
6. **Extensibility:** Easy addition of new political systems and mechanics

The data schemas support the full range of political simulation requirements while providing clear upgrade paths for enhanced features and international expansion.