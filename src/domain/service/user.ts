import type { InviteEntity } from "#domain/model/invite.js";
import type { UserRepo } from "#repo/user.js";
import type { Result } from "ts-results-es";
import type {
  UserEntity,
  UserId,
  UsernameAlreadyExistsError,
  UserNotFoundError,
} from "#model/user.js";

export interface UserService {
  repo: UserRepo;
  deleteById(userId: UserId): Promise<Result<void, UserNotFoundError>>;
  create(
    userId: UserId,
    username: string,
  ): Promise<Result<UserEntity, UsernameAlreadyExistsError>>;
  generateUniqueUsername(email: string): Promise<string>;
  changeUsername(
    userId: UserId,
    newUsername: string,
  ): Promise<
    Result<UserEntity, UsernameAlreadyExistsError | UserNotFoundError>
  >;
  getInvites(
    userId: UserId,
  ): Promise<Result<InviteEntity[], UserNotFoundError>>;
}
