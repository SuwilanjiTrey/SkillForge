// src/components/math/EquationSolver.jsx
import React, { useState } from 'react';
import FunctionGraph from './FunctionGraph';
import './styles/EquationSolver.css';

const EquationSolver = () => {
  const [equationType, setEquationType] = useState('linear');
  const [coefficients, setCoefficients] = useState({ a: '', b: '', c: '', d: '' });
  const [result, setResult] = useState('');
  const [steps, setSteps] = useState([]);
  const [showSteps, setShowSteps] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [functionExpression, setFunctionExpression] = useState('');
  const [roots, setRoots] = useState([]);
  
  const handleCoefficientChange = (e, coeff) => {
    setCoefficients({
      ...coefficients,
      [coeff]: e.target.value
    });
  };
  
  // Format the equation for display and graphing
  const formatEquation = () => {
    const a = parseFloat(coefficients.a) || 0;
    const b = parseFloat(coefficients.b) || 0;
    const c = parseFloat(coefficients.c) || 0;
    const d = parseFloat(coefficients.d) || 0;
    
    let equation = '';
    
    if (equationType === 'linear') {
      equation = `${a}x + ${b}`;
    } else if (equationType === 'quadratic') {
      equation = `${a}x^2 + ${b}x + ${c}`;
    } else if (equationType === 'polynomial') {
      equation = `${a}x^3 + ${b}x^2 + ${c}x + ${d}`;
    }
    
    return equation;
  };
  
  // Create a function expression for graphing (f(x) = equation)
  const createFunctionExpression = () => {
    const a = parseFloat(coefficients.a) || 0;
    const b = parseFloat(coefficients.b) || 0;
    const c = parseFloat(coefficients.c) || 0;
    const d = parseFloat(coefficients.d) || 0;
    
    let expression = '';
    
    if (equationType === 'linear') {
      expression = `${a}*x + ${b}`;
    } else if (equationType === 'quadratic') {
      expression = `${a}*x**2 + ${b}*x + ${c}`;
    } else if (equationType === 'polynomial') {
      expression = `${a}*x**3 + ${b}*x**2 + ${c}*x + ${d}`;
    }
    
    return expression;
  };
  
  // Solve linear equation: ax + b = 0
  const solveLinearEquation = () => {
    const a = parseFloat(coefficients.a);
    const b = parseFloat(coefficients.b);
    
    if (isNaN(a) || isNaN(b)) {
      setResult('Please enter valid coefficients');
      setSteps([]);
      return;
    }
    
    const solutionSteps = [];
    const equation = formatEquation();
    
    // Step 1: Write the equation
    solutionSteps.push({
      title: 'Equation',
      content: `${equation} = 0`
    });
    
    // Step 2: Isolate the variable term
    solutionSteps.push({
      title: 'Isolate the variable term',
      content: `${a}x = ${-b}`
    });
    
    // Step 3: Solve for x
    let solutionText = '';
    if (a === 0) {
      if (b === 0) {
        solutionText = 'Infinite solutions (identity equation)';
        setRoots([]);
      } else {
        solutionText = 'No solution (contradiction)';
        setRoots([]);
      }
    } else {
      const x = -b / a;
      solutionText = `x = ${x.toFixed(4)}`;
      setRoots([x]);
    }
    
    solutionSteps.push({
      title: 'Solution',
      content: solutionText
    });
    
    setSteps(solutionSteps);
    setResult(solutionText);
    setFunctionExpression(createFunctionExpression());
  };
  
  // Solve quadratic equation: ax² + bx + c = 0
  const solveQuadraticEquation = () => {
    const a = parseFloat(coefficients.a);
    const b = parseFloat(coefficients.b);
    const c = parseFloat(coefficients.c);
    
    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      setResult('Please enter valid coefficients');
      setSteps([]);
      return;
    }
    
    const solutionSteps = [];
    const equation = formatEquation();
    
    // Step 1: Write the equation
    solutionSteps.push({
      title: 'Equation',
      content: `${equation} = 0`
    });
    
    // Step 2: Identify coefficients
    solutionSteps.push({
      title: 'Coefficients',
      content: `a = ${a}, b = ${b}, c = ${c}`
    });
    
    // Step 3: Calculate discriminant
    const discriminant = b * b - 4 * a * c;
    solutionSteps.push({
      title: 'Discriminant',
      content: `Δ = b² - 4ac = ${b}² - 4(${a})(${c}) = ${discriminant}`
    });
    
    // Step 4: Determine the nature of roots
    let solutionText = '';
    let newRoots = [];
    
    if (discriminant < 0) {
      solutionSteps.push({
        title: 'Nature of Roots',
        content: 'Since Δ < 0, the equation has two complex conjugate roots.'
      });
      
      // Calculate complex roots
      const realPart = -b / (2 * a);
      const imaginaryPart = Math.sqrt(-discriminant) / (2 * a);
      
      solutionSteps.push({
        title: 'Complex Roots Formula',
        content: `x = (-b ± √Δ) / (2a) = (-${b} ± √${discriminant}) / (2×${a})`
      });
      
      solutionSteps.push({
        title: 'Roots',
        content: `x = ${realPart.toFixed(4)} ± ${imaginaryPart.toFixed(4)}i`
      });
      
      solutionText = `x = ${realPart.toFixed(4)} ± ${imaginaryPart.toFixed(4)}i`;
      // For graphing, we'll use the real part
      newRoots = [realPart];
    } else if (discriminant === 0) {
      solutionSteps.push({
        title: 'Nature of Roots',
        content: 'Since Δ = 0, the equation has one real root (repeated).'
      });
      
      const x = -b / (2 * a);
      solutionSteps.push({
        title: 'Root',
        content: `x = -b / (2a) = -${b} / (2×${a}) = ${x.toFixed(4)}`
      });
      
      solutionText = `x = ${x.toFixed(4)}`;
      newRoots = [x];
    } else {
      solutionSteps.push({
        title: 'Nature of Roots',
        content: 'Since Δ > 0, the equation has two distinct real roots.'
      });
      
      const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      
      solutionSteps.push({
        title: 'Roots',
        content: `x₁ = (-b + √Δ) / (2a) = (-${b} + √${discriminant}) / (2×${a}) = ${x1.toFixed(4)}`
      });
      
      solutionSteps.push({
        title: 'Second Root',
        content: `x₂ = (-b - √Δ) / (2a) = (-${b} - √${discriminant}) / (2×${a}) = ${x2.toFixed(4)}`
      });
      
      solutionText = `x₁ = ${x1.toFixed(4)}, x₂ = ${x2.toFixed(4)}`;
      newRoots = [x1, x2];
    }
    
    setSteps(solutionSteps);
    setResult(solutionText);
    setFunctionExpression(createFunctionExpression());
    setRoots(newRoots);
  };
  
  // Solve cubic equation: ax³ + bx² + cx + d = 0
  const solveCubicEquation = () => {
    const a = parseFloat(coefficients.a);
    const b = parseFloat(coefficients.b);
    const c = parseFloat(coefficients.c);
    const d = parseFloat(coefficients.d);
    
    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) {
      setResult('Please enter valid coefficients');
      setSteps([]);
      return;
    }
    
    const solutionSteps = [];
    const equation = formatEquation();
    
    // Step 1: Write the equation
    solutionSteps.push({
      title: 'Equation',
      content: `${equation} = 0`
    });
    
    // Step 2: Identify coefficients
    solutionSteps.push({
      title: 'Coefficients',
      content: `a = ${a}, b = ${b}, c = ${c}, d = ${d}`
    });
    
    // For simplicity, we'll use a numerical approach to find one real root
    // This is a simplified implementation
    const f = (x) => a * x**3 + b * x**2 + c * x + d;
    const fPrime = (x) => 3 * a * x**2 + 2 * b * x + c;
    
    // Newton-Raphson method to find a root
    let x0 = 0; // Initial guess
    let x1 = x0 - f(x0) / fPrime(x0);
    let iterations = 0;
    const maxIterations = 20;
    const tolerance = 0.0001;
    
    while (Math.abs(x1 - x0) > tolerance && iterations < maxIterations) {
      x0 = x1;
      x1 = x0 - f(x0) / fPrime(x0);
      iterations++;
    }
    
    const root1 = x1;
    
    solutionSteps.push({
      title: 'Finding a Real Root',
      content: `Using Newton-Raphson method, we find one real root: x ≈ ${root1.toFixed(4)}`
    });
    
    // Now, factor out (x - root1) to get a quadratic
    // We'll use polynomial division or synthetic division
    // For simplicity, we'll use the fact that:
    // ax³ + bx² + cx + d = (x - root1)(px² + qx + r)
    
    const p = a;
    const q = b + a * root1;
    const r = c + b * root1 + a * root1 * root1;
    
    solutionSteps.push({
      title: 'Factoring',
      content: `Factoring out (x - ${root1.toFixed(4)}), we get: (x - ${root1.toFixed(4)})(${p}x² + ${q.toFixed(4)}x + ${r.toFixed(4)}) = 0`
    });
    
    // Now solve the quadratic: px² + qx + r = 0
    const discriminant = q * q - 4 * p * r;
    
    solutionSteps.push({
      title: 'Solving the Quadratic',
      content: `Now solve ${p}x² + ${q.toFixed(4)}x + ${r.toFixed(4)} = 0`
    });
    
    solutionSteps.push({
      title: 'Discriminant',
      content: `Δ = q² - 4pr = ${q.toFixed(4)}² - 4(${p})(${r.toFixed(4)}) = ${discriminant.toFixed(4)}`
    });
    
    let solutionText = '';
    let newRoots = [root1];
    
    if (discriminant < 0) {
      solutionSteps.push({
        title: 'Complex Roots',
        content: 'The quadratic has two complex conjugate roots.'
      });
      
      const realPart = -q / (2 * p);
      const imaginaryPart = Math.sqrt(-discriminant) / (2 * p);
      
      solutionSteps.push({
        title: 'Roots',
        content: `x = ${realPart.toFixed(4)} ± ${imaginaryPart.toFixed(4)}i`
      });
      
      solutionText = `x₁ = ${root1.toFixed(4)}, x₂,₃ = ${realPart.toFixed(4)} ± ${imaginaryPart.toFixed(4)}i`;
    } else if (discriminant === 0) {
      const x = -q / (2 * p);
      solutionSteps.push({
        title: 'Repeated Root',
        content: `x = ${x.toFixed(4)} (repeated root)`
      });
      
      solutionText = `x₁ = ${root1.toFixed(4)}, x₂ = x₃ = ${x.toFixed(4)}`;
      newRoots.push(x, x);
    } else {
      const x2 = (-q + Math.sqrt(discriminant)) / (2 * p);
      const x3 = (-q - Math.sqrt(discriminant)) / (2 * p);
      
      solutionSteps.push({
        title: 'Roots',
        content: `x = ${x2.toFixed(4)} and x = ${x3.toFixed(4)}`
      });
      
      solutionText = `x₁ = ${root1.toFixed(4)}, x₂ = ${x2.toFixed(4)}, x₃ = ${x3.toFixed(4)}`;
      newRoots.push(x2, x3);
    }
    
    setSteps(solutionSteps);
    setResult(solutionText);
    setFunctionExpression(createFunctionExpression());
    setRoots(newRoots);
  };
  
  const solveEquation = () => {
    setShowSteps(true);
    setShowGraph(true);
    
    if (equationType === 'linear') {
      solveLinearEquation();
    } else if (equationType === 'quadratic') {
      solveQuadraticEquation();
    } else if (equationType === 'polynomial') {
      solveCubicEquation();
    }
  };
  
  const toggleSteps = () => {
    setShowSteps(!showSteps);
  };
  
  const toggleGraph = () => {
    setShowGraph(!showGraph);
  };

  return (
    <div className="equation-solver">
      <h2>Equation Solver</h2>
      
      <div className="equation-type-selector">
        <label>
          <input 
            type="radio" 
            value="linear" 
            checked={equationType === 'linear'} 
            onChange={() => setEquationType('linear')} 
          />
          Linear (ax + b = 0)
        </label>
        <label>
          <input 
            type="radio" 
            value="quadratic" 
            checked={equationType === 'quadratic'} 
            onChange={() => setEquationType('quadratic')} 
          />
          Quadratic (ax² + bx + c = 0)
        </label>
        <label>
          <input 
            type="radio" 
            value="polynomial" 
            checked={equationType === 'polynomial'} 
            onChange={() => setEquationType('polynomial')} 
          />
          Polynomial (ax³ + bx² + cx + d = 0)
        </label>
      </div>
      
      <div className="coefficient-inputs">
        <div className="input-group">
          <label>a:</label>
          <input 
            type="number" 
            value={coefficients.a} 
            onChange={(e) => handleCoefficientChange(e, 'a')} 
            placeholder="Coefficient a"
          />
        </div>
        <div className="input-group">
          <label>b:</label>
          <input 
            type="number" 
            value={coefficients.b} 
            onChange={(e) => handleCoefficientChange(e, 'b')} 
            placeholder="Coefficient b"
          />
        </div>
        {equationType !== 'linear' && (
          <div className="input-group">
            <label>c:</label>
            <input 
              type="number" 
              value={coefficients.c} 
              onChange={(e) => handleCoefficientChange(e, 'c')} 
              placeholder="Coefficient c"
            />
          </div>
        )}
        {equationType === 'polynomial' && (
          <div className="input-group">
            <label>d:</label>
            <input 
              type="number" 
              value={coefficients.d} 
              onChange={(e) => handleCoefficientChange(e, 'd')} 
              placeholder="Coefficient d"
            />
          </div>
        )}
      </div>
      
      <button className="solve-button" onClick={solveEquation}>Solve Equation</button>
      
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
            title={`${equationType === 'linear' ? 'Linear' : 
                     equationType === 'quadratic' ? 'Quadratic' : 
                     'Cubic'} Function`}
            xRange={equationType === 'linear' ? { min: -10, max: 10 } : 
                     equationType === 'quadratic' ? { min: -10, max: 10 } : 
                     { min: -5, max: 5 }}
            yRange={equationType === 'linear' ? { min: -10, max: 10 } : 
                     equationType === 'quadratic' ? { min: -10, max: 10 } : 
                     { min: -20, max: 20 }}
            roots={roots}
          />
        </div>
      )}
    </div>
  );
};

export default EquationSolver;
