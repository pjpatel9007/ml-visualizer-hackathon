# Testing the Fix

This document explains how to test that the Eigen compilation error has been fixed.

## Prerequisites

To test the compilation, you need to install Emscripten:

```bash
# Install Emscripten (one-time setup)
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

## Testing the Build

Once Emscripten is installed, you can test the compilation:

```bash
# Navigate to the engine directory
cd engine

# Run the build script
./build.sh

# Or use make
make
```

## Expected Output

If the fix is working correctly, you should see:

```
Compiling model.cpp to WebAssembly...
Build complete!
Output files:
  - ../visualizer/public/compute.js
  - ../visualizer/public/compute.wasm
```

## What Was Fixed

The original error was:
```
./engine/model.cpp:2:10: fatal error: 'Eigen/Dense' file not found
    2 | #include <Eigen/Dense>
      |          ^~~~~~~~~~~~~
```

This occurred because:
1. The code included `<Eigen/Dense>` but the Eigen library wasn't available
2. No include path was specified for finding the Eigen headers

The fix:
1. Added Eigen headers to `include/Eigen/`
2. Build scripts now use `-I../include` to tell the compiler where to find Eigen
3. When compiling, the compiler can now find `include/Eigen/Dense`

## Verifying Without Emscripten

If you don't have Emscripten installed, you can verify the Eigen headers are correct with a standard C++ compiler:

```bash
# Create a simple test file
cat > /tmp/test.cpp << 'EOF'
#include <Eigen/Dense>
#include <iostream>
using namespace Eigen;
int main() {
    VectorXd v(3);
    v << 1, 2, 3;
    std::cout << "Eigen works! Sum = " << v.sum() << std::endl;
    return 0;
}
EOF

# Compile and run with g++
g++ -I./include /tmp/test.cpp -o /tmp/test && /tmp/test
```

Expected output:
```
Eigen works! Sum = 6
```
