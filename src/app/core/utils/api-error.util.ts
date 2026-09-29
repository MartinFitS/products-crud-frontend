import { HttpErrorResponse } from '@angular/common/http';

import { ApiErrorResponse } from '../auth/auth.models';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const body = error.error as ApiErrorResponse | null;
  return typeof body?.message === 'string' && body.message.trim() ? body.message : fallback;
}
