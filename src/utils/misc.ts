import { Address } from '@graphprotocol/graph-ts';
import { GIVPower, TokenBalance, User } from '../types/schema';
import { GIVPower as GIVPowerContract } from '../types/GIVPower/GIVPower';

export function getUserEntity(userAddress: Address): User {
  let user = User.load(userAddress.toHex());

  if (user == null) {
    user = new User(userAddress.toHex());
    user.save();
  }

  return user;
}

export function getGIVPower(givPowerAddress: Address): GIVPower {
  let givpower = GIVPower.load(givPowerAddress.toHex());

  if (givpower == null) {
    givpower = new GIVPower(givPowerAddress.toHex());
    const givPowerContract = GIVPowerContract.bind(givPowerAddress);
    const dateCall = givPowerContract.try_initialDate();
    const durationCall = givPowerContract.try_roundDuration();

    let initialDate = dateCall.reverted ? 0 : dateCall.value.toI32();
    let roundDuration = durationCall.reverted ? 0 : durationCall.value.toI32();

    givpower.initialDate = initialDate;
    givpower.roundDuration = roundDuration;
    givpower.locksCreated = 0;
    givpower.save();
  }

  return givpower;
}

export function getPowerLockId(userAddress: Address, rounds: i32, untilRound: i32): string {
  return userAddress.toHex() + '-' + rounds.toString() + '-' + untilRound.toString();
}

export function getUserBalance(tokenAddress: Address, userAddress: Address): TokenBalance {
  const id = tokenAddress.toHex() + '-' + userAddress.toHex();
  let tokenBalance = TokenBalance.load(id);

  if (tokenBalance == null) {
    tokenBalance = new TokenBalance(id);
    tokenBalance.token = tokenAddress.toHex();
    tokenBalance.user = userAddress.toHex();
    tokenBalance.save();
  }

  return tokenBalance;
}
