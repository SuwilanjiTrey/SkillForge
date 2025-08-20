import React, { useState, useRef, useEffect } from 'react';
import { Play, Copy, Download, Code, Terminal, RefreshCw, Menu, Sun, Moon, Trash2 } from 'lucide-react';
import Styles from '../Compiler/styles.js';
import { JavaScriptCompiler, PythonCompiler, SQLCompiler } from '../Compiler//Languages.jsx';



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

// SQL Table Renderer Component
const SQLTableRenderer = ({ data }) => {
  if (!data || !data.columns || !data.rows) return null;

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '1rem',
    border: '1px solid #ccc',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: '14px'
  };

  const thStyle = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    textAlign: 'left',
    fontWeight: 'bold',
    backgroundColor: '#f8f9fa',
    color: '#495057'
  };

  const tdStyle = {
    padding: '8px 12px',
    border: '1px solid #ddd',
    backgroundColor: '#ffffff'
  };

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          {data.columns.map((col, index) => (
            <th key={index} style={thStyle}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} style={tdStyle}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const MultiLanguageCompiler = () => {
  const [activeLanguage, setActiveLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [activePanel, setActivePanel] = useState('code');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [pythonStatus, setPythonStatus] = useState('uninitialized'); // 'uninitialized', 'loading', 'ready', 'failed'
  const outputRef = useRef(null);

  const languages = [JavaScriptCompiler, PythonCompiler, SQLCompiler];

  useEffect(() => {
    const currentLang = languages.find(lang => lang.id === activeLanguage);
    if (currentLang && !code) {
      setCode(currentLang.defaultCode);
    }
    
    // Initialize Python when it's selected
    if (activeLanguage === 'python' && pythonStatus === 'uninitialized') {
      initializePython();
    }
  }, [activeLanguage]);
  


  const initializePython = async () => {
    setPythonStatus('loading');
    try {
      const apiWorking = await PythonCompiler.initialize();
      setPythonStatus('ready');
    } catch (error) {
      setPythonStatus('failed');
      console.error('Python initialization failed:', error);
    }
  };

  const executeCode = async () => {
    if (!code.trim()) {
      setOutput('// No code to execute');
      return;
    }

    setIsRunning(true);
    setOutput('// Running...');
    setActivePanel('output');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const currentLanguage = languages.find(lang => lang.id === activeLanguage);
      let logs;

      if (activeLanguage === 'python') {
        if (pythonStatus === 'loading') {
          setOutput('// Initializing Python environment...');
          await initializePython();
          if (pythonStatus === 'ready') {
            logs = await currentLanguage.execute(code);
          } else {
            logs = [{ type: 'error', content: 'Python initialization failed' }];
          }
        } else if (pythonStatus === 'ready') {
          logs = await currentLanguage.execute(code);
        } else {
          logs = [{ type: 'error', content: 'Python environment not ready. Please try again.' }];
        }
      } else {
        logs = await currentLanguage.execute(code);
      }
      
      renderOutput(logs);
    } catch (error) {
      setOutput(`// Execution Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const renderOutput = (logs) => {
    if (!logs || logs.length === 0) {
      setOutput('// Code executed successfully (no output)');
      return;
    }

    // Handle different output types
    const outputElements = [];
    
    logs.forEach((log, index) => {
      if (log.type === 'table' && log.data) {
        // For SQL table results
        log.data.forEach((tableData, tableIndex) => {
          outputElements.push(
            <div key={`${index}-${tableIndex}`}>
              <SQLTableRenderer data={tableData} />
            </div>
          );
        });
      } else {
        // For regular text output
        const prefix = log.type === 'error' ? '❌ ' : 
                      log.type === 'warn' ? '⚠️ ' : '';
        outputElements.push(
          <div key={index} style={{ marginBottom: '0.5rem' }}>
            {prefix}{log.content}
          </div>
        );
      }
    });

    setOutput(outputElements);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const downloadCode = () => {
    const currentLanguage = languages.find(lang => lang.id === activeLanguage);
    const extension = currentLanguage.extension;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearOutput = () => {
    setOutput('');
  };

  const switchLanguage = (langId) => {
    setActiveLanguage(langId);
    const newLang = languages.find(lang => lang.id === langId);
    setCode(newLang?.defaultCode || '');
    setOutput('');
    setShowLanguageMenu(false);
  };

  const currentLanguage = languages.find(lang => lang.id === activeLanguage);

  

  // Responsive styles
  const isMobile = window.innerWidth < 768;
  
  const styles = Styles(theme);
  


  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <Code />
            Multi-Language Compiler
          </h1>
          
          <div style={styles.headerActions}>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              style={styles.themeToggle}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Language Tabs */}
        <div style={styles.languageTabs}>
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => switchLanguage(lang.id)}
              style={{
                ...styles.languageTab,
                ...(activeLanguage === lang.id ? styles.activeTab : {})
              }}
            >
              <img 
                src={lang.icon} 
                alt={lang.name}
                style={{ width: '20px', height: '20px' }}
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.textContent = 
                    lang.id === 'javascript' ? '🟨' :
                    lang.id === 'python' ? '🐍' : '🗄️';
                }}
              />
              <span style={{ marginLeft: '0.5rem' }}>
                {lang.id === 'javascript' ? '🟨' : 
                 lang.id === 'python' ? '🐍' : '🗄️'}
              </span>
              <span>{lang.name}</span>
              {lang.id === 'python' && pythonStatus === 'loading' && (
                <span style={{ color: '#fbbf24', fontSize: '0.8rem' }}>(Initializing...)</span>
              )}
              {lang.id === 'python' && pythonStatus === 'ready' && (
                <span style={{ color: '#10b981', fontSize: '0.8rem' }}>✓</span>
              )}
              {lang.id === 'python' && pythonStatus === 'failed' && (
                <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>⚠</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <div style={styles.mobileNav}>
          <button 
            style={{
              ...styles.mobileNavButton,
              ...(activePanel === 'code' ? styles.activeMobileNav : {})
            }}
            onClick={() => setActivePanel('code')}
          >
            <Code size={20} />
            Code
          </button>
          <button 
            style={{
              ...styles.mobileNavButton,
              ...(activePanel === 'output' ? styles.activeMobileNav : {})
            }}
            onClick={() => setActivePanel('output')}
          >
            <Terminal size={20} />
            Output
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Code Editor Panel */}
        <div style={{
          ...styles.panel,
          ...(isMobile && activePanel !== 'code' ? styles.hiddenMd : {})
        }}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>
              <Code size={20} />
              Code Editor
              <span style={styles.languageBadge}>
                {currentLanguage?.name}
              </span>
            </h3>
            <div style={styles.panelActions}>
              <button 
                onClick={copyCode} 
                style={styles.actionButton}
                title="Copy Code"
              >
                <Copy size={16} />
              </button>
              <button 
                onClick={downloadCode} 
                style={styles.actionButton}
                title="Download Code"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={styles.codeEditor}
            placeholder="Write your code here..."
            spellCheck="false"
          />
          
          <div style={styles.runButtonContainer}>
            <button
              onClick={executeCode}
              disabled={isRunning || (activeLanguage === 'python' && pythonStatus !== 'ready')}
              style={{
                ...styles.runButton,
                ...(isRunning || (activeLanguage === 'python' && pythonStatus !== 'ready') ? styles.runButtonDisabled : {})
              }}
            >
              {isRunning ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Play size={20} />
              )}
              <span>
                {isRunning ? 'Running...' : 
                 activeLanguage === 'python' && pythonStatus === 'loading' ? 'Initializing Python...' :
                 activeLanguage === 'python' && pythonStatus === 'failed' ? 'Python Unavailable' :
                 'Run Code'}
              </span>
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div style={{
          ...styles.panel,
          ...styles.outputPanel,
          ...(isMobile && activePanel !== 'output' ? styles.hiddenMd : {})
        }}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>
              <Terminal size={20} />
              Console Output
            </h3>
            <button 
              onClick={clearOutput} 
              style={styles.actionButton}
              title="Clear Output"
            >
              <Trash2 size={16} />
            </button>
          </div>
          
          <div 
            ref={outputRef}
            style={styles.outputContent}
          >
            {output ? (
              typeof output === 'string' ? (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                  {output}
                </pre>
              ) : (
                <div>{output}</div>
              )
            ) : (
              <span style={styles.outputPlaceholder}>
                // Output will appear here...
                {activeLanguage === 'python' && pythonStatus === 'loading' && (
                  <div style={{ marginTop: '0.5rem', color: '#fbbf24' }}>
                    🐍 Preparing Python environment...
                  </div>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <div style={styles.fab}>
          <button
            onClick={executeCode}
            disabled={isRunning || (activeLanguage === 'python' && pythonStatus !== 'ready')}
            style={{
              ...styles.fabButton,
              ...(isRunning || (activeLanguage === 'python' && pythonStatus !== 'ready') ? { backgroundColor: '#6b7280', cursor: 'not-allowed' } : {})
            }}
          >
            {isRunning ? (
              <RefreshCw size={20} />
            ) : (
              <Play size={20} />
            )}
            <span>
              {isRunning ? 'Running...' : 
               activeLanguage === 'python' && pythonStatus === 'loading' ? 'Init...' :
               activeLanguage === 'python' && pythonStatus === 'failed' ? 'Error' :
               'Run'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiLanguageCompiler;
