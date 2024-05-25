import React, { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

const ImageClassifier = () => {
  const [labels, setLabels] = useState([]);
  const [currentLabel, setCurrentLabel] = useState('');
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [model, setModel] = useState(null);
  const [inputImage, setInputImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isModelTrained, setIsModelTrained] = useState(false);
  const [dataChanged, setDataChanged] = useState(false);
  const [epochs, setEpochs] = useState(10); // Nuevo estado para las épocas

  const handleImageUpload = (e, setImage) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img); // Cambiar la imagen actual
        setPrediction(null);
      };
      img.src = event.target.result;
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const trainModel = async () => {
    if (!dataChanged) {
      window.alert("Para entrenar un nuevo modelo debes añadir nuevos datos y etiquetas");
      return;
    }
  
    if (images.length === 0 || labels.length === 0) {
      console.log("Error: No hay suficientes datos para entrenar el modelo");
      return;
    }
  
    const numClasses = 1; // Cambiar a 1 para clasificación binaria
    const imageSize = 32; // Tamaño de la imagen (32x32 píxeles)
    const inputShape = [imageSize, imageSize, 3]; // Imágenes RGB
  
    // Crear el modelo
    const model = tf.sequential();
    model.add(tf.layers.conv2d({
      inputShape: inputShape,
      filters: 32,
      kernelSize: 3,
      activation: 'relu'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: numClasses, activation: 'sigmoid' })); // Cambiar la activación a 'sigmoid' para clasificación binaria
  
    const optimizer = tf.train.adam();
    model.compile({ optimizer, loss: 'binaryCrossentropy', metrics: ['accuracy'] }); // Cambiar la pérdida a 'binaryCrossentropy'
  
    // Procesar las imágenes y etiquetas
    const xs = tf.stack(images.map(img => tf.browser.fromPixels(img.image).resizeNearestNeighbor([imageSize, imageSize]).toFloat().div(255)));
    const ys = tf.tensor1d(images.map(({ label }) => labels.includes(label) ? 1 : 0), 'int32'); // Convertir las etiquetas a 0 y 1
  
    const surface = { name: 'Modelo de Entrenamiento', tab: 'Entrenamiento' };
    const history = await model.fit(xs, ys, {
      epochs: epochs,
      callbacks: tfvis.show.fitCallbacks(surface, ['loss', 'acc'], { height: 200, callbacks: ['onEpochEnd'] })
    });
  
    setModel(model);
    setIsModelTrained(true);
    setDataChanged(false); // Reiniciar el estado de cambio de datos
  
    console.log("Modelo entrenado correctamente:", model);
  };

  const handlePredict = async () => {
    if (model && inputImage) {
      const img = await tf.browser.fromPixels(inputImage).resizeNearestNeighbor([32, 32]).toFloat().div(255).expandDims();
      const prediction = model.predict(img).dataSync();
      const similarities = labels.map((label, index) => ({ label, similarity: prediction[index] }));

      const cleanSimilarities = similarities.map(result => ({
        label: result.label,
        similarity: isNaN(result.similarity) ? 0 : result.similarity
      }));
      
      setPrediction(cleanSimilarities);
    }
  };
  
  

  const handleAddLabel = () => {
    if (currentLabel.trim() !== '') {
      setLabels([...labels, currentLabel]);
      setCurrentLabel('');
      setDataChanged(true); // Marcar que los datos han cambiado
    }
  };

  const handleAddImage = () => {
    if (currentImage && currentLabel.trim() !== '') {
      setImages([...images, { label: currentLabel, image: currentImage }]);
      setCurrentImage(null);
      setDataChanged(true); // Marcar que los datos han cambiado
    }
  };

  const handleDeleteLabel = (labelToDelete) => {
    setLabels(labels.filter(label => label !== labelToDelete));
    setImages(images.filter(img => img.label !== labelToDelete));
    setDataChanged(true); // Marcar que los datos han cambiado
  };

  return (
    <div className="image-classifier">
      <h2>Modelo de Aprendizaje de Imágenes</h2>
      <div className="label-section">
        <h3>Añadir Etiquetas</h3>
        <input
          type="text"
          placeholder="Nueva etiqueta"
          value={currentLabel}
          onChange={(e) => setCurrentLabel(e.target.value)}
        />
        <button onClick={handleAddLabel}>Agregar Etiqueta</button>
        {labels.map((label, index) => (
          <div key={index}>
            <span>{label}</span>
            <button onClick={() => handleDeleteLabel(label)}>Eliminar</button>
          </div>
        ))}
      </div>
      <div className="image-section">
        <h3>Añadir Imágenes para Entrenamiento</h3>
        <select value={currentLabel} onChange={(e) => setCurrentLabel(e.target.value)}>
          <option value="">Seleccionar etiqueta</option>
          {labels.map((label, index) => (
            <option key={index} value={label}>
              {label}
            </option>
          ))}
        </select>
        <input type="file" onChange={(e) => handleImageUpload(e, setCurrentImage)} />
        <button onClick={handleAddImage}>Agregar Imagen</button>
        {images.map((item, index) => (
          <div key={index}>
            <span>{item.label}</span>
            <img src={item.image.src} alt={item.label} width="32" height="32" />
          </div>
        ))}
      </div>
      <div className="training-section">
        <h3>Entrenar Modelo</h3>
        <label>
          Número de épocas:
          <input
            type="number"
            value={epochs}
            onChange={(e) => setEpochs(Number(e.target.value))}
            min="1"
          />
        </label>
        <button onClick={trainModel}>Entrenar Modelo</button>
        {isModelTrained && <p>El modelo ya está entrenado</p>}
      </div>
      <div className="prediction-section">
        <h3>Predicción</h3>
        <input type ="file" onChange={(e) => handleImageUpload(e, setInputImage)} />
        <button onClick={handlePredict}>Predecir</button>
        {prediction && (
  <div>
    <p>Resultados:</p>
    <ul>
      {prediction.map((result, index) => (
        <li key={index}>{result.label}: {Math.round(result.similarity * 100)}%</li>
      ))}
    </ul>
  </div>
)}

      </div>
      <div id="training-graph"></div>
    </div>
  );
};

export default ImageClassifier;

