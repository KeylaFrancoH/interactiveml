import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const KMeansClustering = () => {
  const [numClusters, setNumClusters] = useState(3);
  const svgRef = useRef();
  const width = 800;
  const height = 600;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    .attr('width', width)
    .attr('height', height)
    .append('g') 
    .attr('transform', `translate(${margin.left},${margin.top})`); 

    const generateData = () => {
      const data = [];
      for (let i = 0; i < 100; i++) {
        data.push({ x: Math.random() * (width - margin.left - margin.right), y: Math.random() * (height - margin.top - margin.bottom) });
      }
      return data;
    };

    const data = generateData();
    kmeans(data, numClusters, svg);
  }, [numClusters]);

  const kmeans = (data, k, svg) => {
    let centroids = initializeCentroids(data, k);
    let clusters = assignClusters(data, centroids);
    let newCentroids = updateCentroids(clusters, k);

    let iterations = 0;
    while (!converged(centroids, newCentroids) && iterations < 100) {
      centroids = newCentroids;
      clusters = assignClusters(data, centroids);
      newCentroids = updateCentroids(clusters, k);
      iterations++;
    }

    drawClusters(svg, clusters, centroids);
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
        const dist = Math.hypot(point.x - centroid.x, point.y - centroid.y);
        if (dist < minDist) {
          minDist = dist;
          cluster = i;
        }
      });
      return { ...point, cluster };
    });
  };

  const updateCentroids = (clusters, k) => {
    let newCentroids = Array.from({ length: k }, () => ({ x: 0, y: 0, count: 0 }));
    clusters.forEach(point => {
      newCentroids[point.cluster].x += point.x;
      newCentroids[point.cluster].y += point.y;
      newCentroids[point.cluster].count++;
    });
    return newCentroids.map(c => ({ x: c.x / c.count, y: c.y / c.count }));
  };

  const converged = (centroids, newCentroids) => {
    return centroids.every((centroid, i) =>
      centroid.x === newCentroids[i].x && centroid.y === newCentroids[i].y
    );
  };

  const drawClusters = (svg, clusters, centroids) => {
    svg.selectAll('*').remove();

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    svg.selectAll('circle')
      .data(clusters)
      .enter()
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 5)
      .attr('fill', d => color(d.cluster));

    svg.selectAll('rect')
      .data(centroids)
      .enter()
      .append('rect')
      .attr('x', d => d.x - 5)
      .attr('y', d => d.y - 5)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', (d, i) => color(i));
  };

  return (
    <div>
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
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default KMeansClustering;
