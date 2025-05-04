import { useState, useCallback, useEffect } from "react";
import { ApiResponse } from "../types";

/**
 * API request state
 */
interface ApiState<T> {
  /**
   * Whether the request is loading
   */
  loading: boolean;

  /**
   * Whether the request was successful
   */
  success: boolean;

  /**
   * Whether the request failed
   */
  error: boolean;

  /**
   * Error message if the request failed
   */
  errorMessage: string | null;

  /**
   * Response data if the request was successful
   */
  data: T | null;
}

/**
 * API request options
 */
interface ApiOptions<T> {
  /**
   * Initial data
   */
  initialData?: T | null;

  /**
   * Whether to execute the request immediately
   */
  immediate?: boolean;

  /**
   * Callback when the request is successful
   */
  onSuccess?: (data: T) => void;

  /**
   * Callback when the request fails
   */
  onError?: (error: string) => void;
}

/**
 * Hook for handling API requests
 */
function useApi<T = unknown>(
  apiFunction: (...args: unknown[]) => Promise<ApiResponse<T>>,
  options: ApiOptions<T> = {}
) {
  // Destructure options
  const { initialData = null, immediate = false, onSuccess, onError } = options;

  // State
  const [state, setState] = useState<ApiState<T>>({
    loading: immediate,
    success: false,
    error: false,
    errorMessage: null,
    data: initialData,
  });

  // Execute the API request
  const execute = useCallback(
    async (...args: Parameters<typeof apiFunction>) => {
      // Set loading state
      setState((prevState) => ({
        ...prevState,
        loading: true,
        success: false,
        error: false,
        errorMessage: null,
      }));

      try {
        // Execute the API function
        const response = await apiFunction(...args);

        console.log("API response received:", response);

        // Check if the response is successful
        if (
          response &&
          (response.status === "success" || !("status" in response))
        ) {
          // Extract data based on response type
          let extractedData: T | null = null;

          // Handle different response types
          if (
            "users" in response &&
            response.users !== undefined &&
            Array.isArray(response.users)
          ) {
            // For user list responses, prioritize the users field
            extractedData = response.users as unknown as T;
            console.log("Extracted users data:", response.users.length);
          } else if ("user" in response && response.user !== undefined) {
            // For user detail responses
            extractedData = response.user as unknown as T;
            console.log("Extracted user data:", response.user);
          } else if ("data" in response && response.data !== undefined) {
            // For generic data responses
            extractedData = response.data as unknown as T;
            console.log("Extracted generic data:", typeof response.data);
          } else {
            // If no recognizable data structure, try to use the response itself
            console.log(
              "No standard data structure found, using response as data"
            );
            extractedData = response as unknown as T;
          }

          // Set success state
          setState({
            loading: false,
            success: true,
            error: false,
            errorMessage: null,
            data: extractedData,
          });

          // Call onSuccess callback
          if (onSuccess && extractedData) {
            onSuccess(extractedData);
          }

          // Return the response
          return response;
        } else {
          // Set error state
          const errorMsg = response?.message || "An error occurred";
          console.error("API error:", errorMsg);
          
          setState({
            loading: false,
            success: false,
            error: true,
            errorMessage: errorMsg,
            data: null,
          });

          // Call onError callback
          if (onError) {
            onError(errorMsg);
          }

          // Return the response
          return response;
        }
      } catch (error) {
        // Get error message
        const errorMessage =
          error instanceof Error ? error.message : "An error occurred";
        console.error("API exception:", errorMessage);

        // Set error state
        setState({
          loading: false,
          success: false,
          error: true,
          errorMessage,
          data: null,
        });

        // Call onError callback
        if (onError) {
          onError(errorMessage);
        }

        // Return error response
        return {
          status: "error",
          message: errorMessage,
        } as ApiResponse<T>;
      }
    },
    [apiFunction, onSuccess, onError]
  );

  // Execute the request immediately if specified
  useEffect(() => {
    let mounted = true;
    
    if (immediate) {
      console.log("Executing API request immediately");
      
      // Use a microtask to avoid immediate execution in the render phase
      const executeRequest = async () => {
        try {
          await execute();
        } catch (err) {
          console.error("Error in immediate execution:", err);
        }
      };
      
      // Only execute if component is still mounted
      if (mounted) {
        executeRequest();
      }
    }
    
    return () => {
      mounted = false;
    };
  }, [immediate, execute]); // Include execute in the dependency array

  // Reset the state
  const reset = useCallback(() => {
    setState({
      loading: false,
      success: false,
      error: false,
      errorMessage: null,
      data: initialData,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
}

export default useApi;
