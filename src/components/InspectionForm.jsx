import React, { useState, useEffect, useCallback, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import CameraModal from "./CameraModal";
import { savePhoto, getAllPhotos } from "./indexedDB";
import SignatureCanvas from "./SignatureCanvas";
import { PDFDownloadLink } from "@react-pdf/renderer";
import InspectionPDF from "./InspectionPDF";
import { useLocation } from "react-router-dom";
import R2900 from "../Data/R2900.json";
import D6R2 from "../Data/D6R2.json";
import MD6200 from "../Data/MD6200.json";
import GC from "../Data/120GC.json";

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

const modelToJsonMap = {
  R2900: R2900,
  D6R2: D6R2,
  MD6200: MD6200,
  GC: GC,
};

const InspectionForm = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const serialNo = params.get("serialno") || "";
  const modelNo = params.get("modelno") || "";
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
  const [images, setImages] = useState({});
  const [inspectQues, setInspectQues] = useState({});
  const [attachPictures, setAttachPictures] = useState(false);
  const [isAskingForPictures, setIsAskingForPictures] = useState(false);
  const [formattedData, setFormattedData] = useState({});
  const [pdfData, setPdfData] = useState(null);

  const preparePDFData = useCallback(() => {
    const savedData = localStorage.getItem("inspectionData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      const dataWithPhotos = {};

      Object.entries(parsedData).forEach(([sectionKey, sectionData]) => {
        dataWithPhotos[sectionKey] = sectionData.map((item) => {
          const photoKey = `photo_${item.id}`;
          const photo = localStorage.getItem(photoKey);
          return { ...item, photo };
        });
      });

      setPdfData(dataWithPhotos);
    }
  }, []);

  useEffect(() => {
    preparePDFData();
  }, [preparePDFData]);

  const formatData = useCallback(() => {
    const formatted = {};
    Object.entries(inspectQues).forEach(([sectionKey, sectionQuestions]) => {
      formatted[sectionKey.toLowerCase()] = sectionQuestions.map(
        (question) => ({
          id: question.id,
          response: responses[question.id] || "",
          photo: photos[question.id] || null,
        })
      );
    });
    return formatted;
  }, [inspectQues, responses, photos]);

  const saveDataLocally = useCallback(() => {
    const data = formatData();

    // Save non-image data
    const dataWithoutImages = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value.map(({ photo, ...rest }) => rest),
      ])
    );
    localStorage.setItem("inspectionData", JSON.stringify(dataWithoutImages));

    // Save images separately
    Object.entries(data).forEach(([sectionKey, sectionData]) => {
      sectionData.forEach((item) => {
        if (item.photo) {
          localStorage.setItem(`photo_${item.id}`, item.photo);
        }
      });
    });

    setFormattedData(data);
  }, [formatData]);
  const loadSavedData = useCallback(() => {
    const savedData = localStorage.getItem("inspectionData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);

      // Load responses
      const loadedResponses = {};
      Object.values(parsedData)
        .flat()
        .forEach((item) => {
          loadedResponses[item.id] = item.response;
        });
      setResponses(loadedResponses);

      // Load photos
      const loadedPhotos = {};
      Object.values(parsedData)
        .flat()
        .forEach((item) => {
          const savedPhoto = localStorage.getItem(`photo_${item.id}`);
          if (savedPhoto) {
            loadedPhotos[item.id] = savedPhoto;
          }
        });
      setPhotos(loadedPhotos);
    }
  }, []);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  useEffect(() => {
    const intervalId = setInterval(saveDataLocally, 1000);
    return () => clearInterval(intervalId);
  }, [saveDataLocally, photos]);

  useEffect(() => {
    if (modelToJsonMap[modelNo]) {
      const selectedJson = modelToJsonMap[modelNo];
      setInspectQues(selectedJson);
    } else {
      const selectedJson = {};
      setInspectQues(selectedJson);
      alert("Model not found");
    }
  }, [modelNo]);

  const handleClickPhoto = (stepId) => {
    setCurrentPhotoStep(stepId);
    setIsCameraOpen(true);
  };

  const handleCapturePhoto = async (photoDataUrl) => {
    const photoKey = `photo_${currentPhotoStep}`;
    localStorage.setItem(photoKey, photoDataUrl);
    setPhotos((prev) => ({ ...prev, [currentPhotoStep]: photoDataUrl }));
    setCurrentPhotoStep(null);
    setIsCameraOpen(false);
  };

  const startInspection = useCallback(() => {
    resetTranscript();
    setCurrentStepIndex(0);
    setCurrentSectionIndex(0);
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true });
    const firstSection = Object.values(inspectQues)[0];
    if (firstSection && firstSection.length > 0) {
      const firstNonSpecialIndex = findNextNonSpecialStep(firstSection, 0);
      if (firstNonSpecialIndex !== -1) {
        const firstQuestion = firstSection[firstNonSpecialIndex].question;
        speakQuestion(firstQuestion);
      } else {
        speakQuestion("No questions available in this section");
      }
    } else {
      speakQuestion("No questions available");
    }
    setExpandedSections({ [Object.keys(inspectQues)[0]]: true });
  }, [resetTranscript, inspectQues]);

  const speakQuestion = (question) => {
    const speech = new SpeechSynthesisUtterance(question);
    speechSynthesis.speak(speech);
  };

  const moveToNextSection = () => {
    if (currentSectionIndex < Object.values(inspectQues).length - 1) {
      setCurrentSectionIndex((prevIndex) => prevIndex + 1);
      const nextSection = Object.values(inspectQues)[currentSectionIndex + 1];
      const nextSectionFirstNonSpecialIndex = findNextNonSpecialStep(
        nextSection,
        0
      );
      setCurrentStepIndex(nextSectionFirstNonSpecialIndex);
      if (nextSectionFirstNonSpecialIndex !== -1) {
        const nextStep = nextSection[nextSectionFirstNonSpecialIndex];
        speakQuestion(nextStep.question);
      }
      const nextSectionKey = Object.keys(inspectQues)[currentSectionIndex + 1];
      setExpandedSections((prev) => ({
        ...prev,
        [nextSectionKey]: true,
      }));
      setAttachPictures(false);
      setIsAskingForPictures(false);
    } else {
      SpeechRecognition.stopListening();
      setIsListening(false);
      alert("Inspection completed");
    }
  };

  const handleSpeechRecognition = useCallback(async () => {
    if (attachPictures && transcript.toLowerCase().includes("ok done")) {
      moveToNextSection();
    }
    if (transcript.toLowerCase().includes("reset")) {
      resetTranscript();
    }
    if (
      transcript.toLowerCase().includes("nex") ||
      transcript.toLowerCase().includes("next")
    ) {
      moveToNextStep();
    } else if (currentStepIndex !== -1) {
      const sections = Object.values(inspectQues);
      const currentSection = sections[currentSectionIndex];
      if (currentSection && currentSection[currentStepIndex]) {
        const currentStep = currentSection[currentStepIndex];
        if (
          [
            "dateOfInspection",
            "timeOfInspection",
            "geoCoordinates",
            "truckModel",
            "SerialNumber",
          ].includes(currentStep.id)
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
        // (attachPictures || section[i].type !== "photo")
      ) {
        return i;
      }
    }
    return -1;
  };

  const moveToNextStep = useCallback(async () => {
    resetTranscript();
    const sections = Object.values(inspectQues);
    const currentSection = sections[currentSectionIndex];

    if (!currentSection) {
      moveToNextSection();
      return;
    }

    let nextStepIndex = findNextNonSpecialStep(
      currentSection,
      currentStepIndex + 1
    );

    if (nextStepIndex === -1) {
      moveToNextSection();
      return;
    }

    let nextStep = currentSection[nextStepIndex];

    while (nextStep && nextStep.type === "photo") {
      if (!isAskingForPictures) {
        setIsAskingForPictures(true);
        speakQuestion("Do you want to attach pictures for this section?");
        return;
      }

      if (!attachPictures) {
        nextStepIndex = findNextNonSpecialStep(
          currentSection,
          nextStepIndex + 1
        );
        if (nextStepIndex === -1) {
          moveToNextSection();
          return;
        }
        nextStep = currentSection[nextStepIndex];
      } else {
        break;
      }
    }

    if (nextStep && nextStep.type === "photo" && attachPictures) {
      // Prompt to attach photos if required
      speakQuestion(
        "Please attach the required photos. Say 'OK done' when you have finished."
      );
      setIsAskingForPictures(true);
      return;
    }

    setCurrentStepIndex(nextStepIndex);

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
      moveToNextStep();
    } else {
      speakQuestion(nextStep.question);
    }
  }, [
    currentStepIndex,
    currentSectionIndex,
    resetTranscript,
    isAskingForPictures,
    attachPictures,
    inspectQues,
  ]);

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
      const sections = Object.keys(inspectQues);
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
      const sections = Object.values(inspectQues);
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
  useEffect(() => {
    if (attachPictures) {
      const currentSection = Object.values(inspectQues)[currentSectionIndex];
      const photoQuestions = currentSection.filter((q) => q.type === "photo");
      const allPhotosTaken = photoQuestions.every((q) => photos[q.id]);

      if (allPhotosTaken) {
        speakQuestion(
          "All photos for this section have been taken. Say 'OK done' to move to the next section."
        );
      }
    }
  }, [photos, attachPictures, currentSectionIndex, inspectQues]);
  const handleSaveSignature = (dataUrl) => {
    setResponses((prevResponses) => ({
      ...prevResponses,
      inspectorSignature: dataUrl,
    }));
    setShowSignatureCanvas(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 ">
      <h1 className="text-3xl font-bold mb-6">Vehicle Inspection Form</h1>
      <button
        onClick={startInspection}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-6"
      >
        Start Inspection
      </button>
      <div className="space-y-6">
        {Object.entries(inspectQues).map(
          ([sectionKey, sectionQuestions], sectionIndex) => (
            <div
              key={sectionKey}
              className="mt-6 border border-gray-200 rounded-lg bg-slate-100"
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
                      "truckModel",
                      "SerialNumber",
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
                            value={
                              step.id === "SerialNumber"
                                ? serialNo
                                : step.id === "truckModel"
                                ? modelNo
                                : responses[step.id] || "Loading..."
                            }
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
                                className="mt-2 max-w-[200px] h-auto"
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
      <div className="mt-6 w-fit">
        {pdfData && Object.keys(pdfData).length > 0 && (
          <PDFDownloadLink
            document={<InspectionPDF inspectionData={pdfData} />}
            fileName="inspection_report.pdf"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {({ blob, url, loading, error }) =>
              loading ? "Generating PDF..." : "Download PDF"
            }
          </PDFDownloadLink>
        )}
      </div>
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
