window.saveUserState = function saveUserState(state) {
    return new Promise(async (resolve, reject) => {
      //validate state. It is supposed to be an array of objects
      if (!Array.isArray(state) || state.length === 0) {
        reject("Invalid state: state must be an array of objects.");
        return;
      }
      const envValue = "stage";
      const saveGameStateApi = async (state) => {
        const baseUrl =
          envValue === "stage"
            ? "https://leaderboard-staging.glance.inmobi.com"
            : "https://leaderboard.api.glance.inmobi.com";
        console.log("Game state to be saved:", state);
        // Call the API to save the game state
        try {
          const response = await fetch(`${baseUrl}/api/v1/externalgames/save`, {
            method: "PATCH",
            body: JSON.stringify(state),
            headers: {
              "Content-Type": "application/json",
              "X-Api-Key":
                window.apiKey || "30aedfec48ddd7c42cb8cd855b431a774a0d6b17",
            },
          });
          if (response.ok) {
            const result = await response.json();
            console.log("Game update response", result);
            return true;
          } else {
            console.error("Game update failed with status", response.status);
            return false;
          }
        } catch (err) {
          console.error("Game update failed with error", err);
          return false;
        }
      };
      console.log("User state saved and stored locally:", state);
      try {
        console.log("Initiating saveGameStateApi");
        const isSaved = await saveGameStateApi(state);
        if (isSaved) {
          resolve(true);
        } else {
          reject("Failed to save game state.");
        }
      } catch (error) {
        reject("Failed to save user state with error:" + error);
      }
    });
  };
  window.saveUserAsset = function saveUserAsset(userId, gameId, asset) {
    return new Promise(async (resolve, reject) => {
      if (typeof userId !== "string" || userId === "") {
        reject("Invalid userId: userId must be a non-empty string.");
        return;
      }
      if (typeof asset !== "object" || asset === null) {
        reject("Invalid asset: Asset must be an object.");
        return;
      }
      const byteArrayToBase64 = (byteArray) => {
        let binary = "";
        const len = byteArray.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(byteArray[i]);
        }
        return window.btoa(binary);
      };
      const checkImageDimensions = (base64) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            if (img.width <= 1440 && img.height <= 2560) {
              resolve(true); // Correct dimensions
            } else {
              reject(
                `Invalid image dimensions: Expected 1440x2560, got ${img.width}x${img.height}.`
              );
            }
          };
          img.onerror = () =>
            reject("Failed to load the image for dimension check.");
          img.src = `data:image/png;base64,${base64}`; // Convert byte array to base64 data URL
        });
      };
      const checkFileSize = (byteArray) => {
        return new Promise((resolve, reject) => {
          const fileSizeInKB = byteArray.byteLength / 1024; // Convert bytes to KB
          if (fileSizeInKB <= 850) {
            resolve(true); // File size is within limit
            console.log("File size is within limit");
          } else {
            reject(
              `File size exceeds 800 KB limit. Actual size: ${fileSizeInKB.toFixed(
                2
              )} KB`
            );
          }
        });
      };
      const createImageUploadLink = async (userId, gameId) => {
        //store timestamp
        const timestamp = new Date().getTime();
        const baseUrl = "https://livegaming-staging.glance.inmobi.com";
        const response = await fetch(
          `${baseUrl}/api/v1/livesdk/video/upload/url/SDA/${userId}_${gameId}_${timestamp}.png?gameId=${gameId}`,
          {
            method: "GET",
            headers: {
              "x-api-key":
                "1030ed0aff4f570f138c518486a258474f862fb12f4af27e95a4de3fd15a3f5c",
              "Content-Type": "application/json",
            },
          }
        );
        return response.json();
      };
      const uploadImage = async (uploadUrl, dataURL) => {
        const response = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/octet-stream",
          },
          body: dataURL,
        });
        console.log(window.btoa(dataURL), "dataURL bytestring");
        if (response.ok) {
          return { success: true, message: "Upload successful." };
        } else {
          throw new Error(`Failed to upload image: ${response.statusText}`);
        }
      };
      console.log("User asset to be saved:", asset);
      console.log("User asset saved and stored locally:", asset);
      try {
        const base64Image = byteArrayToBase64(asset.bytearray);
        await checkFileSize(asset.bytearray);
        await checkImageDimensions(base64Image);
        const uploadLink = await createImageUploadLink(userId, gameId);
        const uploadResponse = await uploadImage(
          uploadLink.uploadUrl,
          asset.bytearray
        );
        console.log("Upload response:", uploadLink);
        // check if response status is 200
        if (uploadResponse.success) {
          //return uploadlink and resolve promise
          resolve(uploadLink);
          console.log("promise resolved", uploadLink);
        } else {
          reject("Failed to save user asset.");
        }
      } catch (error) {
        reject("Failed to save user asset with error:" + error);
      }
    });
  };
  window.GetUserState = function getUserState(userId, gameId) {
    return new Promise((resolve, reject) => {
      if (typeof userId !== "string" || userId === "") {
        reject("Invalid userId: userId must be a non-empty string.");
        return;
      }
      const envValue = window._ENV_GAME_;
      const baseUrl = "https://leaderboard-staging.glance.inmobi.com";
      const getUserStateApi = async (userId, gameId) => {
        try {
          const response = await fetch(
            `${baseUrl}/api/v1/externalgames/getAllData?userId=${userId}&gameId=${gameId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-Api-Key":
                  window.apiKey || "30aedfec48ddd7c42cb8cd855b431a774a0d6b17",
              },
            }
          );
          if (!response.ok) {
            console.error(`Request failed with status: ${response.status}`);
            return null;
          }
          const text = await response.text();
          console.log("Response text:", text);
          if (!text) {
            console.error("Response body is empty");
            return null;
          }
          try {
            const result = JSON.parse(text);
            console.log("Game state retrieved:", result);
            return result;
          } catch (jsonError) {
            console.error("Failed to parse JSON:", jsonError);
            return null;
          }
        } catch (err) {
          console.error("Game state retrieval failed with error", err);
          return null;
        }
      };
      const savedState = getUserStateApi(userId, gameId);
      if (savedState) {
        console.log(`Retrieved user state from storage:`, savedState);
        resolve(savedState);
      } else {
        reject("No user state found for the given userId.");
      }
    });
  };
  window.GetUserStateByIndex = function getUserStateByIndex(
    userId,
    gameId,
    index
  ) {
    return new Promise((resolve, reject) => {
      if (typeof userId !== "string" || userId === "") {
        reject("Invalid userId: userId must be a non-empty string.");
        return;
      }
      if (typeof index !== "string" || index === "") {
        reject("Invalid index: index must be a non-empty string.");
        return;
      }
      // Retrieve the user state from local storage
      const envValue = window._ENV_GAME_;
      const baseUrl = "https://leaderboard-staging.glance.inmobi.com";
      const getUserStateByIndexApi = async (userId, index) => {
        try {
          const response = await fetch(
            `${baseUrl}/api/v1/externalgames/getData?gameId=${gameId}&userId=${userId}&index=${index}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-Api-Key":
                  window.apiKey || "30aedfec48ddd7c42cb8cd855b431a774a0d6b17",
              },
            }
          );
          if (!response.ok) {
            console.error(`Request failed with status: ${response.status}`);
            return null;
          }
          const text = await response.text();
          console.log("Response text:", text);
          if (!text) {
            console.error("Response body is empty");
            return null;
          }
          try {
            const result = JSON.parse(text);
            console.log("Game state retrieved:", result);
            return result;
          } catch (jsonError) {
            console.error("Failed to parse JSON:", jsonError);
            return null;
          }
        } catch (err) {
          console.error("Game state retrieval failed with error", err);
          return null;
        }
      };
      const savedState = getUserStateByIndexApi(userId, index);
      if (savedState) {
        console.log(`Retrieved user state from storage:`, savedState);
        resolve(savedState);
      } else {
        reject("No user state found for the given userId and index.");
      }
    });
  };