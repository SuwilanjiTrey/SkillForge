import React, { useState, useRef, useEffect } from 'react';
import { Play, Copy, Download, Settings, Code, Terminal, RefreshCw, Menu, Sun, Moon } from 'lucide-react';
import '../Styles/Compiler.css';

const OnlineCompiler = () => {
  const [activeLanguage, setActiveLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [activePanel, setActivePanel] = useState('code');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const outputRef = useRef(null);

  const languages = [
    { 
      id: 'javascript', 
      name: 'JavaScript', 
      icon: '🟨',
      defaultCode: `// Welcome to the JavaScript Online Compiler!
console.log("Hello, World!");

// Try some basic operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log("Doubled numbers:", doubled);

// Function example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci(7):", fibonacci(7));`
    },
    { 
      id: 'python', 
      name: 'Python', 
      icon: '🐍',
      defaultCode: `# Python compiler coming soon!
print("Python support will be added in the next update")`,
      disabled: true
    },
    { 
      id: 'sql', 
      name: 'SQL', 
      icon: '🗄️',
      defaultCode: `-- SQL compiler coming soon!
SELECT 'SQL support will be added soon' as message;`,
      disabled: true
    }
  ];

  useEffect(() => {
    const currentLang = languages.find(lang => lang.id === activeLanguage);
    if (currentLang && !code) {
      setCode(currentLang.defaultCode);
    }
    
    // Set theme attribute for CSS variables
    document.documentElement.setAttribute('data-theme', theme);
  }, [activeLanguage, theme]);

  const runJavaScript = (code) => {
    const logs = [];
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

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
      logs.push({ type: 'error', content: `Error: ${error.message}` });
    } finally {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    }

    return logs;
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
      
      if (activeLanguage === 'javascript') {
        const logs = runJavaScript(code);
        
        if (logs.length === 0) {
          setOutput('// Code executed successfully (no output)');
        } else {
          const outputText = logs.map(log => {
            const prefix = log.type === 'error' ? '❌ ' : 
                          log.type === 'warn' ? '⚠️ ' : '';
            return `${prefix}${log.content}`;
          }).join('\n');
          setOutput(outputText);
        }
      } else {
        setOutput('// This language is not yet supported');
      }
    } catch (error) {
      setOutput(`// Execution Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const downloadCode = () => {
    const extension = activeLanguage === 'javascript' ? 'js' : 
                     activeLanguage === 'python' ? 'py' : 'sql';
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
    if (languages.find(lang => lang.id === langId)?.disabled) return;
    
    setActiveLanguage(langId);
    const newLang = languages.find(lang => lang.id === langId);
    setCode(newLang?.defaultCode || '');
    setOutput('');
    setShowLanguageMenu(false);
  };

  const currentLanguage = languages.find(lang => lang.id === activeLanguage);

  return (
    <div className="compiler-container">
      {/* Header */}
      <div className="compiler-header">
        <div className="header-content">
          <div className="header-title-container">
            <div className="header-icon">
              <Code />
            </div>
            <h1 className="header-title">
              Code Playground
            </h1>
            
            <div className="header-actions">
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                className="theme-toggle"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun /> : <Moon />}
              </button>
              
              <div className="language-menu-mobile">
                <button 
                  className="language-menu-button"
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                >
                  <Menu />
                </button>
                
                {showLanguageMenu && (
                  <div className="language-dropdown">
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => switchLanguage(lang.id)}
                        disabled={lang.disabled}
                        className={`language-option ${activeLanguage === lang.id ? 'active' : ''} ${lang.disabled ? 'disabled' : ''}`}
                      >
                        <span className="text-lg">{lang.icon}</span>
                        <span className="font-medium">{lang.name}</span>
                        {lang.disabled && <span className="text-xs opacity-75">(Soon)</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Language Tabs */}
          <div className="language-tabs">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => switchLanguage(lang.id)}
                disabled={lang.disabled}
                className={`language-tab ${activeLanguage === lang.id ? 'active' : ''} ${lang.disabled ? 'disabled' : ''}`}
              >
                <span>{lang.icon}</span>
                <span>{lang.name}</span>
                {lang.disabled && <span className="text-xs opacity-75">(Soon)</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="mobile-nav">
        <button 
          className={`mobile-nav-button ${activePanel === 'code' ? 'active' : ''}`}
          onClick={() => setActivePanel('code')}
        >
          <Code />
          Code
        </button>
        <button 
          className={`mobile-nav-button ${activePanel === 'output' ? 'active' : ''}`}
          onClick={() => setActivePanel('output')}
        >
          <Terminal />
          Output
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Code Editor Panel */}
        <div className={`panel ${activePanel === 'code' ? '' : 'hidden-md'}`}>
          <div className="panel-header">
            <h3 className="panel-title">
              <Code />
              Code Editor
              <span className="language-badge">
                {currentLanguage?.name}
              </span>
            </h3>
            <div className="panel-actions">
              <button 
                onClick={copyCode} 
                className="panel-action-button"
                title="Copy Code"
              >
                <Copy />
              </button>
              <button 
                onClick={downloadCode} 
                className="panel-action-button"
                title="Download Code"
              >
                <Download />
              </button>
            </div>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="code-editor"
            placeholder="Write your code here..."
            spellCheck="false"
          />
          
          <div className="run-button-container">
            <button
              onClick={executeCode}
              disabled={isRunning || currentLanguage?.disabled}
              className="run-button"
            >
              {isRunning ? (
                <RefreshCw className="animate-spin" />
              ) : (
                <Play />
              )}
              <span>{isRunning ? 'Running...' : 'Run Code'}</span>
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className={`panel output-panel ${activePanel === 'output' ? '' : 'hidden-md'}`}>
          <div className="panel-header">
            <h3 className="panel-title">
              <Terminal />
              Console Output
            </h3>
            <button 
              onClick={clearOutput} 
              className="clear-button"
            >
              Clear
            </button>
          </div>
          
          <div 
            ref={outputRef}
            className="output-content"
          >
            {output || (
              <span className="output-placeholder">
                // Output will appear here...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="mobile-fab">
        <button
          onClick={executeCode}
          disabled={isRunning || currentLanguage?.disabled}
          className="mobile-fab-button"
        >
          {isRunning ? (
            <RefreshCw className="animate-spin" />
          ) : (
            <Play />
          )}
          <span className="fab-text">
            {isRunning ? 'Running...' : 'Run'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default OnlineCompiler;
