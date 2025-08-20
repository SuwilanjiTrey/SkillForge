import React, { useState } from 'react';
import './styles/CalculusSolver.css';

const CalculusSolver = () => {
  const [calculusType, setCalculusType] = useState('derivative');
  const [functionInput, setFunctionInput] = useState('');
  const [variable, setVariable] = useState('x');
  const [point, setPoint] = useState('');
  const [result, setResult] = useState('');
  
  const calculateDerivative = () => {
    if (!functionInput) {
      setResult('Please enter a function');
      return;
    }
    
    // This is a simplified derivative calculator
    // In a real application, you would use a math library or symbolic computation
    
    // Basic pattern matching for simple functions
    let derivative = '';
    
    // Handle constant functions
    if (!functionInput.includes(variable)) {
      derivative = '0';
    } 
    // Handle linear functions: ax
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*$/);
      const coeff = match[1] || '1';
      derivative = coeff;
    }
    // Handle quadratic functions: ax^2
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*\^\s*2\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*\^\s*2\s*$/);
      const coeff = match[1] || '1';
      derivative = `${2 * parseFloat(coeff || 1)} * ${variable}`;
    }
    // Handle power functions: ax^n
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*\^\s*(\d+)\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*\^\s*(\d+)\s*$/);
      const coeff = parseFloat(match[1] || 1);
      const power = parseInt(match[3]);
      derivative = `${coeff * power} * ${variable}^${power - 1}`;
    }
    // Handle trigonometric functions
    else if (functionInput.includes('sin')) {
      derivative = functionInput.replace('sin', 'cos');
    } else if (functionInput.includes('cos')) {
      derivative = functionInput.replace('cos', '-sin');
    } else {
      derivative = 'Unable to compute derivative for this function';
    }
    
    setResult(`d/d${variable} [${functionInput}] = ${derivative}`);
  };
  
  const calculateIntegral = () => {
    if (!functionInput) {
      setResult('Please enter a function');
      return;
    }
    
    // This is a simplified integral calculator
    // In a real application, you would use a math library or symbolic computation
    
    // Basic pattern matching for simple functions
    let integral = '';
    
    // Handle constant functions: c
    if (!functionInput.includes(variable)) {
      integral = `${functionInput} * ${variable} + C`;
    } 
    // Handle linear functions: ax
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*$/);
      const coeff = match[1] || '1';
      integral = `${(parseFloat(coeff || 1) / 2)} * ${variable}^2 + C`;
    }
    // Handle power functions: ax^n
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*\^\s*(\d+)\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*\^\s*(\d+)\s*$/);
      const coeff = parseFloat(match[1] || 1);
      const power = parseInt(match[3]);
      integral = `${(coeff / (power + 1))} * ${variable}^${power + 1} + C`;
    }
    // Handle trigonometric functions
    else if (functionInput.includes('sin')) {
      integral = functionInput.replace('sin', '-cos') + ' + C';
    } else if (functionInput.includes('cos')) {
      integral = functionInput.replace('cos', 'sin') + ' + C';
    } else {
      integral = 'Unable to compute integral for this function';
    }
    
    setResult(`∫ ${functionInput} d${variable} = ${integral}`);
  };
  
  const calculateLimit = () => {
    if (!functionInput || !point) {
      setResult('Please enter a function and a point');
      return;
    }
    
    const pointVal = parseFloat(point);
    if (isNaN(pointVal)) {
      setResult('Please enter a valid number for the point');
      return;
    }
    
    // This is a simplified limit calculator
    // In a real application, you would use a math library or numerical methods
    
    // For demonstration, we'll just evaluate the function at the point
    // This doesn't handle actual limits (approaching from both sides)
    
    // Basic pattern matching for simple functions
    let limitValue = '';
    
    // Handle constant functions
    if (!functionInput.includes(variable)) {
      limitValue = functionInput;
    } 
    // Handle linear functions: ax + b
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*([+-]\s*\d+\.?\d*)?\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*([+-]\s*\d+\.?\d*)?\s*$/);
      const coeff = parseFloat(match[1] || 1);
      const constant = match[3] ? parseFloat(match[3].replace(/\s/g, '')) : 0;
      limitValue = (coeff * pointVal + constant).toString();
    }
    // Handle quadratic functions: ax^2 + bx + c
    else if (/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*\^\s*2\s*([+-]\s*\d*\.?\d*\s*\*\s*[a-zA-Z])?\s*([+-]\s*\d+\.?\d*)?\s*$/.test(functionInput)) {
      const match = functionInput.match(/^\s*([+-]?\d*\.?\d*)\s*\*\s*([a-zA-Z])\s*\^\s*2\s*([+-]\s*\d*\.?\d*\s*\*\s*[a-zA-Z])?\s*([+-]\s*\d+\.?\d*)?\s*$/);
      const a = parseFloat(match[1] || 1);
      const b = match[3] ? parseFloat(match[3].replace(/\s/g, '').replace(/\*.*$/, '')) : 0;
      const c = match[4] ? parseFloat(match[4].replace(/\s/g, '')) : 0;
      limitValue = (a * pointVal * pointVal + b * pointVal + c).toString();
    } else {
      limitValue = 'Unable to compute limit for this function';
    }
    
    setResult(`lim_{${variable}→${pointVal}} ${functionInput} = ${limitValue}`);
  };
  
  const handleSolve = () => {
    if (calculusType === 'derivative') {
      calculateDerivative();
    } else if (calculusType === 'integral') {
      calculateIntegral();
    } else {
      calculateLimit();
    }
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
      
      {result && <div className="result">{result}</div>}
    </div>
  );
};

export default CalculusSolver;
