// src/components/Math/BinomialSolver.jsx
import React, { useState } from 'react';
import './styles/BinomialSolver.css';

const BinomialSolver = () => {
  const [n, setN] = useState('');
  const [k, setK] = useState('');
  const [binomialType, setBinomialType] = useState('coefficient');
  const [result, setResult] = useState('');
  const [steps, setSteps] = useState([]);
  const [showSteps, setShowSteps] = useState(false);
  
  const factorial = (num) => {
    if (num === 0 || num === 1) return 1;
    let result = 1;
    for (let i = 2; i <= num; i++) {
      result *= i;
    }
    return result;
  };
  
  const formatFactorialSteps = (num) => {
    if (num === 0 || num === 1) return [`${num}! = 1`];
    
    let steps = [`${num}! = 1`];
    for (let i = 2; i <= num; i++) {
      steps.push(`${i}! = ${i} × ${(i-1)}! = ${factorial(i)}`);
    }
    return steps;
  };
  
  const calculateBinomialCoefficient = () => {
    const nVal = parseInt(n);
    const kVal = parseInt(k);
    
    if (isNaN(nVal) || isNaN(kVal) || nVal < 0 || kVal < 0 || kVal > nVal) {
      setResult('Please enter valid non-negative integers where k ≤ n');
      setSteps([]);
      return;
    }
    
    // Reset steps
    const calculationSteps = [];
    
    // Step 1: Formula
    calculationSteps.push({
      title: 'Formula',
      content: `C(${nVal}, ${kVal}) = ${nVal}! / (${kVal}! × (${nVal}-${kVal})!) = ${nVal}! / (${kVal}! × ${nVal-kVal}!)`
    });
    
    // Step 2: Calculate factorials
    const nFact = factorial(nVal);
    const kFact = factorial(kVal);
    const nkFact = factorial(nVal - kVal);
    
    calculationSteps.push({
      title: 'Calculate Factorials',
      content: [
        ...formatFactorialSteps(nVal),
        ...formatFactorialSteps(kVal),
        ...formatFactorialSteps(nVal - kVal)
      ]
    });
    
    // Step 3: Substitute values
    calculationSteps.push({
      title: 'Substitute Values',
      content: `C(${nVal}, ${kVal}) = ${nFact} / (${kFact} × ${nkFact})`
    });
    
    // Step 4: Calculate denominator
    const denominator = kFact * nkFact;
    calculationSteps.push({
      title: 'Calculate Denominator',
      content: `${kFact} × ${nkFact} = ${denominator}`
    });
    
    // Step 5: Final result
    const coefficient = nFact / denominator;
    calculationSteps.push({
      title: 'Final Result',
      content: `C(${nVal}, ${kVal}) = ${nFact} / ${denominator} = ${coefficient}`
    });
    
    setSteps(calculationSteps);
    setResult(`C(${nVal}, ${kVal}) = ${coefficient}`);
  };
  
  const calculateBinomialExpansion = () => {
    const nVal = parseInt(n);
    
    if (isNaN(nVal) || nVal < 0) {
      setResult('Please enter a valid non-negative integer');
      setSteps([]);
      return;
    }
    
    // Reset steps
    const calculationSteps = [];
    
    // Step 1: Formula
    calculationSteps.push({
      title: 'Formula',
      content: `(a + b)^${nVal} = Σ [k=0 to ${nVal}] C(${nVal},k) × a^(${nVal}-k) × b^k`
    });
    
    // Step 2: Generate each term
    let terms = [];
    let expansion = '';
    
    calculationSteps.push({
      title: 'Calculate Each Term',
      content: []
    });
    
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
      
      terms.push(term);
      
      // Add step for this term
      calculationSteps[1].content.push(
        `Term ${k+1}: C(${nVal},${k}) × a^${nVal-k} × b^${k} = ${coeff} × a^${nVal-k} × b^${k} = ${term}`
      );
    }
    
    // Step 3: Combine terms
    expansion = terms.join(' + ');
    calculationSteps.push({
      title: 'Combine All Terms',
      content: `(a + b)^${nVal} = ${expansion}`
    });
    
    setSteps(calculationSteps);
    setResult(`(a + b)^${nVal} = ${expansion}`);
  };
  
  const handleSolve = () => {
    setShowSteps(true);
    if (binomialType === 'coefficient') {
      calculateBinomialCoefficient();
    } else {
      calculateBinomialExpansion();
    }
  };
  
  const toggleSteps = () => {
    setShowSteps(!showSteps);
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
      
      {result && (
        <div className="result-container">
          <div className="result">{result}</div>
          <button className="toggle-steps-button" onClick={toggleSteps}>
            {showSteps ? 'Hide Steps' : 'Show Steps'}
          </button>
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
    </div>
  );
};

export default BinomialSolver;
