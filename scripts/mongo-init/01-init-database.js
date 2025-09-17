// MongoDB initialization script for Political Desktop OS Simulation
// Creates database, collections, and initial indexes for optimal performance

// Switch to the politicai database
db = db.getSiblingDB('politicai');

// Create application user with appropriate permissions
db.createUser({
  user: 'politicai_app',
  pwd: 'politicai_app_2025',
  roles: [
    {
      role: 'readWrite',
      db: 'politicai'
    }
  ]
});

print('✓ Created application user: politicai_app');

// Create core collections with validation schemas
db.createCollection('politicians', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'party', 'attributes', 'skills'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        party: { bsonType: 'object' },
        attributes: {
          bsonType: 'object',
          required: ['charisma', 'intelligence', 'integrity', 'ambition', 'experience'],
          properties: {
            charisma: { bsonType: 'number', minimum: 1, maximum: 100 },
            intelligence: { bsonType: 'number', minimum: 1, maximum: 100 },
            integrity: { bsonType: 'number', minimum: 1, maximum: 100 },
            ambition: { bsonType: 'number', minimum: 1, maximum: 100 },
            experience: { bsonType: 'number', minimum: 1, maximum: 100 }
          }
        },
        skills: { bsonType: 'object' },
        approval_rating: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        is_active: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('political_blocs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'ideology', 'membership'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        ideology: { bsonType: 'object' },
        membership: { bsonType: 'object' },
        cohesion_metrics: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        is_active: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('policies', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'title', 'category', 'policy_type'],
      properties: {
        id: { bsonType: 'string' },
        title: { bsonType: 'string' },
        category: { bsonType: 'string' },
        policy_type: {
          bsonType: 'string',
          enum: ['bill', 'resolution', 'amendment', 'executive_order', 'regulation', 'judicial_ruling']
        },
        complexity_score: { bsonType: 'number', minimum: 1, maximum: 10 },
        controversy_level: { bsonType: 'number', minimum: 1, maximum: 10 },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        is_active: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('game_events', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'title', 'event_type', 'occurrence_time', 'severity'],
      properties: {
        id: { bsonType: 'string' },
        title: { bsonType: 'string' },
        event_type: { bsonType: 'string' },
        occurrence_time: { bsonType: 'date' },
        severity: {
          bsonType: 'string',
          enum: ['minor', 'moderate', 'major', 'crisis', 'historic']
        },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('social_media_posts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'platform', 'persona_id', 'content'],
      properties: {
        id: { bsonType: 'string' },
        platform: {
          bsonType: 'string',
          enum: ['twitter', 'facebook', 'instagram', 'tiktok', 'reddit', 'linkedin', 'youtube']
        },
        persona_id: { bsonType: 'string' },
        content: { bsonType: 'object' },
        engagement: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        is_active: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('social_media_personas', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'username', 'account_type', 'political_profile'],
      properties: {
        id: { bsonType: 'string' },
        username: { bsonType: 'string' },
        account_type: {
          bsonType: 'string',
          enum: ['individual', 'organization', 'media', 'bot', 'parody', 'fan_account']
        },
        political_profile: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        is_active: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('news_articles', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'headline', 'source', 'content'],
      properties: {
        id: { bsonType: 'string' },
        headline: { bsonType: 'string' },
        source: { bsonType: 'object' },
        content: { bsonType: 'string' },
        content_analysis: { bsonType: 'object' },
        game_integration: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('media_outlets', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name', 'website_url', 'editorial_profile'],
      properties: {
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        website_url: { bsonType: 'string' },
        editorial_profile: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('window_configurations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'window_type', 'app_id', 'geometry'],
      properties: {
        id: { bsonType: 'string' },
        window_type: {
          bsonType: 'string',
          enum: ['app', 'dialog', 'popup', 'overlay', 'system']
        },
        app_id: { bsonType: 'string' },
        geometry: { bsonType: 'object' },
        behavior: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

// Create additional utility collections
db.createCollection('game_state', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'current_tick', 'game_time'],
      properties: {
        id: { bsonType: 'string' },
        current_tick: { bsonType: 'number' },
        game_time: { bsonType: 'date' },
        political_temperature: { bsonType: 'number' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('llm_job_queue', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'job_type', 'status', 'created_at'],
      properties: {
        id: { bsonType: 'string' },
        job_type: { bsonType: 'string' },
        status: {
          bsonType: 'string',
          enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
        },
        priority: { bsonType: 'number', minimum: 1, maximum: 10 },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

print('✓ Created all core collections with validation schemas');

// Insert initial game state document
db.game_state.insertOne({
  id: 'main_game_state',
  current_tick: 0,
  game_time: new Date(),
  political_temperature: 50,
  institutional_trust: 65,
  public_engagement: 45,
  media_attention_level: 30,
  created_at: new Date(),
  updated_at: new Date()
});

print('✓ Initialized game state document');
print('🗄️  Database initialization completed successfully');