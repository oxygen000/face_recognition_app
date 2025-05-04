import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { useTranslation } from "react-i18next";

/**
 * Form validation errors
 */
type FormErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Form validation function
 */
type FormValidationFunction<T> = (values: T) => FormErrors<T>;

/**
 * Form options
 */
interface FormOptions<T> {
  /**
   * Initial form values
   */
  initialValues: T;

  /**
   * Form validation function
   */
  validate?: FormValidationFunction<T>;

  /**
   * Callback when the form is submitted
   */
  onSubmit?: (values: T) => void | Promise<void>;
}

/**
 * Hook for handling forms
 */
function useForm<T extends Record<string, unknown>>(options: FormOptions<T>) {
  const { t } = useTranslation(["common", "hooks"]);

  // Destructure options
  const { initialValues, validate, onSubmit } = options;

  // State
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset the form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Validate the form
  const validateForm = useCallback(() => {
    if (!validate) return {};

    const validationErrors = validate(values);
    setErrors(validationErrors);
    return validationErrors;
  }, [validate, values]);

  // Handle input change
  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const { name, value, type } = e.target;

      // Handle checkboxes
      if (type === "checkbox") {
        const checked = (e.target as HTMLInputElement).checked;
        setValues((prevValues) => ({
          ...prevValues,
          [name]: checked,
        }));
      } else {
        setValues((prevValues) => ({
          ...prevValues,
          [name]: value,
        }));
      }

      // Mark field as touched
      setTouched((prevTouched) => ({
        ...prevTouched,
        [name]: true,
      }));
    },
    []
  );

  // Handle input blur
  const handleBlur = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      const { name } = e.target;

      // Mark field as touched
      setTouched((prevTouched) => ({
        ...prevTouched,
        [name]: true,
      }));

      // Validate the form
      validateForm();
    },
    [validateForm]
  );

  // Set a field value
  const setFieldValue = useCallback((name: keyof T, value: unknown) => {
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  }, []);

  // Set a field error
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  }, []);

  // Set a field touched
  const setFieldTouched = useCallback(
    (name: keyof T, isTouched: boolean = true) => {
      setTouched((prevTouched) => ({
        ...prevTouched,
        [name]: isTouched,
      }));
    },
    []
  );

  // Get a validation message with translation support
  const getValidationMessage = useCallback(
    (key: string, defaultMessage?: string, params?: Record<string, any>) => {
      return t(`hooks:errors.form.${key}`, {
        ...params,
        defaultValue: defaultMessage || key,
      });
    },
    [t]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: FormEvent<HTMLFormElement>) => {
      // Prevent default form submission
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({
          ...acc,
          [key]: true,
        }),
        {} as Partial<Record<keyof T, boolean>>
      );
      setTouched(allTouched);

      // Validate the form
      const validationErrors = validateForm();

      // If there are errors, don't submit
      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      // Set submitting state
      setIsSubmitting(true);

      try {
        // Call onSubmit callback
        if (onSubmit) {
          await onSubmit(values);
        }
      } finally {
        // Reset submitting state
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    validateForm,
    getValidationMessage,
  };
}

export default useForm;
