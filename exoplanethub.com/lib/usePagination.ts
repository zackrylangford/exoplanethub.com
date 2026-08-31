'use client';
import { useState } from 'react';

export interface Pagination {
  page: number;
  totalPages: number;
  goTo: (page: number) => void;
}

export function usePagination(itemCount: number, itemsPerPage: number): Pagination {
  const [requested, setRequested] = useState(1);
  const totalPages = Math.max(1, Math.ceil(itemCount / itemsPerPage));

  // Only the clamped page leaves this hook, so no caller can page off the end using the raw one.
  return { page: Math.min(Math.max(1, requested), totalPages), totalPages, goTo: setRequested };
}
