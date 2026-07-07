import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

/**
 * FF-4: single static-token session. No signup, no password reset, no
 * OAuth — this is a deliberate MVP simplification (pm/prd_mvp.md Epic 1),
 * not a shortcut to revisit; FocusForge is explicitly not multi-tenant.
 */
@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedToken = this.config.get<string>("API_TOKEN");
    if (!expectedToken) {
      throw new Error("API_TOKEN is not configured");
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const providedToken = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

    if (providedToken !== expectedToken) {
      throw new UnauthorizedException("Invalid or missing API token");
    }
    return true;
  }
}
