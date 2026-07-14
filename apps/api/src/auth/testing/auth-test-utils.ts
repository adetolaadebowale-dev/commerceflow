import { MemorySessionRepository } from "../repositories/memory-session.repository";
import { MemoryUserRepository } from "../repositories/memory-user.repository";
import { AuthService } from "../services/auth.service";

export function createMemoryAuthService(): {
  authService: AuthService;
  userRepository: MemoryUserRepository;
  sessionRepository: MemorySessionRepository;
} {
  const userRepository = new MemoryUserRepository();
  const sessionRepository = new MemorySessionRepository();

  return {
    authService: new AuthService({ userRepository, sessionRepository }),
    userRepository,
    sessionRepository,
  };
}
