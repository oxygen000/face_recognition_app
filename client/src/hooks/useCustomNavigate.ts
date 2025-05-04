import { useCallback } from 'react';
import { useNavigate, NavigateOptions } from 'react-router-dom';

/**
 * Custom hook for navigation with improved performance
 * This hook ensures that navigation is handled properly and consistently
 */
const useCustomNavigate = () => {
  const navigate = useNavigate();

  /**
   * Navigate to a new route
   * @param to - The path to navigate to
   * @param options - Navigation options
   */
  const navigateTo = useCallback((to: string, options?: NavigateOptions) => {
    // Add a small delay to ensure any state updates are processed
    // This helps prevent navigation issues
    setTimeout(() => {
      navigate(to, options);
    }, 0);
  }, [navigate]);

  /**
   * Navigate back
   */
  const navigateBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /**
   * Navigate to the home page
   */
  const navigateHome = useCallback(() => {
    navigateTo('/');
  }, [navigateTo]);

  return {
    navigateTo,
    navigateBack,
    navigateHome,
    navigate // Include the original navigate function for compatibility
  };
};

export default useCustomNavigate;
