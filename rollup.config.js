import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const name = 'ImageSequenceEngine';

export default [
  // UMD build (for browsers)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/image-sequence-engine.umd.js',
      format: 'umd',
      name,
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      })
    ]
  },
  // Minified UMD build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/image-sequence-engine.umd.min.js',
      format: 'umd',
      name,
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      }),
      terser()
    ]
  },
  // ESM build (for modern bundlers)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/image-sequence-engine.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      })
    ]
  },
  // CommonJS build (for Node.js)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/image-sequence-engine.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      })
    ]
  }
];