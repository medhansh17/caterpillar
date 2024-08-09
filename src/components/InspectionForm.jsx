import React, { useState, useEffect, useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const inspectionSteps = [
  { id: "tire", question: "How is the condition of the tires?" },
  { id: "engine", question: "How is the condition of the engine?" },
  // Add more inspection steps as needed
];

const DEBOUNCE_TIME = 2000; // Increased to 2 seconds for better user experience

const InspectionForm = () => {
  const [responses, setResponses] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);

  const startInspection = useCallback(() => {
    resetTranscript();
    setCurrentStepIndex(0);
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true });
    speakQuestion(inspectionSteps[0].question);
  }, [resetTranscript]);

  const speakQuestion = (question) => {
    const speech = new SpeechSynthesisUtterance(question);
    speechSynthesis.speak(speech);
  };

  const handleSpeechRecognition = useCallback(() => {
    if (transcript.toLowerCase().includes("okay done")) {
      moveToNextStep();
    } else if (currentStepIndex !== -1) {
      setResponses((prevResponses) => ({
        ...prevResponses,
        [inspectionSteps[currentStepIndex].id]: transcript,
      }));
    }
  }, [transcript, currentStepIndex]);

  const moveToNextStep = useCallback(() => {
    resetTranscript();
    if (currentStepIndex < inspectionSteps.length - 1) {
      setCurrentStepIndex((prevIndex) => prevIndex + 1);
      speakQuestion(inspectionSteps[currentStepIndex + 1].question);
    } else {
      SpeechRecognition.stopListening();
      setIsListening(false);
      alert("Inspection completed");
    }
  }, [currentStepIndex, resetTranscript]);

  useEffect(() => {
    if (isListening && transcript) {
      const timer = setTimeout(() => {
        handleSpeechRecognition();
      }, DEBOUNCE_TIME);

      return () => clearTimeout(timer);
    }
  }, [transcript, isListening, handleSpeechRecognition]);

  const handleInputChange = (e, stepId) => {
    setResponses((prevResponses) => ({
      ...prevResponses,
      [stepId]: e.target.value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Vehicle Inspection Form</h1>
      <button
        onClick={startInspection}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-6"
      >
        Start Inspection
      </button>
      <div className="space-y-6">
        {inspectionSteps.map((step, index) => (
          <div key={step.id} className="bg-gray-100 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">{step.question}</h2>
            <input
              type="text"
              value={responses[step.id] || ""}
              onChange={(e) => handleInputChange(e, step.id)}
              placeholder="Waiting for response..."
              className="w-full p-2 border border-gray-300 rounded text-lg"
            />
            {index === currentStepIndex && isListening && (
              <p className="text-sm text-gray-600 mt-2">Listening...</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InspectionForm;
