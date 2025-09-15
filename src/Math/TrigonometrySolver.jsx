// src/components/math/TrigonometrySolver.jsx
import React, { useState } from 'react';
import FunctionGraph from './FunctionGraph';
import './styles/TrigonometrySolver.css';

const TrigonometrySolver = () => {
  const [trigType, setTrigType] = useState('equation');
  const [functionType, setFunctionType] = useState('sin');
  const [amplitude, setAmplitude] = useState('1');
  const [period, setPeriod] = useState('1');
  const [phaseShift, setPhaseShift] = useState('0');
  const [verticalShift, setVerticalShift] = useState('0');
  const [equation, setEquation] = useState('sin(x) = 0.5');
  const [angleUnit, setAngleUnit] = useState('radians'); // 'radians' or 'degrees'
  const [result, setResult] = useState('');
  const [steps, setSteps] = useState([]);
  const [showSteps, setShowSteps] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [functionExpression, setFunctionExpression] = useState('sin(x)');
  const [solutions, setSolutions] = useState([]);
  
  // Create a function expression for graphing
  const createFunctionExpression = () => {
    const a = parseFloat(amplitude) || 1;
    const b = parseFloat(period) || 1;
    const c = parseFloat(phaseShift) || 0;
    const d = parseFloat(verticalShift) || 0;
    
    let expression = '';
    
    if (functionType === 'sin') {
      expression = `${a} * sin(${b} * (x - ${c})) + ${d}`;
    } else if (functionType === 'cos') {
      expression = `${a} * cos(${b} * (x - ${c})) + ${d}`;
    } else if (functionType === 'tan') {
      expression = `${a} * tan(${b} * (x - ${c})) + ${d}`;
    }
    
    return expression;
  };
  
  // Solve basic trigonometric equations
  const solveTrigEquation = () => {
    if (!equation) {
      setResult('Please enter an equation');
      setSteps([]);
      return;
    }
    
    const solutionSteps = [];
    const newSolutions = [];
    
    // Step 1: Write the equation
    solutionSteps.push({
      title: 'Equation',
      content: equation
    });
    
    // Try to match common patterns
    // Pattern: sin(x) = k
    const sinMatch = equation.match(/sin\s*\(\s*([a-zA-Z])\s*\)\s*=\s*([+-]?\d*\.?\d+)/);
    if (sinMatch) {
      const variable = sinMatch[1];
      const k = parseFloat(sinMatch[2]);
      
      if (Math.abs(k) > 1) {
        solutionSteps.push({
          title: 'No Solution',
          content: `Since |${k}| > 1, there is no solution because the range of sin(${variable}) is [-1, 1].`
        });
        setResult('No solution');
      } else {
        solutionSteps.push({
          title: 'General Solution',
          content: `For sin(${variable}) = ${k}, the general solution is:`
        });
        
        const principalAngle = angleUnit === 'radians' 
          ? Math.asin(k) 
          : Math.asin(k) * 180 / Math.PI;
        
        solutionSteps.push({
          title: 'Principal Angle',
          content: `The principal angle is ${variable} = ${principalAngle.toFixed(4)} ${angleUnit === 'radians' ? 'radians' : 'degrees'}`
        });
        
        if (angleUnit === 'radians') {
          solutionSteps.push({
            title: 'General Solution',
            content: `${variable} = ${principalAngle.toFixed(4)} + 2πn or ${variable} = ${(Math.PI - principalAngle).toFixed(4)} + 2πn, where n is an integer.`
          });
          
          setResult(`${variable} = ${principalAngle.toFixed(4)} + 2πn or ${variable} = ${(Math.PI - principalAngle).toFixed(4)} + 2πn`);
          newSolutions.push(principalAngle, Math.PI - principalAngle);
        } else {
          solutionSteps.push({
            title: 'General Solution',
            content: `${variable} = ${principalAngle.toFixed(4)}° + 360°n or ${variable} = ${(180 - principalAngle).toFixed(4)}° + 360°n, where n is an integer.`
          });
          
          setResult(`${variable} = ${principalAngle.toFixed(4)}° + 360°n or ${variable} = ${(180 - principalAngle).toFixed(4)}° + 360°n`);
          newSolutions.push(principalAngle, 180 - principalAngle);
        }
      }
    }
    
    // Pattern: cos(x) = k
    const cosMatch = equation.match(/cos\s*\(\s*([a-zA-Z])\s*\)\s*=\s*([+-]?\d*\.?\d+)/);
    if (cosMatch) {
      const variable = cosMatch[1];
      const k = parseFloat(cosMatch[2]);
      
      if (Math.abs(k) > 1) {
        solutionSteps.push({
          title: 'No Solution',
          content: `Since |${k}| > 1, there is no solution because the range of cos(${variable}) is [-1, 1].`
        });
        setResult('No solution');
      } else {
        solutionSteps.push({
          title: 'General Solution',
          content: `For cos(${variable}) = ${k}, the general solution is:`
        });
        
        const principalAngle = angleUnit === 'radians' 
          ? Math.acos(k) 
          : Math.acos(k) * 180 / Math.PI;
        
        solutionSteps.push({
          title: 'Principal Angle',
          content: `The principal angle is ${variable} = ${principalAngle.toFixed(4)} ${angleUnit === 'radians' ? 'radians' : 'degrees'}`
        });
        
        if (angleUnit === 'radians') {
          solutionSteps.push({
            title: 'General Solution',
            content: `${variable} = ±${principalAngle.toFixed(4)} + 2πn, where n is an integer.`
          });
          
          setResult(`${variable} = ±${principalAngle.toFixed(4)} + 2πn`);
          newSolutions.push(principalAngle, -principalAngle);
        } else {
          solutionSteps.push({
            title: 'General Solution',
            content: `${variable} = ±${principalAngle.toFixed(4)}° + 360°n, where n is an integer.`
          });
          
          setResult(`${variable} = ±${principalAngle.toFixed(4)}° + 360°n`);
          newSolutions.push(principalAngle, -principalAngle);
        }
      }
    }
    
    // Pattern: tan(x) = k
    const tanMatch = equation.match(/tan\s*\(\s*([a-zA-Z])\s*\)\s*=\s*([+-]?\d*\.?\d+)/);
    if (tanMatch) {
      const variable = tanMatch[1];
      const k = parseFloat(tanMatch[2]);
      
      solutionSteps.push({
        title: 'General Solution',
        content: `For tan(${variable}) = ${k}, the general solution is:`
      });
      
      const principalAngle = angleUnit === 'radians' 
        ? Math.atan(k) 
        : Math.atan(k) * 180 / Math.PI;
      
      solutionSteps.push({
        title: 'Principal Angle',
        content: `The principal angle is ${variable} = ${principalAngle.toFixed(4)} ${angleUnit === 'radians' ? 'radians' : 'degrees'}`
      });
      
      if (angleUnit === 'radians') {
        solutionSteps.push({
          title: 'General Solution',
          content: `${variable} = ${principalAngle.toFixed(4)} + πn, where n is an integer.`
        });
        
        setResult(`${variable} = ${principalAngle.toFixed(4)} + πn`);
        newSolutions.push(principalAngle);
      } else {
        solutionSteps.push({
          title: 'General Solution',
          content: `${variable} = ${principalAngle.toFixed(4)}° + 180°n, where n is an integer.`
        });
        
        setResult(`${variable} = ${principalAngle.toFixed(4)}° + 180°n`);
        newSolutions.push(principalAngle);
      }
    }
    
    // If no pattern matched
    if (newSolutions.length === 0) {
      solutionSteps.push({
        title: 'Unsupported Equation',
        content: 'This equation type is not supported by the current solver. Please try equations in the form sin(x) = k, cos(x) = k, or tan(x) = k.'
      });
      setResult('Unable to solve this equation type');
    }
    
    setSteps(solutionSteps);
    setSolutions(newSolutions);
  };
  
  // Simplify trigonometric expressions
  const simplifyTrigExpression = () => {
    if (!equation) {
      setResult('Please enter an expression');
      setSteps([]);
      return;
    }
    
    const solutionSteps = [];
    let simplified = equation;
    
    // Step 1: Write the original expression
    solutionSteps.push({
      title: 'Original Expression',
      content: equation
    });
    
    // Apply Pythagorean identities
    if (equation.includes('sin^2') && equation.includes('cos^2')) {
      simplified = simplified.replace(/sin\s*\^\s*2\s*\(\s*([a-zA-Z])\s*\)\s*\+\s*cos\s*\^\s*2\s*\(\s*\1\s*\)/g, '1');
      simplified = simplified.replace(/cos\s*\^\s*2\s*\(\s*([a-zA-Z])\s*\)\s*\+\s*sin\s*\^\s*2\s*\(\s*\1\s*\)/g, '1');
      
      if (simplified !== equation) {
        solutionSteps.push({
          title: 'Pythagorean Identity',
          content: 'Using sin²(x) + cos²(x) = 1'
        });
        solutionSteps.push({
          title: 'Simplified',
          content: simplified
        });
      }
    }
    
    // Apply double angle identities
    if (equation.includes('2sin') && equation.includes('cos')) {
      simplified = simplified.replace(/2\s*\*\s*sin\s*\(\s*([a-zA-Z])\s*\)\s*\*\s*cos\s*\(\s*\1\s*\)/g, 'sin(2*$1)');
      
      if (simplified !== equation) {
        solutionSteps.push({
          title: 'Double Angle Identity',
          content: 'Using 2sin(x)cos(x) = sin(2x)'
        });
        solutionSteps.push({
          title: 'Simplified',
          content: simplified
        });
      }
    }
    
    // Apply other identities as needed
    // This is a simplified implementation
    
    // If no simplification occurred
    if (simplified === equation) {
      solutionSteps.push({
        title: 'No Further Simplification',
        content: 'The expression cannot be simplified further with the available identities.'
      });
    }
    
    setSteps(solutionSteps);
    setResult(`Simplified: ${simplified}`);
  };
  
  // Generate trigonometric function
  const generateTrigFunction = () => {
    const a = parseFloat(amplitude) || 1;
    const b = parseFloat(period) || 1;
    const c = parseFloat(phaseShift) || 0;
    const d = parseFloat(verticalShift) || 0;
    
    const solutionSteps = [];
    
    // Step 1: Function form
    solutionSteps.push({
      title: 'Function Form',
      content: `${functionType}(x) = ${a} * ${functionType}(${b} * (x - ${c})) + ${d}`
    });
    
    // Step 2: Amplitude
    solutionSteps.push({
      title: 'Amplitude',
      content: `Amplitude = |${a}| = ${Math.abs(a)}`
    });
    
    // Step 3: Period
    let periodValue = '';
    if (functionType === 'sin' || functionType === 'cos') {
      periodValue = `${(2 * Math.PI / b).toFixed(4)} ${angleUnit === 'radians' ? 'radians' : 'degrees'}`;
    } else if (functionType === 'tan') {
      periodValue = `${(Math.PI / b).toFixed(4)} ${angleUnit === 'radians' ? 'radians' : 'degrees'}`;
    }
    
    solutionSteps.push({
      title: 'Period',
      content: `Period = ${periodValue}`
    });
    
    // Step 4: Phase Shift
    solutionSteps.push({
      title: 'Phase Shift',
      content: `Phase Shift = ${c} ${angleUnit === 'radians' ? 'radians' : 'degrees'} to the ${c >= 0 ? 'right' : 'left'}`
    });
    
    // Step 5: Vertical Shift
    solutionSteps.push({
      title: 'Vertical Shift',
      content: `Vertical Shift = ${d} units ${d >= 0 ? 'up' : 'down'}`
    });
    
    setSteps(solutionSteps);
    setResult(`${functionType}(x) = ${a} * ${functionType}(${b} * (x - ${c})) + ${d}`);
    setFunctionExpression(createFunctionExpression());
  };
  
  const handleSolve = () => {
    setShowSteps(true);
    setShowGraph(true);
    
    if (trigType === 'equation') {
      solveTrigEquation();
    } else if (trigType === 'identity') {
      simplifyTrigExpression();
    } else if (trigType === 'function') {
      generateTrigFunction();
    }
  };
  
  const toggleSteps = () => {
    setShowSteps(!showSteps);
  };
  
  const toggleGraph = () => {
    setShowGraph(!showGraph);
  };

  return (
    <div className="trig-solver">
      <h2>Trigonometry Solver</h2>
      
      <div className="trig-type-selector">
        <label>
          <input 
            type="radio" 
            value="equation" 
            checked={trigType === 'equation'} 
            onChange={() => setTrigType('equation')} 
          />
          Solve Equation
        </label>
        <label>
          <input 
            type="radio" 
            value="identity" 
            checked={trigType === 'identity'} 
            onChange={() => setTrigType('identity')} 
          />
          Simplify Identity
        </label>
        <label>
          <input 
            type="radio" 
            value="function" 
            checked={trigType === 'function'} 
            onChange={() => setTrigType('function')} 
          />
          Generate Function
        </label>
      </div>
      
      {trigType === 'equation' && (
        <div className="equation-inputs">
          <div className="input-group">
            <label>Equation:</label>
            <input 
              type="text" 
              value={equation} 
              onChange={(e) => setEquation(e.target.value)} 
              placeholder="e.g., sin(x) = 0.5"
            />
          </div>
          <div className="input-group">
            <label>Angle Unit:</label>
            <select 
              value={angleUnit} 
              onChange={(e) => setAngleUnit(e.target.value)}
            >
              <option value="radians">Radians</option>
              <option value="degrees">Degrees</option>
            </select>
          </div>
        </div>
      )}
      
      {trigType === 'identity' && (
        <div className="identity-inputs">
          <div className="input-group">
            <label>Expression:</label>
            <input 
              type="text" 
              value={equation} 
              onChange={(e) => setEquation(e.target.value)} 
              placeholder="e.g., sin^2(x) + cos^2(x)"
            />
          </div>
        </div>
      )}
      
      {trigType === 'function' && (
        <div className="function-inputs">
          <div className="input-group">
            <label>Function Type:</label>
            <select 
              value={functionType} 
              onChange={(e) => setFunctionType(e.target.value)}
            >
              <option value="sin">Sine</option>
              <option value="cos">Cosine</option>
              <option value="tan">Tangent</option>
            </select>
          </div>
          <div className="input-group">
            <label>Amplitude (a):</label>
            <input 
              type="number" 
              value={amplitude} 
              onChange={(e) => setAmplitude(e.target.value)} 
              placeholder="Amplitude"
              step="0.1"
            />
          </div>
          <div className="input-group">
            <label>Period Factor (b):</label>
            <input 
              type="number" 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)} 
              placeholder="Period factor"
              step="0.1"
            />
          </div>
          <div className="input-group">
            <label>Phase Shift (c):</label>
            <input 
              type="number" 
              value={phaseShift} 
              onChange={(e) => setPhaseShift(e.target.value)} 
              placeholder="Phase shift"
              step="0.1"
            />
          </div>
          <div className="input-group">
            <label>Vertical Shift (d):</label>
            <input 
              type="number" 
              value={verticalShift} 
              onChange={(e) => setVerticalShift(e.target.value)} 
              placeholder="Vertical shift"
              step="0.1"
            />
          </div>
          <div className="input-group">
            <label>Angle Unit:</label>
            <select 
              value={angleUnit} 
              onChange={(e) => setAngleUnit(e.target.value)}
            >
              <option value="radians">Radians</option>
              <option value="degrees">Degrees</option>
            </select>
          </div>
        </div>
      )}
      
      <button className="solve-button" onClick={handleSolve}>
        {trigType === 'equation' ? 'Solve Equation' : 
         trigType === 'identity' ? 'Simplify Identity' : 'Generate Function'}
      </button>
      
      {result && (
        <div className="result-container">
          <div className="result">{result}</div>
          <div className="toggle-buttons">
            <button className="toggle-steps-button" onClick={toggleSteps}>
              {showSteps ? 'Hide Steps' : 'Show Steps'}
            </button>
            <button className="toggle-graph-button" onClick={toggleGraph}>
              {showGraph ? 'Hide Graph' : 'Show Graph'}
            </button>
          </div>
        </div>
      )}
      
      {showSteps && steps.length > 0 && (
        <div className="steps-container">
          <h3>Solution Steps</h3>
          <div className="steps">
            {steps.map((step, index) => (
              <div key={index} className="step">
                <div className="step-title">{step.title}</div>
                <div className="step-content">
                  {Array.isArray(step.content) ? (
                    <ul>
                      {step.content.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{step.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showGraph && functionExpression && (
        <div className="graph-container">
          <h3>Function Visualization</h3>
          <FunctionGraph 
            functionExpression={functionExpression}
            title={`${functionType === 'sin' ? 'Sine' : 
                     functionType === 'cos' ? 'Cosine' : 
                     'Tangent'} Function`}
            xRange={angleUnit === 'radians' ? { min: -2 * Math.PI, max: 2 * Math.PI } : 
                     { min: -360, max: 360 }}
            yRange={trigType === 'function' ? 
                     { min: -Math.abs(parseFloat(amplitude) || 1) - Math.abs(parseFloat(verticalShift) || 0) - 1, 
                       max: Math.abs(parseFloat(amplitude) || 1) + Math.abs(parseFloat(verticalShift) || 0) + 1 } : 
                     { min: -2, max: 2 }}
            solutions={solutions}
          />
        </div>
      )}
    </div>
  );
};

export default TrigonometrySolver;
