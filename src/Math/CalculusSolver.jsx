// src/components/math/CalculusSolver.jsx
import React, { useState } from 'react';
import FunctionGraph from './FunctionGraph';
import './styles/CalculusSolver.css';

const CalculusSolver = () => {
  const [calculusType, setCalculusType] = useState('derivative');
  const [functionInput, setFunctionInput] = useState('x^2');
  const [variable, setVariable] = useState('x');
  const [point, setPoint] = useState('1');
  const [result, setResult] = useState('');
  const [steps, setSteps] = useState([]);
  const [showSteps, setShowSteps] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [derivativeExpression, setDerivativeExpression] = useState('');
  const [integralExpression, setIntegralExpression] = useState('');
  
  // Helper function to format expressions for display
  const formatExpression = (expr) => {
    return expr
      .replace(/\*\*/g, '^')
      .replace(/\*/g, '·')
      .replace(/Math\./g, '');
  };
  
  // Parse and evaluate mathematical expressions
  const evaluateExpression = (expr, x) => {
    try {
      // Replace the variable with the actual value
      const processedExpr = expr
        .replace(/\^/g, '**')
        .replace(/x/g, `(${x})`)
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/ln/g, 'Math.log')
        .replace(/log/g, 'Math.log10')
        .replace(/e/g, 'Math.E')
        .replace(/pi/g, 'Math.PI');
      
      // Use Function constructor for evaluation
      const func = new Function(`return ${processedExpr}`);
      return func();
    } catch (err) {
      console.error("Error evaluating expression:", err);
      return null;
    }
  };
  
  // Calculate derivative using power rule and chain rule
  const calculateDerivative = () => {
    if (!functionInput) {
      setResult('Please enter a function');
      setSteps([]);
      return;
    }
    
    const calculationSteps = [];
    let derivative = '';
    
    // Step 1: Identify the function type
    calculationSteps.push({
      title: 'Function',
      content: `f(${variable}) = ${functionInput}`
    });
    
    // Step 2: Apply differentiation rules
    calculationSteps.push({
      title: 'Differentiation Rules',
      content: []
    });
    
    // Handle constant functions
    if (!functionInput.includes(variable)) {
      derivative = '0';
      calculationSteps[1].content.push('The derivative of a constant is 0');
    } 
    // Handle linear functions: ax
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*?\s*([a-zA-Z])\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*?\s*([a-zA-Z])\s*$/);
      const coeff = match[1] || '1';
      derivative = coeff;
      calculationSteps[1].content.push(`Using the power rule: d/dx [ax] = a`);
      calculationSteps[1].content.push(`Here, a = ${coeff}, so the derivative is ${coeff}`);
    }
    // Handle quadratic functions: ax^2
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*?\s*([a-zA-Z])\s*\^?\s*2\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*?\s*([a-zA-Z])\s*\^?\s*2\s*$/);
      const coeff = match[1] || '1';
      derivative = `${2 * parseFloat(coeff || 1)}*${variable}`;
      calculationSteps[1].content.push(`Using the power rule: d/dx [ax^n] = n·a·x^(n-1)`);
      calculationSteps[1].content.push(`Here, a = ${coeff}, n = 2, so the derivative is 2·${coeff}·x = ${derivative}`);
    }
    // Handle power functions: ax^n
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*?\s*([a-zA-Z])\s*\^?\s*(\d+)\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*?\s*([a-zA-Z])\s*\^?\s*(\d+)\s*$/);
      const coeff = parseFloat(match[1] || 1);
      const power = parseInt(match[3]);
      derivative = `${coeff * power}*${variable}^${power - 1}`;
      calculationSteps[1].content.push(`Using the power rule: d/dx [ax^n] = n·a·x^(n-1)`);
      calculationSteps[1].content.push(`Here, a = ${coeff}, n = ${power}, so the derivative is ${coeff * power}·x^${power - 1} = ${derivative}`);
    }
    // Handle trigonometric functions
    else if (functionInput.includes('sin')) {
      derivative = functionInput.replace('sin', 'cos');
      calculationSteps[1].content.push(`Using the trigonometric rule: d/dx [sin(x)] = cos(x)`);
      calculationSteps[1].content.push(`So, d/dx [${functionInput}] = ${derivative}`);
    } else if (functionInput.includes('cos')) {
      derivative = functionInput.replace('cos', '-sin');
      calculationSteps[1].content.push(`Using the trigonometric rule: d/dx [cos(x)] = -sin(x)`);
      calculationSteps[1].content.push(`So, d/dx [${functionInput}] = ${derivative}`);
    } else {
      derivative = 'Unable to compute derivative for this function';
      calculationSteps[1].content.push('This function type is not supported by the current solver');
    }
    
    // Step 3: Final result
    calculationSteps.push({
      title: 'Final Result',
      content: `f'(${variable}) = d/d${variable} [${functionInput}] = ${derivative}`
    });
    
    setSteps(calculationSteps);
    setResult(`f'(${variable}) = ${derivative}`);
    setDerivativeExpression(derivative);
    setIntegralExpression('');
  };
  
  // Calculate integral using power rule
  const calculateIntegral = () => {
    if (!functionInput) {
      setResult('Please enter a function');
      setSteps([]);
      return;
    }
    
    const calculationSteps = [];
    let integral = '';
    
    // Step 1: Identify the function type
    calculationSteps.push({
      title: 'Function',
      content: `f(${variable}) = ${functionInput}`
    });
    
    // Step 2: Apply integration rules
    calculationSteps.push({
      title: 'Integration Rules',
      content: []
    });
    
    // Handle constant functions: c
    if (!functionInput.includes(variable)) {
      integral = `${functionInput}*${variable}`;
      calculationSteps[1].content.push(`Using the constant rule: ∫ c dx = c·x`);
      calculationSteps[1].content.push(`Here, c = ${functionInput}, so the integral is ${functionInput}·x`);
    } 
    // Handle linear functions: ax
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*?\s*([a-zA-Z])\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*?\s*([a-zA-Z])\s*$/);
      const coeff = match[1] || '1';
      integral = `${(parseFloat(coeff || 1) / 2)}*${variable}^2`;
      calculationSteps[1].content.push(`Using the power rule: ∫ ax^n dx = a·x^(n+1)/(n+1) + C`);
      calculationSteps[1].content.push(`Here, a = ${coeff}, n = 1, so the integral is ${coeff}·x^2/2 = ${integral}`);
    }
    // Handle power functions: ax^n
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*?\s*([a-zA-Z])\s*\^?\s*(\d+)\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*?\s*([a-zA-Z])\s*\^?\s*(\d+)\s*$/);
      const coeff = parseFloat(match[1] || 1);
      const power = parseInt(match[3]);
      integral = `${(coeff / (power + 1))}*${variable}^${power + 1}`;
      calculationSteps[1].content.push(`Using the power rule: ∫ ax^n dx = a·x^(n+1)/(n+1) + C`);
      calculationSteps[1].content.push(`Here, a = ${coeff}, n = ${power}, so the integral is ${coeff}·x^${power + 1}/${power + 1} = ${integral}`);
    }
    // Handle trigonometric functions
    else if (functionInput.includes('sin')) {
      integral = functionInput.replace('sin', '-cos');
      calculationSteps[1].content.push(`Using the trigonometric rule: ∫ sin(x) dx = -cos(x) + C`);
      calculationSteps[1].content.push(`So, ∫ ${functionInput} dx = ${integral} + C`);
    } else if (functionInput.includes('cos')) {
      integral = functionInput.replace('cos', 'sin');
      calculationSteps[1].content.push(`Using the trigonometric rule: ∫ cos(x) dx = sin(x) + C`);
      calculationSteps[1].content.push(`So, ∫ ${functionInput} dx = ${integral} + C`);
    } else {
      integral = 'Unable to compute integral for this function';
      calculationSteps[1].content.push('This function type is not supported by the current solver');
    }
    
    // Step 3: Final result
    calculationSteps.push({
      title: 'Final Result',
      content: `∫ f(${variable}) d${variable} = ${integral} + C`
    });
    
    setSteps(calculationSteps);
    setResult(`∫ f(${variable}) d${variable} = ${integral} + C`);
    setIntegralExpression(integral);
    setDerivativeExpression('');
  };
  
  // Calculate limit by evaluating the function at the point
  const calculateLimit = () => {
    if (!functionInput || !point) {
      setResult('Please enter a function and a point');
      setSteps([]);
      return;
    }
    
    const pointVal = parseFloat(point);
    if (isNaN(pointVal)) {
      setResult('Please enter a valid number for the point');
      setSteps([]);
      return;
    }
    
    const calculationSteps = [];
    
    // Step 1: Identify the function and point
    calculationSteps.push({
      title: 'Function and Point',
      content: `f(${variable}) = ${functionInput}, approaching ${variable} = ${pointVal}`
    });
    
    // Step 2: Direct substitution
    calculationSteps.push({
      title: 'Direct Substitution',
      content: []
    });
    
    try {
      const limitValue = evaluateExpression(functionInput, pointVal);
      
      if (limitValue === null) {
        calculationSteps[1].content.push('Direct substitution failed - the function may be undefined at this point');
        calculationSteps.push({
          title: 'Result',
          content: `lim_{${variable}→${pointVal}} ${functionInput} = undefined`
        });
      } else {
        calculationSteps[1].content.push(`Substituting ${variable} = ${pointVal} into the function`);
        calculationSteps[1].content.push(`f(${pointVal}) = ${limitValue}`);
        
        calculationSteps.push({
          title: 'Result',
          content: `lim_{${variable}→${pointVal}} ${functionInput} = ${limitValue}`
        });
        
        setResult(`lim_{${variable}→${pointVal}} ${functionInput} = ${limitValue}`);
      }
    } catch (err) {
      calculationSteps[1].content.push('Error evaluating the function at this point');
      calculationSteps.push({
        title: 'Result',
        content: `lim_{${variable}→${pointVal}} ${functionInput} = undefined`
      });
      setResult(`lim_{${variable}→${pointVal}} ${functionInput} = undefined`);
    }
    
    setSteps(calculationSteps);
    setDerivativeExpression('');
    setIntegralExpression('');
  };
  
  const handleSolve = () => {
    setShowSteps(true);
    setShowGraph(true);
    
    if (calculusType === 'derivative') {
      calculateDerivative();
    } else if (calculusType === 'integral') {
      calculateIntegral();
    } else {
      calculateLimit();
    }
  };
  
  const toggleSteps = () => {
    setShowSteps(!showSteps);
  };
  
  const toggleGraph = () => {
    setShowGraph(!showGraph);
  };

  return (
    <div className="calculus-solver">
      <h2>Calculus Solver</h2>
      
      <div className="calculus-type-selector">
        <label>
          <input 
            type="radio" 
            value="derivative" 
            checked={calculusType === 'derivative'} 
            onChange={() => setCalculusType('derivative')} 
          />
          Derivative
        </label>
        <label>
          <input 
            type="radio" 
            value="integral" 
            checked={calculusType === 'integral'} 
            onChange={() => setCalculusType('integral')} 
          />
          Integral
        </label>
        <label>
          <input 
            type="radio" 
            value="limit" 
            checked={calculusType === 'limit'} 
            onChange={() => setCalculusType('limit')} 
          />
          Limit
        </label>
      </div>
      
      <div className="calculus-inputs">
        <div className="input-group">
          <label>Function f({variable}):</label>
          <input 
            type="text" 
            value={functionInput} 
            onChange={(e) => setFunctionInput(e.target.value)} 
            placeholder={`e.g., 2*${variable}^2 + 3*${variable} - 5`}
          />
        </div>
        <div className="input-group">
          <label>Variable:</label>
          <input 
            type="text" 
            value={variable} 
            onChange={(e) => setVariable(e.target.value)} 
            placeholder="Variable (e.g., x)"
            maxLength="1"
          />
        </div>
        {calculusType === 'limit' && (
          <div className="input-group">
            <label>Point:</label>
            <input 
              type="number" 
              value={point} 
              onChange={(e) => setPoint(e.target.value)} 
              placeholder="Point to evaluate"
            />
          </div>
        )}
      </div>
      
      <button className="solve-button" onClick={handleSolve}>
        {calculusType === 'derivative' ? 'Calculate Derivative' : 
         calculusType === 'integral' ? 'Calculate Integral' : 'Calculate Limit'}
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
      
      {showGraph && functionInput && (
        <div className="graph-container">
          <h3>Function Visualization</h3>
          <FunctionGraph 
            functionExpression={functionInput}
            derivativeExpression={derivativeExpression || null}
            integralExpression={integralExpression || null}
            limitPoint={calculusType === 'limit' ? parseFloat(point) : null}
            title={`${calculusType === 'derivative' ? 'Function and Derivative' : 
                    calculusType === 'integral' ? 'Function and Integral' : 
                    'Function with Limit Point'}`}
          />
        </div>
      )}
    </div>
  );
};

export default CalculusSolver;
