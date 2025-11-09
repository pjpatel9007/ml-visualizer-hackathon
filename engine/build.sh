#!/bin/bash
# Build script for compiling the C++ engine to WebAssembly

set -e

# Check if emscripten is installed
if ! command -v emcc &> /dev/null; then
    echo "Error: Emscripten (emcc) is not installed or not in PATH"
    echo "Please install Emscripten from: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Set the include path for Eigen headers
INCLUDE_PATH="../include"

# Output directory
OUTPUT_DIR="../visualizer/public"

# Source file
SOURCE_FILE="model.cpp"

# Output files
OUTPUT_JS="compute.js"
OUTPUT_WASM="compute.wasm"

echo "Compiling $SOURCE_FILE to WebAssembly..."

# Compile with emscripten
emcc "$SOURCE_FILE" \
    -I"$INCLUDE_PATH" \
    -o "$OUTPUT_DIR/$OUTPUT_JS" \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS='["_run_gradient_descent"]' \
    -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='createComputeModule' \
    -O2

echo "Build complete!"
echo "Output files:"
echo "  - $OUTPUT_DIR/$OUTPUT_JS"
echo "  - $OUTPUT_DIR/$OUTPUT_WASM"
