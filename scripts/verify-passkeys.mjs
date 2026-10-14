// Manual development-only verification. Creates one test notebook and removes its ephemeral passkey.
import {
  generateKeyPairSync,
  randomBytes,
  createHash,
  sign,
} from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
const base = "https://insightful-viper-971.convex.site",
  origin = base,
  rp = "insightful-viper-971.convex.site";
const jar = new Map();
async function call(path, body, requestOrigin = origin) {
  const res = await fetch(base + "/api/auth" + path, {
    method: body ? "POST" : "GET",
    headers: {
      origin: requestOrigin,
      "content-type": "application/json",
      cookie: [...jar].map(([k, v]) => k + "=" + v).join("; "),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  for (const cookie of res.headers.getSetCookie()) {
    const pair = cookie.split(";")[0],
      index = pair.indexOf("=");
    jar.set(pair.slice(0, index), pair.slice(index + 1));
  }
  const data = await res.json();
  if (!res.ok)
    throw new Error(
      path + " " + res.status + " " + (data.code ?? data.message),
    );
  return data;
}
const b64 = (b) => Buffer.from(b).toString("base64url"),
  hash = (b) => createHash("sha256").update(b).digest();
function cbor(value) {
  const head = (major, n) =>
    n < 24
      ? Buffer.from([(major << 5) | n])
      : n < 256
        ? Buffer.from([(major << 5) | 24, n])
        : Buffer.from([(major << 5) | 25, n >> 8, n & 255]);
  if (Buffer.isBuffer(value))
    return Buffer.concat([head(2, value.length), value]);
  if (typeof value === "string") {
    const b = Buffer.from(value);
    return Buffer.concat([head(3, b.length), b]);
  }
  if (typeof value === "number")
    return value >= 0 ? head(0, value) : head(1, -1 - value);
  const entries = value instanceof Map ? [...value] : Object.entries(value);
  return Buffer.concat([
    head(5, entries.length),
    ...entries.flatMap(([k, v]) => [cbor(k), cbor(v)]),
  ]);
}
const bootstrap = await call("/sign-in/anonymous", {});
const options = await call("/passkey/generate-register-options");
const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  }),
  jwk = publicKey.export({ format: "jwk" }),
  id = randomBytes(32);
const cose = cbor(
  new Map([
    [1, 2],
    [3, -7],
    [-1, 1],
    [-2, Buffer.from(jwk.x, "base64url")],
    [-3, Buffer.from(jwk.y, "base64url")],
  ]),
);
const authData = Buffer.concat([
  hash(rp),
  Buffer.from([0x45, 0, 0, 0, 0]),
  Buffer.alloc(16),
  Buffer.from([0, id.length]),
  id,
  cose,
]);
const registration = {
  id: b64(id),
  rawId: b64(id),
  type: "public-key",
  response: {
    clientDataJSON: b64(
      JSON.stringify({
        type: "webauthn.create",
        challenge: options.challenge,
        origin,
        crossOrigin: false,
      }),
    ),
    attestationObject: b64(cbor({ fmt: "none", attStmt: {}, authData })),
    transports: ["internal"],
  },
  clientExtensionResults: {},
  authenticatorAttachment: "platform",
};
const registered = await call("/passkey/verify-registration", {
  response: registration,
  name: "Ephemeral protocol verification",
});
console.log("Passkey registration verified", !!registered.id);
jar.clear();
const request = await call("/passkey/generate-authenticate-options");
const clientData = Buffer.from(
  JSON.stringify({
    type: "webauthn.get",
    challenge: request.challenge,
    origin,
    crossOrigin: false,
  }),
);
const assertionData = Buffer.concat([
  hash(rp),
  Buffer.from([0x05, 0, 0, 0, 1]),
]);
const assertion = {
  id: b64(id),
  rawId: b64(id),
  type: "public-key",
  response: {
    clientDataJSON: b64(clientData),
    authenticatorData: b64(assertionData),
    signature: b64(
      sign(
        "sha256",
        Buffer.concat([assertionData, hash(clientData)]),
        privateKey,
      ),
    ),
    userHandle: options.user.id,
  },
  clientExtensionResults: {},
  authenticatorAttachment: "platform",
};
const authenticated = await call("/passkey/verify-authentication", {
  response: assertion,
});
console.log(
  "Passkey sign-in verified",
  authenticated.user?.id === bootstrap.user.id,
);
const token = await call("/convex/token");
const convex = new ConvexHttpClient(
  "https://insightful-viper-971.convex.cloud",
);
convex.setAuth(token.token);
await convex.mutation("notebook:initialize", {});
const notebook = await convex.query("notebook:get", {});
console.log(
  "Authenticated Convex notebook",
  notebook.projects.length === 1,
  notebook.projects[0].isSample,
);
await call("/passkey/delete-passkey", { id: registered.id });
await call("/sign-out", {});
console.log("Ephemeral passkey removed and session signed out");
