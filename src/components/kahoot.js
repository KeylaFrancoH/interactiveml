import React, { useState, useEffect } from 'react';

const Question = ({ question, options, correctAnswer, onSelect, selectedOption }) => {
  return (
    <div>
      <h2>{question}</h2>
      <ul>
        {options.map((option, index) => (
          <li key={index} onClick={() => onSelect(index)}>
            {selectedOption === index ? (
              <>
                {option} {index === correctAnswer ? "👍" : "😢"}
              </>
            ) : (
              option
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const TimeOutMessage = ({ onRetry, onNext }) => {
  return (
    <div>
      <p>¡Se acabó el tiempo!</p>
      <button onClick={onRetry}>Reintentar</button>
      <button onClick={onNext}>Siguiente Tema</button>
    </div>
  );
};

const KahootGame = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10); // Tiempo inicial
  const [showTimeout, setShowTimeout] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const questions = [
    {
      question: "What's the capital of France?",
      options: ["London", "Paris", "Berlin"],
      correctAnswer: 1
    },
    {
      question: "What's the largest ocean in the world?",
      options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean"],
      correctAnswer: 2
    },
    // Agrega más preguntas aquí
  ];

  const handleAnswer = (selectedOption) => {
    setSelectedOption(selectedOption);
    if (selectedOption === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(10); // Reiniciar el temporizador para la siguiente pregunta
      setSelectedOption(null);
    } else {
      // Fin del juego
    }
  };

  const handleRetry = () => {
    setShowTimeout(false);
    setTimeLeft(10);
  };

  const handleNext = () => {
    setShowTimeout(false);
    goToNextQuestion();
  };

  const startTimer = () => {
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
      } else {
        clearInterval(timer);
        setShowTimeout(true);
      }
    }, 1000);
  };

  useEffect(() => {
    startTimer();
  }, [currentQuestion]); // Iniciar el temporizador cuando cambie la pregunta

  return (
    <div>
      <h1>Kahoot Game</h1>
      {showTimeout ? (
        <TimeOutMessage onRetry={handleRetry} onNext={handleNext} />
      ) : (
        <>
          <Question
            question={questions[currentQuestion].question}
            options={questions[currentQuestion].options}
            correctAnswer={questions[currentQuestion].correctAnswer}
            onSelect={handleAnswer}
            selectedOption={selectedOption}
          />
          <p>Time left: {timeLeft} seconds</p>
          <p>Score: {score}</p>
        </>
      )}
    </div>
  );
};

export default KahootGame;
