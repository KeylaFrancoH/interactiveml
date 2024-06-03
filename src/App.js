
import React, { useState }  from 'react';
import KMeansClustering from './components/KMeansClustering';
import TextClassifier from './components/TextClassifier';
import ImageClassifier from './components/ImageClassifier';
import GeoGebraGraph from './components/GeoGebraGraph ';
import KahootGame from './components/kahoot.js';
//Para clustering
//function App() {
//  return (
//    <div className="App">
//      <header className="App-header">
 //       <h1>K-means Clustering Interactivo</h1>
//      </header>
//      <KMeansClustering />
//    </div>
//  );
//}

//Para clasificación de textos
//<TextClassifier texts={texts} labels={labels}   <ImageClassifier />         <KahootGame />  <GeoGebraGraph /> />
function App() {
  
  return (
    <div>
   
   <GeoGebraGraph />
    </div>
  );
}

export default App;
