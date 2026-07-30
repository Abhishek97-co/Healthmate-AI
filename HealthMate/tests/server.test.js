import { describe, it, expect } from "vitest";
import http from "node:http";
import app from "../server";

describe("Server Tests", () => {
  it("GET / serves the frontend index page", async () => {
    const server = app.listen(0);

    try {
      await new Promise((resolve) => server.once("listening", resolve));

      const { port } = server.address();
      const response = await new Promise((resolve, reject) => {
        http.get({ hostname: "127.0.0.1", port, path: "/" }, (res) => {
          let data = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => { data += chunk; });
          res.on("end", () => resolve({ statusCode: res.statusCode, body: data }));
        }).on("error", reject);
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatch(/<div id="root">/i);
    } finally {
      await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    }
  });
});
