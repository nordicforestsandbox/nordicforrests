
import { GoogleGenAI, Modality } from "@google/genai";

const fileToBase64 = (fileData: string): string => {
  if (fileData.includes(',')) {
    return fileData.split(',')[1];
  }
  return fileData;
};

export const removeObject = async (markedImageBase64: string, mimeType: string): Promise<string> => {
  // We do not manually check for process.env.API_KEY here. 
  // The SDK or the execution environment will handle validation, 
  // and we want to allow the key to be injected dynamically if applicable.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const textPart = {
    text: "The provided image has an area marked with red brush strokes. Remove the object covered by the red strokes and fill the area with a realistic background that blends seamlessly with the surroundings. The result should be the clean image without any red marks."
  };

  const imagePart = {
    inlineData: {
      data: fileToBase64(markedImageBase64),
      mimeType: mimeType,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [textPart, imagePart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];

    if (firstPart && 'inlineData' in firstPart && firstPart.inlineData) {
      const base64ImageBytes: string = firstPart.inlineData.data;
      const responseMimeType = firstPart.inlineData.mimeType;
      return `data:${responseMimeType};base64,${base64ImageBytes}`;
    } else {
      throw new Error("The API did not return an image. It might be due to a safety policy violation or an unexpected response format.");
    }
  } catch (error) {
    console.error("Gemini API call failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to process the image: ${errorMessage}`);
  }
};
