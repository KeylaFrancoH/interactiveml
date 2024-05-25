
import React, { useState }  from 'react';
import KMeansClustering from './components/KMeansClustering';
import TextClassifier from './components/TextClassifier';
import ImageClassifier from './components/ImageClassifier';

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
//<TextClassifier texts={texts} labels={labels} />
function App() {
  
  return (
    <div>
      <ImageClassifier />
      
    </div>
  );
}

export default App;
