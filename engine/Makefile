# Makefile for building the C++ engine to WebAssembly

# Compiler
CXX = emcc

# Directories
INCLUDE_DIR = ../include
OUTPUT_DIR = ../visualizer/public

# Source files
SOURCE = model.cpp

# Output files
OUTPUT_JS = $(OUTPUT_DIR)/compute.js
OUTPUT_WASM = $(OUTPUT_DIR)/compute.wasm

# Compiler flags
CXXFLAGS = -I$(INCLUDE_DIR) \
           -s WASM=1 \
           -s EXPORTED_FUNCTIONS='["_run_gradient_descent"]' \
           -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
           -s ALLOW_MEMORY_GROWTH=1 \
           -s MODULARIZE=1 \
           -s EXPORT_NAME='createComputeModule' \
           -O2

# Default target
all: $(OUTPUT_JS)

# Build target
$(OUTPUT_JS): $(SOURCE)
	@echo "Compiling $(SOURCE) to WebAssembly..."
	$(CXX) $(SOURCE) -o $(OUTPUT_JS) $(CXXFLAGS)
	@echo "Build complete!"
	@echo "Output files:"
	@echo "  - $(OUTPUT_JS)"
	@echo "  - $(OUTPUT_WASM)"

# Clean target
clean:
	rm -f $(OUTPUT_JS) $(OUTPUT_WASM)
	@echo "Cleaned output files"

# Help target
help:
	@echo "Available targets:"
	@echo "  all     - Build the WebAssembly module (default)"
	@echo "  clean   - Remove build outputs"
	@echo "  help    - Show this help message"

.PHONY: all clean help
