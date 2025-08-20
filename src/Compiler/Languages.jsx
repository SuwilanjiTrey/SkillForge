// Language Components with proper structure

const JavaScriptCompiler = {
  id: 'javascript',
  name: 'JavaScript',
  icon: '/images/javascript.png', // Using image from public folder
  extension: 'js',
  defaultCode: `// Welcome to JavaScript Playground!
console.log("Hello, World!");

// Try some operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);

// Function example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(7):", fibonacci(7));`,
  
  execute: (code) => {
    const logs = [];
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn
    };

    console.log = (...args) => {
      logs.push({ type: 'log', content: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ') });
    };
    
    console.error = (...args) => {
      logs.push({ type: 'error', content: args.map(arg => String(arg)).join(' ') });
    };
    
    console.warn = (...args) => {
      logs.push({ type: 'warn', content: args.map(arg => String(arg)).join(' ') });
    };

    try {
      const func = new Function(code);
      func();
    } catch (error) {
      logs.push({ type: 'error', content: `Runtime Error: ${error.message}` });
    } finally {
      Object.assign(console, originalConsole);
    }

    return logs;
  }
};

const PythonCompiler = {
  id: 'python',
  name: 'Python',
  icon: '/images/python.png', // Using image from public folder
  extension: 'py',
  isLoading: false,
  isApiReady: false,
  defaultCode: `# Welcome to Python Playground!
print("Hello, World!")

# List operations
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print("Doubled numbers:", doubled)

# Function example
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print("Fibonacci(7):", fibonacci(7))

# Dictionary example
person = {"name": "Alice", "age": 30}
print("Person:", person)`,
  
  // Initialize Python API
  initialize: async function() {
    if (this.isApiReady) return true;
    
    this.isLoading = true;
    
    try {
      // Test the API first
      const testResponse = await fetch('https://api.programiz.com/compiler/v1/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'python',
          version: '3.9.6',
          code: 'print("API Test")',
          input: ''
        })
      });

      if (testResponse.ok) {
        this.isApiReady = true;
        this.isLoading = false;
        return true;
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      // Fallback to loading Skulpt
      await loadSkulptLibrary();
      this.isApiReady = true;
      this.isLoading = false;
      return false; // API failed, using fallback
    }
  },
  
  execute: async function(code) {
    // Ensure initialization before execution
    if (!this.isApiReady) {
      const apiWorking = await this.initialize();
      if (this.isLoading) {
        return [{ type: 'log', content: 'Initializing Python environment...' }];
      }
    }

    try {
      // Try API first
      const response = await fetch('https://api.programiz.com/compiler/v1/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'python',
          version: '3.9.6',
          code: code,
          input: ''
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const result = await response.json();
      
      if (result.error) {
        return [{ type: 'error', content: result.error }];
      }
      
      return [{ type: 'log', content: result.output || 'Code executed successfully (no output)' }];
    } catch (error) {
      // Fallback to Skulpt
      return await executePythonWithSkulpt(code);
    }
  }
};

const SQLCompiler = {
  id: 'sql',
  name: 'SQL',
  icon: '/images/sql.png', // Using image from public folder
  extension: 'sql',
  defaultCode: `-- Welcome to SQL Playground!
-- Sample data simulation
SELECT 'Hello, SQL World!' as greeting;

-- More complex queries (simulated)
SELECT 
    'John Doe' as name, 
    25 as age, 
    'Engineer' as profession
UNION ALL
SELECT 'Jane Smith', 30, 'Designer'
UNION ALL  
SELECT 'Bob Wilson', 35, 'Manager';

-- Date functions
SELECT 
    'Current timestamp' as label,
    datetime('now') as current_time;`,
  
  execute: async (code) => {
    try {
      // Using sql.js for client-side SQL execution
      if (typeof window.initSqlJs === 'undefined') {
        await loadSqlJs();
      }
      
      const SQL = await window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      });
      
      const db = new SQL.Database();
      
      // Create sample tables for testing
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          name TEXT,
          age INTEGER,
          profession TEXT
        );
        
        INSERT OR IGNORE INTO users (id, name, age, profession) VALUES 
        (1, 'John Doe', 25, 'Engineer'),
        (2, 'Jane Smith', 30, 'Designer'),
        (3, 'Bob Wilson', 35, 'Manager');
      `);
      
      const statements = code.split(';').filter(s => s.trim());
      const results = [];
      
      for (let statement of statements) {
        if (!statement.trim()) continue;
        
        try {
          const result = db.exec(statement);
          if (result.length > 0) {
            // Return structured data for table rendering
            results.push({ 
              type: 'table', 
              data: result.map(r => ({
                columns: r.columns,
                rows: r.values
              }))
            });
          } else {
            results.push({ type: 'log', content: 'Query executed successfully' });
          }
        } catch (error) {
          results.push({ type: 'error', content: `SQL Error: ${error.message}` });
        }
      }
      
      db.close();
      return results.length > 0 ? results : [{ type: 'log', content: 'No results' }];
      
    } catch (error) {
      return [{ type: 'error', content: `SQL Execution Error: ${error.message}` }];
    }
  }
};

// Helper functions
const loadSqlJs = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.initSqlJs !== 'undefined') {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const loadSkulptLibrary = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.Sk !== 'undefined') {
      resolve();
      return;
    }

    if (!document.getElementById('skulpt-script')) {
      const skulptScript = document.createElement('script');
      skulptScript.id = 'skulpt-script';
      skulptScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/skulpt/0.11.1/skulpt.min.js';
      skulptScript.onload = () => {
        // Load skulpt-stdlib after main skulpt library
        const skulptStdlibScript = document.createElement('script');
        skulptStdlibScript.id = 'skulpt-stdlib-script';
        skulptStdlibScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/skulpt/0.11.1/skulpt-stdlib.js';
        skulptStdlibScript.onload = resolve;
        skulptStdlibScript.onerror = reject;
        document.head.appendChild(skulptStdlibScript);
      };
      skulptScript.onerror = reject;
      document.head.appendChild(skulptScript);
    } else {
      resolve();
    }
  });
};

const executePythonWithSkulpt = (code) => {
  return new Promise((resolve) => {
    try {
      if (typeof window.Sk === 'undefined') {
        resolve([{ type: 'error', content: 'Python interpreter not available. Please refresh the page.' }]);
        return;
      }
      
      let output = '';
      window.Sk.pre = 'output';
      window.Sk.configure({
        output: (text) => {
          output += text;
        },
        read: (filename) => {
          throw new Error(`File not found: ${filename}`);
        }
      });
      
      window.Sk.misceval.asyncToPromise(() => 
        window.Sk.importMainWithBody('<stdin>', false, code, true)
      )
        .then(() => {
          resolve([{ type: 'log', content: output || 'Code executed successfully (no output)' }]);
        })
        .catch((error) => {
          resolve([{ type: 'error', content: `Python Error: ${error.toString()}` }]);
        });
    } catch (error) {
      resolve([{ type: 'error', content: `Python execution failed: ${error.message}` }]);
    }
  });
};

// Utility component for rendering SQL tables
const SQLTableRenderer = ({ data }) => {
  if (!data || !data.columns || !data.rows) return null;

  return (
    <table style={{ 
      width: '100%', 
      borderCollapse: 'collapse', 
      marginBottom: '1rem',
      border: '1px solid #ccc'
    }}>
      <thead>
        <tr style={{ backgroundColor: '#f5f5f5' }}>
          {data.columns.map((col, index) => (
            <th key={index} style={{ 
              padding: '8px 12px', 
              border: '1px solid #ddd',
              textAlign: 'left',
              fontWeight: 'bold'
            }}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} style={{ 
                padding: '8px 12px', 
                border: '1px solid #ddd'
              }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Export all components and utilities
export { 
  JavaScriptCompiler, 
  PythonCompiler, 
  SQLCompiler,
  SQLTableRenderer,
  loadSqlJs,
  loadSkulptLibrary,
  executePythonWithSkulpt
};
