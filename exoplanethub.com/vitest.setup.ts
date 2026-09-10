import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

// jsdom does no layout and leaves scrollIntoView undefined; node-environment files have no Element at all.
if (typeof Element !== 'undefined') Element.prototype.scrollIntoView = () => {};
