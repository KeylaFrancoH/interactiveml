import React, { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

const TextClassifier = () => {
  const [labels, setLabels] = useState([]);
  const [currentLabel, setCurrentLabel] = useState('');
  const [texts, setTexts] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [model, setModel] = useState(null);
  const [inputText, setInputText] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [isModelTrained, setIsModelTrained] = useState(false);
  const [dataChanged, setDataChanged] = useState(false);
  const [epochs, setEpochs] = useState(10); // Nuevo estado para las épocas

  const trainModel = async () => {
    if (!dataChanged) {
      window.alert("Para entrenar un nuevo modelo debes añadir nuevos datos y etiquetas");
      return;
    }

    if (texts.length === 0 || labels.length === 0) {
      console.log("Error: No hay suficientes datos para entrenar el modelo");
      return;
    }

    const numClasses = labels.length;
    const maxTextLength = 10; // Longitud máxima de los textos
    const numWords = 256; // Número de palabras (en este caso, tamaño del vocabulario)
    const embeddingSize = 50; // Tamaño del embedding (por ejemplo)

    // Crear el modelo
    const input = tf.input({ shape: [maxTextLength] });
    const embeddingLayer = tf.layers.embedding({ inputDim: numWords, outputDim: embeddingSize }).apply(input);
    const flattenLayer = tf.layers.flatten().apply(embeddingLayer);
    const denseLayer = tf.layers.dense({ units: 32, activation: 'relu' }).apply(flattenLayer);
    const output = tf.layers.dense({ units: numClasses, activation: numClasses > 1 ? 'softmax' : 'sigmoid' }).apply(denseLayer);

    const model = tf.model({ inputs: input, outputs: output });

    const optimizer = tf.train.adam();
    model.compile({ optimizer, loss: numClasses > 1 ? 'categoricalCrossentropy' : 'binaryCrossentropy', metrics: ['accuracy'] });

    // Truncar o rellenar los textos para que tengan la misma longitud
    const paddedTexts = texts.map(({ text }) => {
      const encodedText = text.split('').map(char => char.charCodeAt(0) % numWords); // Codificar caracteres a números
      return tf.tensor1d([...encodedText, ...Array(maxTextLength - encodedText.length).fill(0)], 'int32'); // Rellenar con ceros si es necesario
    });

    const xs = tf.stack(paddedTexts); // Crear tensor de entrada
    const ys = numClasses > 1 
      ? tf.oneHot(tf.tensor1d(texts.map(({ label }) => labels.indexOf(label)), 'int32'), numClasses) // Convertir etiquetas a tensor
      : tf.tensor1d(texts.map(({ label }) => labels.indexOf(label)), 'int32'); // Usar etiquetas directamente si solo hay una

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

  const handlePredict = () => {
    if (model && inputText.trim() !== '') {
      const tokens = inputText.trim().toLowerCase().split('').map(char => char.charCodeAt(0) % 256);
      const paddedTokens = [...Array(10).fill(0), ...tokens].slice(-10); // Rellenar o truncar a 10 caracteres
      const prediction = model.predict(tf.tensor2d([paddedTokens], [1, 10]));
      setPrediction(prediction.dataSync());
    }
  };

  const handleAddLabel = () => {
    if (currentLabel.trim() !== '') {
      setLabels([...labels, currentLabel]);
      setCurrentLabel('');
      setDataChanged(true); // Marcar que los datos han cambiado
    }
  };

  const handleAddText = () => {
    if (currentText.trim() !== '' && currentLabel.trim() !== '') {
      let truncatedText = currentText.substring(0, 10); // Truncar texto a 10 caracteres
      truncatedText = truncatedText.padEnd(10, ' '); // Rellenar con espacios si es necesario
  
      setTexts([...texts, { label: currentLabel, text: truncatedText }]);
      setCurrentText('');
      setDataChanged(true); // Marcar que los datos han cambiado
    }
  };

  const handleDeleteLabel = (labelToDelete) => {
    setLabels(labels.filter(label => label !== labelToDelete));
    setTexts(texts.filter(text => text.label !== labelToDelete));
    setDataChanged(true); // Marcar que los datos han cambiado
  };

  return (
    <div className="text-classifier">
      <h2>Modelo de Aprendizaje de Texto</h2>
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
      <div className="text-section">
        <h3>Añadir Textos para Entrenamiento</h3>
        <select value={currentLabel} onChange={(e) => setCurrentLabel(e.target.value)}>
          <option value="">Seleccionar etiqueta</option>
          {labels.map((label, index) => (
            <option key={index} value={label}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Nuevo texto"
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
        />
        <button onClick={handleAddText}>Agregar Texto</button>
        {texts.map((item, index) => (
          <div key={index}>
            <span>{item.label}: {item.text}</span>
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
        <input
          type="text"
          placeholder="Ingrese texto para predecir"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button onClick={handlePredict}>Predecir</button>
        {prediction && (
          <div>
            <p>Resultados:</p>
            <ul>
              {labels.map((label, index) => (
                <li key={index}>{label}: {Math.round(prediction[index] * 100)}%</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div id="training-graph"></div>
    </div>
  );
};

export default TextClassifier;
