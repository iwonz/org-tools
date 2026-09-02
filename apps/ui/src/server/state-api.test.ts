import { describe, expect, it } from "vitest";

import { assertStateApiRequest, parseStateCreateNewRequest } from "@/server/state-api";

describe("state recovery API", () => {
  it("accepts only the exact create-new action", () => {
    expect(parseStateCreateNewRequest({ action: "create_new" })).toEqual({
      action: "create_new",
    });
    expect(() => parseStateCreateNewRequest({ action: "create_new", extra: true })).toThrowError(
      expect.objectContaining({ code: "invalid_input" }),
    );
    expect(() => parseStateCreateNewRequest({ action: "reset" })).toThrowError(
      expect.objectContaining({ code: "invalid_input" }),
    );
  });

  it("requires JSON and a matching loopback origin for mutations", () => {
    const valid = new Request("http://127.0.0.1:3000/api/state", {
      headers: {
        "content-type": "application/json",
        host: "127.0.0.1:3000",
        origin: "http://127.0.0.1:3000",
      },
      method: "POST",
    });
    expect(() => assertStateApiRequest(valid, true)).not.toThrow();

    const remote = new Request("http://127.0.0.1:3000/api/state", {
      headers: {
        "content-type": "application/json",
        host: "127.0.0.1:3000",
        origin: "https://example.test",
      },
      method: "POST",
    });
    expect(() => assertStateApiRequest(remote, true)).toThrowError(
      expect.objectContaining({ code: "invalid_input" }),
    );
  });
});
