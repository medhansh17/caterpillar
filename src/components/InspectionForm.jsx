import React, { useState, useEffect, useCallback, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import inspect_ques from "../../public/Data/inspection.json";
import CameraModal from "./CameraModal";
import { savePhoto, getAllPhotos } from "./indexedDB";
import SignatureCanvas from "./SignatureCanvas";

const DEBOUNCE_TIME = 100;

const getGeoCoordinates = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`${latitude}, ${longitude}`);
        },
        (error) => {
          console.error(error);
          reject("Unable to retrieve location");
        }
      );
    } else {
      reject("Geolocation is not supported by this browser.");
    }
  });
};

const generateSpecialInput = async (id) => {
  switch (id) {
    case "dateOfInspection":
      return new Date().toLocaleDateString();
    case "timeOfInspection":
      return new Date().toLocaleTimeString();
    case "geoCoordinates":
      try {
        return await getGeoCoordinates();
      } catch (error) {
        return error.toString();
      }
    default:
      return null;
  }
};

const InspectionForm = () => {
  const [responses, setResponses] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const questionRefs = useRef({});
  const [photos, setPhotos] = useState({});
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentPhotoStep, setCurrentPhotoStep] = useState(null);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);

  useEffect(() => {
    getAllPhotos().then((storedPhotos) => {
      const photoObject = storedPhotos.reduce((acc, photo) => {
        acc[photo.id] = photo.photoDataUrl;
        return acc;
      }, {});
      setPhotos(photoObject);
    });
  }, []);

  const handleClickPhoto = (stepId) => {
    setCurrentPhotoStep(stepId);
    setIsCameraOpen(true);
  };

  const handleCapturePhoto = async (photoDataUrl) => {
    await savePhoto(currentPhotoStep, photoDataUrl);
    setPhotos((prev) => ({ ...prev, [currentPhotoStep]: photoDataUrl }));
    setCurrentPhotoStep(null);
  };

  const startInspection = useCallback(() => {
    resetTranscript();
    setCurrentStepIndex(0);
    setCurrentSectionIndex(0);
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true });
    const firstQuestion =
      Object.values(inspect_ques)[0]?.[0]?.question || "No questions available";
    speakQuestion(firstQuestion);
    setExpandedSections({ [Object.keys(inspect_ques)[0]]: true });
  }, [resetTranscript]);

  const speakQuestion = (question) => {
    const speech = new SpeechSynthesisUtterance(question);
    speechSynthesis.speak(speech);
  };

  const handleSpeechRecognition = useCallback(async () => {
    if (transcript.toLowerCase().includes("reset")) {
      resetTranscript();
    }
    if (
      transcript.toLowerCase().includes("nex") ||
      transcript.toLowerCase().includes("next")
    ) {
      moveToNextStep();
    } else if (currentStepIndex !== -1) {
      const sections = Object.values(inspect_ques);
      const currentSection = sections[currentSectionIndex];
      if (currentSection && currentSection[currentStepIndex]) {
        const currentStep = currentSection[currentStepIndex];
        if (
          ["dateOfInspection", "timeOfInspection", "geoCoordinates"].includes(
            currentStep.id
          )
        ) {
          const specialInput = await generateSpecialInput(currentStep.id);
          setResponses((prevResponses) => ({
            ...prevResponses,
            [currentStep.id]: specialInput,
          }));
        } else {
          setResponses((prevResponses) => ({
            ...prevResponses,
            [currentStep.id]: transcript,
          }));
        }
      }
    }
  }, [transcript, currentStepIndex, currentSectionIndex]);

  const findNextNonSpecialStep = (section, startIndex) => {
    for (let i = startIndex; i < section.length; i++) {
      if (
        section[i].id !== "dateOfInspection" &&
        section[i].id !== "timeOfInspection" &&
        section[i].id !== "geoCoordinates" &&
        section[i].id !== "inspectorSignature"
      ) {
        return i;
      }
    }
    return -1;
  };

  const moveToNextStep = useCallback(async () => {
    resetTranscript();
    const sections = Object.values(inspect_ques);
    const currentSection = sections[currentSectionIndex];

    const nextStepIndex = findNextNonSpecialStep(
      currentSection,
      currentStepIndex + 1
    );

    if (nextStepIndex !== -1) {
      setCurrentStepIndex(nextStepIndex);
      const nextStep = currentSection[nextStepIndex];
      if (
        ["dateOfInspection", "timeOfInspection", "geoCoordinates"].includes(
          nextStep.id
        )
      ) {
        const specialInput = await generateSpecialInput(nextStep.id);
        setResponses((prevResponses) => ({
          ...prevResponses,
          [nextStep.id]: specialInput,
        }));
      } else {
        speakQuestion(nextStep.question);
      }
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex((prevIndex) => prevIndex + 1);
      const nextSection = sections[currentSectionIndex + 1];
      const nextSectionFirstNonSpecialIndex = findNextNonSpecialStep(
        nextSection,
        0
      );
      setCurrentStepIndex(nextSectionFirstNonSpecialIndex);
      if (nextSectionFirstNonSpecialIndex !== -1) {
        const nextStep = nextSection[nextSectionFirstNonSpecialIndex];
        if (
          ["dateOfInspection", "timeOfInspection", "geoCoordinates"].includes(
            nextStep.id
          )
        ) {
          const specialInput = await generateSpecialInput(nextStep.id);
          setResponses((prevResponses) => ({
            ...prevResponses,
            [nextStep.id]: specialInput,
          }));
        } else {
          speakQuestion(nextStep.question);
        }
      }
      const nextSectionKey = Object.keys(inspect_ques)[currentSectionIndex + 1];
      setExpandedSections((prev) => ({
        ...prev,
        [nextSectionKey]: true,
      }));
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

  useEffect(() => {
    if (currentStepIndex !== -1 && currentSectionIndex !== -1) {
      const sections = Object.keys(inspect_ques);
      const currentSectionKey = sections[currentSectionIndex];
      const currentQuestionId = `${currentSectionKey}-${currentStepIndex}`;
      const questionElement = questionRefs.current[currentQuestionId];
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentStepIndex, currentSectionIndex]);

  useEffect(() => {
    const updateSpecialInputs = async () => {
      const sections = Object.values(inspect_ques);
      for (const section of sections) {
        for (const step of section) {
          const specialInput = await generateSpecialInput(step.id);
          if (specialInput !== null) {
            setResponses((prevResponses) => ({
              ...prevResponses,
              [step.id]: specialInput,
            }));
          }
        }
      }
    };

    updateSpecialInputs();
  }, []);

  const handleInputChange = (e, stepId) => {
    setResponses((prevResponses) => ({
      ...prevResponses,
      [stepId]: e.target.value,
    }));
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleSaveSignature = (dataUrl) => {
    setResponses((prevResponses) => ({
      ...prevResponses,
      inspectorSignature: dataUrl,
    }));
    setShowSignatureCanvas(false);
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
            <div
              key={sectionKey}
              className="my-6 border border-gray-200 rounded-lg bg-slate-100"
            >
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full flex justify-between items-center p-4 bg-gray-200 hover:bg-gray-300 transition-colors duration-200"
              >
                <h1 className="text-2xl font-bold">
                  {sectionKey.toUpperCase()}
                </h1>
                {expandedSections[sectionKey] ? <UpIcon /> : <DownIcon />}
              </button>
              {expandedSections[sectionKey] && (
                <div className="p-4">
                  {sectionQuestions.map((step, index) => {
                    const isSpecialInput = [
                      "dateOfInspection",
                      "timeOfInspection",
                      "geoCoordinates",
                    ].includes(step.id);
                    const isSignatureInput = step.id === "inspectorSignature";
                    return (
                      <div
                        key={step.id}
                        ref={(el) =>
                          (questionRefs.current[`${sectionKey}-${index}`] = el)
                        }
                        className="bg-white p-4 rounded-lg mb-4 shadow"
                      >
                        <h2 className="text-xl font-semibold mb-2">
                          {step.question}
                        </h2>
                        {isSpecialInput ? (
                          <input
                            type="text"
                            value={responses[step.id] || "Loading..."}
                            readOnly
                            className="w-full p-2 border border-gray-300 rounded text-lg bg-gray-100"
                          />
                        ) : isSignatureInput ? (
                          <>
                            {showSignatureCanvas && (
                              <SignatureCanvas
                                onSave={handleSaveSignature}
                                onCancel={() => setShowSignatureCanvas(false)}
                              />
                            )}
                            {!showSignatureCanvas && (
                              <button
                                onClick={() => setShowSignatureCanvas(true)}
                                className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                              >
                                Sign Here
                              </button>
                            )}
                            {responses[step.id] && (
                              <img
                                src={responses[step.id]}
                                alt="Signature"
                                className="mt-2 max-w-full h-auto"
                              />
                            )}
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={responses[step.id] || ""}
                              onChange={(e) => handleInputChange(e, step.id)}
                              placeholder="Waiting for response..."
                              className="w-full p-2 border border-gray-300 rounded text-lg"
                            />
                            {step.type === "photo" && (
                              <button
                                onClick={() => handleClickPhoto(step.id)}
                                className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                              >
                                Click Photo
                              </button>
                            )}
                            {photos[step.id] && (
                              <img
                                src={photos[step.id]}
                                alt={`Photo for ${step.question}`}
                                className="mt-2 max-w-full h-auto"
                              />
                            )}
                          </>
                        )}
                        {sectionIndex === currentSectionIndex &&
                          index === currentStepIndex &&
                          isListening &&
                          !isSpecialInput && (
                            <p className="text-sm text-gray-600 mt-2">
                              Listening...
                            </p>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        )}
      </div>
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturePhoto}
        stepId={currentPhotoStep}
      />
    </div>
  );
};

const UpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="size-6"
  >
    <path
      fillRule="evenodd"
      d="M11.47 7.72a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 1 1-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 0 1-1.06-1.06l7.5-7.5Z"
      clipRule="evenodd"
    />
  </svg>
);

const DownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="size-6"
  >
    <path
      fillRule="evenodd"
      d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
      clipRule="evenodd"
    />
  </svg>
);

export default InspectionForm;
