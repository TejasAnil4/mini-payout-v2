const { buildSchema } = require("graphql");

const schema = buildSchema(`
  type Wallet {
     id: ID!
    balance: Float!
    status: String!
  }

  type Query {
    myWallet: Wallet
  }
`);

module.exports = schema;