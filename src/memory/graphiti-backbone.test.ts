import { describe, expect, it } from "vitest";
import {
  buildGraphitiNeo4jMissionQuery,
  buildGraphitiNeo4jSearchQuery,
  buildGraphitiNeo4jWritebackQuery,
} from "./graphiti-backbone.js";

describe("graphiti backbone neo4j queries", () => {
  it("builds a mission upsert query for graph writeback", () => {
    expect(buildGraphitiNeo4jMissionQuery()).toContain("MERGE (mission:VikiMission");
    expect(buildGraphitiNeo4jMissionQuery()).toContain("mission.objective = $objective");
  });

  it("builds a writeback relationship query", () => {
    expect(buildGraphitiNeo4jWritebackQuery()).toContain("MERGE (writeback:VikiWriteback");
    expect(buildGraphitiNeo4jWritebackQuery()).toContain("[:WROTE_BACK]");
  });

  it("builds a search query for graph-backed retrieval", () => {
    expect(buildGraphitiNeo4jSearchQuery()).toContain("MATCH (mission:VikiMission)");
    expect(buildGraphitiNeo4jSearchQuery()).toContain("LIMIT $limit");
  });
});
