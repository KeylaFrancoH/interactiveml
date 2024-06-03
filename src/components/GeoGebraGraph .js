import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';

const GeoGebraGraph = () => {
  const [data, setData] = useState([
    {"Word count": 200, "# Shares": 150},
    {"Word count": 300, "# Shares": 180},
    {"Word count": 400, "# Shares": 200},
    {"Word count": 500, "# Shares": 220},
    {"Word count": 600, "# Shares": 240},
    {"Word count": 700, "# Shares": 260},
    {"Word count": 800, "# Shares": 280},
    {"Word count": 900, "# Shares": 300},
    {"Word count": 1000, "# Shares": 320},
    {"Word count": 1100, "# Shares": 340}
  ]);

  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [mse, setMSE] = useState(0);
  const [variance, setVariance] = useState(0);
  const [regressionSteps, setRegressionSteps] = useState([]);
  const svgRef = useRef();
  const formulaRef = useRef(null);

  const handleDataChange = (index, key, value) => {
    const updatedData = [...data];
    updatedData[index][key] = Number(value);
    setData(updatedData);
    calculateAndDrawRegression(updatedData);
  };

  const addData = () => {
    setData([...data, {"Word count": 0, "# Shares": 0}]);
  };

  const removeData = (index) => {
    const updatedData = [...data];
    updatedData.splice(index, 1);
    setData(updatedData);
  };

  const calculateAndDrawRegression = (data) => {
    if (data.length === 0) {
      clearCanvas();
      return;
    }

    const wordCount = data.map(item => item["Word count"]);
    const shares = data.map(item => item["# Shares"]);

    const { slope, intercept, mse, variance, steps } = linearRegression(wordCount, shares);

    setA(slope);
    setB(intercept);
    setMSE(mse);
    setVariance(variance);
    setRegressionSteps(steps);

    drawChart(data, slope, intercept);
    updateFormulaText(slope, intercept);
  };

  const linearRegression = (x, y) => {
    const n = x.length;
    const xMean = x.reduce((a, b) => a + b) / n;
    const yMean = y.reduce((a, b) => a + b) / n;

    const ssXX = x.map(xi => (xi - xMean) ** 2).reduce((a, b) => a + b);
    const ssXY = x.map((xi, i) => (xi - xMean) * (y[i] - yMean)).reduce((a, b) => a + b);

    const slope = ssXY / ssXX;
    const intercept = yMean - slope * xMean;

    const yPred = x.map(xi => slope * xi + intercept);
    const mse = y.map((yi, i) => (yi - yPred[i]) ** 2).reduce((a, b) => a + b) / n;
    const variance = 1 - mse / y.map(yi => (yi - yMean) ** 2).reduce((a, b) => a + b) / n;

    const steps = [];
    for (let i = 0; i < n; i++) {
      const step = `Paso ${i + 1}: (${x[i]}, ${y[i]}) => y = ${slope.toFixed(2)} * ${x[i]} + ${intercept.toFixed(2)} = ${yPred[i].toFixed(2)}`;
      steps.push(step);
    }

    return { slope, intercept, mse, variance, steps };
  };

  const drawChart = (data, slope, intercept) => {
    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d["Word count"])])
      .range([0, width - margin.left - margin.right]);
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d["# Shares"])])
      .range([height - margin.top - margin.bottom, 0]);
  
    // Líneas horizontales para la cuadrícula
    svg.selectAll('.horizontal-line')
      .data(y.ticks())
      .enter()
      .append('line')
      .attr('class', 'horizontal-line')
      .attr('x1', 0)
      .attr('y1', d => y(d))
      .attr('x2', width - margin.left - margin.right)
      .attr('y2', d => y(d))
      .attr('stroke', 'lightgray')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2');
  
    // Líneas verticales para la cuadrícula
    svg.selectAll('.vertical-line')
      .data(x.ticks())
      .enter()
      .append('line')
      .attr('class', 'vertical-line')
      .attr('x1', d => x(d))
      .attr('y1', 0)
      .attr('x2', d => x(d))
      .attr('y2', height - margin.top - margin.bottom)
      .attr('stroke', 'lightgray')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2');
  
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x));
  
    svg.append('g')
      .call(d3.axisLeft(y));
  
    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => x(d["Word count"]))
      .attr('cy', d => y(d["# Shares"]))
      .attr('r', 5)
      .attr('fill', 'blue');
  
    svg.append('line')
      .attr('x1', x(0))
      .attr('y1', y(intercept))
      .attr('x2', x(d3.max(data, d => d["Word count"])))
      .attr('y2', y(slope * d3.max(data, d => d["Word count"]) + intercept))
      .attr('stroke', 'red')
      .attr('stroke-width', 2);
  };
  
      
    const updateFormulaText = (slope, intercept) => {
        const svg = d3.select(formulaRef.current);
        svg.selectAll('*').remove();
        svg.append('text')
          .attr('x', 10)
          .attr('y', 20)
          .attr('fill', 'black')
          .text(`y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`);
      };
      
      
      const clearCanvas = () => {
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      };
      
      useEffect(() => {
      if (svgRef.current) {
      clearCanvas();
      }
      calculateAndDrawRegression(data);
      }, [data]);
      
      return (
      <div>
      <h1>Regresión Lineal Interactiva</h1>
      <div>
      <h2>Datos (Editables):</h2>
      {data.map((item, index) => (
      <div key={index}>
      <label>
      Word count:
      <input type="number"
      value={item["Word count"]}
      onChange={(e) => handleDataChange(index, "Word count", e.target.value)}
      />
      </label>
      <label>
      # Shares:
      <input
      type="number"
      value={item["# Shares"]}
      onChange={(e) => handleDataChange(index, "# Shares", e.target.value)}
      />
      </label>
      <button onClick={() => removeData(index)}>Eliminar</button>
      </div>
      ))}
      <button onClick={addData}>Agregar Fila</button>
      </div>
      <div>
      {data.length === 0 ? (
      <p>No hay datos disponibles</p>
      ) : (
      <>
      <svg ref={svgRef}></svg>
      <svg ref={formulaRef} width="200" height="50"></svg>
      </>
      )}
      </div>
      <div>
      <p>Pendiente (a): {a.toFixed(2)}</p>
      <p>Intercepto (b): {b.toFixed(2)}</p>
      <p>Error Cuadrado Medio: {mse.toFixed(2)}</p>
      <p>Puntaje de Varianza: {variance.toFixed(2)}</p>
      <h2>Proceso de Regresión Lineal:</h2>
      <ol>
      {regressionSteps.map((step, index) => (
      <li key={index}>{step}</li>
      ))}
      </ol>
      </div>
      </div>
      );
      };
      
      export default GeoGebraGraph;
