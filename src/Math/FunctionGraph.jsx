// src/components/math/FunctionGraph.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './styles/FunctionGraph.css';

const FunctionGraph = ({ 
  functionExpression, 
  derivativeExpression = null, 
  integralExpression = null,
  limitPoint = null,
  roots = [], // New prop for roots
  solutions = [], // For trigonometric solutions
  xRange = { min: -10, max: 10 },
  yRange = { min: -10, max: 10 },
  title = "Function Graph",
  width = 800,
  height = 500
}) => {
  const svgRef = useRef(null);
  const [error, setError] = useState(null);

  // Evaluate a mathematical expression at a given x value
  const evaluateExpression = (expression, x) => {
    try {
      // Replace the variable with the actual value
      const expr = expression.replace(/x/g, `(${x})`);
      
      // Use Function constructor for safe evaluation
      // Note: In production, consider using a math library like math.js for better security
      const func = new Function('return ' + expr);
      return func();
    } catch (err) {
      console.error("Error evaluating expression:", err);
      return null;
    }
  };

  // Generate data points for a function
  const generateData = (expression, xMin, xMax, numPoints = 200) => {
    const data = [];
    const step = (xMax - xMin) / numPoints;
    
    for (let i = 0; i <= numPoints; i++) {
      const x = xMin + i * step;
      const y = evaluateExpression(expression, x);
      
      if (y !== null && !isNaN(y) && isFinite(y)) {
        data.push({ x, y });
      }
    }
    
    return data;
  };

  // Draw the graph
  useEffect(() => {
    if (!svgRef.current || !functionExpression) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();
    
    try {
      const svg = d3.select(svgRef.current);
      const margin = { top: 40, right: 40, bottom: 60, left: 60 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      
      // Create the main group
      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      // Set up scales
      const xScale = d3.scaleLinear()
        .domain([xRange.min, xRange.max])
        .range([0, innerWidth]);
      
      const yScale = d3.scaleLinear()
        .domain([yRange.min, yRange.max])
        .range([innerHeight, 0]);
      
      // Create axes
      const xAxis = d3.axisBottom(xScale)
        .ticks(10)
        .tickSize(5)
        .tickPadding(5);
      
      const yAxis = d3.axisLeft(yScale)
        .ticks(10)
        .tickSize(5)
        .tickPadding(5);
      
      // Add axes to the graph
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis)
        .append("text")
        .attr("x", innerWidth / 2)
        .attr("y", 40)
        .attr("fill", "#333")
        .text("x");
      
      g.append("g")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", -innerHeight / 2)
        .attr("fill", "#333")
        .text("y");
      
      // Add grid lines
      g.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale)
          .tickSize(-innerHeight)
          .tickFormat("")
        );
      
      g.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat("")
        );
      
      // Add title
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .text(title);
      
      // Line generator
      const line = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveMonotoneX);
      
      // Plot the main function
      const mainFunctionData = generateData(functionExpression, xRange.min, xRange.max);
      g.append("path")
        .datum(mainFunctionData)
        .attr("fill", "none")
        .attr("stroke", "#667eea")
        .attr("stroke-width", 3)
        .attr("d", line);
      
      // Plot the derivative if provided
      if (derivativeExpression) {
        const derivativeData = generateData(derivativeExpression, xRange.min, xRange.max);
        g.append("path")
          .datum(derivativeData)
          .attr("fill", "none")
          .attr("stroke", "#ff6b6b")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5")
          .attr("d", line);
        
        // Add legend for derivative
        g.append("text")
          .attr("x", innerWidth - 100)
          .attr("y", 20)
          .attr("fill", "#ff6b6b")
          .text("f'(x)");
      }
      
      // Plot the integral if provided
      if (integralExpression) {
        const integralData = generateData(integralExpression, xRange.min, xRange.max);
        g.append("path")
          .datum(integralData)
          .attr("fill", "none")
          .attr("stroke", "#2ed573")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "10,5")
          .attr("d", line);
        
        // Add legend for integral
        g.append("text")
          .attr("x", innerWidth - 100)
          .attr("y", 40)
          .attr("fill", "#2ed573")
          .text("∫f(x)dx");
      }
      
      
  // Add this after plotting the integral but before adding the limit point
  // Plot solutions if provided (for trigonometric functions)
  if (solutions.length > 0) {
    solutions.forEach(solution => {
      if (solution >= xRange.min && solution <= xRange.max) {
        const solutionX = xScale(solution);
        const solutionY = yScale(0); // Solutions are where y=0
        
        // Add a point at the solution
        g.append("circle")
          .attr("cx", solutionX)
          .attr("cy", solutionY)
          .attr("r", 6)
          .attr("fill", "#ff6b6b");
        
        // Add a label for the solution
        g.append("text")
          .attr("x", solutionX)
          .attr("y", solutionY - 15)
          .attr("text-anchor", "middle")
          .attr("fill", "#ff6b6b")
          .text(`x = ${solution.toFixed(2)}`);
      }
    });
  }

      
  // Add this after plotting the integral but before adding the limit point
  // Plot roots if provided
  if (roots.length > 0) {
    roots.forEach(root => {
      if (root >= xRange.min && root <= xRange.max) {
        const rootX = xScale(root);
        const rootY = yScale(0); // Roots are where y=0
        
        // Add a point at the root
        g.append("circle")
          .attr("cx", rootX)
          .attr("cy", rootY)
          .attr("r", 6)
          .attr("fill", "#ff6b6b");
        
        // Add a label for the root
        g.append("text")
          .attr("x", rootX)
          .attr("y", rootY - 15)
          .attr("text-anchor", "middle")
          .attr("fill", "#ff6b6b")
          .text(`x = ${root.toFixed(2)}`);
      }
    });
  }
      
      // Add limit point if provided
      if (limitPoint !== null) {
        const limitX = xScale(limitPoint);
        g.append("line")
          .attr("x1", limitX)
          .attr("y1", 0)
          .attr("x2", limitX)
          .attr("y2", innerHeight)
          .attr("stroke", "#ffa502")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5");
        
        // Add label for limit point
        g.append("text")
          .attr("x", limitX)
          .attr("y", -10)
          .attr("text-anchor", "middle")
          .attr("fill", "#ffa502")
          .text(`x = ${limitPoint}`);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error drawing graph:", err);
      setError("Failed to render graph. Please check your function expression.");
    }
  }, [functionExpression, derivativeExpression, integralExpression, limitPoint, xRange, yRange, width, height]);

  return (
    <div className="function-graph-container">
      {error && <div className="graph-error">{error}</div>}
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default FunctionGraph;
