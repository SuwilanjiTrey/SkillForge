import React, { useState } from 'react';
import './styles/BinomialSolver.css';

const BinomialSolver = () => {
  const [n, setN] = useState('');
  const [k, setK] = useState('');
  const [binomialType, setBinomialType] = useState('coefficient');
  const [result, setResult] = useState('');
  
  const calculateBinomialCoefficient = () => {
    const nVal = parseInt(n);
    const kVal = parseInt(k);
    
    if (isNaN(nVal) || isNaN(kVal) || nVal < 0 || kVal < 0 || kVal > nVal) {
      setResult('Please enter valid non-negative integers where k ≤ n');
      return;
    }
    
    // Calculate binomial coefficient: C(n, k) = n! / (k! * (n-k)!)
    const factorial = (num) => {
      if (num === 0 || num === 1) return 1;
      let result = 1;
      for (let i = 2; i <= num; i++) {
        result *= i;
      }
      return result;
    };
    
    const coefficient = factorial(nVal) / (factorial(kVal) * factorial(nVal - kVal));
    setResult(`C(${nVal}, ${kVal}) = ${coefficient}`);
  };
  
  const calculateBinomialExpansion = () => {
    const nVal = parseInt(n);
    
    if (isNaN(nVal) || nVal < 0) {
      setResult('Please enter a valid non-negative integer');
      return;
    }
    
    // Generate binomial expansion of (a + b)^n
    let expansion = '';
    
    for (let k = 0; k <= nVal; k++) {
      // Calculate binomial coefficient for this term
      let coeff = 1;
      for (let i = 1; i <= k; i++) {
        coeff = coeff * (nVal - k + i) / i;
      }
      
      // Format the term
      let term = '';
      if (coeff !== 1) term += coeff;
      
      if (nVal - k > 0) {
        term += 'a';
        if (nVal - k > 1) term += `^${nVal - k}`;
      }
      
      if (k > 0) {
        if (term && nVal - k > 0) term += '·';
        term += 'b';
        if (k > 1) term += `^${k}`;
      }
      
      if (!term) term = '1';
      
      expansion += term;
      if (k < nVal) expansion += ' + ';
    }
    
    setResult(`(a + b)^${nVal} = ${expansion}`);
  };
  
  const handleSolve = () => {
    if (binomialType === 'coefficient') {
      calculateBinomialCoefficient();
    } else {
      calculateBinomialExpansion();
    }
  };
  
  return (
    <div className="binomial-solver">
      <h2>Binomial Solver</h2>
      
      <div className="binomial-type-selector">
        <label>
          <input 
            type="radio" 
            value="coefficient" 
            checked={binomialType === 'coefficient'} 
            onChange={() => setBinomialType('coefficient')} 
          />
          Binomial Coefficient C(n, k)
        </label>
        <label>
          <input 
            type="radio" 
            value="expansion" 
            checked={binomialType === 'expansion'} 
            onChange={() => setBinomialType('expansion')} 
          />
          Binomial Expansion (a + b)^n
        </label>
      </div>
      
      <div className="binomial-inputs">
        <div className="input-group">
          <label>n:</label>
          <input 
            type="number" 
            value={n} 
            onChange={(e) => setN(e.target.value)} 
            placeholder="n value"
            min="0"
          />
        </div>
        {binomialType === 'coefficient' && (
          <div className="input-group">
            <label>k:</label>
            <input 
              type="number" 
              value={k} 
              onChange={(e) => setK(e.target.value)} 
              placeholder="k value"
              min="0"
            />
          </div>
        )}
      </div>
      
      <button className="solve-button" onClick={handleSolve}>
        {binomialType === 'coefficient' ? 'Calculate Coefficient' : 'Expand Binomial'}
      </button>
      
      {result && <div className="result">{result}</div>}
    </div>
  );
};

export default BinomialSolver;
