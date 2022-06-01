import { Address } from '@graphprotocol/graph-ts';
import { GIVPower, User } from '../types/schema';
import { GIVPower as GIVPowerContract } from '../types/GIVPower/GIVPower';
import { GIVPOWER_ADDRESS, ZERO_BD } from './constants';

export function getUserEntity(userAddress: Address): User {
  let user = User.load(userAddress.toHex());

  if (user == null) {
    user = new User(userAddress.toHex());
    user.givLocked = ZERO_BD;
    user.givPower = ZERO_BD;
    user.save();
  }

  return user;
}

export function getGIVPower(): GIVPower {
  let givpower = GIVPower.load(GIVPOWER_ADDRESS);

  if (givpower == null) {
    givpower = new GIVPower(GIVPOWER_ADDRESS);

    const givPowerAddress = Address.fromString(GIVPOWER_ADDRESS);
    const givPowerContract = GIVPowerContract.bind(givPowerAddress);
    const dateCall = givPowerContract.try_initialDate();
    const durationCall = givPowerContract.try_roundDuration();

    let initialDate = dateCall.reverted ? 0 : dateCall.value.toI32();
    let roundDuration = durationCall.reverted ? 0 : durationCall.value.toI32();

    givpower.initialDate = initialDate;
    givpower.roundDuration = roundDuration;
    givpower.locksCreated = 0;
    givpower.totalGIVPower = ZERO_BD;
    givpower.totalGIVLocked = ZERO_BD;
    givpower.save();
  }

  return givpower;
}

export function getPowerLockId(userAddress: Address, untilRound: i32): string {
  return userAddress.toHex() + '-' + untilRound.toString();
}
