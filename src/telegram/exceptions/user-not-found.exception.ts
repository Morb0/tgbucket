export class UserNotFoundException extends Error {
  constructor(username: string) {
    super(`User with "${username}" username or phone not found`);
  }
}
