const readline = require("readline");
const { Issuer, generators, custom } = require("openid-client");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // Necessary for localhost test
const credentials = {
  client_id: "", // Insira o identificador de parceiro
  client_secret: "", // Insira o segredo de parceiro
  redirect_uris: [], // Insira a URL de callback
  scope: "openid profile email accounts", // Com exceção do openid, os outros escopos são opcionais
};

const issuerUrl = "https://conta.toroinvestimentos.com.br";

custom.setHttpOptionsDefaults({
  hooks: {
    beforeRequest: [
      (options) => {
        console.log("--> options %s %s", options);
        console.log(
          "--> %s %s",
          options.method.toUpperCase(),
          options.url.href
        );
        console.log("--> HEADERS %o", options.headers);
        if (options.body) {
          console.log("--> BODY %s", options.body);
        }
      },
    ],
    afterResponse: [
      (response) => {
        console.log(
          "<-- %i FROM %s %s",
          response.statusCode,
          response.request.options.method.toUpperCase(),
          response.request.options.url.href
        );
        console.log("<-- HEADERS %o", response.headers);
        if (response.body) {
          console.log("<-- BODY %s", response.body);
        }
        return response;
      },
    ],
  },
});

const jwt_decode = require("jwt-decode");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const rlIt = rl[Symbol.asyncIterator]();

(async () => {
  const issuer = await Issuer.discover(issuerUrl);
  console.log("Discovered issuer %s %O", issuer.issuer, issuer.metadata);

  const client = new issuer.Client({
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    redirect_uris: credentials.redirect_uris,
    response_types: ["code"],
  });

  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);
  const authorizationUrl = client.authorizationUrl({
    scope: credentials.scope,
    redirect_uri: credentials.redirect_uris[0],
    code_challenge,
    code_challenge_method: "S256",
  });

  console.log(authorizationUrl);

  console.log("Cole a resposta aqui:");
  const response = await rlIt.next();
  console.log("response.value", response.value);
  const parsedResponse = client.callbackParams(response.value);
  console.log("parsedResponse", parsedResponse);

  const tokenSet = await client.callback(
    credentials.redirect_uris[0],
    parsedResponse,
    {
      code_verifier: code_verifier,
    }
  );
  console.log("tokenSet", tokenSet);

  const decodedHeader = jwt_decode(tokenSet.id_token, { header: true });
  console.log(decodedHeader);
  console.log("jwksUri", issuer.metadata.jwks_uri);
  var jwksClientInstance = jwksClient({
    jwksUri: issuer.metadata.jwks_uri,
  });

  const key = await jwksClientInstance.getSigningKey(decodedHeader.kid);
  const signingKey = key.publicKey || key.rsaPublicKey;

  const decodedVerified = await jwt.verify(tokenSet.id_token, signingKey);
  console.log(decodedVerified);
})()
  .catch(console.error)
  .finally(() => {
    rl.close();
    console.log("END");
  });
