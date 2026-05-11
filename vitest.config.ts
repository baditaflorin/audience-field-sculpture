import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Coverage thresholds apply to the layers that can be tested without a
      // real browser: domain math, lifecycle orchestration, and persistence.
      // UI/camera/audio glue is exercised via the manual stranger test, not
      // unit tests; see docs/phase3/stranger-test.md.
      include: [
        'src/domain/**/*.ts',
        'src/application/lifecycle.ts',
        'src/application/settings.ts',
        'src/application/simulation.ts',
        'src/primitives/persistence.ts',
        'src/primitives/clamp.ts',
        'src/primitives/result.ts',
      ],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
});
