// src/components/math/MathSolvers.jsx
import React, { useState } from 'react';
import { Calculator, Sigma, TrendingUp, Triangle } from 'lucide-react';
import './styles/MathSolvers.css';
import EquationSolver from './EquationSolver';
import BinomialSolver from './BinomialSolver';
import CalculusSolver from './CalculusSolver';
import TrigonometrySolver from './TrigonometrySolver';
import MathChatbot from './Chatbox';

const MathSolvers = () => {
  const [activeSolver, setActiveSolver] = useState('equation');
  
  const solvers = [
    {
      id: 'equation',
      name: 'Equations',
      icon: <Calculator size={24} />,
      description: 'Solve linear, quadratic, and polynomial equations'
    },
    {
      id: 'binomial',
      name: 'Binomials',
      icon: <Sigma size={24} />,
      description: 'Calculate binomial coefficients and expansions'
    },
    {
      id: 'calculus',
      name: 'Calculus',
      icon: <TrendingUp size={24} />,
      description: 'Compute derivatives, integrals, and limits'
    },
    {
      id: 'trigonometry',
      name: 'Trigonometry',
      icon: <Triangle size={24} />,
      description: 'Solve trigonometric equations and identities'
    }
  ];
  
  return (
    <div className="math-solvers-container">
      <div className="math-solvers-header">
        <div className="header-content">
          <h1>Math Solvers</h1>
          <p>Advanced mathematical problem-solving tools for students</p>
        </div>
        <div className="header-decoration">
          <div className="math-symbol">∑</div>
          <div className="math-symbol">∫</div>
          <div className="math-symbol">π</div>
        </div>
      </div>
      
      <div className="solver-navigation">
        <div className="nav-container">
          {solvers.map((solver) => (
            <button
              key={solver.id}
              className={`nav-button ${activeSolver === solver.id ? 'active' : ''}`}
              onClick={() => setActiveSolver(solver.id)}
            >
              <span className="nav-icon">{solver.icon}</span>
              <span className="nav-text">
                <span className="nav-title">{solver.name}</span>
                <span className="nav-description">{solver.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="solver-content">
        <div className="solver-card">
          {activeSolver === 'equation' && <EquationSolver />}
          {activeSolver === 'binomial' && <BinomialSolver />}
          {activeSolver === 'calculus' && <CalculusSolver />}
          {activeSolver === 'trigonometry' && <TrigonometrySolver />}
        </div>
      </div>
      
      <footer className="math-solvers-footer">
        <div className="footer-content">
          <p>Math Solvers &copy; {new Date().getFullYear()}</p>
          <p>Designed for students by educators</p>
        </div>
        <div className="footer-decoration">
          <div className="math-symbol">∞</div>
          <div className="math-symbol">√</div>
          <div className="math-symbol">∂</div>
        </div>
      </footer>
      
      {/* Math Assistant Chatbot */}
      <MathChatbot />
    </div>
  );
};

export default MathSolvers;
