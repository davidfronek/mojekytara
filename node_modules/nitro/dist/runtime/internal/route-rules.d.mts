import type { Middleware } from "h3";
import type { MatchedRouteRule, NitroRouteRules } from "nitro/types";
type RouteRuleCtor<T extends keyof NitroRouteRules> = (m: MatchedRouteRule<T>) => Middleware;
export declare const headers: RouteRuleCtor<"headers">;
export declare const redirect: RouteRuleCtor<"redirect">;
export declare const proxy: RouteRuleCtor<"proxy">;
export declare const cache: RouteRuleCtor<"cache">;
export declare const basicAuth: RouteRuleCtor<"auth">;
export {};
