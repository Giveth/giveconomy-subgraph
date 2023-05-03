
# GIVEconomy Subgraph
Subgraph for Giveth Economy contracts


## Hosted node endpoints on production

- Mainnet: `https://thegraph.com/hosted-service/subgraph/giveth/giveth-economy-second-mainnet`
- Gnosis: `https://thegraph.com/hosted-service/subgraph/giveth/giveth-economy-second-xdai`

## Hosted node endpoints on staging

- Goerli: `https://thegraph.com/hosted-service/subgraph/giveth/giveth-economy-goerli-staging`
- Gnosis: `https://thegraph.com/hosted-service/subgraph/giveth/giveth-economy-xdai-staging`


## Subgraphs

This repository contains subgraphs for two chains: Ethereum and Gnosis with respective testnet (Goerli)

**To prepare root (Ethereum) subgraphs**

```bash
# install dependencies
yarn install

# Set authentication
yarn auth
```

### Build
According to your configuration on networks.yaml
```bash
# build mainnet
yarn build:deployment-mainnet

# build deployment 7
yarn build:deployment-7
```

### Deploy on Graph's hosted node

**For mainnet**

```bash
yarn deploy:mainnet:production
```

**For goerli**

```bash
yarn deploy:goerli:develop
```

**For gnosis**

```bash
yarn deploy:gnosis:production
```
