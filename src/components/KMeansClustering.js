import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Color from 'd3-scale-chromatic';

const KMeansClustering = () => {
  const [numClusters, setNumClusters] = useState(3);
  const [dataPoints, setDataPoints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [centroids, setCentroids] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [inertias, setInertias] = useState([]);
  const svgRef = useRef();
  const inertiaSvgRef = useRef();
  const width = 600;
  const height = 400;

  useEffect(() => {
    if (dataPoints.length > 0 && selectedColumns.length > 0) {
      const filteredData = dataPoints.map(point => {
        const newPoint = {};
        selectedColumns.forEach(col => {
          newPoint[col] = parseFloat(point[col]);
        });
        return newPoint;
      });

      const { clusters, centroids, inertias } = kmeans(filteredData, numClusters);
      setClusters(clusters);
      setCentroids(centroids);
      setInertias(inertias);
      drawClusters(svgRef.current, clusters, centroids);
      drawInertiaGraph(inertiaSvgRef.current, inertias);
    }
  }, [numClusters, dataPoints, selectedColumns]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target.result;
      const parsedData = d3.csvParse(contents);
      setDataPoints(parsedData);
      setColumns(Object.keys(parsedData[0]));
    };
    reader.readAsText(file);
  };

  const kmeans = (data, k) => {
    let centroids = initializeCentroids(data, k);
    let clusters = assignClusters(data, centroids);
    let newCentroids = updateCentroids(clusters, k);
    const inertiaValues = [];

    let iterations = 0;
    while (!converged(centroids, newCentroids) && iterations < 100) {
      centroids = newCentroids;
      clusters = assignClusters(data, centroids);
      newCentroids = updateCentroids(clusters, k);
      inertiaValues.push(calculateInertia(clusters, centroids));
      iterations++;
    }

    return { clusters, centroids: newCentroids, inertias: inertiaValues };
  };

  const initializeCentroids = (data, k) => {
    const centroids = [];
    for (let i = 0; i < k; i++) {
      centroids.push(data[Math.floor(Math.random() * data.length)]);
    }
    return centroids;
  };

  const assignClusters = (data, centroids) => {
    return data.map(point => {
      let minDist = Infinity;
      let cluster = 0;
      centroids.forEach((centroid, i) => {
        const dist = selectedColumns.reduce((acc, col) => {
          return acc + Math.pow(point[col] - centroid[col], 2);
        }, 0);
        if (dist < minDist) {
          minDist = dist;
          cluster = i;
        }
      });
      return { ...point, cluster };
    });
  };

  const updateCentroids = (clusters, k) => {
    const newCentroids = Array.from({ length: k }, () => {
      const centroid = {};
      selectedColumns.forEach(col => {
        centroid[col] = 0;
      });
      centroid.count = 0;
      return centroid;
    });

    clusters.forEach(point => {
      selectedColumns.forEach(col => {
        newCentroids[point.cluster][col] += point[col];
      });
      newCentroids[point.cluster].count++;
    });

    return newCentroids.map(c => {
      const centroid = {};
      selectedColumns.forEach(col => {
        centroid[col] = c[col] / c.count;
      });
      return centroid;
    });
  };

  const converged = (centroids, newCentroids) => {
    return centroids.every((centroid, i) => {
      return selectedColumns.every(col => centroid[col] === newCentroids[i][col]);
    });
  };

  const calculateInertia = (clusters, centroids) => {
    return clusters.reduce((sum, point) => {
      const centroid = centroids[point.cluster];
      return sum + selectedColumns.reduce((acc, col) => {
        return acc + Math.pow(point[col] - centroid[col], 2);
      }, 0);
    }, 0);
  };

  const drawClusters = (svg, clusters, centroids) => {
    svg.innerHTML = '';

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    d3.select(svg)
      .selectAll('circle')
      .data(clusters)
      .enter()
      .append('circle')
      .attr('cx', d => d[selectedColumns[0]])
      .attr('cy', d => d[selectedColumns[1]])
      .attr('r', 5)
      .attr('fill', d => color(d.cluster));

    d3.select(svg)
      .selectAll('rect')
      .data(centroids)
      .enter()
      .append('rect')
      .attr('x', d => d[selectedColumns[0]] - 5)
      .attr('y', d => d[selectedColumns[1]] - 5)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', (d, i) => color(i));
  };

  const drawInertiaGraph = (svg, inertias) => {
    d3.select(svg).selectAll("*").remove();
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const graphWidth = 400 - margin.left - margin.right;
    const graphHeight = 300 - margin.top - margin.bottom;

    const x = d3Scale.scaleLinear().domain([1, inertias.length]).range([0, graphWidth]);
    const y = d3Scale.scaleLinear().domain([0, d3.max(inertias)]).range([graphHeight, 0]);

    const line = d3.line()
      .x((d, i) => x(i + 1))
      .y(d => y(d));

    const inertiaSvg = d3.select(svg)
      .attr('width', graphWidth + margin.left + margin.right)
      .attr('height', graphHeight + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    inertiaSvg.append('g')
      .attr('transform', `translate(0,${graphHeight})`)
      .call(d3.axisBottom(x).ticks(inertias.length));

    inertiaSvg.append('g')
      .call(d3.axisLeft(y));

    inertiaSvg.append('path')
      .datum(inertias)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    };
  
    return (
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ marginRight: '20px' }}>
          <h2>K-means Clustering</h2>
          <label>
            Number of Clusters:
            <input
              type="number"
              value={numClusters}
              onChange={(e) => setNumClusters(Number(e.target.value))}
              min="1"
              max="10"
            />
          </label>
          <input type="file" accept=".csv" onChange={handleFileUpload} />
          {columns.length > 0 && (
            <div>
              <h3>Select Columns for Clustering</h3>
              {columns.map((col, index) => (
                <label key={index}>
                  <input
                    type="checkbox"
                    value={col}
                    checked={selectedColumns.includes(col)}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedColumns(prev => {
                        if (prev.includes(value)) {
                          return prev.filter(item => item !== value);
                        } else {
                          return [...prev, value];
                        }
                      });
                    }}
                  />
                  {col}
                </label>
              ))}
            </div>
          )}
          <svg ref={svgRef} width={width} height={height}></svg>
        </div>
        {inertias.length > 0 && (
          <div>
            <h3>Inertias</h3>
            <svg ref={inertiaSvgRef} width={width} height={height}></svg>
            <table>
              <thead>
                <tr>
                  <th>Number of Clusters</th>
                  <th>Inertia</th>
                </tr>
              </thead>
              <tbody>
                {inertias.map((inertia, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{inertia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  export default KMeansClustering;
  
