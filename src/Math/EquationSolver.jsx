import React, { useState } from 'react';
import './styles/EquationSolver.css';

const EquationSolver = () => {
  const [equationType, setEquationType] = useState('linear');
  const [coefficients, setCoefficients] = useState({ a: '', b: '', c: '', d: '' });
  const [result, setResult] = useState('');
  
  const handleCoefficientChange = (e, coeff) => {
    setCoefficients({
      ...coefficients,
      [coeff]: e.target.value
    });
  };
  
  const solveEquation = () => {
    const a = parseFloat(coefficients.a);
    const b = parseFloat(coefficients.b);
    const c = parseFloat(coefficients.c);
    const d = parseFloat(coefficients.d);
    
    if (equationType === 'linear') {
      if (isNaN(a) || isNaN(b)) {
        setResult('Please enter valid coefficients');
        return;
      }
      if (a === 0) {
        setResult(b === 0 ? 'Infinite solutions' : 'No solution');
      } else {
        setResult(`x = ${(-b / a).toFixed(4)}`);
      }
    } else if (equationType === 'quadratic') {
      if (isNaN(a) || isNaN(b) || isNaN(c)) {
        setResult('Please enter valid coefficients');
        return;
      }
      if (a === 0) {
        setResult(b === 0 ? 'Infinite solutions' : `x = ${(-c / b).toFixed(4)}`);
        return;
      }
      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) {
        setResult('No real solutions');
      } else if (discriminant === 0) {
        setResult(`x = ${(-b / (2 * a)).toFixed(4)}`);
      } else {
        const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        setResult(`x₁ = ${x1.toFixed(4)}, x₂ = ${x2.toFixed(4)}`);
      }
    } else if (equationType === 'polynomial') {
      if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d)) {
        setResult('Please enter valid coefficients');
        return;
      }
      // Simplified polynomial solver (cubic)
      setResult('Polynomial solutions require complex algorithms. This is a simplified implementation.');
    }
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
      
      {result && <div className="result">{result}</div>}
    </div>
  );
};

export default EquationSolver;
