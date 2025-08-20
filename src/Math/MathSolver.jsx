import React, { useState } from 'react';
import './styles/MathSolvers.css';
import EquationSolver from './EquationSolver';
import BinomialSolver from './BinomialSolver';
import CalculusSolver from './CalculusSolver';

const MathSolvers = () => {
  const [activeSolver, setActiveSolver] = useState('equation');
  
  return (
    <div className="math-solvers-container">
      <header className="math-solvers-header">
        <h1>Math Solvers</h1>
        <p>Solve equations, binomials, and calculus problems</p>
      </header>
      
      <div className="solver-navigation">
        <button 
          className={`nav-button ${activeSolver === 'equation' ? 'active' : ''}`}
          onClick={() => setActiveSolver('equation')}
        >
          Equations
        </button>
        <button 
          className={`nav-button ${activeSolver === 'binomial' ? 'active' : ''}`}
          onClick={() => setActiveSolver('binomial')}
        >
          Binomials
        </button>
        <button 
          className={`nav-button ${activeSolver === 'calculus' ? 'active' : ''}`}
          onClick={() => setActiveSolver('calculus')}
        >
          Calculus
        </button>
      </div>
      
      <div className="solver-content">
        {activeSolver === 'equation' && <EquationSolver />}
        {activeSolver === 'binomial' && <BinomialSolver />}
        {activeSolver === 'calculus' && <CalculusSolver />}
      </div>
      
      <footer className="math-solvers-footer">
        <p>Math Solvers &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default MathSolvers;
