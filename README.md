# ml-visualizer-hackathon
data visualiser wih a c++/python/react framework

## Project Structure

- `engine/` - C++ code for ML computations (compiled to WebAssembly)
- `glue/` - Python/Flask middleware layer
- `visualizer/` - React frontend application
- `include/` - C++ header libraries (Eigen)

## Building the C++ Engine

The C++ engine requires the Eigen library headers (included in this repository) and Emscripten to compile to WebAssembly.

### Prerequisites

1. **Emscripten** - Install from: https://emscripten.org/docs/getting_started/downloads.html
2. **Eigen** - Headers are already included in `include/Eigen/` (no installation needed)

### Build Instructions

```bash
cd engine
./build.sh
```

Or using make:

```bash
cd engine
make
```

See `engine/README.md` for more details on building the C++ code.

## Running the Application

### Frontend (React + Vite)

```bash
cd visualizer
npm install
npm run dev
```

### Backend (Flask)

```bash
cd glue
python app.py
```
