import { beforeEach, describe, expect, it, vi } from "vitest";
import { withRemoteHttpResponse } from "./remote-http.js";

vi.mock("./remote-http.js", () => ({
  withRemoteHttpResponse: vi.fn(),
}));

describe("postJson", () => {
  const remoteHttpMock = vi.mocked(withRemoteHttpResponse);
  let postJson: typeof import("./post-json.js").postJson;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    ({ postJson } = await import("./post-json.js"));
  });

  it("parses JSON payload on successful response", async () => {
    remoteHttpMock.mockImplementationOnce(async (params) => {
      return await params.onResponse(
        new Response(JSON.stringify({ data: [{ embedding: [1, 2] }] }), { status: 200 }),
      );
    });

    const result = await postJson({
      url: "https://memory.example/v1/post",
      headers: { Authorization: "Bearer test" },
      body: { input: ["x"] },
      errorPrefix: "post failed",
      parse: (payload) => payload,
    });

    expect(result).toEqual({ data: [{ embedding: [1, 2] }] });
  });

  it("attaches status to thrown error when requested", async () => {
    remoteHttpMock.mockImplementationOnce(async (params) => {
      return await params.onResponse(new Response("bad gateway", { status: 502 }));
    });

    await expect(
      postJson({
        url: "https://memory.example/v1/post",
        headers: {},
        body: {},
        errorPrefix: "post failed",
        attachStatus: true,
        parse: () => ({}),
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("post failed: 502 bad gateway"),
      status: 502,
    });
  });
});
