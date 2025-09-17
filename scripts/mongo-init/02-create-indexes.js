// MongoDB index creation for optimal query performance
// Based on the data schema analysis and expected query patterns

// Switch to the politicai database
db = db.getSiblingDB('politicai');

print('Creating indexes for optimal query performance...');

// Politicians Collection Indexes
print('Creating politicians indexes...');
db.politicians.createIndex({ "id": 1 }, { unique: true, name: "idx_politicians_id" });
db.politicians.createIndex({ "party.id": 1, "approval_rating.overall": -1 }, { name: "idx_politicians_party_approval" });
db.politicians.createIndex({ "attributes.charisma": -1, "attributes.intelligence": -1 }, { name: "idx_politicians_top_performers" });
db.politicians.createIndex({ "current_position.title": 1, "current_position.jurisdiction": 1 }, { name: "idx_politicians_position" });
db.politicians.createIndex({ "relationships": 1 }, { name: "idx_politicians_relationships", sparse: true });
db.politicians.createIndex({ "created_at": 1 }, { name: "idx_politicians_created" });
db.politicians.createIndex({ "updated_at": -1 }, { name: "idx_politicians_updated" });
db.politicians.createIndex({ "is_active": 1, "approval_rating.overall": -1 }, { name: "idx_politicians_active_approval" });

// Text search index for politicians
db.politicians.createIndex(
  {
    "name": "text",
    "biography": "text",
    "current_position.title": "text"
  },
  {
    name: "idx_politicians_text_search",
    weights: { "name": 10, "current_position.title": 5, "biography": 1 }
  }
);

// Political Blocs Collection Indexes
print('Creating political_blocs indexes...');
db.political_blocs.createIndex({ "id": 1 }, { unique: true, name: "idx_blocs_id" });
db.political_blocs.createIndex({ "ideology.primary": 1, "cohesion_metrics.unity_score": -1 }, { name: "idx_blocs_ideology_unity" });
db.political_blocs.createIndex({ "membership.total_members": -1 }, { name: "idx_blocs_size" });
db.political_blocs.createIndex({ "electoral_data.seats_held": 1 }, { name: "idx_blocs_seats" });
db.political_blocs.createIndex({ "is_active": 1, "resources.influence_score": -1 }, { name: "idx_blocs_active_influence" });

// Text search index for political blocs
db.political_blocs.createIndex(
  {
    "name": "text",
    "description": "text"
  },
  {
    name: "idx_blocs_text_search",
    weights: { "name": 10, "description": 1 }
  }
);

// Policies Collection Indexes
print('Creating policies indexes...');
db.policies.createIndex({ "id": 1 }, { unique: true, name: "idx_policies_id" });
db.policies.createIndex({ "legislative_history.current_status": 1, "timeline.introduction_date": -1 }, { name: "idx_policies_status_date" });
db.policies.createIndex({ "category": 1, "urgency_level": 1, "complexity_score": 1 }, { name: "idx_policies_classification" });
db.policies.createIndex({ "fiscal_impact.estimated_cost": -1 }, { name: "idx_policies_cost" });
db.policies.createIndex({ "stakeholder_positions": 1 }, { name: "idx_policies_stakeholders", sparse: true });
db.policies.createIndex({ "scope": 1, "political_feasibility": -1 }, { name: "idx_policies_scope_feasibility" });
db.policies.createIndex({ "is_active": 1, "timeline.introduction_date": -1 }, { name: "idx_policies_active_recent" });

// Text search index for policies
db.policies.createIndex(
  {
    "title": "text",
    "description": "text",
    "summary": "text"
  },
  {
    name: "idx_policies_text_search",
    weights: { "title": 10, "summary": 5, "description": 1 }
  }
);

// Game Events Collection Indexes
print('Creating game_events indexes...');
db.game_events.createIndex({ "id": 1 }, { unique: true, name: "idx_events_id" });
db.game_events.createIndex({ "occurrence_time": -1 }, { name: "idx_events_time" });
db.game_events.createIndex({ "severity": 1, "media_attention_level": -1 }, { name: "idx_events_severity_attention" });
db.game_events.createIndex({ "event_type": 1, "category": 1 }, { name: "idx_events_type_category" });
db.game_events.createIndex({ "geographic_scope": 1, "affected_regions": 1 }, { name: "idx_events_geographic" });
db.game_events.createIndex({ "trigger_events": 1 }, { name: "idx_events_triggers", sparse: true });
db.game_events.createIndex({ "resolution_status": 1, "occurrence_time": -1 }, { name: "idx_events_resolution_time" });

// Compound index for active/ongoing events
db.game_events.createIndex({
  "resolution_status": 1,
  "occurrence_time": -1,
  "severity": 1
}, { name: "idx_events_active_recent_severe" });

// Social Media Posts Collection Indexes
print('Creating social_media_posts indexes...');
db.social_media_posts.createIndex({ "id": 1 }, { unique: true, name: "idx_posts_id" });
db.social_media_posts.createIndex({ "platform": 1, "publication.actual_publish_time": -1 }, { name: "idx_posts_platform_time" });
db.social_media_posts.createIndex({ "persona_id": 1, "publication.actual_publish_time": -1 }, { name: "idx_posts_persona_time" });
db.social_media_posts.createIndex({ "engagement.likes": -1, "engagement.shares": -1 }, { name: "idx_posts_engagement" });
db.social_media_posts.createIndex({ "virality_metrics.viral_coefficient": -1 }, { name: "idx_posts_virality" });
db.social_media_posts.createIndex({ "conversation_context.thread_id": 1, "conversation_context.reply_level": 1 }, { name: "idx_posts_conversation" });
db.social_media_posts.createIndex({ "political_analysis.sentiment.overall": 1 }, { name: "idx_posts_sentiment" });
db.social_media_posts.createIndex({ "is_active": 1, "publication.actual_publish_time": -1 }, { name: "idx_posts_active_recent" });

// Text search index for social media posts
db.social_media_posts.createIndex(
  {
    "content.text": "text",
    "content.hashtags": "text"
  },
  {
    name: "idx_posts_text_search",
    weights: { "content.text": 5, "content.hashtags": 3 }
  }
);

// Social Media Personas Collection Indexes
print('Creating social_media_personas indexes...');
db.social_media_personas.createIndex({ "id": 1 }, { unique: true, name: "idx_personas_id" });
db.social_media_personas.createIndex({ "username": 1 }, { unique: true, name: "idx_personas_username" });
db.social_media_personas.createIndex({ "account_type": 1, "follower_count": -1 }, { name: "idx_personas_type_followers" });
db.social_media_personas.createIndex({ "political_profile.ideology.primary": 1 }, { name: "idx_personas_ideology" });
db.social_media_personas.createIndex({ "performance_metrics.influence_score": -1 }, { name: "idx_personas_influence" });
db.social_media_personas.createIndex({ "is_active": 1, "follower_count": -1 }, { name: "idx_personas_active_popular" });

// News Articles Collection Indexes
print('Creating news_articles indexes...');
db.news_articles.createIndex({ "id": 1 }, { unique: true, name: "idx_articles_id" });
db.news_articles.createIndex({ "publication.published_at": -1 }, { name: "idx_articles_published" });
db.news_articles.createIndex({ "content_analysis.political_relevance.score": -1 }, { name: "idx_articles_relevance" });
db.news_articles.createIndex({ "source.name": 1, "source.credibility_metrics.trust_score": -1 }, { name: "idx_articles_source_trust" });
db.news_articles.createIndex({ "source.bias_rating": 1 }, { name: "idx_articles_bias" });
db.news_articles.createIndex({ "content_analysis.political_relevance.geographic_scope": 1 }, { name: "idx_articles_geo_scope" });
db.news_articles.createIndex({ "content_analysis.entities.politicians.politician_id": 1 }, { name: "idx_articles_politician_mentions" });

// Compound index for recent, relevant articles
db.news_articles.createIndex({
  "content_analysis.political_relevance.score": -1,
  "publication.published_at": -1,
  "source.credibility_metrics.trust_score": -1
}, { name: "idx_articles_relevance_time_trust" });

// Text search index for news articles
db.news_articles.createIndex(
  {
    "headline": "text",
    "summary": "text",
    "content": "text"
  },
  {
    name: "idx_articles_text_search",
    weights: { "headline": 10, "summary": 5, "content": 1 }
  }
);

// Media Outlets Collection Indexes
print('Creating media_outlets indexes...');
db.media_outlets.createIndex({ "id": 1 }, { unique: true, name: "idx_outlets_id" });
db.media_outlets.createIndex({ "name": 1 }, { unique: true, name: "idx_outlets_name" });
db.media_outlets.createIndex({ "editorial_profile.bias_rating.overall_bias": 1 }, { name: "idx_outlets_bias" });
db.media_outlets.createIndex({ "editorial_profile.bias_rating.trust_score": -1 }, { name: "idx_outlets_trust" });
db.media_outlets.createIndex({ "influence_metrics.public_influence": -1 }, { name: "idx_outlets_influence" });

// Window Configurations Collection Indexes
print('Creating window_configurations indexes...');
db.window_configurations.createIndex({ "id": 1 }, { unique: true, name: "idx_windows_id" });
db.window_configurations.createIndex({ "app_id": 1, "window_type": 1 }, { name: "idx_windows_app_type" });
db.window_configurations.createIndex({ "created_by_user": 1, "last_used": -1 }, { name: "idx_windows_user_recent" });
db.window_configurations.createIndex({ "is_template": 1 }, { name: "idx_windows_templates" });

// Game State Collection Indexes
print('Creating game_state indexes...');
db.game_state.createIndex({ "id": 1 }, { unique: true, name: "idx_game_state_id" });
db.game_state.createIndex({ "updated_at": -1 }, { name: "idx_game_state_updated" });

// LLM Job Queue Collection Indexes
print('Creating llm_job_queue indexes...');
db.llm_job_queue.createIndex({ "id": 1 }, { unique: true, name: "idx_llm_jobs_id" });
db.llm_job_queue.createIndex({ "status": 1, "priority": -1, "created_at": 1 }, { name: "idx_llm_jobs_processing_queue" });
db.llm_job_queue.createIndex({ "job_type": 1, "status": 1 }, { name: "idx_llm_jobs_type_status" });
db.llm_job_queue.createIndex({ "created_at": 1 }, { name: "idx_llm_jobs_created" });

// Compound index for active job processing
db.llm_job_queue.createIndex({
  "status": 1,
  "priority": -1,
  "created_at": 1
}, { name: "idx_llm_jobs_active_processing" });

// TTL index for completed jobs (automatically delete after 7 days)
db.llm_job_queue.createIndex(
  { "updated_at": 1 },
  {
    expireAfterSeconds: 604800, // 7 days
    partialFilterExpression: { status: { $in: ["completed", "failed", "cancelled"] } },
    name: "idx_llm_jobs_ttl"
  }
);

print('✓ All indexes created successfully');

// Create compound indexes for common query patterns
print('Creating compound indexes for common query patterns...');

// Politicians by party and approval for dashboard queries
db.politicians.createIndex({
  "party.id": 1,
  "is_active": 1,
  "approval_rating.overall": -1,
  "attributes.charisma": -1
}, { name: "idx_politicians_dashboard" });

// Events by time and impact for timeline queries
db.game_events.createIndex({
  "occurrence_time": -1,
  "severity": 1,
  "media_attention_level": -1,
  "resolution_status": 1
}, { name: "idx_events_timeline" });

// Posts by engagement for trending analysis
db.social_media_posts.createIndex({
  "publication.actual_publish_time": -1,
  "engagement.likes": -1,
  "engagement.shares": -1,
  "virality_metrics.viral_coefficient": -1
}, { name: "idx_posts_trending" });

// Articles by relevance and recency for news feed
db.news_articles.createIndex({
  "content_analysis.political_relevance.score": -1,
  "publication.published_at": -1,
  "source.credibility_metrics.trust_score": -1
}, { name: "idx_articles_news_feed" });

print('✓ Compound indexes for query patterns created');

// Verify index creation
print('\nIndex creation summary:');
print('Politicians collection: ' + db.politicians.getIndexes().length + ' indexes');
print('Political blocs collection: ' + db.political_blocs.getIndexes().length + ' indexes');
print('Policies collection: ' + db.policies.getIndexes().length + ' indexes');
print('Game events collection: ' + db.game_events.getIndexes().length + ' indexes');
print('Social media posts collection: ' + db.social_media_posts.getIndexes().length + ' indexes');
print('Social media personas collection: ' + db.social_media_personas.getIndexes().length + ' indexes');
print('News articles collection: ' + db.news_articles.getIndexes().length + ' indexes');
print('Media outlets collection: ' + db.media_outlets.getIndexes().length + ' indexes');
print('Window configurations collection: ' + db.window_configurations.getIndexes().length + ' indexes');
print('Game state collection: ' + db.game_state.getIndexes().length + ' indexes');
print('LLM job queue collection: ' + db.llm_job_queue.getIndexes().length + ' indexes');

print('\n🚀 Database indexes optimization completed successfully');