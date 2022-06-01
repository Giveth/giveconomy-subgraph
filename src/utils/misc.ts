import { Address } from '@graphprotocol/graph-ts';
import { User } from '../types/schema';
import { ZERO_BD } from './constants';

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
