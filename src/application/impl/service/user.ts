import type { UserId } from "#model/user.js";
import { UsernameAlreadyExistsError, UserNotFoundError } from "#model/user.js";
import type { UserService } from "#service/user.js";
import { log } from "#infrastructure/log.js";
import type { UserRepo } from "#repo/user.js";
import { Err, Ok } from "ts-results-es";
import type { Config } from "unique-names-generator";
import {
  adjectives,
  animals,
  colors,
  names,
  NumberDictionary,
  uniqueNamesGenerator,
} from "unique-names-generator";

export class UserServiceImpl implements UserService {
  private customConfig: Config;
  constructor(public repo: UserRepo) {
    const numberDict = NumberDictionary.generate({ min: 1, max: 10000 });
    // NOTE: Adjectives = 1400, Colors = 50, Animals = 350, Names = 4900, NumberDict = 10000 => 1400 * 50 * 350 * 4900 * 10000 = 1200500000000000
    // If we take only Animals and colors with 10 numbers => 350 * 50 * 10 = 175000
    this.customConfig = {
      dictionaries: [adjectives, colors, animals, names, numberDict],
      separator: "",
      length: 5,
      style: "capital",
    };
  }

  async create(userId: UserId, username: string) {
    const userWithUsername = await this.repo.checkIfUsernameExists(username);
    if (userWithUsername)
      return new Err(new UsernameAlreadyExistsError(username));
    const user = await this.repo.create(userId, username);
    return new Ok(user);
  }

  async generateUniqueUsername(email: string) {
    let i = 0;
    while (true) {
      const username = uniqueNamesGenerator(this.customConfig);
      const user = await this.repo.checkIfUsernameExists(username);
      if (!user) {
        return username;
      } else if (i % 1000 === 0) {
        log.warn(
          "UserService.createUsername(): too many iterations (>" +
            i +
            ")" +
            " for email: " +
            email,
        );
      }

      i++;
    }
  }

  async deleteById(userId: UserId) {
    const user = await this.repo.findById(userId);
    if (!user) return new Err(new UserNotFoundError(userId));
    await this.repo.deleteById(userId);
    return new Ok(undefined);
  }

  async changeUsername(userId: UserId, newUsername: string) {
    const userWithUsername = await this.repo.checkIfUsernameExists(newUsername);
    if (!userWithUsername)
      return new Err(new UsernameAlreadyExistsError(newUsername));
    const userWithId = await this.repo.findById(userId);
    if (!userWithId) return new Err(new UserNotFoundError(userId));
    const updatedUser = await this.repo.updateUsername(userId, newUsername);
    return new Ok(updatedUser);
  }

  async getInvites(userId: UserId) {
    const user = await this.repo.findById(userId);
    if (!user) return new Err(new UserNotFoundError(userId));
    return new Ok(await this.repo.getInvites(userId));
  }
}
