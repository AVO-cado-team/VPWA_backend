import type { UserId, UserEntity, UserEntityWithChats } from "#model/user.js";
import { InviteEntity } from "#domain/model/invite.js";

export interface UserRepo {
  create(userId: UserId, username: string): Promise<UserEntity>;
  deleteById(userId: UserId): Promise<void>;
  checkIfUsernameExists(username: string): Promise<boolean>;
  findById(userId: UserId): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  findByIdWithChats(userId: UserId): Promise<UserEntityWithChats | null>;
  updateUsername(userId: UserId, newUsername: string): Promise<UserEntity>;
  getInvites(userId: UserId): Promise<InviteEntity[]>;
}
