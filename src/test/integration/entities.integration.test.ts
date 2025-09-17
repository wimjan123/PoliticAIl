/**
 * Integration Tests for Political Entity Interfaces
 *
 * This file provides comprehensive integration testing for the political
 * entity data models, validation schemas, and mock data generation,
 * ensuring entity relationships work correctly and data integrity is maintained.
 *
 * Test Coverage:
 * - Entity relationship validation and integrity
 * - Cross-entity reference consistency
 * - Data persistence and retrieval operations
 * - Mock data generation reliability
 * - Validation schema comprehensive testing
 */

import {
  validatePolitician,
  validateBloc,
  validatePolicy,
  validatePoliticalLandscape
} from '../../types/validation';
import {
  generatePoliticalLandscape,
  generateAdditionalPoliticians
} from '../../data/mockGenerator';
import {
  SAMPLE_POLITICAL_LANDSCAPE,
  SAMPLE_POLITICIANS,
  SAMPLE_BLOCS,
  SAMPLE_POLICIES,
  generateFreshSampleData
} from '../../data/sampleData';

describe('Political Entity Integration Tests', () => {
  describe('Entity Validation Integration', () => {
    test('should validate sample politicians with all relationships', () => {
      SAMPLE_POLITICIANS.forEach(politician => {
        const result = validatePolitician(politician);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.errors).toBeUndefined();

        // Verify politician structure
        expect(result.data!.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(result.data!.name).toBeTruthy();
        expect(['player', 'ai_opponent', 'npc']).toContain(result.data!.role);
        expect(['left', 'center', 'right']).toContain(result.data!.political_stance);

        // Verify attributes are within bounds
        expect(result.data!.attributes.charisma).toBeGreaterThanOrEqual(1);
        expect(result.data!.attributes.charisma).toBeLessThanOrEqual(100);
        expect(result.data!.approval_rating).toBeGreaterThanOrEqual(0);
        expect(result.data!.approval_rating).toBeLessThanOrEqual(100);
      });
    });

    test('should validate sample blocs with member relationships', () => {
      SAMPLE_BLOCS.forEach(bloc => {
        const result = validateBloc(bloc);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.errors).toBeUndefined();

        // Verify bloc structure
        expect(result.data!.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(result.data!.name).toBeTruthy();
        expect(['party', 'coalition', 'faction', 'interest_group']).toContain(result.data!.type);
        expect(result.data!.members.length).toBeGreaterThan(0);

        // Verify at most one leader
        const leaders = result.data!.members.filter(m => m.role === 'leader');
        expect(leaders.length).toBeLessThanOrEqual(1);

        // Verify member IDs are unique
        const memberIds = result.data!.members.map(m => m.politician_id);
        expect(new Set(memberIds).size).toBe(memberIds.length);
      });
    });

    test('should validate sample policies with support/opposition integrity', () => {
      SAMPLE_POLICIES.forEach(policy => {
        const result = validatePolicy(policy);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.errors).toBeUndefined();

        // Verify policy structure
        expect(result.data!.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(result.data!.title).toBeTruthy();
        expect(result.data!.sponsor_id).toMatch(/^[0-9a-f-]{36}$/i);

        // Verify no entity supports and opposes the same policy
        const supporterIds = result.data!.supporters.map(s => s.entity_id);
        const opponentIds = result.data!.opponents.map(o => o.entity_id);
        const intersection = supporterIds.filter(id => opponentIds.includes(id));
        expect(intersection.length).toBe(0);
      });
    });

    test('should validate complete political landscape with cross-references', () => {
      const result = validatePoliticalLandscape(SAMPLE_POLITICAL_LANDSCAPE);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();

      const landscape = result.data!;

      // Verify minimum entity counts
      expect(landscape.politicians.length).toBeGreaterThanOrEqual(4);
      expect(landscape.blocs.length).toBeGreaterThan(0);
      expect(landscape.policies.length).toBeGreaterThan(0);

      // Verify climate structure
      expect(landscape.climate.public_trust).toBeGreaterThanOrEqual(0);
      expect(landscape.climate.public_trust).toBeLessThanOrEqual(100);
      expect(landscape.climate.dominant_issues.length).toBeGreaterThan(0);
      expect(landscape.climate.dominant_issues.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Entity Relationship Integrity', () => {
    test('should maintain consistent politician relationships', () => {
      const landscape = SAMPLE_POLITICAL_LANDSCAPE;
      const politicianIds = new Set(landscape.politicians.map(p => p.id));

      landscape.politicians.forEach(politician => {
        // All relationship targets should exist
        for (const [relationshipId] of politician.relationships) {
          expect(politicianIds.has(relationshipId)).toBe(true);
        }

        // Relationships should be realistic based on political stance
        for (const [relationshipId, _score] of politician.relationships) {
          const otherPolitician = landscape.politicians.find(p => p.id === relationshipId);
          expect(otherPolitician).toBeDefined();

          // Same stance politicians should generally have positive relationships
          if (otherPolitician && politician.political_stance === otherPolitician.political_stance) {
            // Allow for some internal conflicts, but most should be positive
            const sameStanceRelationships = Array.from(politician.relationships.entries())
              .filter(([id]) => {
                const other = landscape.politicians.find(p => p.id === id);
                return other?.political_stance === politician.political_stance;
              });

            const positiveCount = sameStanceRelationships.filter(([_id, score]) => score > 0).length;
            const totalCount = sameStanceRelationships.length;

            if (totalCount > 0) {
              expect(positiveCount / totalCount).toBeGreaterThan(0.3); // At least 30% positive
            }
          }
        }
      });
    });

    test('should maintain consistent bloc memberships', () => {
      const landscape = SAMPLE_POLITICAL_LANDSCAPE;
      const politicianIds = new Set(landscape.politicians.map(p => p.id));

      landscape.blocs.forEach(bloc => {
        // All members should reference existing politicians
        bloc.members.forEach(member => {
          expect(politicianIds.has(member.politician_id)).toBe(true);
        });

        // Members should generally align with bloc political stance
        const compatibleMembers = bloc.members.filter(member => {
          const politician = landscape.politicians.find(p => p.id === member.politician_id);
          return politician && (
            politician.political_stance === bloc.political_stance ||
            (bloc.type === 'coalition' && Math.abs(
              ['left', 'center', 'right'].indexOf(politician.political_stance) -
              ['left', 'center', 'right'].indexOf(bloc.political_stance)
            ) <= 1)
          );
        });

        // Most members should be politically compatible
        expect(compatibleMembers.length / bloc.members.length).toBeGreaterThan(0.7);
      });
    });

    test('should maintain consistent policy support/opposition', () => {
      const landscape = SAMPLE_POLITICAL_LANDSCAPE;
      const politicianIds = new Set(landscape.politicians.map(p => p.id));
      const blocIds = new Set(landscape.blocs.map(b => b.id));

      landscape.policies.forEach(policy => {
        // Sponsor should exist
        expect(politicianIds.has(policy.sponsor_id)).toBe(true);

        // All supporters and opponents should reference existing entities
        [...policy.supporters, ...policy.opponents].forEach(support => {
          if (support.entity_type === 'politician') {
            expect(politicianIds.has(support.entity_id)).toBe(true);
          } else {
            expect(blocIds.has(support.entity_id)).toBe(true);
          }
        });

        // Support should generally align with political stances
        const sponsor = landscape.politicians.find(p => p.id === policy.sponsor_id);
        if (!sponsor) return;
        const politicianSupporters = policy.supporters.filter(s => s.entity_type === 'politician');

        const alignedSupporters = politicianSupporters.filter(supporter => {
          const politician = landscape.politicians.find(p => p.id === supporter.entity_id);
          return politician && politician.political_stance === sponsor.political_stance;
        });

        // At least some supporters should be politically aligned
        if (politicianSupporters.length > 0) {
          expect(alignedSupporters.length).toBeGreaterThan(0);
        }
      });
    });

    test('should maintain cross-entity policy positions consistency', () => {
      const landscape = SAMPLE_POLITICAL_LANDSCAPE;

      landscape.politicians.forEach(politician => {
        politician.policy_positions.forEach(position => {
          // Policy should exist
          const policy = landscape.policies.find(p => p.id === position.policy_id);
          expect(policy).toBeDefined();
          if (!policy) return;

          // Position should be consistent with support/opposition records
          const supportRecord = policy.supporters.find(s =>
            s.entity_id === politician.id && s.entity_type === 'politician'
          );
          const opponentRecord = policy.opponents.find(o =>
            o.entity_id === politician.id && o.entity_type === 'politician'
          );

          if (position.stance === 'support' && supportRecord) {
            expect(supportRecord.strength).toBeGreaterThan(0);
          }
          if (position.stance === 'oppose' && opponentRecord) {
            expect(opponentRecord.strength).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  describe('Mock Data Generation Reliability', () => {
    test('should generate consistent political landscapes multiple times', () => {
      const landscapes = Array.from({ length: 5 }, () => generatePoliticalLandscape());

      landscapes.forEach(landscape => {
        // Each landscape should pass validation
        const result = validatePoliticalLandscape(landscape);
        expect(result.success).toBe(true);

        // Should have expected entity counts
        expect(landscape.politicians.length).toBe(6); // As specified in generator
        expect(landscape.blocs.length).toBe(4);
        expect(landscape.policies.length).toBe(5);

        // Should have diverse political representation
        const stances = landscape.politicians.map(p => p.political_stance);
        expect(new Set(stances)).toContain('left');
        expect(new Set(stances)).toContain('right');
        expect(new Set(stances)).toContain('center');

        // Should have proper role distribution
        const playerCount = landscape.politicians.filter(p => p.role === 'player').length;
        expect(playerCount).toBe(1); // Exactly one player
      });
    });

    test('should generate additional politicians with balanced stances', () => {
      const existingBalance = { left: 2, center: 2, right: 2 };
      const additionalPoliticians = generateAdditionalPoliticians(6, existingBalance);

      expect(additionalPoliticians.length).toBe(6);

      // Each should be valid
      additionalPoliticians.forEach(politician => {
        const result = validatePolitician(politician);
        expect(result.success).toBe(true);
      });

      // Should have diverse stances
      const stances = additionalPoliticians.map(p => p.political_stance);
      expect(new Set(stances).size).toBeGreaterThan(1);
    });

    test('should generate fresh sample data consistently', () => {
      const landscapes = Array.from({ length: 3 }, () => generateFreshSampleData());

      landscapes.forEach(landscape => {
        const result = validatePoliticalLandscape(landscape);
        expect(result.success).toBe(true);

        // Should be different from static sample
        expect(landscape.politicians[0].id).not.toBe(SAMPLE_POLITICIANS[0].id);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid politician data gracefully', () => {
      const invalidPolitician = {
        id: 'invalid-uuid',
        name: '',
        role: 'invalid-role',
        attributes: {
          charisma: 150, // Out of bounds
          intelligence: -10, // Out of bounds
          integrity: 'invalid', // Wrong type
          ambition: 50
        },
        approval_rating: 105, // Out of bounds
        political_stance: 'invalid-stance',
        personality: {
          risk_tolerance: 50,
          collaboration_preference: 50,
          compromise_willingness: 50,
          populism_tendency: 50,
          reform_preference: 50
        },
        relationships: new Map(),
        policy_positions: [],
        created_at: new Date(),
        updated_at: new Date('2023-01-01') // Before created_at
      };

      const result = validatePolitician(invalidPolitician);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    test('should handle invalid bloc data gracefully', () => {
      const invalidBloc = {
        id: 'invalid-uuid',
        name: '',
        type: 'invalid-type',
        political_stance: 'invalid-stance',
        members: [], // Empty members array
        platform: [],
        support_level: 150, // Out of bounds
        resources: {
          funding: -1000, // Negative funding
          media_influence: 150, // Out of bounds
          grassroots_strength: 'invalid' // Wrong type
        },
        bloc_relationships: new Map(),
        created_at: new Date(),
        updated_at: new Date('2023-01-01') // Before created_at
      };

      const result = validateBloc(invalidBloc);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    test('should handle invalid policy data gracefully', () => {
      const invalidPolicy = {
        id: 'invalid-uuid',
        title: '',
        description: '',
        category: 'invalid-category',
        status: 'invalid-status',
        sponsor_id: 'invalid-uuid',
        supporters: [
          {
            entity_id: 'same-entity',
            entity_type: 'politician',
            strength: 80,
            public: true,
            declared_at: new Date()
          }
        ],
        opponents: [
          {
            entity_id: 'same-entity', // Same as supporter
            entity_type: 'politician',
            strength: 70,
            public: true,
            declared_at: new Date()
          }
        ],
        public_support: 150, // Out of bounds
        economic_impact: {
          cost: -1000, // Negative cost
          benefit: 'invalid', // Wrong type
          implementation_timeframe: ''
        },
        voting_predictions: {
          support_percentage: 150, // Out of bounds
          confidence: 150, // Out of bounds
          swing_votes: ['invalid-uuid']
        },
        introduced_at: new Date(),
        updated_at: new Date('2023-01-01') // Before introduced_at
      };

      const result = validatePolicy(invalidPolicy);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    test('should detect cross-reference inconsistencies', () => {
      const invalidLandscape = {
        politicians: [
          {
            ...SAMPLE_POLITICIANS[0],
            relationships: new Map([
              ['non-existent-politician', 50] // Reference to non-existent politician
            ])
          }
        ],
        blocs: [
          {
            ...SAMPLE_BLOCS[0],
            members: [
              {
                politician_id: 'non-existent-politician', // Reference to non-existent politician
                role: 'member' as const,
                influence: 50,
                joined_at: new Date()
              }
            ]
          }
        ],
        policies: [
          {
            ...SAMPLE_POLICIES[0],
            sponsor_id: 'non-existent-politician' // Reference to non-existent politician
          }
        ],
        climate: SAMPLE_POLITICAL_LANDSCAPE.climate,
        timestamp: new Date()
      };

      const result = validatePoliticalLandscape(invalidLandscape);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scalability', () => {
    test('should validate large datasets efficiently', () => {
      const startTime = Date.now();

      // Generate a larger dataset
      const largeLandscape = generatePoliticalLandscape();
      const additionalPoliticians = generateAdditionalPoliticians(20);
      largeLandscape.politicians.push(...additionalPoliticians);

      // Validate the entire landscape
      const result = validatePoliticalLandscape(largeLandscape);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle memory efficiently with large relationship networks', () => {
      const politicians = generateAdditionalPoliticians(50);

      // Each politician should have a reasonable number of relationships
      politicians.forEach(politician => {
        expect(politician.relationships.size).toBeLessThan(politicians.length);
        expect(politician.policy_positions.length).toBeLessThan(20);
      });
    });
  });
});

describe('Data Persistence and Retrieval Simulation', () => {
  test('should simulate database operations correctly', () => {
    const landscape = SAMPLE_POLITICAL_LANDSCAPE;

    // Simulate retrieving by ID
    const politicianId = landscape.politicians[0].id;
    const foundPolitician = landscape.politicians.find(p => p.id === politicianId);
    expect(foundPolitician).toBeDefined();
    expect(foundPolitician!.id).toBe(politicianId);

    // Simulate relationship queries
    const relationships = Array.from(foundPolitician!.relationships.entries());
    relationships.forEach(([targetId, score]) => {
      const targetPolitician = landscape.politicians.find(p => p.id === targetId);
      expect(targetPolitician).toBeDefined();
      expect(typeof score).toBe('number');
    });

    // Simulate policy support queries
    const policy = landscape.policies[0];
    policy.supporters.forEach(supporter => {
      if (supporter.entity_type === 'politician') {
        const politician = landscape.politicians.find(p => p.id === supporter.entity_id);
        expect(politician).toBeDefined();
      } else {
        const bloc = landscape.blocs.find(b => b.id === supporter.entity_id);
        expect(bloc).toBeDefined();
      }
    });
  });

  test('should maintain data consistency after updates', () => {
    const landscape = { ...SAMPLE_POLITICAL_LANDSCAPE };

    // Simulate updating a politician's approval rating
    const politician = { ...landscape.politicians[0] };
    politician.approval_rating = 75;
    politician.updated_at = new Date();

    landscape.politicians = [...landscape.politicians];
    landscape.politicians[0] = politician;

    // Validate the updated landscape
    const result = validatePoliticalLandscape(landscape);
    expect(result.success).toBe(true);

    // Verify the update persisted
    expect(landscape.politicians[0].approval_rating).toBe(75);
    expect(landscape.politicians[0].updated_at.getTime()).toBeGreaterThan(
      landscape.politicians[0].created_at.getTime()
    );
  });
});