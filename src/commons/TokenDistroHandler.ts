import { Address } from '@graphprotocol/graph-ts/common/numbers';
import { TokenDistro } from '../types/schema';
import { TokenDistro as TokenDistroType } from '../types/TokenDistro/TokenDistro';
import { log } from '@graphprotocol/graph-ts';

// const isContractInfoInitiated: any = {};

export function getTokenDistro(address: Address): TokenDistro | null {
  const contractInfo = TokenDistro.load(address.toHex());
  return contractInfo;
}

export function createTokenDistroContractInfoIfNotExists(
  address: Address,
): TokenDistro {
  log.info(
    'createTokenDistroContractInfoIfNotExists() has been called: ' +
      address.toHex(),
    [],
  );
  let contractInfo = getTokenDistro(address);
  const contract = TokenDistroType.bind(address);

  if (contractInfo) {
    log.info(
      'createTokenDistroContractInfoIfNotExists() contractInfo existed' +
        address.toHex(),
      [],
    );
    return contractInfo;
  }
  contractInfo = new TokenDistro(address.toHex());
  contractInfo.lockedAmount = contract.lockedAmount();
  contractInfo.startTime = contract.startTime();
  contractInfo.cliffTime = contract.cliffTime();
  contractInfo.duration = contract.duration();
  contractInfo.initialAmount = contract.initialAmount();
  contractInfo.totalTokens = contract.totalTokens();
  contractInfo.save();
  return contractInfo;
}

export function updateContractInfo(address: Address): void {}

export function createOrUpdateTokenDistro(address: Address): TokenDistro {
  log.info(
    'createOrUpdateTokenDistro() has been called: ' + address.toHex(),
    [],
  );
  let contractInfo = getTokenDistro(address);
  const contract = TokenDistroType.bind(address);

  contractInfo = new TokenDistro(address.toHex());
  contractInfo.lockedAmount = contract.lockedAmount();
  contractInfo.startTime = contract.startTime();
  contractInfo.cliffTime = contract.cliffTime();
  contractInfo.duration = contract.duration();
  contractInfo.initialAmount = contract.initialAmount();
  contractInfo.totalTokens = contract.totalTokens();
  contractInfo.save();
  return contractInfo;
}
