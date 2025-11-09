# C++ Engine

This directory contains the C++ code for the ML model that gets compiled to WebAssembly.

## Dependencies

- **Eigen** (v3.4.0): C++ template library for linear algebra
  - The Eigen headers are included in the `../include/Eigen` directory
  - No installation required - headers are bundled with this project

- **Emscripten**: Compiler toolchain for WebAssembly
  - Required to build the C++ code to WebAssembly
  - Installation guide: https://emscripten.org/docs/getting_started/downloads.html

## Building

To compile the C++ code to WebAssembly:

```bash
cd engine
./build.sh
```

This will generate:
- `compute.js` - JavaScript glue code for loading the WebAssembly module
- `compute.wasm` - The compiled WebAssembly binary

Both files will be placed in `../visualizer/public/` for use by the web application.

## Manual Compilation

If you prefer to compile manually:

```bash
emcc model.cpp \
    -I../include \
    -o ../visualizer/public/compute.js \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS='["_run_gradient_descent"]' \
    -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='createComputeModule' \
    -O2
```

## About Eigen

Eigen is a header-only C++ library, which means no separate compilation or linking is required. The headers are included in this repository under `../include/Eigen/` for convenience.

- License: MPL2 (Mozilla Public License 2.0) with a few LGPL components
- Version: 3.4.0
- Official website: https://eigen.tuxfamily.org/
