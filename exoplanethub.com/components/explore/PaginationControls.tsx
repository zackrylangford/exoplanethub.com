'use client';
import { Pagination } from '@/lib/usePagination';
import styles from './PaginationControls.module.css';

export default function PaginationControls({ pagination }: { pagination: Pagination }) {
  const { page, totalPages, goTo } = pagination;

  return (
    <div className={styles.pagination}>
      <button className={styles.button} onClick={() => goTo(page - 1)} disabled={page === 1}>
        Previous
      </button>
      <span className={styles.pageInfo}>
        Page {page} of {totalPages}
      </span>
      <button className={styles.button} onClick={() => goTo(page + 1)} disabled={page === totalPages}>
        Next
      </button>
    </div>
  );
}
