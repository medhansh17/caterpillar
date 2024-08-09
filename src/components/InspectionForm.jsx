import React, { useState, useEffect, useCallback } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import inspect_ques from "../Data/inspection.json";

const DEBOUNCE_TIME = 500;

const InspectionForm = () => {
  const [responses, setResponses] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);

  const startInspection = useCallback(() => {
    resetTranscript();
    setCurrentStepIndex(0);
    setCurrentSectionIndex(0);
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true });
    const firstQuestion =
      Object.values(inspect_ques)[0]?.[0]?.question || "No questions available";
    speakQuestion(firstQuestion);
  }, [resetTranscript]);

  const speakQuestion = (question) => {
    const speech = new SpeechSynthesisUtterance(question);
    speechSynthesis.speak(speech);
  };

  const handleSpeechRecognition = useCallback(() => {
    if (
      transcript.toLowerCase().includes("okay next") ||
      transcript.toLowerCase().includes("ok next")
    ) {
      moveToNextStep();
    } else if (currentStepIndex !== -1) {
      const sections = Object.values(inspect_ques);
      const currentSection = sections[currentSectionIndex];
      if (currentSection && currentSection[currentStepIndex]) {
        const currentStep = currentSection[currentStepIndex];
        setResponses((prevResponses) => ({
          ...prevResponses,
          [currentStep.id]: transcript,
        }));
      }
    }
  }, [transcript, currentStepIndex, currentSectionIndex]);

  const moveToNextStep = useCallback(() => {
    resetTranscript();
    const sections = Object.values(inspect_ques);
    const currentSection = sections[currentSectionIndex];

    if (currentStepIndex < currentSection.length - 1) {
      setCurrentStepIndex((prevIndex) => prevIndex + 1);
      speakQuestion(
        currentSection[currentStepIndex + 1]?.question || "No more questions"
      );
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex((prevIndex) => prevIndex + 1);
      setCurrentStepIndex(0);
      const nextSection = sections[currentSectionIndex + 1];
      speakQuestion(nextSection[0]?.question || "No more questions");
    } else {
      SpeechRecognition.stopListening();
      setIsListening(false);
      alert("Inspection completed");
    }
  }, [currentStepIndex, currentSectionIndex, resetTranscript]);

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
        {Object.entries(inspect_ques).map(
          ([sectionKey, sectionQuestions], sectionIndex) => (
            <div key={sectionKey} className="my-6">
              <h1 className="text-2xl font-bold mb-4">
                {sectionKey.toUpperCase()}
              </h1>
              {sectionQuestions.map((step, index) => (
                <div key={step.id} className="bg-gray-100 p-4 rounded-lg mb-4">
                  <h2 className="text-xl font-semibold mb-2">
                    {step.question}
                  </h2>
                  <input
                    type="text"
                    value={responses[step.id] || ""}
                    onChange={(e) => handleInputChange(e, step.id)}
                    placeholder="Waiting for response..."
                    className="w-full p-2 border border-gray-300 rounded text-lg"
                  />
                  {sectionIndex === currentSectionIndex &&
                    index === currentStepIndex &&
                    isListening && (
                      <p className="text-sm text-gray-600 mt-2">Listening...</p>
                    )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default InspectionForm;
