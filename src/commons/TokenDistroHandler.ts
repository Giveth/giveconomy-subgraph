import { Address } from '@graphprotocol/graph-ts/common/numbers';
import { TokenDistro } from '../types/schema';
import { TokenDistro as TokenDistroType } from '../types/TokenDistro/TokenDistro';
import { BigInt, log } from '@graphprotocol/graph-ts';

// const isContractInfoInitiated: any = {};

export function getTokenDistro(address: Address): TokenDistro {
  log.info(
    'createTokenDistroContractInfoIfNotExists() has been called: ' +
      address.toHex(),
    [],
  );
  // if (isContractInfoInitiated[address.toHex()]) {
  //   return;
  // }
  const contract = TokenDistroType.bind(address);
  let contractInfo = TokenDistro.load(address.toHex());
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
  // isContractInfoInitiated[address.toHex()] = true;
  return contractInfo;
}

export function createTokenDistroContractInfoIfNotExists(
  address: Address,
): void {
  getTokenDistro(address);
}

export function updateContractInfo(address: Address): void {}

export function updateRewardPerTokenStored(address: Address): void {
  getTokenDistro(address);
}

export function createOrUpdateTokenDistro(address: Address): void {
  getTokenDistro(address);
}
