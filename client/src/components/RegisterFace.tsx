// This file now serves as a re-export of the modular RegisterFace component
// The implementation has been split into smaller components in the RegisterFace folder
import RegisterFace from "./RegisterFace/index";

export default RegisterFace;

/*
REFACTORING INSTRUCTIONS:
The RegisterFace component is very large and should be split into the following files:

1. RegisterFace/index.tsx - Main component that composes smaller components
2. RegisterFace/hooks/useRegisterFace.ts - Custom hook for registration logic
3. RegisterFace/components/WebcamCapture.tsx - Webcam capture functionality
4. RegisterFace/components/ImagePreview.tsx - Image preview with pose guidance
5. RegisterFace/components/RegistrationForm.tsx - Form fields and validation
6. RegisterFace/components/Alert.tsx - Alert component for messages
7. RegisterFace/components/PoseGuidance.tsx - Component for showing pose guidance
8. RegisterFace/utils/imageUtils.ts - Image processing utilities

This modular approach makes the code more maintainable, testable, and easier to modify.
Each component or utility should focus on a single responsibility.
*/
