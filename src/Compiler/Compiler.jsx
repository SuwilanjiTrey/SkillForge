import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Copy, Download, Database, Code, FileText, Brackets, Zap } from 'lucide-react';

const OnlineCompiler = () => {
  const [activeCompiler, setActiveCompiler] = useState(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  const compilers = [
    {
      id: 'python',
      name: 'Python',
      icon: <Code size={24} />,
      description: 'Execute Python 3 code',
      color: '#3776ab',
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

print("Fibonacci(7):", fibonacci(7))`,
      api: 'piston'
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      icon: <FileText size={24} />,
      description: 'Execute JavaScript (Node.js)',
      color: '#f7df1e',
      defaultCode: `// Welcome to JavaScript Playground!
console.log("Hello, World!");

// Array operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);

// Function example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(7):", fibonacci(7));`,
      api: 'piston'
    },
    {
      id: 'java',
      name: 'Java',
      icon: <Brackets size={24} />,
      description: 'Compile and run Java code',
      color: '#007396',
      defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Array operations
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.print("Doubled numbers: [");
        for (int i = 0; i < numbers.length; i++) {
            System.out.print(numbers[i] * 2);
            if (i < numbers.length - 1) System.out.print(", ");
        }
        System.out.println("]");
        
        // Fibonacci
        System.out.println("Fibonacci(7): " + fibonacci(7));
    }
    
    static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}`,
      api: 'piston'
    },
    {
      id: 'sql',
      name: 'SQL',
      icon: <Database size={24} />,
      description: 'Execute SQL queries (SQLite)',
      color: '#2980b9',
      defaultCode: `-- Welcome to SQL Playground!
-- This uses a temporary in-memory SQLite database

-- Create a sample table
CREATE TABLE employees (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    department TEXT
);

-- Insert sample data
INSERT INTO employees (name, age, department) VALUES
    ('Alice', 28, 'Engineering'),
    ('Bob', 32, 'Marketing'),
    ('Charlie', 29, 'Engineering'),
    ('Diana', 35, 'Sales');

-- Query the data
SELECT name, age, department 
FROM employees 
WHERE age > 25 
ORDER BY name;`,
      api: 'client-sql'
    },
    {
      id: 'html',
      name: 'HTML/CSS/JS',
      icon: <Zap size={24} />,
      description: 'Live web preview',
      color: '#e34c26',
      defaultCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Web Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
        }
        button:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, Web!</h1>
        <p>This is a live HTML/CSS/JavaScript preview.</p>
        <button onclick="showMessage()">Click Me!</button>
        <p id="output"></p>
    </div>
    
    <script>
        function showMessage() {
            document.getElementById('output').innerHTML = 
                'You clicked the button! Current time: ' + new Date().toLocaleTimeString();
        }
    </script>
</body>
</html>`,
      api: 'iframe'
    }
  ];

  useEffect(() => {
    if (activeCompiler) {
      const compiler = compilers.find(c => c.id === activeCompiler);
      if (compiler) {
        setCode(compiler.defaultCode);
        setOutput('');
        setError('');
      }
    }
  }, [activeCompiler]);

  const executePiston = async (language, code) => {
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: language,
          version: '*',
          files: [{
            name: language === 'java' ? 'Main.java' : `main.${language === 'python' ? 'py' : 'js'}`,
            content: code
          }]
        })
      });

      const result = await response.json();
      
      if (result.run) {
        if (result.run.stderr) {
          return { output: result.run.stderr, error: true };
        }
        return { output: result.run.stdout || 'Code executed successfully (no output)', error: false };
      }
      
      return { output: 'Execution failed', error: true };
    } catch (err) {
      return { output: `API Error: ${err.message}`, error: true };
    }
  };

  const executeSQL = async (code) => {
    try {
      if (!window.initSqlJs) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const SQL = await window.initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      });

      const db = new SQL.Database();
      const statements = code.split(';').filter(s => s.trim());
      let results = [];

      for (let statement of statements) {
        if (!statement.trim()) continue;
        
        try {
          const result = db.exec(statement);
          if (result.length > 0) {
            for (let table of result) {
              let tableStr = '\n' + table.columns.join(' | ') + '\n';
              tableStr += '-'.repeat(table.columns.join(' | ').length) + '\n';
              for (let row of table.values) {
                tableStr += row.join(' | ') + '\n';
              }
              results.push(tableStr);
            }
          } else {
            results.push('✓ Query executed successfully\n');
          }
        } catch (err) {
          results.push(`✗ SQL Error: ${err.message}\n`);
        }
      }

      db.close();
      return { output: results.join('\n') || 'No results', error: false };
    } catch (err) {
      return { output: `SQL Execution Error: ${err.message}`, error: true };
    }
  };

  const executeHTML = (code) => {
    return { output: code, error: false, isHTML: true };
  };

  const runCode = async () => {
    setIsRunning(true);
    setError('');
    setOutput('');

    const compiler = compilers.find(c => c.id === activeCompiler);
    let result;

    try {
      switch (compiler.api) {
        case 'piston':
          result = await executePiston(activeCompiler, code);
          break;
        case 'client-sql':
          result = await executeSQL(code);
          break;
        case 'iframe':
          result = executeHTML(code);
          break;
        default:
          result = { output: 'Unknown compiler type', error: true };
      }

      if (result.error) {
        setError(result.output);
      } else {
        setOutput(result.output);
      }
    } catch (err) {
      setError(`Execution failed: ${err.message}`);
    }

    setIsRunning(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadCode = () => {
    const compiler = compilers.find(c => c.id === activeCompiler);
    const extensions = {
      python: 'py',
      javascript: 'js',
      java: 'java',
      sql: 'sql',
      html: 'html'
    };
    
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `code.${extensions[activeCompiler]}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCompilerSelect = (compiler) => {
    setActiveCompiler(compiler.id);
  };

  const goBack = () => {
    setActiveCompiler(null);
    setError('');
    setOutput('');
  };

  if (activeCompiler) {
    const compiler = compilers.find(c => c.id === activeCompiler);
    const isHTMLMode = compiler.api === 'iframe';

    return (
      <div style={styles.container}>
        <div style={styles.contentWrapper}>
          <div style={styles.headerSection}>
            <button onClick={goBack} style={styles.backButton}>
              <ChevronLeft size={20} />
              <span>Back to Compilers</span>
            </button>
            <h1 style={styles.mainTitle}>{compiler.name} Compiler</h1>
            <p style={styles.subtitle}>{compiler.description}</p>
          </div>

          <div style={styles.editorGrid}>
            {/* Code Editor */}
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <div style={styles.panelHeaderLeft}>
                  {compiler.icon}
                  <h3 style={styles.panelTitle}>Code Editor</h3>
                </div>
                <div style={styles.buttonGroup}>
                  <button
                    onClick={runCode}
                    disabled={isRunning}
                    style={{...styles.runButton, ...(isRunning && styles.runButtonDisabled)}}
                  >
                    <Play size={16} />
                    <span>{isRunning ? 'Running...' : 'Run'}</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(code)}
                    style={styles.iconButton}
                    title="Copy code"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={downloadCode}
                    style={styles.iconButton}
                    title="Download code"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
              <textarea
                style={styles.codeEditor}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your code here..."
                spellCheck="false"
              />
            </div>

            {/* Output */}
            <div style={styles.panel}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}>
                  {isHTMLMode ? 'Preview' : 'Output'}
                </h3>
                {!isHTMLMode && output && (
                  <button
                    onClick={() => copyToClipboard(output)}
                    style={styles.iconButton}
                    title="Copy output"
                  >
                    <Copy size={16} />
                  </button>
                )}
              </div>
              <div style={styles.outputContainer}>
                {isRunning ? (
                  <div style={styles.centerMessage}>
                    <div style={styles.loadingText}>Executing code...</div>
                  </div>
                ) : error ? (
                  <pre style={styles.errorOutput}>{error}</pre>
                ) : isHTMLMode && output ? (
                  <iframe
                    srcDoc={output}
                    style={styles.iframe}
                    sandbox="allow-scripts"
                    title="HTML Preview"
                  />
                ) : output ? (
                  <pre style={styles.output}>{output}</pre>
                ) : (
                  <div style={styles.centerMessage}>
                    <div style={styles.placeholderText}>
                      {isHTMLMode ? 'Preview will appear here' : 'Output will appear here'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.welcomeHeader}>
          <h1 style={styles.welcomeTitle}>Online Compiler</h1>
          <p style={styles.welcomeSubtitle}>Choose your programming language and start coding instantly</p>
        </div>

        <div style={styles.compilerGrid}>
          {compilers.map((compiler) => (
            <div
              key={compiler.id}
              onClick={() => handleCompilerSelect(compiler)}
              style={styles.compilerCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.backgroundColor = '#2d3748';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.backgroundColor = '#1a202c';
              }}
            >
              <div
                style={{...styles.compilerIcon, backgroundColor: compiler.color}}
              >
                {compiler.icon}
              </div>
              <h3 style={styles.compilerCardTitle}>{compiler.name}</h3>
              <p style={styles.compilerCardDesc}>{compiler.description}</p>
            </div>
          ))}
        </div>

        <div style={styles.featuresBox}>
          <h2 style={styles.featuresTitle}>Features</h2>
          <ul style={styles.featuresList}>
            <li style={styles.featureItem}>✓ Real-time code execution using Piston API</li>
            <li style={styles.featureItem}>✓ Support for Python, JavaScript, Java, SQL, and HTML/CSS</li>
            <li style={styles.featureItem}>✓ Client-side SQL execution with SQLite</li>
            <li style={styles.featureItem}>✓ Live HTML/CSS/JS preview</li>
            <li style={styles.featureItem}>✓ Download and copy code functionality</li>
            <li style={styles.featureItem}>✓ No server setup required for students</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  contentWrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
  },
  headerSection: {
    marginBottom: '24px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#374151',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  mainTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginTop: '16px',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: '16px',
    margin: 0,
  },
  editorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '24px',
  },
  panel: {
    backgroundColor: '#1a202c',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #374151',
  },
  panelHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  panelTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  runButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  runButtonDisabled: {
    backgroundColor: '#4b5563',
    cursor: 'not-allowed',
  },
  iconButton: {
    padding: '10px',
    backgroundColor: '#374151',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  codeEditor: {
    width: '100%',
    height: '500px',
    padding: '16px',
    backgroundColor: '#0f172a',
    color: '#e5e7eb',
    fontFamily: '"Fira Code", "Courier New", monospace',
    fontSize: '14px',
    border: 'none',
    resize: 'none',
    outline: 'none',
    lineHeight: '1.6',
  },
  outputContainer: {
    height: '500px',
    overflow: 'auto',
  },
  centerMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  loadingText: {
    color: '#9ca3af',
  },
  errorOutput: {
    padding: '16px',
    color: '#f87171',
    fontFamily: '"Fira Code", "Courier New", monospace',
    fontSize: '14px',
    whiteSpace: 'pre-wrap',
    margin: 0,
    lineHeight: '1.6',
  },
  output: {
    padding: '16px',
    color: '#e5e7eb',
    fontFamily: '"Fira Code", "Courier New", monospace',
    fontSize: '14px',
    whiteSpace: 'pre-wrap',
    margin: 0,
    lineHeight: '1.6',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: '#ffffff',
  },
  placeholderText: {
    color: '#6b7280',
  },
  welcomeHeader: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  welcomeTitle: {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '16px',
    margin: 0,
  },
  welcomeSubtitle: {
    fontSize: '20px',
    color: '#9ca3af',
    margin: 0,
  },
  compilerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '48px',
  },
  compilerCard: {
    backgroundColor: '#1a202c',
    borderRadius: '12px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  compilerIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    color: '#ffffff',
  },
  compilerCardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
    margin: 0,
  },
  compilerCardDesc: {
    color: '#9ca3af',
    fontSize: '14px',
    margin: 0,
  },
  featuresBox: {
    padding: '24px',
    backgroundColor: '#1a202c',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  featuresTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    marginTop: 0,
  },
  featuresList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  featureItem: {
    color: '#d1d5db',
    marginBottom: '8px',
    fontSize: '16px',
  },
};

export default OnlineCompiler;
