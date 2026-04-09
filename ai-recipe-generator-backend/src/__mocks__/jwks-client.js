const mockGetSigningKey = jest.fn();

const jwksClient = jest.fn().mockImplementation(() => ({
  getSigningKey: mockGetSigningKey
}));

jwksClient.mockGetSigningKey = mockGetSigningKey;

module.exports = jwksClient;