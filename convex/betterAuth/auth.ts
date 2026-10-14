import type { GenericCtx } from '@convex-dev/better-auth';
import { betterAuth } from 'better-auth/minimal';
import { createAuthOptions } from '../auth';
import type { DataModel } from '../_generated/dataModel';
// Used only by `npx auth generate`, never imported by a runtime function.
export const auth = betterAuth(createAuthOptions({} as GenericCtx<DataModel>));
