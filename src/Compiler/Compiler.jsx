import React, { useState } from 'react';
import { ChevronLeft, Play, Copy, Download, Database, Code, FileText } from 'lucide-react';
import "../Styles/Compiler.css";

const OnlineCompiler = () => {
  const [activeCompiler, setActiveCompiler] = useState(null);
  const [sqlCode, setSqlCode] = useState(`-- Welcome to SQL Compiler
-- Try running this sample query

SELECT 
  name,
  age,
  department
FROM employees
WHERE age > 25
ORDER BY name;`);
  
  const [sqlOutput, setSqlOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');

  const compilers = [
    {
      id: 'sql',
      name: 'SQL Compiler',
      icon: <Database size={24} />,
      description: 'Execute SQL queries and statements',
      color: '#2980b9'
    },
    {
      id: 'python',
      name: 'Python Compiler',
      icon: <Code size={24} />,
      description: 'Run Python code (Coming Soon)',
      color: '#3498db',
      disabled: true
    },
    {
      id: 'javascript',
      name: 'JavaScript Compiler',
      icon: <FileText size={24} />,
      description: 'Execute JavaScript code (Coming Soon)',
      color: '#9b59b6',
      disabled: true
    }
  ];

  const runSQLCode = async () => {
    setIsRunning(true);
    setError('');
    
    // Simulate SQL execution
    setTimeout(() => {
      try {
        // Mock SQL execution result
        if (sqlCode.trim().toLowerCase().includes('select')) {
          setSqlOutput(`Query executed successfully!

Result:
+----------+-----+------------+
| name     | age | department |
+----------+-----+------------+
| Alice    | 28  | Engineering|
| Bob      | 32  | Marketing  |
| Charlie  | 29  | Engineering|
+----------+-----+------------+

3 rows returned
Execution time: 0.045s`);
        } else if (sqlCode.trim().toLowerCase().includes('create')) {
          setSqlOutput('Table created successfully!\nExecution time: 0.012s');
        } else if (sqlCode.trim().toLowerCase().includes('insert')) {
          setSqlOutput('Data inserted successfully!\nRows affected: 1\nExecution time: 0.008s');
        } else if (sqlCode.trim().toLowerCase().includes('update')) {
          setSqlOutput('Data updated successfully!\nRows affected: 3\nExecution time: 0.015s');
        } else if (sqlCode.trim().toLowerCase().includes('delete')) {
          setSqlOutput('Data deleted successfully!\nRows affected: 2\nExecution time: 0.010s');
        } else {
          setSqlOutput('SQL statement executed successfully!\nExecution time: 0.005s');
        }
      } catch (err) {
        setError('SQL Error: Invalid syntax or query structure');
      }
      setIsRunning(false);
    }, 1500);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([sqlCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'query.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCompilerSelect = (compiler) => {
    if (!compiler.disabled) {
      setActiveCompiler(compiler.id);
      setError('');
      setSqlOutput('');
    }
  };

  const goBack = () => {
    setActiveCompiler(null);
    setError('');
    setSqlOutput('');
  };

  if (activeCompiler === 'sql') {
    return (
      <div className="compiler-container">
        <div className="header">
          <div className="header-content">
            <button onClick={goBack} className="back-button">
              <ChevronLeft size={20} />
              Back to Compilers
            </button>
            <h1>SQL Compiler</h1>
            <p>Execute SQL queries and statements with real-time feedback</p>
          </div>
        </div>

        <div className="compiler-interface">
          <div className="compiler-header">
            <Database size={24} />
            <h2>SQL Query Editor</h2>
          </div>

          <div className="compiler-body">
            <div className="code-panel">
              <div className="panel-header">
                <h3>SQL Query</h3>
                <div className="panel-controls">
                  <button 
                    className="control-btn run-btn"
                    onClick={runSQLCode}
                    disabled={isRunning}
                  >
                    <Play size={16} />
                    {isRunning ? 'Running...' : 'Run Query'}
                  </button>
                  <button 
                    className="control-btn"
                    onClick={() => copyToClipboard(sqlCode)}
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                  <button 
                    className="control-btn"
                    onClick={downloadCode}
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
              <textarea
                className="code-editor"
                value={sqlCode}
                onChange={(e) => setSqlCode(e.target.value)}
                placeholder="Enter your SQL query here..."
                spellCheck="false"
              />
            </div>

            <div className="output-panel">
              <div className="panel-header">
                <h3>Query Results</h3>
                <div className="panel-controls">
                  <button 
                    className="control-btn"
                    onClick={() => copyToClipboard(sqlOutput)}
                    disabled={!sqlOutput}
                  >
                    <Copy size={16} />
                    Copy Output
                  </button>
                </div>
              </div>
              <div className={`output-area ${error ? 'error' : ''}`}>
                {isRunning ? (
                  <div className="loading">Executing SQL query...</div>
                ) : error ? (
                  error
                ) : (
                  sqlOutput
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compiler-container">
      <div className="header">
        <div className="header-content">
          <h1>Online Compiler</h1>
          <p>Choose your programming language and start coding instantly</p>
        </div>
      </div>

      <div className="compiler-grid">
        {compilers.map((compiler) => (
          <div
            key={compiler.id}
            className={`compiler-card ${compiler.disabled ? 'disabled' : ''}`}
            onClick={() => handleCompilerSelect(compiler)}
          >
            {compiler.disabled && <span className="coming-soon">Coming Soon</span>}
            <div 
              className="compiler-icon"
              style={{ backgroundColor: compiler.color }}
            >
              {compiler.icon}
            </div>
            <h3>{compiler.name}</h3>
            <p>{compiler.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineCompiler;
