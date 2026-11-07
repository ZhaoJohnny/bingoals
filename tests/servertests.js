import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { DateTime } from "luxon";
import { io as ioClient } from "socket.io-client";


// ---------------------------------------------------------------------------
// Hoisted mocks + env (must exist before server.js is imported)
// ---------------------------------------------------------------------------
const mocks = vi.hoisted(() => {
  process.env.JWT_SECRET = "test-secret";
  process.env.FRONTEND_URL = "http://frontend.test";
  process.env.BACKEND_URL = "http://backend.test";
  process.env.EMAIL_USER = "bot@test.com";
  process.env.EMAIL_PASS = "pw";
  return {
    query: vi.fn(),
    connect: vi.fn(),
    sendMail: vi.fn(),
    hash: vi.fn(),
    compare: vi.fn(),
  };
});

vi.mock("pg", () => {
  class Pool {
    query = mocks.query;
    connect = mocks.connect;
  }
  return { default: { Pool } };
});
vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: mocks.sendMail }) },
}));
vi.mock("bcrypt", () => ({
  default: { hash: mocks.hash, compare: mocks.compare },
}));

const {
  app,
  server,
  io,
  countdownTimers,
  authenticateToken,
  getVancouverEndDate,
  checkAndEndExpiredBoard,
} = await import("./server.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SECRET = "test-secret";
const auth = (id = 1) => ({
  Authorization: `Bearer ${jwt.sign({ id, email: `u${id}@test.com` }, SECRET)}`,
});

/** SQL-regex router: BEGIN/COMMIT/ROLLBACK are auto-handled; unmatched => {rows: []} */
const route = (mock, routes) =>
  mock.mockImplementation(async (sql, params) => {
    if (/^\s*(BEGIN|COMMIT|ROLLBACK)/i.test(sql)) return { rows: [] };
    for (const [re, res] of routes) {
      if (re.test(sql)) return typeof res === "function" ? res(sql, params) : res;
    }
    return { rows: [], rowCount: 0 };
  });

const rows = (...r) => ({ rows: r });
const future = () => new Date(Date.now() + 86_400_000);
const past = () => new Date(Date.now() - 86_400_000);
const boardCheck = (status = "playing", ends_at = future()) => [
  /SELECT id, status, ends_at/,
  rows({ id: 1, status, ends_at }),
];
const boardMissing = [/SELECT id, status, ends_at/, rows()];
const boardEnded = boardCheck("ended");

let client;
let emit;
const pq = (routes) => route(mocks.query, routes);
const cq = (routes) => route(client.query, routes);
const called = (mock, re) => mock.mock.calls.some(([sql]) => re.test(sql));

beforeEach(() => {
  mocks.query.mockReset();
  mocks.connect.mockReset();
  mocks.sendMail.mockReset();
  mocks.hash.mockReset().mockResolvedValue("hashed-pw");
  mocks.compare.mockReset();
  client = { query: vi.fn(), release: vi.fn() };
  mocks.connect.mockResolvedValue(client);
  pq([]);
  cq([]);
  emit = vi.fn();
  vi.spyOn(io, "to").mockReturnValue({ emit });
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  countdownTimers.forEach((t) => clearTimeout(t));
  countdownTimers.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// getVancouverEndDate
// ---------------------------------------------------------------------------
describe("getVancouverEndDate", () => {
  it("returns a Date", () => {
    expect(getVancouverEndDate()).toBeInstanceOf(Date);
  });

  it("is Dec 31, 23:59:59 in America/Vancouver of the current year", () => {
    const d = DateTime.fromJSDate(getVancouverEndDate()).setZone("America/Vancouver");
    expect(d.month).toBe(12);
    expect(d.day).toBe(31);
    expect(d.hour).toBe(23);
    expect(d.minute).toBe(59);
    expect(d.second).toBe(59);
    expect(d.year).toBe(DateTime.now().setZone("America/Vancouver").year);
  });

  it("is in the future", () => {
    expect(getVancouverEndDate().getTime()).toBeGreaterThan(Date.now());
  });
});

// ---------------------------------------------------------------------------
// authenticateToken
// ---------------------------------------------------------------------------
describe("authenticateToken", () => {
  const mockRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  it("401 when no Authorization header", () => {
    const res = mockRes();
    const next = vi.fn();
    authenticateToken({ headers: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401 when header has no token part", () => {
    const res = mockRes();
    const next = vi.fn();
    authenticateToken({ headers: { authorization: "Bearer" } }, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("403 for a malformed token", () => {
    const res = mockRes();
    const next = vi.fn();
    authenticateToken({ headers: { authorization: "Bearer garbage" } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("403 for a token signed with the wrong secret", () => {
    const bad = jwt.sign({ id: 1 }, "other-secret");
    const res = mockRes();
    const next = vi.fn();
    authenticateToken({ headers: { authorization: `Bearer ${bad}` } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("403 for an expired token", () => {
    const expired = jwt.sign({ id: 1 }, SECRET, { expiresIn: -10 });
    const res = mockRes();
    const next = vi.fn();
    authenticateToken({ headers: { authorization: `Bearer ${expired}` } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("sets req.user and calls next() for a valid token", () => {
    const token = jwt.sign({ id: 7, email: "a@b.com" }, SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = vi.fn();
    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ id: 7, email: "a@b.com" });
  });
});

// ---------------------------------------------------------------------------
// checkAndEndExpiredBoard
// ---------------------------------------------------------------------------
describe("checkAndEndExpiredBoard", () => {
  it("returns exists:false when board is missing", async () => {
    pq([boardMissing]);
    expect(await checkAndEndExpiredBoard(1)).toEqual({
      exists: false,
      ended: false,
      status: null,
    });
  });

  it("does nothing for an active, unexpired board", async () => {
    pq([boardCheck("playing", future())]);
    const r = await checkAndEndExpiredBoard(1);
    expect(r).toEqual({ exists: true, ended: false, status: "playing" });
    expect(called(mocks.query, /UPDATE boards/)).toBe(false);
    expect(emit).not.toHaveBeenCalled();
  });

  it("reports an already-ended board without updating", async () => {
    pq([boardCheck("ended", past())]);
    const r = await checkAndEndExpiredBoard(1);
    expect(r).toEqual({ exists: true, ended: true, status: "ended" });
    expect(called(mocks.query, /UPDATE boards/)).toBe(false);
  });

  it("ends an expired board and emits status-updated + board-updated", async () => {
    pq([
      boardCheck("playing", past()),
      [/FROM marker/, rows({ player_id: 3, marked_count: "4" })],
      [/UPDATE boards/, rows({ status: "ended" })],
    ]);
    const r = await checkAndEndExpiredBoard(1);
    expect(r).toEqual({ exists: true, ended: true, status: "ended" });
    expect(io.to).toHaveBeenCalledWith("board-1");
    expect(emit).toHaveBeenCalledWith("status-updated", { boardID: 1, status: "ended" });
    expect(emit).toHaveBeenCalledWith("board-updated", { boardID: 1 });
  });
});

// ---------------------------------------------------------------------------
// Socket.IO handlers
// ---------------------------------------------------------------------------
describe("socket.io", () => {
  let port;
  let socket;
  beforeAll(async () => {
    await new Promise((r) => server.listen(0, r));
    port = server.address().port;
  });
  afterAll(async () => {
    await new Promise((r) => server.close(r));
  });
  beforeEach(() => {
    vi.mocked(io.to).mockRestore(); // use the real room emitter here
  });
  afterEach(() => socket?.disconnect());

  const connect = () =>
    new Promise((resolve) => {
      socket = ioClient(`http://localhost:${port}`, { transports: ["websocket"] });
      socket.on("connect", () => resolve(socket));
    });

  it("join-board puts the socket in the board room", async () => {
    await connect();
    socket.emit("join-board", 42);
    await new Promise((r) => setTimeout(r, 100));
    const got = new Promise((resolve) => socket.on("ping-test", resolve));
    io.to("board-42").emit("ping-test", { ok: true });
    expect(await got).toEqual({ ok: true });
  });

  it("does not receive events for rooms it has not joined", async () => {
    await connect();
    socket.emit("join-board", 1);
    await new Promise((r) => setTimeout(r, 100));
    const spy = vi.fn();
    socket.on("ping-test", spy);
    io.to("board-2").emit("ping-test", {});
    await new Promise((r) => setTimeout(r, 100));
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GET /
// ---------------------------------------------------------------------------
describe("GET /", () => {
  it("responds that the server is working", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("Server is working");
  });
});

// ---------------------------------------------------------------------------
// POST /api/register   (NOTE: source currently has the typo "/api/ ")
// ---------------------------------------------------------------------------
describe("POST /api/register", () => {
  const body = { name: "Ann", email: "ann@test.com", password: "pw123" };
  const happyRoutes = () => [
    [/SELECT id FROM users WHERE email/, rows()],
    [/INSERT INTO users/, rows({ id: 1, name: "Ann", email: "ann@test.com" })],
    [
      /SELECT id, name, email, password FROM users/,
      rows({ id: 1, name: "Ann", email: "ann@test.com", password: "hashed-pw" }),
    ],
  ];

  it.each([
    [{ email: "a@b.c", password: "x" }],
    [{ name: "a", password: "x" }],
    [{ name: "a", email: "a@b.c" }],
    [{}],
  ])("400 when a required field is missing: %j", async (payload) => {
    const res = await request(app).post("/api/register").send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it("409 when the email already exists", async () => {
    pq([[/SELECT id FROM users WHERE email/, rows({ id: 9 })]]);
    const res = await request(app).post("/api/register").send(body);
    expect(res.status).toBe(409);
    expect(called(mocks.query, /INSERT INTO users/)).toBe(false);
  });

  it("creates the user with a hashed password and unverified status", async () => {
    pq(happyRoutes());
    await request(app).post("/api/register").send(body);
    expect(mocks.hash).toHaveBeenCalledWith("pw123", 10);
    const insert = mocks.query.mock.calls.find(([s]) => /INSERT INTO users/.test(s));
    const [name, email, hash, verified, token, expires] = insert[1];
    expect([name, email, hash, verified]).toEqual(["Ann", "ann@test.com", "hashed-pw", false]);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(expires.getTime()).toBeGreaterThan(Date.now());
    expect(expires.getTime()).toBeLessThanOrEqual(Date.now() + 3_600_000);
  });

  it("sends a verification email containing the token link", async () => {
    pq(happyRoutes());
    await request(app).post("/api/register").send(body);
    expect(mocks.sendMail).toHaveBeenCalledOnce();
    const mail = mocks.sendMail.mock.calls[0][0];
    expect(mail.to).toBe("ann@test.com");
    expect(mail.html).toContain("http://backend.test/api/verify-email/");
  });

  it("returns a JWT and user, and never leaks the password", async () => {
    pq(happyRoutes());
    const res = await request(app).post("/api/register").send(body);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(jwt.verify(res.body.token, SECRET)).toMatchObject({ id: 1, email: "ann@test.com" });
    expect(res.body.user).toEqual({ id: 1, name: "Ann", email: "ann@test.com" });
    expect(JSON.stringify(res.body)).not.toContain("hashed-pw");
  });

  it("500 when the database fails", async () => {
    mocks.query.mockRejectedValue(new Error("db down"));
    const res = await request(app).post("/api/register").send(body);
    expect(res.status).toBe(500);
  });

  it("500 when the email cannot be sent", async () => {
    pq(happyRoutes());
    mocks.sendMail.mockRejectedValue(new Error("smtp"));
    const res = await request(app).post("/api/register").send(body);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/verify-email/:token
// ---------------------------------------------------------------------------
describe("GET /api/verify-email/:token", () => {
  it("redirects with reason=invalid for unknown token", async () => {
    pq([[/FROM users\s+WHERE verification_token/, rows()]]);
    const res = await request(app).get("/api/verify-email/nope");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("http://frontend.test/login?verified=false&reason=invalid");
  });

  it("redirects with reason=expired for an expired token", async () => {
    pq([
      [/FROM users\s+WHERE verification_token/, rows({ id: 1, verification_token_expires: past() })],
    ]);
    const res = await request(app).get("/api/verify-email/tok");
    expect(res.headers.location).toBe("http://frontend.test/login?verified=false&reason=expired");
    expect(called(mocks.query, /UPDATE users/)).toBe(false);
  });

  it("verifies the user and redirects with verified=true", async () => {
    pq([
      [/FROM users\s+WHERE verification_token/, rows({ id: 5, verification_token_expires: future() })],
    ]);
    const res = await request(app).get("/api/verify-email/tok");
    expect(res.headers.location).toBe("http://frontend.test/login?verified=true");
    const upd = mocks.query.mock.calls.find(([s]) => /UPDATE users/.test(s));
    expect(upd[0]).toMatch(/email_verified = true/);
    expect(upd[0]).toMatch(/verification_token = NULL/);
    expect(upd[1]).toEqual([5]);
  });

  it("redirects with reason=server on DB error", async () => {
    mocks.query.mockRejectedValue(new Error("boom"));
    const res = await request(app).get("/api/verify-email/tok");
    expect(res.headers.location).toBe("http://frontend.test/login?verified=false&reason=server");
  });
});

// ---------------------------------------------------------------------------
// POST /api/login
// ---------------------------------------------------------------------------
describe("POST /api/login", () => {
  const userRow = (extra = {}) =>
    rows({ id: 1, name: "Ann", email: "ann@test.com", password: "hashed-pw", email_verified: true, ...extra });

  it("404 when the user does not exist", async () => {
    pq([[/FROM users WHERE email/, rows()]]);
    const res = await request(app).post("/api/login").send({ email: "x@y.z", password: "p" });
    expect(res.status).toBe(404);
  });

  it("403 when the email is not verified", async () => {
    pq([[/FROM users WHERE email/, userRow({ email_verified: false })]]);
    const res = await request(app).post("/api/login").send({ email: "ann@test.com", password: "p" });
    expect(res.status).toBe(403);
    expect(mocks.compare).not.toHaveBeenCalled();
  });

  it("401 on wrong password", async () => {
    pq([[/FROM users WHERE email/, userRow()]]);
    mocks.compare.mockResolvedValue(false);
    const res = await request(app).post("/api/login").send({ email: "ann@test.com", password: "bad" });
    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  it("200 with token + user on success", async () => {
    pq([[/FROM users WHERE email/, userRow()]]);
    mocks.compare.mockResolvedValue(true);
    const res = await request(app).post("/api/login").send({ email: "ann@test.com", password: "pw" });
    expect(res.status).toBe(200);
    expect(mocks.compare).toHaveBeenCalledWith("pw", "hashed-pw");
    expect(jwt.verify(res.body.token, SECRET)).toMatchObject({ id: 1, email: "ann@test.com" });
    expect(res.body.user).toEqual({ id: 1, name: "Ann", email: "ann@test.com" });
    expect(res.body.user.password).toBeUndefined();
  });

  it("500 on DB error", async () => {
    mocks.query.mockRejectedValue(new Error("x"));
    const res = await request(app).post("/api/login").send({ email: "a", password: "b" });
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/boards
// ---------------------------------------------------------------------------
describe("GET /api/boards", () => {
  it("401 without a token", async () => {
    expect((await request(app).get("/api/boards")).status).toBe(401);
  });

  it("returns the boards the user plays on", async () => {
    pq([[/FROM boards JOIN players/, rows({ id: 1 }, { id: 2 })]]);
    const res = await request(app).get("/api/boards").set(auth(4));
    expect(res.status).toBe(200);
    expect(res.body.boards).toEqual([{ id: 1 }, { id: 2 }]);
    expect(mocks.query.mock.calls[0][1]).toEqual([4]);
  });

  it("500 on DB error", async () => {
    mocks.query.mockRejectedValue(new Error("x"));
    expect((await request(app).get("/api/boards").set(auth())).status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/board/:boardID/square/:index/bingo-square
// ---------------------------------------------------------------------------
describe("POST /api/board/:boardID/square/:index/bingo-square", () => {
  const url = "/api/board/1/square/3/bingo-square";
  const happy = () => {
    pq([boardCheck("creation")]);
    cq([
      [/SELECT player_id FROM squares/, rows({ player_id: 1 })],
      [/SELECT status FROM boards/, rows({ status: "creation" })],
      [/UPDATE squares SET goal/, rows({ id: 10, goal: "Run 5k" })],
    ]);
  };

  it("401 without token", async () => {
    expect((await request(app).post(url).send({ content: "x" })).status).toBe(401);
  });

  it("404 when board does not exist", async () => {
    pq([boardMissing]);
    expect((await request(app).post(url).set(auth()).send({ content: "x" })).status).toBe(404);
  });

  it("400 when the game has ended", async () => {
    pq([boardEnded]);
    const res = await request(app).post(url).set(auth()).send({ content: "x" });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe("ended");
  });

  it("404 when the square isn't assigned to anyone", async () => {
    pq([boardCheck("creation")]);
    cq([[/SELECT player_id FROM squares/, rows()]]);
    const res = await request(app).post(url).set(auth()).send({ content: "x" });
    expect(res.status).toBe(404);
    expect(client.release).toHaveBeenCalled();
  });

  it("403 when the user is not the assigned player", async () => {
    pq([boardCheck("creation")]);
    cq([[/SELECT player_id FROM squares/, rows({ player_id: 99 })]]);
    const res = await request(app).post(url).set(auth(1)).send({ content: "x" });
    expect(res.status).toBe(403);
    expect(called(client.query, /UPDATE squares/)).toBe(false);
  });

  it("400 when board is not in creation status", async () => {
    pq([boardCheck("lobby")]);
    cq([
      [/SELECT player_id FROM squares/, rows({ player_id: 1 })],
      [/SELECT status FROM boards/, rows({ status: "lobby" })],
    ]);
    const res = await request(app).post(url).set(auth()).send({ content: "x" });
    expect(res.status).toBe(400);
  });

  it("404 when the UPDATE touches no row", async () => {
    pq([boardCheck("creation")]);
    cq([
      [/SELECT player_id FROM squares/, rows({ player_id: 1 })],
      [/SELECT status FROM boards/, rows({ status: "creation" })],
      [/UPDATE squares SET goal/, rows()],
    ]);
    expect((await request(app).post(url).set(auth()).send({ content: "x" })).status).toBe(404);
  });

  it("saves the goal, commits, emits board-updated and releases the client", async () => {
    happy();
    const res = await request(app).post(url).set(auth()).send({ content: "Run 5k" });
    expect(res.status).toBe(200);
    expect(res.body.square).toEqual({ id: 10, goal: "Run 5k" });
    const upd = client.query.mock.calls.find(([s]) => /UPDATE squares SET goal/.test(s));
    expect(upd[1]).toEqual(["Run 5k", "1", "3"]);
    expect(called(client.query, /COMMIT/)).toBe(true);
    expect(emit).toHaveBeenCalledWith("board-updated", { boardID: "1" });
    expect(client.release).toHaveBeenCalled();
  });

  it("500 + ROLLBACK when a query fails", async () => {
    pq([boardCheck("creation")]);
    cq([
      [
        /SELECT player_id FROM squares/,
        () => {
          throw new Error("db");
        },
      ],
    ]);
    const res = await request(app).post(url).set(auth()).send({ content: "x" });
    expect(res.status).toBe(500);
    expect(called(client.query, /ROLLBACK/)).toBe(true);
    expect(client.release).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /api/create-game
// ---------------------------------------------------------------------------
describe("POST /api/create-game", () => {
  const happy = () =>
    cq([
      [/SELECT id FROM boards WHERE code/, rows()],
      [/INSERT INTO boards/, rows({ id: 8, code: "ABC123", ends_at: future() })],
    ]);

  it("401 without token", async () => {
    expect((await request(app).post("/api/create-game").send({})).status).toBe(401);
  });

  it("creates board + registers host as player", async () => {
    happy();
    const res = await request(app).post("/api/create-game").set(auth(2)).send({ title: "My Goals" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, boardID: 8, code: "ABC123", title: "My Goals" });
    const boardInsert = client.query.mock.calls.find(([s]) => /INSERT INTO boards/.test(s));
    expect(boardInsert[1][0]).toBe(2);
    expect(boardInsert[1][1]).toMatch(/^[A-Z0-9]{1,6}$/);
    expect(boardInsert[1][2]).toBeInstanceOf(Date);
    const playerInsert = client.query.mock.calls.find(([s]) => /INSERT INTO players/.test(s));
    expect(playerInsert[1]).toEqual([2, 8]);
    expect(called(client.query, /COMMIT/)).toBe(true);
    expect(client.release).toHaveBeenCalled();
  });

  it("defaults the title when none is provided", async () => {
    happy();
    const res = await request(app).post("/api/create-game").set(auth(2)).send({});
    expect(res.body.title).toBe("2's Board");
  });

  // Fails until `const existingCode` in server.js is changed to `let`
  it("retries when the generated code already exists", async () => {
    let n = 0;
    cq([
      [/SELECT id FROM boards WHERE code/, () => (n++ === 0 ? rows({ id: 1 }) : rows())],
      [/INSERT INTO boards/, rows({ id: 8, code: "ZZZ999", ends_at: future() })],
    ]);
    const res = await request(app).post("/api/create-game").set(auth()).send({});
    expect(res.status).toBe(200);
    expect(n).toBeGreaterThanOrEqual(2);
  });

  it("500 + ROLLBACK on failure", async () => {
    cq([
      [
        /INSERT INTO boards/,
        () => {
          throw new Error("db");
        },
      ],
    ]);
    const res = await request(app).post("/api/create-game").set(auth()).send({});
    expect(res.status).toBe(500);
    expect(called(client.query, /ROLLBACK/)).toBe(true);
    expect(client.release).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /api/board/:code/join
// ---------------------------------------------------------------------------
describe("POST /api/board/:code/join", () => {
  it("401 without token", async () => {
    expect((await request(app).post("/api/board/ABC/join")).status).toBe(401);
  });

  it("404 for unknown code", async () => {
    pq([[/SELECT \* FROM boards WHERE code/, rows()]]);
    expect((await request(app).post("/api/board/NOPE/join").set(auth())).status).toBe(404);
  });

  it("400 when the game has already started", async () => {
    pq([[/SELECT \* FROM boards WHERE code/, rows({ id: 3, status: "playing" })]]);
    const res = await request(app).post("/api/board/ABC/join").set(auth());
    expect(res.status).toBe(400);
    expect(called(mocks.query, /INSERT INTO players/)).toBe(false);
  });

  it("adds the player and emits players-updated", async () => {
    pq([
      [/SELECT \* FROM boards WHERE code/, rows({ id: 3, status: "lobby" })],
      [/INSERT INTO players/, rows({ user_id: 2, board_id: 3, ready: false })],
    ]);
    const res = await request(app).post("/api/board/ABC/join").set(auth(2));
    expect(res.status).toBe(200);
    expect(res.body.boardID).toBe(3);
    expect(res.body.player).toMatchObject({ user_id: 2, board_id: 3 });
    expect(emit).toHaveBeenCalledWith("players-updated", expect.objectContaining({ boardID: 3 }));
  });

  it("500 on DB error", async () => {
    mocks.query.mockRejectedValue(new Error("x"));
    expect((await request(app).post("/api/board/ABC/join").set(auth())).status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/board/:boardID/finish-creation
// ---------------------------------------------------------------------------
describe("PUT /api/board/:boardID/finish-creation", () => {
  const url = "/api/board/1/finish-creation";
  const filled = [
    { id: 1, index: 0, goal: "a" },
    { id: 2, index: 1, goal: "b" },
  ];
  const setup = ({ ready = false, status = "creation", squares = filled, players }) =>
    cq([
      [/SELECT ready FROM players/, rows({ ready })],
      [/SELECT status FROM boards/, rows({ status })],
      [/SELECT id, index, goal FROM squares/, { rows: squares }],
      [/SELECT user_id, ready FROM players/, { rows: players }],
    ]);

  it("403 when user is not on the board", async () => {
    cq([[/SELECT ready FROM players/, rows()]]);
    const res = await request(app).put(url).set(auth());
    expect(res.status).toBe(403);
    expect(called(client.query, /ROLLBACK/)).toBe(true);
  });

  it("404 when board does not exist", async () => {
    cq([
      [/SELECT ready FROM players/, rows({ ready: false })],
      [/SELECT status FROM boards/, rows()],
    ]);
    expect((await request(app).put(url).set(auth())).status).toBe(404);
  });

  it("rejects when board is not in creation mode", async () => {
    setup({ status: "lobby", players: [] });
    const res = await request(app).put(url).set(auth());
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/creation/);
  });

  it("404 when the player has no squares", async () => {
    setup({ squares: [], players: [] });
    expect((await request(app).put(url).set(auth())).status).toBe(404);
  });

  it.each([[""], ["   "], [null]])("400 when a square goal is empty (%j)", async (goal) => {
    setup({ squares: [{ id: 1, index: 4, goal }], players: [] });
    const res = await request(app).put(url).set(auth());
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("index 4");
    expect(called(client.query, /UPDATE players SET ready/)).toBe(false);
  });

  it("toggles ready and reports end:false when someone isn't ready", async () => {
    setup({
      players: [
        { user_id: 1, ready: true },
        { user_id: 2, ready: false },
      ],
    });
    const res = await request(app).put(url).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.end).toBe(false);
    expect(called(client.query, /UPDATE players SET ready = NOT ready/)).toBe(true);
    expect(emit).toHaveBeenCalledWith("players-updated", { boardID: "1" });
    expect(countdownTimers.size).toBe(0);
  });

  it("starts a countdown when everyone is ready, then flips board to playing", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    setup({
      players: [
        { user_id: 1, ready: true },
        { user_id: 2, ready: true },
      ],
    });
    mocks.query.mockImplementation(async (sql) =>
      /UPDATE boards\s+SET status = 'playing'/.test(sql) ? rows({ status: "playing" }) : { rows: [] },
    );

    const res = await request(app).put(url).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("creation");
    expect(emit).toHaveBeenCalledWith("countdown-started", { boardID: "1", seconds: 5 });
    expect(countdownTimers.has("1")).toBe(true);

    await vi.advanceTimersByTimeAsync(5000);
    expect(emit).toHaveBeenCalledWith("board-updated", { boardID: "1", status: "playing" });
  });

  it("doesn't start a second countdown if one is already running", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    countdownTimers.set("1", setTimeout(() => {}, 10_000));
    setup({
      players: [
        { user_id: 1, ready: true },
        { user_id: 2, ready: true },
      ],
    });
    const res = await request(app).put(url).set(auth());
    expect(res.body.message).toMatch(/already started/i);
    expect(emit).not.toHaveBeenCalledWith("countdown-started", expect.anything());
  });

  it("un-readying cancels a running countdown", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    countdownTimers.set("1", setTimeout(() => {}, 10_000));
    setup({
      ready: true,
      players: [
        { user_id: 1, ready: false },
        { user_id: 2, ready: true },
      ],
    });
    const res = await request(app).put(url).set(auth());
    expect(res.status).toBe(200);
    expect(countdownTimers.has("1")).toBe(false);
    expect(emit).toHaveBeenCalledWith("countdown-cancelled", { boardID: "1" });
  });

  it("400 when no players are found after toggling", async () => {
    setup({ players: [] });
    expect((await request(app).put(url).set(auth())).status).toBe(400);
  });

  it("500 on DB error and releases the client", async () => {
    client.query.mockRejectedValue(new Error("x"));
    const res = await request(app).put(url).set(auth());
    expect(res.status).toBe(500);
    expect(client.release).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GET /api/board/:boardID
// ---------------------------------------------------------------------------
describe("GET /api/board/:boardID", () => {
  it("401 without token", async () => {
    expect((await request(app).get("/api/board/1")).status).toBe(401);
  });

  it("403 when the user is not a player", async () => {
    pq([
      [/SELECT \* FROM boards WHERE id/, rows({ id: 1 })],
      [/SELECT \* FROM players/, rows()],
    ]);
    expect((await request(app).get("/api/board/1").set(auth())).status).toBe(403);
  });

  it("404 when the board does not exist", async () => {
    pq([
      [/SELECT \* FROM boards WHERE id/, rows()],
      [/SELECT \* FROM players/, rows({ user_id: 1 })],
    ]);
    expect((await request(app).get("/api/board/1").set(auth())).status).toBe(404);
  });

  it("returns mapped cells including marked and isOwner flags", async () => {
    pq([
      [/SELECT \* FROM boards WHERE id/, rows({ id: 1, title: "T", code: "ABC" })],
      [/SELECT \* FROM players/, rows({ user_id: 1 })],
      [
        /FROM squares\s+LEFT JOIN marker/,
        rows(
          { id: 10, index: 0, goal: "a", player_id: 1, marked: true },
          { id: 11, index: 1, goal: "b", player_id: 2, marked: false },
        ),
      ],
    ]);
    const res = await request(app).get("/api/board/1").set(auth(1));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ boardID: 1, title: "T", code: "ABC" });
    expect(res.body.cells).toEqual([
      { squareId: 10, index: 0, content: "a", marked: true, isOwner: true },
      { squareId: 11, index: 1, content: "b", marked: false, isOwner: false },
    ]);
  });

  it("500 on DB error", async () => {
    mocks.query.mockRejectedValue(new Error("x"));
    expect((await request(app).get("/api/board/1").set(auth())).status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/board/:boardID/status
// ---------------------------------------------------------------------------
describe("GET /api/board/:boardID/status", () => {
  it("404 when board is missing", async () => {
    pq([[/SELECT status FROM boards/, rows()]]);
    expect((await request(app).get("/api/board/1/status").set(auth())).status).toBe(404);
  });

  it("403 when user is not a player", async () => {
    pq([
      [/SELECT status FROM boards/, rows({ status: "lobby" })],
      [/SELECT \* FROM players/, rows()],
    ]);
    expect((await request(app).get("/api/board/1/status").set(auth())).status).toBe(403);
  });

  it("returns the status", async () => {
    pq([
      [/SELECT status FROM boards/, rows({ status: "playing" })],
      [/SELECT \* FROM players/, rows({ user_id: 1 })],
    ]);
    const res = await request(app).get("/api/board/1/status").set(auth());
    expect(res.body).toEqual({ success: true, status: "playing" });
  });

  it("500 on DB error", async () => {
    mocks.query.mockRejectedValue(new Error("x"));
    expect((await request(app).get("/api/board/1/status").set(auth())).status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/board/:boardID/bingo
// ---------------------------------------------------------------------------
describe("PUT /api/board/:boardID/bingo", () => {
  const url = "/api/board/1/bingo";
  const counts = (squares, markers) =>
    cq([
      [/COUNT\(\*\) FROM squares/, rows({ count: String(squares) })],
      [/COUNT\(\*\) FROM marker/, rows({ count: String(markers) })],
      [
        /UPDATE boards SET status = 'ended'/,
        rows({ id: 1, status: "ended", winner_id: 1, ended_at: new Date() }),
      ],
    ]);

  it("404 when board is missing", async () => {
    pq([boardMissing]);
    expect((await request(app).put(url).set(auth())).status).toBe(404);
  });

  it("400 when game already ended", async () => {
    pq([boardEnded]);
    const res = await request(app).put(url).set(auth());
    expect(res.status).toBe(400);
    expect(res.body.status).toBe("ended");
  });

  it("400 when player hasn't marked every square", async () => {
    pq([boardCheck()]);
    counts(25, 24);
    const res = await request(app).put(url).set(auth());
    expect(res.status).toBe(400);
    expect(called(client.query, /UPDATE boards SET status = 'ended'/)).toBe(false);
  });

  it("ends the game with the caller as winner", async () => {
    pq([boardCheck()]);
    counts(25, 25);
    const res = await request(app).put(url).set(auth(1));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ended");
    expect(res.body.board.winner_id).toBe(1);
    const upd = client.query.mock.calls.find(([s]) => /UPDATE boards SET status = 'ended'/.test(s));
    expect(upd[1]).toEqual([1, "1"]);
    expect(emit).toHaveBeenCalledWith("board-updated", { boardID: "1" });
    expect(client.release).toHaveBeenCalled();
  });

  it("404 when the UPDATE returns no board", async () => {
    pq([boardCheck()]);
    cq([
      [/COUNT\(\*\) FROM squares/, rows({ count: "25" })],
      [/COUNT\(\*\) FROM marker/, rows({ count: "25" })],
      [/UPDATE boards SET status = 'ended'/, rows()],
    ]);
    expect((await request(app).put(url).set(auth())).status).toBe(404);
  });

  it("500 + ROLLBACK on DB error", async () => {
    pq([boardCheck()]);
    cq([
      [
        /COUNT\(\*\) FROM squares/,
        () => {
          throw new Error("db");
        },
      ],
    ]);
    const res = await request(app).put(url).set(auth());
    expect(res.status).toBe(500);
    expect(called(client.query, /ROLLBACK/)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/board/:boardID/square/:index/toggle-marker
// ---------------------------------------------------------------------------
describe("POST .../toggle-marker", () => {
  const url = "/api/board/1/square/2/toggle-marker";

  it("404 when board is missing", async () => {
    pq([boardMissing]);
    expect((await request(app).post(url).set(auth())).status).toBe(404);
  });

  it("400 when board has ended", async () => {
    pq([boardEnded]);
    const res = await request(app).post(url).set(auth());
    expect(res.status).toBe(400);
    expect(res.body.status).toBe("ended");
  });

  it("404 when square is missing", async () => {
    pq([boardCheck()]);
    cq([[/SELECT id FROM squares/, rows()]]);
    expect((await request(app).post(url).set(auth())).status).toBe(404);
  });

  it("adds a marker when none exists", async () => {
    pq([boardCheck()]);
    cq([
      [/SELECT id FROM squares/, rows({ id: 55 })],
      [/SELECT id FROM marker/, rows()],
    ]);
    const res = await request(app).post(url).set(auth(3));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: "Marker added", marked: true });
    const ins = client.query.mock.calls.find(([s]) => /INSERT INTO marker/.test(s));
    expect(ins[1]).toEqual([3, 55, "1"]);
    expect(emit).toHaveBeenCalledWith("marker-updated", { boardID: "1" });
    expect(emit).toHaveBeenCalledWith("board-updated", { boardID: "1" });
    expect(client.release).toHaveBeenCalled();
  });

  it("removes the marker when one exists", async () => {
    pq([boardCheck()]);
    cq([
      [/SELECT id FROM squares/, rows({ id: 55 })],
      [/SELECT id FROM marker/, rows({ id: 900 })],
    ]);
    const res = await request(app).post(url).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Marker removed");
    const del = client.query.mock.calls.find(([s]) => /DELETE FROM marker/.test(s));
    expect(del[1]).toEqual([900]);
    expect(called(client.query, /INSERT INTO marker/)).toBe(false);
  });

  it("500 on DB error", async () => {
    pq([boardCheck()]);
    cq([
      [
        /SELECT id FROM squares/,
        () => {
          throw new Error("db");
        },
      ],
    ]);
    const res = await request(app).post(url).set(auth());
    expect(res.status).toBe(500);
    expect(res.body.marked).toBe(false);
    expect(client.release).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GET /api/board/:boardID/players
// ---------------------------------------------------------------------------
describe("GET /api/board/:boardID/players", () => {
  it("returns id/name/ready only", async () => {
    pq([[/FROM players\s+JOIN users/, rows({ id: 1, name: "A", ready: true, email: "leak" })]]);
    const res = await request(app).get("/api/board/1/players");
    expect(res.status).toBe(200);
    expect(res.body.players).toEqual([{ id: 1, name: "A", ready: true }]);
  });

  it("500 on DB error", async () => {
    mocks.query.mockRejectedValue(new Error("x"));
    expect((await request(app).get("/api/board/1/players")).status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/board/:boardID/getReady
// ---------------------------------------------------------------------------
describe("GET /api/board/:boardID/getReady", () => {
  it("401 without token", async () => {
    expect((await request(app).get("/api/board/1/getReady")).status).toBe(401);
  });

  it("404 when player isn't on the board", async () => {
    pq([[/SELECT ready FROM players/, rows()]]);
    expect((await request(app).get("/api/board/1/getReady").set(auth())).status).toBe(404);
  });

  it("returns the ready flag", async () => {
    pq([[/SELECT ready FROM players/, rows({ ready: true })]]);
    const res = await request(app).get("/api/board/1/getReady").set(auth());
    expect(res.body.ready).toBe(true);
  });

  it("500 on DB error", async () => {
    mocks.query.mockRejectedValue(new Error("x"));
    expect((await request(app).get("/api/board/1/getReady").set(auth())).status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/board/:boardID/leaderboard
// ---------------------------------------------------------------------------
describe("GET /api/board/:boardID/leaderboard", () => {
  it("returns players with numeric marker counts", async () => {
    cq([[/COUNT\(m\.player_id\)/, rows({ name: "A", marker_count: "7" }, { name: "B", marker_count: "3" })]]);
    const res = await request(app).get("/api/board/1/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body.players).toEqual([
      { name: "A", marker_count: 7 },
      { name: "B", marker_count: 3 },
    ]);
    expect(client.release).toHaveBeenCalled();
  });

  it("returns an empty list when nobody has marked anything", async () => {
    const res = await request(app).get("/api/board/1/leaderboard");
    expect(res.body.players).toEqual([]);
  });

  it("500 on error and still releases the client", async () => {
    cq([
      [
        /COUNT\(m\.player_id\)/,
        () => {
          throw new Error("x");
        },
      ],
    ]);
    const res = await request(app).get("/api/board/1/leaderboard");
    expect(res.status).toBe(500);
    expect(client.release).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /api/board/:boardID/leaveGame
// ---------------------------------------------------------------------------
describe("POST /api/board/:boardID/leaveGame", () => {
  const url = "/api/board/1/leaveGame";

  it("404 when player wasn't on the board", async () => {
    cq([[/DELETE FROM players/, rows()]]);
    const res = await request(app).post(url).set(auth());
    expect(res.status).toBe(404);
    expect(called(client.query, /ROLLBACK/)).toBe(true);
  });

  it("deletes the board when the last player leaves", async () => {
    cq([
      [/DELETE FROM players/, rows({ user_id: 1 })],
      [/SELECT \* FROM players/, rows()],
    ]);
    const res = await request(app).post(url).set(auth());
    expect(res.body.boardDeleted).toBe(true);
    expect(called(client.query, /DELETE FROM boards/)).toBe(true);
    expect(emit).toHaveBeenCalledWith("board-deleted", { boardID: "1" });
  });

  it("transfers host to a remaining player when the host leaves", async () => {
    cq([
      [/DELETE FROM players/, rows({ user_id: 1 })],
      [/SELECT \* FROM players/, rows({ user_id: 9 })],
      [/SELECT host_id FROM boards/, rows({ host_id: 1 })],
    ]);
    const res = await request(app).post(url).set(auth(1));
    expect(res.status).toBe(200);
    const upd = client.query.mock.calls.find(([s]) => /UPDATE boards SET host_id/.test(s));
    expect(upd[1]).toEqual([9, "1"]);
    expect(emit).toHaveBeenCalledWith("host-changed", { boardID: "1", newHostID: 9 });
  });

  it("keeps the host when a non-host leaves", async () => {
    cq([
      [/DELETE FROM players/, rows({ user_id: 2 })],
      [/SELECT \* FROM players/, rows({ user_id: 1 })],
      [/SELECT host_id FROM boards/, rows({ host_id: 1 })],
    ]);
    const res = await request(app).post(url).set(auth(2));
    expect(res.body).toMatchObject({ success: true, message: "Left the game" });
    expect(called(client.query, /UPDATE boards SET host_id/)).toBe(false);
    expect(emit).toHaveBeenCalledWith("players-updated", { boardID: "1" });
  });

  it("404 when host row can't be loaded", async () => {
    cq([
      [/DELETE FROM players/, rows({ user_id: 2 })],
      [/SELECT \* FROM players/, rows({ user_id: 1 })],
      [/SELECT host_id FROM boards/, rows()],
    ]);
    expect((await request(app).post(url).set(auth())).status).toBe(404);
  });

  it("500 on DB error and releases the client", async () => {
    client.query.mockRejectedValue(new Error("x"));
    const res = await request(app).post(url).set(auth());
    expect(res.status).toBe(500);
    expect(client.release).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /api/board/:boardID/changeReady
// ---------------------------------------------------------------------------
describe("POST /api/board/:boardID/changeReady", () => {
  const url = "/api/board/1/changeReady";

  it("404 when player isn't on the board", async () => {
    pq([[/SELECT ready FROM players/, rows()]]);
    expect((await request(app).post(url).set(auth())).status).toBe(404);
  });

  it.each([
    [false, true],
    [true, false],
  ])("flips ready %s -> %s and emits players-updated", async (before, after) => {
    pq([
      [/SELECT ready FROM players/, rows({ ready: before })],
      [/UPDATE players SET ready/, rows({ ready: after })],
    ]);
    const res = await request(app).post(url).set(auth());
    expect(res.body.ready).toBe(after);
    const upd = mocks.query.mock.calls.find(([s]) => /UPDATE players SET ready/.test(s));
    expect(upd[1][0]).toBe(after);
    expect(emit).toHaveBeenCalledWith("players-updated", { boardID: "1" });
  });

  it("500 on DB error", async () => {
    mocks.query.mockRejectedValue(new Error("x"));
    expect((await request(app).post(url).set(auth())).status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/board/:boardID/start
// ---------------------------------------------------------------------------
describe("POST /api/board/:boardID/start", () => {
  const url = "/api/board/1/start";
  const squares25 = Array.from({ length: 25 }, (_, i) => ({ id: 100 + i, index: i }));
  const readyPlayers = (n) =>
    Array.from({ length: n }, (_, i) => ({ user_id: i + 1, ready: true }));

  const setup = ({ host = 1, status = "lobby", players = readyPlayers(2), squares = squares25 } = {}) =>
    cq([
      [/SELECT host_id, status FROM boards/, rows({ host_id: host, status })],
      [/SELECT user_id, ready FROM players/, { rows: players }],
      [/SELECT id, index FROM squares/, { rows: squares }],
    ]);

  it("404 when board is missing", async () => {
    cq([[/SELECT host_id, status/, rows()]]);
    expect((await request(app).post(url).set(auth())).status).toBe(404);
  });

  it("403 when caller isn't the host", async () => {
    setup({ host: 99 });
    expect((await request(app).post(url).set(auth(1))).status).toBe(403);
  });

  it.each([["playing"], ["ended"], ["creation"]])("400 when status is %s", async (status) => {
    setup({ status });
    expect((await request(app).post(url).set(auth(1))).status).toBe(400);
  });

  it("404 when there are no players", async () => {
    setup({ players: [] });
    expect((await request(app).post(url).set(auth(1))).status).toBe(404);
  });

  it("403 when someone isn't ready", async () => {
    setup({ players: [{ user_id: 1, ready: true }, { user_id: 2, ready: false }] });
    const res = await request(app).post(url).set(auth(1));
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not all players/i);
  });

  it("400 when the existing square count isn't 25", async () => {
    setup({ squares: squares25.slice(0, 10) });
    const res = await request(app).post(url).set(auth(1));
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("found 10");
  });

  it("creates 25 squares when none exist", async () => {
    let n = 0;
    cq([
      [/SELECT host_id, status FROM boards/, rows({ host_id: 1, status: "lobby" })],
      [/SELECT user_id, ready FROM players/, { rows: readyPlayers(2) }],
      [/SELECT id, index FROM squares/, () => ({ rows: n++ === 0 ? [] : squares25 })],
    ]);
    const res = await request(app).post(url).set(auth(1));
    expect(res.status).toBe(200);
    const ins = client.query.mock.calls.find(([s]) => /INSERT INTO squares/.test(s));
    expect(ins[1]).toHaveLength(50); // (boardID, index) x 25
    expect(ins[1].filter((_, i) => i % 2 === 1)).toEqual([...Array(25).keys()]);
  });

  it.each([
    [1, [25]],
    [2, [13, 12]],
    [5, [5, 5, 5, 5, 5]],
  ])("assigns squares evenly across %i player(s)", async (n, expected) => {
    setup({ players: readyPlayers(n) });
    const res = await request(app).post(url).set(auth(1));
    expect(res.status).toBe(200);
    const upd = client.query.mock.calls.find(([s]) => /UPDATE squares AS s/.test(s));
    const params = upd[1];
    expect(params).toHaveLength(50);
    const perPlayer = {};
    const seenSquares = new Set();
    for (let i = 0; i < params.length; i += 2) {
      seenSquares.add(params[i]);
      perPlayer[params[i + 1]] = (perPlayer[params[i + 1]] || 0) + 1;
    }
    expect(seenSquares.size).toBe(25);
    expect(Object.values(perPlayer).sort((a, b) => b - a)).toEqual(expected);
  });

  it("moves board to creation, resets ready, commits, and emits", async () => {
    setup();
    const res = await request(app).post(url).set(auth(1));
    expect(res.body.status).toBe("creation");
    expect(called(client.query, /UPDATE boards SET status = 'creation'/)).toBe(true);
    expect(called(client.query, /UPDATE players SET ready = false/)).toBe(true);
    expect(called(client.query, /COMMIT/)).toBe(true);
    expect(emit).toHaveBeenCalledWith("board-updated", { boardID: "1" });
    expect(client.release).toHaveBeenCalled();
  });

  it("500 + ROLLBACK on DB error", async () => {
    cq([
      [
        /SELECT host_id, status/,
        () => {
          throw new Error("db");
        },
      ],
    ]);
    const res = await request(app).post(url).set(auth(1));
    expect(res.status).toBe(500);
    expect(called(client.query, /ROLLBACK/)).toBe(true);
    expect(client.release).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// POST /api/board/:boardID/kickPlayer/:currentPlayer
// ---------------------------------------------------------------------------
describe("POST /api/board/:boardID/kickPlayer/:currentPlayer", () => {
  const url = "/api/board/1/kickPlayer/2";

  it("401 without token", async () => {
    expect((await request(app).post(url)).status).toBe(401);
  });

  it("404 when board is missing", async () => {
    pq([[/SELECT host_id FROM boards/, rows()]]);
    expect((await request(app).post(url).set(auth(1))).status).toBe(404);
  });

  it("403 when caller isn't host", async () => {
    pq([[/SELECT host_id FROM boards/, rows({ host_id: 5 })]]);
    const res = await request(app).post(url).set(auth(1));
    expect(res.status).toBe(403);
    expect(called(mocks.query, /DELETE FROM players/)).toBe(false);
  });

  it("400 when host tries to kick themselves", async () => {
    pq([[/SELECT host_id FROM boards/, rows({ host_id: 2 })]]);
    const res = await request(app).post("/api/board/1/kickPlayer/2").set(auth(2));
    expect(res.status).toBe(400);
  });

  it("404 when target isn't on the board", async () => {
    pq([
      [/SELECT host_id FROM boards/, rows({ host_id: 1 })],
      [/DELETE FROM players/, rows()],
    ]);
    expect((await request(app).post(url).set(auth(1))).status).toBe(404);
  });

  it("kicks the player and emits both events", async () => {
    pq([
      [/SELECT host_id FROM boards/, rows({ host_id: 1 })],
      [/DELETE FROM players/, rows({ user_id: 2 })],
    ]);
    const res = await request(app).post(url).set(auth(1));
    expect(res.status).toBe(200);
    const del = mocks.query.mock.calls.find(([s]) => /DELETE FROM players/.test(s));
    expect(del[1]).toEqual(["2", "1"]);
    expect(emit).toHaveBeenCalledWith("players-updated", { boardID: "1" });
    expect(emit).toHaveBeenCalledWith("player-kicked", { boardID: "1", kickedPlayerID: "2" });
  });

  it("500 on DB error", async () => {
    mocks.query.mockRejectedValue(new Error("x"));
    expect((await request(app).post(url).set(auth(1))).status).toBe(500);
  });
});