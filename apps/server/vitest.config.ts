import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/modules/data-model/validation-engine.ts',
        'src/modules/data-model/field-type-matrix.ts',
        'src/modules/data-model/dto/*.ts',
      ],
    },
  },
});
