import "./isolated-agent.mocks.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { withTempCronHome, writeSessionStore } from "./isolated-agent.test-harness.js";

let runSubagentAnnounceFlow: typeof import("../agents/subagent-announce.js").runSubagentAnnounceFlow;
let createCliDeps: typeof import("./isolated-agent.delivery.test-helpers.js").createCliDeps;
let expectDirectTelegramDelivery: typeof import("./isolated-agent.delivery.test-helpers.js").expectDirectTelegramDelivery;
let mockAgentPayloads: typeof import("./isolated-agent.delivery.test-helpers.js").mockAgentPayloads;
let runTelegramAnnounceTurn: typeof import("./isolated-agent.delivery.test-helpers.js").runTelegramAnnounceTurn;
let setupIsolatedAgentTurnMocks: typeof import("./isolated-agent.test-setup.js").setupIsolatedAgentTurnMocks;

describe("runCronIsolatedAgentTurn forum topic delivery", () => {
  beforeEach(async () => {
    vi.resetModules();
    await import("./isolated-agent.mocks.js");
    ({ runSubagentAnnounceFlow } = await import("../agents/subagent-announce.js"));
    ({ createCliDeps, expectDirectTelegramDelivery, mockAgentPayloads, runTelegramAnnounceTurn } =
      await import("./isolated-agent.delivery.test-helpers.js"));
    ({ setupIsolatedAgentTurnMocks } = await import("./isolated-agent.test-setup.js"));
    setupIsolatedAgentTurnMocks();
  });

  it("routes forum-topic and plain telegram targets through the correct delivery path", async () => {
    await withTempCronHome(async (home) => {
      const storePath = await writeSessionStore(home, { lastProvider: "webchat", lastTo: "" });
      const deps = createCliDeps();
      mockAgentPayloads([{ text: "forum message" }]);

      const res = await runTelegramAnnounceTurn({
        home,
        storePath,
        deps,
        delivery: { mode: "announce", channel: "telegram", to: "123:topic:42" },
      });

      expect(res.status).toBe("ok");
      expect(res.delivered).toBe(true);
      expect(runSubagentAnnounceFlow).not.toHaveBeenCalled();
      expectDirectTelegramDelivery(deps, {
        chatId: "123",
        text: "forum message",
        messageThreadId: 42,
      });

      vi.clearAllMocks();
      mockAgentPayloads([{ text: "plain message" }]);

      const plainRes = await runTelegramAnnounceTurn({
        home,
        storePath,
        deps,
        delivery: { mode: "announce", channel: "telegram", to: "123" },
      });

      expect(plainRes.status).toBe("ok");
      expect(plainRes.delivered).toBe(true);
      expect(runSubagentAnnounceFlow).not.toHaveBeenCalled();
      expectDirectTelegramDelivery(deps, {
        chatId: "123",
        text: "plain message",
      });
    });
  });
});
