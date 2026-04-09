declare module 'jwks-client' {
  interface JwksClientOptions {
    jwksUri: string;
    requestHeaders?: Record<string, string>;
    timeout?: number;
    cache?: boolean;
    cacheMaxEntries?: number;
    cacheMaxAge?: number;
  }

  interface SigningKey {
    getPublicKey(): string;
  }

  interface JwksClient {
    getSigningKey(kid: string): Promise<SigningKey>;
  }

  function jwksClient(options: JwksClientOptions): JwksClient;

  export = jwksClient;
}