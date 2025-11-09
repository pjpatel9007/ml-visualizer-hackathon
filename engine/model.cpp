#include <emscripten/emscripten.h>
#include <Eigen/Dense>
#include <string>
#include <sstream>
#include <iomanip>

using namespace Eigen;

// Import the JavaScript callback function that P1 has defined
EM_JS(void, stream_data, (const char* json_str), {
    // Call the global stream_data function that P1's worker provides
    if (typeof stream_data !== 'undefined') {
        stream_data(UTF8ToString(json_str));
    }
});

// Export the gradient descent function that P1's Web Worker will call
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void run_gradient_descent(double learning_rate) {
        // Hard-coded "Monopoly" dataset as specified
        VectorXd x_data(5);
        VectorXd y_data(5);
        x_data << 0, 1, 2, 3, 4;
        y_data << 10, 50, 150, 450, 625;
        
        // Initialize model parameters
        double m = 0.0;  // slope
        double b = 0.0;  // intercept
        int n = x_data.size();
        
        // Gradient descent loop - 200 epochs
        const int epochs = 200;
        
        for (int epoch = 0; epoch < epochs; epoch++) {
            // Calculate predictions
            VectorXd predictions = m * x_data.array() + b;
            
            // Calculate loss (Mean Squared Error)
            VectorXd errors = predictions - y_data;
            double loss = errors.squaredNorm() / n;
            
            // Calculate gradients
            double dm = (2.0 / n) * (errors.array() * x_data.array()).sum();
            double db = (2.0 / n) * errors.sum();
            
            // Update parameters
            m -= learning_rate * dm;
            b -= learning_rate * db;
            
            // Create JSON string with exact format P1 expects
            std::ostringstream json_stream;
            json_stream << std::fixed << std::setprecision(4);
            json_stream << "{\"epoch\": " << (epoch + 1) 
                       << ", \"m\": " << m 
                       << ", \"b\": " << b 
                       << ", \"loss\": " << loss << "}";
            
            std::string json_string = json_stream.str();
            
            // Stream this epoch's data to JavaScript
            stream_data(json_string.c_str());
        }
        
        // Send completion signal as specified
        stream_data("{\"epoch\": \"complete\"}");
    }
}