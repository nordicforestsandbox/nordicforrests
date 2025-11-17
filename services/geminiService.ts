import { GoogleGenAI, Modality } from "@google/genai";

const fileToBase64 = (fileData: string): string => {
  return fileData.split(',')[1];
};

export const removeObject = async (originalImageBase64: string, maskImageBase64: string, mimeType: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const textPart = {
    text: "You are an expert at image inpainting. The user has provided a main image and a second mask image. The red area in the mask image indicates the object to be removed from the main image. Please remove the object and replace it with a realistic background that seamlessly blends with the surroundings. Output only the modified main image."
  };

  const originalImagePart = {
    inlineData: {
      data: fileToBase64(originalImageBase64),
      mimeType: mimeType,
    },
  };
  
  const maskImagePart = {
    inlineData: {
      data: fileToBase64(maskImageBase64),
      mimeType: 'image/png', // Mask is always PNG
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [textPart, originalImagePart, maskImagePart],
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
    throw new Error("Failed to process the image with the AI model. Please try again.");
  }
};
